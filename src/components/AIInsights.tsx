import { useState, useMemo } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoodEntry, MoodStats as MoodStatsType } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VisualInsights } from './insights/VisualInsights';

interface AIInsightsProps {
  entries: MoodEntry[];
  stats: MoodStatsType;
  periodLabel: string;
  view: 'week' | 'month' | 'year';
}

interface StructuredInsight {
  summary: {
    status: 'good' | 'warning' | 'alert';
    title: string;
    description: string;
  };
  moodTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    dominantMood: 'elevated' | 'stable' | 'depressed';
  };
  riskIndicators: {
    type: 'sleep' | 'exercise' | 'eating' | 'mood';
    label: string;
    currentStreak: number;
    riskLevel: number;
    historicalImpact: string | null;
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    icon: 'sleep' | 'exercise' | 'food' | 'warning' | 'calendar' | 'heart';
    title: string;
    description: string;
  }[];
  weeklyComparison: {
    metric: string;
    current: number;
    previous: number;
    change: number;
  }[];
}

export function AIInsights({ entries, stats, periodLabel, view }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [structured, setStructured] = useState<StructuredInsight | null>(null);
  const [patternsDetected, setPatternsDetected] = useState<number>(0);
  const { toast } = useToast();

  // Prepare summary data for the AI
  const summaryData = useMemo(() => {
    const recentEntries = entries.slice(0, view === 'week' ? 7 : view === 'month' ? 30 : 90);
    
    // Calculate mood patterns
    const moodCounts = { elevated: 0, stable: 0, depressed: 0 };
    const sleepCounts = { good: 0, bad: 0 };
    const eatingCounts = { good: 0, bad: 0 };
    let exerciseDays = 0;
    let totalDaysWithData = 0;

    recentEntries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood]++;
        totalDaysWithData++;
      }
      if (entry.sleepQuality) sleepCounts[entry.sleepQuality]++;
      if (entry.eatingQuality) eatingCounts[entry.eatingQuality]++;
      if (entry.exercised) exerciseDays++;
    });

    // Find patterns - consecutive moods
    const consecutivePatterns: string[] = [];
    let currentMood: string | null = null;
    let consecutiveCount = 0;

    recentEntries.forEach(entry => {
      if (entry.mood === currentMood) {
        consecutiveCount++;
      } else {
        if (consecutiveCount >= 3 && currentMood) {
          consecutivePatterns.push(`${consecutiveCount} dagar i rad med ${currentMood === 'elevated' ? 'förhöjt' : currentMood === 'depressed' ? 'sänkt' : 'stabilt'} mående`);
        }
        currentMood = entry.mood;
        consecutiveCount = 1;
      }
    });

    // Check sleep-mood correlation
    const sleepMoodCorrelation = recentEntries.reduce((acc, entry) => {
      if (entry.sleepQuality === 'bad' && entry.mood === 'depressed') {
        acc.badSleepDepressed++;
      }
      if (entry.sleepQuality === 'good' && (entry.mood === 'stable' || entry.mood === 'elevated')) {
        acc.goodSleepStable++;
      }
      return acc;
    }, { badSleepDepressed: 0, goodSleepStable: 0 });

    return {
      period: periodLabel,
      viewType: view === 'week' ? 'vecka' : view === 'month' ? 'månad' : 'år',
      totalDaysWithData,
      moodCounts,
      sleepCounts,
      eatingCounts,
      exerciseDays,
      consecutivePatterns,
      sleepMoodCorrelation,
      stats,
    };
  }, [entries, stats, periodLabel, view]);

  const generateInsights = async () => {
    if (summaryData.totalDaysWithData < 3) {
      toast({
        title: "Inte tillräckligt med data",
        description: "Du behöver minst 3 dagars incheckningar för att generera insikter.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setInsights(null);

    try {
      const { data, error } = await supabase.functions.invoke('mood-insights', {
        body: { summaryData },
      });

      if (error) throw error;
      
      setInsights(data.insights);
      setStructured(data.structured || null);
      setPatternsDetected(data.patternsDetected || 0);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Kunde inte generera insikter",
        description: "Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasEnoughData = summaryData.totalDaysWithData >= 3;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Prediktiva insikter</h2>
          <p className="text-sm text-muted-foreground">
            AI-analys baserad på dina historiska mönster
          </p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Analys för {periodLabel}</CardTitle>
          <CardDescription>
            Baserat på {summaryData.totalDaysWithData} dagars data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasEnoughData ? (
            <VisualInsights
              structured={structured}
              textInsights={insights}
              isLoading={isLoading}
              onGenerate={generateInsights}
              patternsDetected={patternsDetected}
            />
          ) : (
            <div className="text-center py-8">
              <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">
                Du behöver minst 3 dagars incheckningar för att analysera mönster.
              </p>
              <p className="text-sm text-muted-foreground">
                Just nu har du {summaryData.totalDaysWithData} dagar med data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

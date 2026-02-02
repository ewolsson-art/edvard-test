import { useState, useMemo } from 'react';
import { Sparkles, Loader2, RefreshCw, Lightbulb, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoodEntry, MoodStats as MoodStatsType } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface PatientAIInsightsProps {
  entries: MoodEntry[];
  stats: MoodStatsType;
  periodLabel: string;
  view: 'week' | 'month' | 'year';
  patientName: string;
  isShared: boolean;
}

export function PatientAIInsights({ entries, stats, periodLabel, view, patientName, isShared }: PatientAIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
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
        description: "Patienten behöver minst 3 dagars incheckningar för att generera insikter.",
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

  if (!isShared) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-muted-foreground" />
          <h2 className="font-display text-2xl font-semibold text-muted-foreground">AI-insikter</h2>
        </div>

        <Card className="glass-card border-dashed">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">AI-insikter är inte delade</p>
                <p className="text-sm text-muted-foreground">
                  {patientName} har inte aktiverat delning av AI-insikter.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-primary" />
        <h2 className="font-display text-2xl font-semibold">AI-insikter</h2>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5" />
            Insikter för {patientName}
          </CardTitle>
          <CardDescription>
            AI-analys av patientens mönster för {periodLabel.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!insights && !isLoading && (
            <div className="text-center py-6">
              {hasEnoughData ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    Generera AI-analys av patientens incheckningar för att upptäcka mönster och trender.
                  </p>
                  <Button onClick={generateInsights} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generera insikter
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Patienten behöver minst 3 dagars incheckningar för att generera insikter.
                  Just nu finns {summaryData.totalDaysWithData} dagar med data.
                </p>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyserar patientens mönster...</p>
            </div>
          )}

          {insights && !isLoading && (
            <div className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{insights}</ReactMarkdown>
              </div>
              
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateInsights}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generera nya insikter
                </Button>
              </div>
            </div>
          )}

          {/* Quick stats summary */}
          {hasEnoughData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{summaryData.totalDaysWithData}</div>
                <div className="text-xs text-muted-foreground">Dagar loggade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats.stable}</div>
                <div className="text-xs text-muted-foreground">Stabila dagar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{summaryData.sleepCounts.good}</div>
                <div className="text-xs text-muted-foreground">Bra sömn</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{summaryData.exerciseDays}</div>
                <div className="text-xs text-muted-foreground">Träningsdagar</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

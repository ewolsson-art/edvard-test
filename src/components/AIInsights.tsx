import { useState, useMemo } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MoodEntry, MoodStats as MoodStatsType } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
  entries: MoodEntry[];
  stats: MoodStatsType;
  periodLabel: string;
  view: 'week' | 'month' | 'year';
}

interface Warning {
  type: 'sleep' | 'mood' | 'exercise' | 'eating';
  message: string;
  severity: 'low' | 'medium' | 'high';
  historicalContext: string | null;
}

export function AIInsights({ entries, stats, periodLabel, view }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
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
      setWarnings(data.warnings || []);
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
        <Sparkles className="w-6 h-6 text-primary" />
        <div>
          <h2 className="font-display text-2xl font-semibold">AI-insikter</h2>
          {patternsDetected > 0 && (
            <p className="text-xs text-muted-foreground">
              {patternsDetected} historiska mönster identifierade
            </p>
          )}
        </div>
      </div>

      {/* Warning alerts */}
      {warnings.length > 0 && (
        <div className="space-y-3 mb-6">
          {warnings.filter(w => w.severity === 'high').map((warning, i) => (
            <Alert key={`high-${i}`} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Varning</AlertTitle>
              <AlertDescription>
                {warning.message}
                {warning.historicalContext && (
                  <p className="mt-1 text-sm opacity-90">{warning.historicalContext}</p>
                )}
              </AlertDescription>
            </Alert>
          ))}
          {warnings.filter(w => w.severity === 'medium').map((warning, i) => (
            <Alert key={`medium-${i}`} className="border-accent/50 bg-accent/10">
              <AlertTriangle className="h-4 w-4 text-accent-foreground" />
              <AlertTitle>Observation</AlertTitle>
              <AlertDescription>
                {warning.message}
                {warning.historicalContext && (
                  <p className="mt-1 text-sm text-muted-foreground">{warning.historicalContext}</p>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5" />
            Prediktiva insikter
          </CardTitle>
          <CardDescription>
            AI-analys baserad på dina historiska mönster för {periodLabel.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!insights && !isLoading && (
            <div className="text-center py-6">
              {hasEnoughData ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    Låt AI analysera dina incheckningar, identifiera varningssignaler och förutse mönster baserat på din historik.
                  </p>
                  <Button onClick={generateInsights} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Analysera mönster
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Du behöver minst 3 dagars incheckningar för att analysera mönster.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Just nu har du {summaryData.totalDaysWithData} dagar med data.
                  </p>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyserar historiska mönster och varningssignaler...</p>
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
                  Uppdatera analys
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
                <div className="text-2xl font-bold text-primary">{stats.stable}</div>
                <div className="text-xs text-muted-foreground">Stabila dagar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary/80">{summaryData.sleepCounts.good}</div>
                <div className="text-xs text-muted-foreground">Bra sömn</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary/60">{summaryData.exerciseDays}</div>
                <div className="text-xs text-muted-foreground">Träningsdagar</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

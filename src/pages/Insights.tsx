import { useState, useEffect, useRef } from 'react';
import { Brain, TrendingUp, Shield, AlertTriangle, Lightbulb, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface InsightStats {
  totalDays: number;
  dateRange: string;
  moodCounts: { elevated: number; stable: number; depressed: number };
  sleepCounts: { good: number; bad: number; unknown: number };
  exerciseDays: number;
  currentStreak: number;
  currentMood: string;
}

const MOOD_LABELS: Record<string, string> = {
  elevated: 'Uppvarvad',
  stable: 'Stabil',
  depressed: 'Nedstämd',
};

const THINKING_PHRASES = [
  'Läser dina incheckningar…',
  'Analyserar sömnmönster…',
  'Kartlägger humörtrender…',
  'Letar efter mönster…',
  'Bygger din prognos…',
  'Sammanställer insikter…',
];

function InsightsLoadingAnimation() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % THINKING_PHRASES.length);
    }, 2400);
    return () => clearInterval(phraseTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8 + 2, 92));
    }, 800);
    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-5">
      {/* Animated brain orb */}
      <div className="relative w-28 h-28 mb-10">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[spin_8s_linear_infinite]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
        </div>
        {/* Middle pulsing ring */}
        <div className="absolute inset-3 rounded-full border border-primary/10 animate-[pulse_3s_ease-in-out_infinite]" />
        {/* Inner orb */}
        <div className="absolute inset-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-sm">
          <Brain className="w-10 h-10 text-primary animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
        {/* Floating particles */}
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary/40 animate-[bounce_2s_ease-in-out_infinite]" />
        <div className="absolute bottom-4 left-1 w-1.5 h-1.5 rounded-full bg-primary/30 animate-[bounce_2.5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-primary/25 animate-[bounce_3s_ease-in-out_infinite_1s]" />
      </div>

      {/* Animated phrase */}
      <p className="text-[15px] text-foreground/80 font-medium h-6 transition-all duration-500 animate-fade-in" key={phraseIndex}>
        {THINKING_PHRASES[phraseIndex]}
      </p>

      {/* Progress bar */}
      <div className="w-48 h-1 rounded-full bg-muted/30 mt-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground/40 mt-3">
        Detta kan ta några sekunder
      </p>
    </div>
  );
}

export default function Insights() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTriggered = useRef(false);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-deep-insights');
      
      if (fnError) throw fnError;
      
      if (data?.error === 'insufficient_data') {
        setError(data.message);
        return;
      }
      if (data?.error) {
        setError(data.message || 'Något gick fel.');
        return;
      }
      
      setAnalysis(data.analysis);
      setStats(data.stats);
    } catch (e: any) {
      console.error(e);
      setError('Kunde inte generera insikter. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger on mount
  useEffect(() => {
    if (!hasTriggered.current) {
      hasTriggered.current = true;
      generateInsights();
    }
  }, []);

  const parseSection = (text: string, header: string): string | null => {
    const regex = new RegExp(`${header}:?\\s*\\n([\\s\\S]*?)(?=\\n[A-ZÅÄÖ]{3,}|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const sections = analysis ? [
    { key: 'summary', title: 'Sammanfattning', icon: Brain, color: 'text-primary', bg: 'bg-primary/10', content: parseSection(analysis, 'SAMMANFATTNING') },
    { key: 'background', title: 'Bakgrund & Analys', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10', content: parseSection(analysis, 'BAKGRUND & ANALYS') },
    { key: 'strengths', title: 'Styrkor', icon: Shield, color: 'text-mood-stable', bg: 'bg-mood-stable/10', content: parseSection(analysis, 'STYRKOR') },
    { key: 'warnings', title: 'Varningssignaler', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', content: parseSection(analysis, 'VARNINGSSIGNALER') },
    { key: 'prognosis', title: 'Prognos', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10', content: parseSection(analysis, 'PROGNOS') },
    { key: 'recommendations', title: 'Rekommendationer', icon: Lightbulb, color: 'text-mood-elevated', bg: 'bg-mood-elevated/10', content: parseSection(analysis, 'REKOMMENDATIONER') },
  ] : [];

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto pb-24">
      <h1 className="font-display text-3xl font-bold mb-2">Insikter</h1>
      <p className="text-sm text-muted-foreground mb-8">
        AI-driven analys av ditt mående baserat på all din data.
      </p>

      {loading && <InsightsLoadingAnimation />}

      {!loading && error && !analysis && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">{error}</p>
          <Button onClick={generateInsights} variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="w-4 h-4" />
            Försök igen
          </Button>
        </div>
      )}

      {analysis && stats && (
        <div className="space-y-6 fade-in">
          {/* Stats overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalDays}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dagar data</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dagar {MOOD_LABELS[stats.currentMood] || stats.currentMood}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.exerciseDays}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Träningsdagar</p>
            </div>
          </div>

          {/* Mood distribution bar */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <p className="text-xs text-muted-foreground mb-2.5 font-medium">Humörfördelning</p>
            <div className="flex rounded-full overflow-hidden h-3 bg-muted/30">
              {stats.moodCounts.elevated > 0 && (
                <div className="bg-mood-elevated" style={{ width: `${(stats.moodCounts.elevated / stats.totalDays) * 100}%` }} />
              )}
              {stats.moodCounts.stable > 0 && (
                <div className="bg-mood-stable" style={{ width: `${(stats.moodCounts.stable / stats.totalDays) * 100}%` }} />
              )}
              {stats.moodCounts.depressed > 0 && (
                <div className="bg-mood-depressed" style={{ width: `${(stats.moodCounts.depressed / stats.totalDays) * 100}%` }} />
              )}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[11px] text-mood-elevated">Uppvarvad {Math.round((stats.moodCounts.elevated / stats.totalDays) * 100)}%</span>
              <span className="text-[11px] text-mood-stable">Stabil {Math.round((stats.moodCounts.stable / stats.totalDays) * 100)}%</span>
              <span className="text-[11px] text-mood-depressed">Nedstämd {Math.round((stats.moodCounts.depressed / stats.totalDays) * 100)}%</span>
            </div>
          </div>

          {/* Analysis sections */}
          {sections.map((section) => {
            if (!section.content) return null;
            const Icon = section.icon;
            return (
              <div key={section.key} className="rounded-xl border border-border/50 bg-card/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", section.bg)}>
                    <Icon className={cn("w-5 h-5", section.color)} />
                  </div>
                  <h3 className="font-semibold text-base">{section.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            );
          })}

          {/* Regenerate */}
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={generateInsights} disabled={loading} className="gap-2 text-muted-foreground">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Generera ny analys
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground/40 text-center">
            AI-analysen är observationell och ersätter inte medicinsk rådgivning.
          </p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Brain, TrendingUp, Shield, AlertTriangle, Lightbulb, Activity, Loader2, Sparkles, RefreshCw } from 'lucide-react';
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

export default function Insights() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Upptäck mönster i ditt mående</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
            Vår AI analyserar alla dina incheckningar och identifierar mönster, styrkor och varningssignaler.
          </p>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive max-w-sm">
              {error}
            </div>
          )}
          <Button onClick={generateInsights} size="lg" className="gap-2 rounded-xl px-8">
            <Brain className="w-5 h-5" />
            Generera insikter
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-6" />
          <p className="text-sm text-muted-foreground">Analyserar ditt mående...</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Detta kan ta några sekunder</p>
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

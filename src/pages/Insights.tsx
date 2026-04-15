import { useState, useEffect, useRef } from 'react';
import {
  Brain, TrendingUp, Activity, Sparkles, RefreshCw,
  AlertTriangle, Shield, Moon, Dumbbell, Heart, ArrowUpRight, ArrowDownRight,
  ArrowRight, Shuffle, Eye, Zap, CheckCircle2, Utensils, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface InsightStats {
  totalDays: number;
  calendarDays: number;
  dateRange: string;
  moodCounts: { elevated: number; stable: number; depressed: number };
  sleepCounts: { good: number; bad: number };
  eatingCounts: { good: number; bad: number };
  exerciseDays: number;
  currentStreak: number;
  currentMood: string;
  avgEpisodes: Record<string, number>;
  registrationRate: number;
}

interface StructuredInsight {
  status: 'good' | 'warning' | 'alert';
  statusLabel: string;
  statusDescription: string;
  trendDirection: 'improving' | 'declining' | 'stable' | 'fluctuating';
  trendLabel: string;
  keyNumbers: { value: string; label: string; type: 'positive' | 'negative' | 'neutral' }[];
  patterns: { icon: string; label: string; impact: 'positive' | 'negative' | 'neutral'; detail?: string }[];
  prognosis: { shortTerm: string; longTerm: string; confidence: 'low' | 'medium' | 'high' };
  riskLevel: number;
  strengths: string[];
  warnings: string[];
}

const useThinkingPhrases = () => {
  const { t } = useTranslation();
  return [
    t('insights.readingCheckins'),
    t('insights.analyzingSleepPatterns'),
    t('insights.mappingMoodTrends'),
    t('insights.calculatingEpisodeLengths'),
    t('insights.examiningCorrelations'),
    t('insights.buildingPrognosis'),
  ];
};

function InsightsLoadingAnimation() {
  const { t } = useTranslation();
  const phrases = useThinkingPhrases();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
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
    <div className="fixed inset-0 flex flex-col items-center justify-center text-center px-5 z-10">
      <div className="relative w-28 h-28 mb-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[spin_8s_linear_infinite]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
        </div>
        <div className="absolute inset-3 rounded-full border border-primary/10 animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute inset-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-sm">
          <Brain className="w-10 h-10 text-primary animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary/40 animate-[bounce_2s_ease-in-out_infinite]" />
        <div className="absolute bottom-4 left-1 w-1.5 h-1.5 rounded-full bg-primary/30 animate-[bounce_2.5s_ease-in-out_infinite_0.5s]" />
      </div>
      <p className="text-[15px] text-foreground/80 font-medium h-6 transition-all duration-500 animate-fade-in" key={phraseIndex}>
        {phrases[phraseIndex]}
      </p>
      <div className="w-48 h-1 rounded-full bg-muted/30 mt-5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground/40 mt-3">{t('insights.mayTakeSeconds')}</p>
    </div>
  );
}

const STATUS_CONFIG = {
  good: { color: 'text-mood-stable', bg: 'bg-mood-stable/10', border: 'border-mood-stable/30', icon: CheckCircle2, pulse: 'bg-mood-stable' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: Eye, pulse: 'bg-amber-400' },
  alert: { color: 'text-mood-depressed', bg: 'bg-mood-depressed/10', border: 'border-mood-depressed/30', icon: AlertTriangle, pulse: 'bg-mood-depressed' },
};

const TREND_CONFIG = {
  improving: { icon: ArrowUpRight, color: 'text-mood-stable', labelKey: 'insights.improving' },
  declining: { icon: ArrowDownRight, color: 'text-mood-depressed', labelKey: 'insights.declining' },
  stable: { icon: ArrowRight, color: 'text-primary', labelKey: 'insights.stableLabel' },
  fluctuating: { icon: Shuffle, color: 'text-amber-400', labelKey: 'insights.fluctuating' },
};

const PATTERN_ICONS: Record<string, typeof Moon> = {
  sleep: Moon,
  exercise: Dumbbell,
  mood: Heart,
  eating: Utensils,
  correlation: Zap,
  calendar: Calendar,
};

function AnimatedCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={cn(
      'transition-all duration-500 ease-out',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      className
    )}>
      {children}
    </div>
  );
}

export default function Insights() {
  const { t } = useTranslation();
  const [structured, setStructured] = useState<StructuredInsight | null>(null);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTriggered = useRef(false);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    setStructured(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-deep-insights');
      if (fnError) throw fnError;
      if (data?.error === 'insufficient_data') { setError(data.message); return; }
      if (data?.error) { setError(data.message || t('insights.somethingWentWrong')); return; }
      setStructured(data.structured);
      setStats(data.stats);
    } catch (e: unknown) {
      setError(t('insights.couldNotGenerateRetry'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasTriggered.current) {
      hasTriggered.current = true;
      generateInsights();
    }
  }, []);

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto md:mx-0 pb-24">
      <h1 className="font-display text-3xl font-bold mb-2">{t('insights.title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t('insights.subtitle')}
      </p>

      {loading && <InsightsLoadingAnimation />}

      {!loading && error && !structured && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">{error}</p>
          <Button onClick={generateInsights} variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="w-4 h-4" />
            {t('insights.tryAgain')}
          </Button>
        </div>
      )}

      {structured && stats && (
        <div className="space-y-4">
          {/* Status + Risk */}
          <AnimatedCard delay={0}>
            <StatusCard insight={structured} />
          </AnimatedCard>

          {/* Key Numbers Grid */}
          {structured.keyNumbers && structured.keyNumbers.length > 0 && (
            <AnimatedCard delay={100}>
              <KeyNumbersGrid numbers={structured.keyNumbers} />
            </AnimatedCard>
          )}

          {/* Trend */}
          <AnimatedCard delay={200}>
            <TrendCard insight={structured} stats={stats} />
          </AnimatedCard>

          {/* Patterns */}
          {structured.patterns && structured.patterns.length > 0 && (
            <AnimatedCard delay={350}>
              <PatternsCard patterns={structured.patterns} />
            </AnimatedCard>
          )}

          {/* Prognosis */}
          <AnimatedCard delay={500}>
            <PrognosisCard prognosis={structured.prognosis} />
          </AnimatedCard>

          {/* Strengths & Warnings */}
          {((structured.strengths?.length > 0) || (structured.warnings?.length > 0)) && (
            <AnimatedCard delay={650}>
              <StrengthsWarningsCard strengths={structured.strengths} warnings={structured.warnings} />
            </AnimatedCard>
          )}

          {/* Regenerate */}
          <AnimatedCard delay={800}>
            <div className="flex justify-center pt-4">
              <Button variant="ghost" onClick={generateInsights} disabled={loading} className="gap-2 text-muted-foreground">
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                {t('insights.generateNewAnalysis')}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
              {t('insights.aiDisclaimer')}
            </p>
          </AnimatedCard>
        </div>
      )}
    </div>
  );
}

function StatusCard({ insight }: { insight: StructuredInsight }) {
  const { t } = useTranslation();
    const config = STATUS_CONFIG[insight.status] || STATUS_CONFIG.good;
  const Icon = config.icon;
  const riskLevel = insight.riskLevel ?? 0;

  return (
    <div className={cn('rounded-2xl border p-5', config.bg, config.border)}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', config.bg)}>
            <Icon className={cn('w-7 h-7', config.color)} />
          </div>
          <div className={cn('absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full animate-[pulse_2s_ease-in-out_infinite]', config.pulse)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-lg font-bold', config.color)}>{insight.statusLabel}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{insight.statusDescription}</p>
        </div>
      </div>
      {/* Risk bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">{t('insights.riskLevelLabel')}</span>
          <span className={cn('text-xs font-bold', riskLevel > 60 ? 'text-mood-depressed' : riskLevel > 30 ? 'text-amber-400' : 'text-mood-stable')}>
            {riskLevel}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-out',
              riskLevel > 60 ? 'bg-mood-depressed' : riskLevel > 30 ? 'bg-amber-400' : 'bg-mood-stable'
            )}
            style={{ width: `${riskLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function KeyNumbersGrid({ numbers }: { numbers: StructuredInsight['keyNumbers'] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {numbers.slice(0, 6).map((num, i) => {
        const colorClass = num.type === 'positive' ? 'text-mood-stable' : num.type === 'negative' ? 'text-mood-depressed' : 'text-primary';
        const bgClass = num.type === 'positive' ? 'bg-mood-stable/5 border-mood-stable/15' : num.type === 'negative' ? 'bg-mood-depressed/5 border-mood-depressed/15' : 'bg-primary/5 border-primary/15';

        return (
          <div key={i} className={cn('rounded-xl border p-3 text-center', bgClass)}>
            <p className={cn('text-xl font-bold tracking-tight', colorClass)}>{num.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{num.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function TrendCard({ insight, stats }: { insight: StructuredInsight; stats: InsightStats }) {
  const { t } = useTranslation();
    const config = TREND_CONFIG[insight.trendDirection] || TREND_CONFIG.stable;
  const Icon = config.icon;

  // Mini mood distribution bar from stats
  const total = stats.totalDays;
  const elevPct = total > 0 ? (stats.moodCounts.elevated / total) * 100 : 0;
  const stabPct = total > 0 ? (stats.moodCounts.stable / total) * 100 : 0;
  const depPct = total > 0 ? (stats.moodCounts.depressed / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('insights.trend')}</h3>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center">
          <Icon className={cn('w-6 h-6', config.color)} />
        </div>
        <div>
          <p className={cn('font-bold', config.color)}>{t(config.labelKey)}</p>
          <p className="text-sm text-muted-foreground">{insight.trendLabel}</p>
        </div>
      </div>

      {/* Mini distribution */}
      <div className="flex h-2.5 rounded-full overflow-hidden">
        {elevPct > 0 && <div className="bg-mood-elevated transition-all" style={{ width: `${elevPct}%` }} />}
        {stabPct > 0 && <div className="bg-mood-stable transition-all" style={{ width: `${stabPct}%` }} />}
        {depPct > 0 && <div className="bg-mood-depressed transition-all" style={{ width: `${depPct}%` }} />}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/60">
        <span>↑ {Math.round(elevPct)}%</span>
        <span>— {Math.round(stabPct)}%</span>
        <span>↓ {Math.round(depPct)}%</span>
      </div>
    </div>
  );
}

function PatternsCard({ patterns }: { patterns: StructuredInsight['patterns'] }) {
  const { t } = useTranslation();
    const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('insights.patterns')}</h3>
      </div>
      <div className="space-y-2">
        {patterns.map((pattern, i) => {
          const Icon = PATTERN_ICONS[pattern.icon] || Zap;
          const impactColor = pattern.impact === 'positive' ? 'text-mood-stable' : pattern.impact === 'negative' ? 'text-mood-depressed' : 'text-muted-foreground';
          const impactBg = pattern.impact === 'positive' ? 'bg-mood-stable/8' : pattern.impact === 'negative' ? 'bg-mood-depressed/8' : 'bg-muted/30';
          const impactBorder = pattern.impact === 'positive' ? 'border-mood-stable/15' : pattern.impact === 'negative' ? 'border-mood-depressed/15' : 'border-border/30';
          const isExpanded = expanded === i;

          return (
            <button
              key={i}
              onClick={() => setExpanded(isExpanded ? null : i)}
              className={cn(
                'w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-all',
                impactBg, impactBorder,
                'hover:scale-[1.01] active:scale-[0.99]'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', impactColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{pattern.label}</p>
                {isExpanded && pattern.detail && (
                  <p className="text-xs text-muted-foreground mt-1 animate-fade-in">{pattern.detail}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {pattern.impact === 'positive' && <div className="w-2 h-2 rounded-full bg-mood-stable" />}
                {pattern.impact === 'negative' && <div className="w-2 h-2 rounded-full bg-mood-depressed" />}
                {pattern.impact === 'neutral' && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrognosisCard({ prognosis }: { prognosis: StructuredInsight['prognosis'] }) {
  const { t } = useTranslation();
    const confidenceDots = prognosis.confidence === 'high' ? 3 : prognosis.confidence === 'medium' ? 2 : 1;
  const confidenceLabel = prognosis.confidence === 'high' ? t('insights.high') : prognosis.confidence === 'medium' ? t('insights.medium') : t('insights.low');

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('insights.prognosis')}</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60">{confidenceLabel}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map(n => (
              <div key={n} className={cn('w-1.5 h-1.5 rounded-full', n <= confidenceDots ? 'bg-primary' : 'bg-muted-foreground/20')} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">{t('insights.weekLabel')}</p>
          </div>
          <p className="text-sm text-foreground/80">{prognosis.shortTerm}</p>
        </div>

        <div className="rounded-xl bg-muted/30 border border-border/30 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('insights.monthLabel')}</p>
          </div>
          <p className="text-sm text-foreground/60">{prognosis.longTerm}</p>
        </div>
      </div>
    </div>
  );
}

function StrengthsWarningsCard({ strengths, warnings }: { strengths: string[]; warnings: string[] }) {
  const { t } = useTranslation();
    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {strengths && strengths.length > 0 && (
        <div className="rounded-2xl border border-mood-stable/20 bg-mood-stable/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-mood-stable" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-mood-stable">{t('insights.strengths')}</h3>
          </div>
          <div className="space-y-2">
            {strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-mood-stable mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground/70">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">{t('insights.warnings')}</h3>
          </div>
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground/70">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

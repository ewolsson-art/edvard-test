import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  usePatternInsights,
  type PatternInsight,
  type PatternType,
} from '@/hooks/usePatternInsights';
import { TurtleLogo } from '@/components/TurtleLogo';

// Playful emoji + gradient per pattern type
const TYPE_META: Record<
  PatternType,
  { emoji: string; label: string; gradient: string }
> = {
  transition:          { emoji: '🔀', label: 'Övergång',     gradient: 'from-[hsl(280_70%_60%)] to-[hsl(220_70%_60%)]' },
  trigger:             { emoji: '⚡', label: 'Trigger',      gradient: 'from-[hsl(45_90%_60%)]  to-[hsl(20_85%_60%)]'  },
  cycle:               { emoji: '🔁', label: 'Cykel',        gradient: 'from-[hsl(190_75%_55%)] to-[hsl(160_70%_50%)]' },
  seasonal:            { emoji: '🍂', label: 'Säsong',       gradient: 'from-[hsl(30_80%_60%)]  to-[hsl(10_75%_55%)]'  },
  recovery:            { emoji: '🌱', label: 'Återhämtning', gradient: 'from-[hsl(140_65%_50%)] to-[hsl(170_65%_45%)]' },
  medication:          { emoji: '💊', label: 'Medicin',      gradient: 'from-[hsl(210_80%_60%)] to-[hsl(250_70%_60%)]' },
  characteristic_chain:{ emoji: '🧩', label: 'Kedja',        gradient: 'from-[hsl(320_70%_60%)] to-[hsl(280_70%_60%)]' },
  general:             { emoji: '✨', label: 'Mönster',      gradient: 'from-[hsl(45_85%_60%)]  to-[hsl(35_85%_55%)]'  },
};

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-foreground/25',
  attention: 'bg-[hsl(45_90%_60%)]',
  warning: 'bg-[hsl(0_80%_62%)]',
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-10 rounded-full bg-foreground/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-foreground/55"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function PatternCard({ insight }: { insight: PatternInsight }) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[insight.pattern_type] ?? TYPE_META.general;

  return (
    <div className="rounded-2xl bg-card/70 border border-border/30 overflow-hidden transition-colors hover:bg-card/90">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center gap-3 p-3"
      >
        {/* Colorful icon orb */}
        <div
          className={cn(
            'shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br grid place-items-center text-xl shadow-sm',
            meta.gradient,
          )}
        >
          <span className="drop-shadow-sm">{meta.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_DOT[insight.severity] ?? SEVERITY_DOT.info)} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {meta.label}
            </span>
            {insight.occurrences > 1 && (
              <span className="text-[10px] text-muted-foreground/70">· {insight.occurrences}×</span>
            )}
          </div>
          <h3 className="text-[14px] font-semibold text-foreground/90 leading-snug truncate">
            {insight.title}
          </h3>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <ConfidenceBar value={insight.confidence} />
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/60 transition-transform',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 pl-[68px] -mt-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {insight.description}
          </p>
          {insight.supporting_dates.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {insight.supporting_dates.slice(0, 12).map((d) => (
                <span
                  key={d}
                  className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-foreground/[0.06] text-foreground/65 tabular-nums"
                >
                  {format(parseISO(d), 'd MMM', { locale: sv })}
                </span>
              ))}
              {insight.supporting_dates.length > 12 && (
                <span className="text-[10.5px] px-1.5 py-0.5 text-muted-foreground/60">
                  +{insight.supporting_dates.length - 12}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PatternInsightsSection() {
  const { insights, lastRun, isLoading, analyze, isAnalyzing, analyzeError } =
    usePatternInsights();

  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [insufficient, setInsufficient] = useState<{ entries: number; required: number } | null>(
    null,
  );

  useEffect(() => {
    if (isLoading || hasAutoTriggered || isAnalyzing) return;
    const shouldRun =
      !lastRun ||
      lastRun.status === 'error' ||
      (lastRun.status === 'success' &&
        Date.now() - new Date(lastRun.last_run_at).getTime() > 24 * 3_600_000);
    if (shouldRun) {
      setHasAutoTriggered(true);
      analyze(false)
        .then((r) => {
          if (r?.status === 'insufficient_data') {
            setInsufficient({ entries: r.entries ?? 0, required: r.required ?? 14 });
          }
        })
        .catch(() => {});
    }
  }, [isLoading, lastRun, hasAutoTriggered, isAnalyzing, analyze]);

  const sorted = useMemo(() => {
    const severityRank: Record<string, number> = { warning: 0, attention: 1, info: 2 };
    return [...insights].sort((a, b) => {
      const s = severityRank[a.severity] - severityRank[b.severity];
      if (s !== 0) return s;
      return b.confidence - a.confidence;
    });
  }, [insights]);

  const lastRunLabel = lastRun?.last_run_at
    ? formatDistanceToNow(new Date(lastRun.last_run_at), { locale: sv, addSuffix: true })
    : null;

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <TurtleLogo size="sm" animated={false} className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-tight">Mönster</h2>
            {(lastRun?.entries_analyzed || lastRunLabel) && (
              <p className="text-[11px] text-muted-foreground/80 leading-tight">
                {lastRun?.entries_analyzed ? `${lastRun.entries_analyzed} check-ins` : ''}
                {lastRun?.entries_analyzed && lastRunLabel ? ' · ' : ''}
                {lastRunLabel ?? ''}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isAnalyzing}
          onClick={() => {
            setInsufficient(null);
            analyze(true).then((r) => {
              if (r?.status === 'insufficient_data') {
                setInsufficient({ entries: r.entries ?? 0, required: r.required ?? 14 });
              }
            });
          }}
          className="text-xs gap-1.5 shrink-0 h-8 rounded-full"
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {isAnalyzing ? 'Analyserar' : 'Uppdatera'}
        </Button>
      </header>

      {isAnalyzing && insights.length === 0 && (
        <div className="py-10 text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Letar efter mönster…</p>
        </div>
      )}

      {!isAnalyzing && insufficient && (
        <div className="rounded-2xl bg-card/60 border border-border/30 p-5 text-center space-y-1">
          <div className="text-2xl mb-1">🌱</div>
          <p className="text-sm text-foreground/85">Lite mer data behövs</p>
          <p className="text-[12px] text-muted-foreground">
            {insufficient.entries} av {insufficient.required} check-ins
          </p>
        </div>
      )}

      {!isAnalyzing && analyzeError && !insufficient && (
        <p className="text-sm text-[hsl(0_75%_65%)] text-center py-4">
          Kunde inte köra analysen just nu.
        </p>
      )}

      {!isAnalyzing && !insufficient && sorted.length === 0 && lastRun?.status === 'success' && (
        <div className="rounded-2xl bg-card/60 border border-border/30 p-5 text-center space-y-1">
          <div className="text-2xl mb-1">✨</div>
          <p className="text-sm text-foreground/85">Inga tydliga mönster ännu</p>
          <p className="text-[12px] text-muted-foreground">Fortsätt checka in dagligen.</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((insight) => (
            <PatternCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <p className="text-[10px] text-muted-foreground/55 leading-relaxed text-center pt-1 px-4">
          Mönster i din egen data — diskutera med vårdgivare.
        </p>
      )}
    </section>
  );
}

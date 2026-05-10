import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-card/70 border border-border/30 transition-colors hover:bg-card/90"
      >
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
          <h3 className="text-[14px] font-semibold text-foreground/90 leading-snug line-clamp-2">
            {insight.title}
          </h3>
        </div>

        <div className="shrink-0">
          <ConfidenceBar value={insight.confidence} />
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br grid place-items-center text-2xl shadow-sm',
                  meta.gradient,
                )}
              >
                <span className="drop-shadow-sm">{meta.emoji}</span>
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_DOT[insight.severity] ?? SEVERITY_DOT.info)} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {meta.label}
                  </span>
                  {insight.occurrences > 1 && (
                    <span className="text-[10px] text-muted-foreground/70">· {insight.occurrences}×</span>
                  )}
                </div>
                <DialogTitle className="text-[17px] font-semibold leading-snug text-left">
                  {insight.title}
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-[14px] text-foreground/80 leading-relaxed text-left">
              {insight.description}
            </DialogDescription>
          </DialogHeader>

          {insight.supporting_data?.why_it_matters && (
            <div className="rounded-2xl bg-foreground/[0.04] border border-border/30 p-3 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Varför det spelar roll
              </p>
              <p className="text-[14px] text-foreground/85 leading-relaxed">
                {insight.supporting_data.why_it_matters}
              </p>
            </div>
          )}

          {insight.supporting_data?.what_to_do && (
            <div className="rounded-2xl bg-[hsl(45_85%_55%/0.08)] border border-[hsl(45_85%_55%/0.3)] p-3 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-[hsl(45_85%_65%)] font-medium">
                Vad du kan göra
              </p>
              <p className="text-[14px] text-foreground/90 leading-relaxed">
                {insight.supporting_data.what_to_do}
              </p>
            </div>
          )}

          {insight.supporting_dates.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Datum i mönstret
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insight.supporting_dates.slice(0, 24).map((d) => (
                  <span
                    key={d}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-foreground/[0.06] text-foreground/70 tabular-nums"
                  >
                    {format(parseISO(d), 'd MMM', { locale: sv })}
                  </span>
                ))}
                {insight.supporting_dates.length > 24 && (
                  <span className="text-[11px] px-2 py-0.5 text-muted-foreground/60">
                    +{insight.supporting_dates.length - 24}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] text-muted-foreground">Säkerhet</span>
            <ConfidenceBar value={insight.confidence} />
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {Math.round(insight.confidence * 100)}%
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
    return [...insights]
      .filter((i) => i.pattern_type !== 'medication')
      .sort((a, b) => {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

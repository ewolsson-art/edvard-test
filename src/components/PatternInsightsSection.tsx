import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pill,
  RefreshCw,
  Repeat,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  usePatternInsights,
  type PatternInsight,
  type PatternType,
} from '@/hooks/usePatternInsights';
import { TurtleLogo } from '@/components/TurtleLogo';

const TYPE_META: Record<
  PatternType,
  { icon: typeof Activity; label: string }
> = {
  transition: { icon: ArrowRightLeft, label: 'Övergång' },
  trigger: { icon: Zap, label: 'Trigger' },
  cycle: { icon: Repeat, label: 'Cykel' },
  seasonal: { icon: CalendarIcon, label: 'Säsong' },
  recovery: { icon: TrendingUp, label: 'Återhämtning' },
  medication: { icon: Pill, label: 'Medicin' },
  characteristic_chain: { icon: Activity, label: 'Karaktärskedja' },
  general: { icon: Sparkles, label: 'Mönster' },
};

const SEVERITY_STYLE: Record<string, string> = {
  info: 'border-border/40 bg-foreground/[0.02]',
  attention: 'border-[hsl(45_85%_55%/0.4)] bg-[hsl(45_85%_55%/0.05)]',
  warning: 'border-[hsl(0_75%_55%/0.45)] bg-[hsl(0_75%_55%/0.06)]',
};

const SEVERITY_BADGE: Record<string, string> = {
  info: 'text-muted-foreground',
  attention: 'text-[hsl(45_85%_60%)]',
  warning: 'text-[hsl(0_75%_65%)]',
};

function PatternRow({ insight }: { insight: PatternInsight }) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[insight.pattern_type] ?? TYPE_META.general;
  const Icon = meta.icon;
  const confidencePct = Math.round(insight.confidence * 100);

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-colors',
        SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.info,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-start gap-3"
      >
        <div className="shrink-0 mt-0.5">
          {insight.severity === 'warning' ? (
            <AlertTriangle className="h-4 w-4 text-[hsl(0_75%_65%)]" />
          ) : (
            <Icon className="h-4 w-4 text-foreground/70" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-foreground/45 font-medium">
              {meta.label}
            </span>
            <span
              className={cn(
                'text-[10px] uppercase tracking-wider font-medium',
                SEVERITY_BADGE[insight.severity] ?? SEVERITY_BADGE.info,
              )}
            >
              · {confidencePct}% säkerhet
            </span>
            {insight.occurrences > 1 && (
              <span className="text-[10px] uppercase tracking-wider text-foreground/45">
                · {insight.occurrences}× sett
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground/90 leading-snug">
            {insight.title}
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {insight.description}
          </p>
        </div>
        {insight.supporting_dates.length > 0 && (
          <div className="shrink-0 mt-1 text-muted-foreground/60">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        )}
      </button>

      {open && insight.supporting_dates.length > 0 && (
        <div className="mt-3 pl-7 border-t border-border/15 pt-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-foreground/45 font-medium">
            Stöddatum
          </p>
          <div className="flex flex-wrap gap-1.5">
            {insight.supporting_dates.slice(0, 18).map((d) => (
              <span
                key={d}
                className="text-[11px] px-1.5 py-0.5 rounded-md bg-foreground/[0.05] text-foreground/70 tabular-nums"
              >
                {format(parseISO(d), 'd MMM', { locale: sv })}
              </span>
            ))}
            {insight.supporting_dates.length > 18 && (
              <span className="text-[11px] px-1.5 py-0.5 text-muted-foreground/60">
                +{insight.supporting_dates.length - 18}
              </span>
            )}
          </div>
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

  // Auto-trigger om vi aldrig kört eller om det är >24h sen senast
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
    <section className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <TurtleLogo size="sm" animated={false} className="h-6 w-6 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">Dina personliga mönster</h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              AI-analys av hela din historik · uppdateras dagligen
            </p>
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
          className="text-xs gap-1.5 shrink-0"
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {isAnalyzing ? 'Analyserar…' : 'Analysera om'}
        </Button>
      </header>

      {/* Status row */}
      {(lastRunLabel || lastRun?.entries_analyzed) && (
        <p className="text-[11px] text-muted-foreground/70">
          {lastRun?.entries_analyzed
            ? `${lastRun.entries_analyzed} check-ins analyserade`
            : null}
          {lastRunLabel && lastRun?.entries_analyzed ? ' · ' : ''}
          {lastRunLabel ? `senast ${lastRunLabel}` : ''}
        </p>
      )}

      {/* States */}
      {isAnalyzing && insights.length === 0 && (
        <div className="py-8 text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Analyserar din historik…
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            Letar efter övergångar, triggers, cykler och samband
          </p>
        </div>
      )}

      {!isAnalyzing && insufficient && (
        <div className="py-6 text-center space-y-1">
          <p className="text-sm text-foreground/80">
            Behöver mer data för att hitta tillförlitliga mönster
          </p>
          <p className="text-[12px] text-muted-foreground">
            {insufficient.entries} av {insufficient.required} check-ins.
            Fortsätt med dagliga incheckningar.
          </p>
        </div>
      )}

      {!isAnalyzing && analyzeError && !insufficient && (
        <div className="py-4 text-center">
          <p className="text-sm text-[hsl(0_75%_65%)]">
            Kunde inte köra analysen just nu. Försök igen om en stund.
          </p>
        </div>
      )}

      {!isAnalyzing && !insufficient && sorted.length === 0 && lastRun?.status === 'success' && (
        <div className="py-6 text-center space-y-1">
          <p className="text-sm text-foreground/80">Inga tydliga mönster ännu</p>
          <p className="text-[12px] text-muted-foreground">
            Det är ett bra tecken — eller så behövs mer data. Fortsätt checka in.
          </p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2.5">
          {sorted.map((insight) => (
            <PatternRow key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1">
          Mönster i din egen data — inte en klinisk bedömning. Diskutera fynd med vårdgivare.
        </p>
      )}
    </section>
  );
}

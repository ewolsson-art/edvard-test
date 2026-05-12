import { useMemo, useState } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TurtleLogo } from '@/components/TurtleLogo';
import { usePatientPatternInsights } from '@/hooks/usePatientPatternInsights';
import type { PatternInsight, PatternType } from '@/hooks/usePatternInsights';

const TYPE_META: Record<PatternType, { emoji: string; label: string; gradient: string }> = {
  transition:           { emoji: '🔀', label: 'Övergång',     gradient: 'from-[hsl(280_70%_60%)] to-[hsl(220_70%_60%)]' },
  trigger:              { emoji: '⚡', label: 'Trigger',      gradient: 'from-[hsl(45_90%_60%)]  to-[hsl(20_85%_60%)]'  },
  cycle:                { emoji: '🔁', label: 'Cykel',        gradient: 'from-[hsl(190_75%_55%)] to-[hsl(160_70%_50%)]' },
  seasonal:             { emoji: '🍂', label: 'Säsong',       gradient: 'from-[hsl(30_80%_60%)]  to-[hsl(10_75%_55%)]'  },
  recovery:             { emoji: '🌱', label: 'Återhämtning', gradient: 'from-[hsl(140_65%_50%)] to-[hsl(170_65%_45%)]' },
  medication:           { emoji: '💊', label: 'Medicin',      gradient: 'from-[hsl(210_80%_60%)] to-[hsl(250_70%_60%)]' },
  characteristic_chain: { emoji: '🧩', label: 'Kedja',        gradient: 'from-[hsl(320_70%_60%)] to-[hsl(280_70%_60%)]' },
  general:              { emoji: '✨', label: 'Mönster',      gradient: 'from-[hsl(45_85%_60%)]  to-[hsl(35_85%_55%)]'  },
};

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-foreground/25',
  attention: 'bg-[hsl(45_90%_60%)]',
  warning: 'bg-[hsl(0_80%_62%)]',
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-10 rounded-full bg-foreground/10 overflow-hidden">
      <div className="h-full rounded-full bg-foreground/55" style={{ width: `${Math.round(value * 100)}%` }} />
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
        <div className={cn('shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br grid place-items-center text-xl shadow-sm', meta.gradient)}>
          <span className="drop-shadow-sm">{meta.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_DOT[insight.severity] ?? SEVERITY_DOT.info)} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{meta.label}</span>
            {insight.occurrences > 1 && (
              <span className="text-[10px] text-muted-foreground/70">· {insight.occurrences}×</span>
            )}
          </div>
          <h3 className="text-[14px] font-semibold text-foreground/90 leading-snug line-clamp-2">{insight.title}</h3>
        </div>
        <div className="shrink-0">
          <ConfidenceBar value={insight.confidence} />
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn('shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br grid place-items-center text-2xl shadow-sm', meta.gradient)}>
                <span className="drop-shadow-sm">{meta.emoji}</span>
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_DOT[insight.severity] ?? SEVERITY_DOT.info)} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{meta.label}</span>
                  {insight.occurrences > 1 && (
                    <span className="text-[10px] text-muted-foreground/70">· {insight.occurrences}×</span>
                  )}
                </div>
                <DialogTitle className="text-[17px] font-semibold leading-snug text-left">{insight.title}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-[14px] text-foreground/80 leading-relaxed text-left">
              {insight.description}
            </DialogDescription>
          </DialogHeader>

          {insight.supporting_data?.why_it_matters && (
            <div className="rounded-2xl bg-foreground/[0.04] border border-border/30 p-3 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Varför det spelar roll</p>
              <p className="text-[14px] text-foreground/85 leading-relaxed">{insight.supporting_data.why_it_matters}</p>
            </div>
          )}

          {insight.supporting_data?.what_to_do && (
            <div className="rounded-2xl bg-[hsl(45_85%_55%/0.08)] border border-[hsl(45_85%_55%/0.3)] p-3 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-[hsl(45_85%_65%)] font-medium">Förslag till samtal</p>
              <p className="text-[14px] text-foreground/90 leading-relaxed">{insight.supporting_data.what_to_do}</p>
            </div>
          )}

          {insight.supporting_dates.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Datum i mönstret</p>
              <div className="flex flex-wrap gap-1.5">
                {insight.supporting_dates.slice(0, 24).map((d) => (
                  <span key={d} className="text-[11px] px-2 py-0.5 rounded-md bg-foreground/[0.06] text-foreground/70 tabular-nums">
                    {format(parseISO(d), 'd MMM', { locale: sv })}
                  </span>
                ))}
                {insight.supporting_dates.length > 24 && (
                  <span className="text-[11px] px-2 py-0.5 text-muted-foreground/60">+{insight.supporting_dates.length - 24}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] text-muted-foreground">Säkerhet</span>
            <ConfidenceBar value={insight.confidence} />
            <span className="text-[11px] text-muted-foreground tabular-nums">{Math.round(insight.confidence * 100)}%</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Props {
  patientId: string;
  isShared: boolean;
  patientName?: string;
}

export function PatientPatternInsightsSection({ patientId, isShared, patientName }: Props) {
  const { insights, lastRun, isLoading } = usePatientPatternInsights(isShared ? patientId : null);

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

  if (!isShared) {
    return (
      <section className="space-y-3">
        <header className="flex items-center gap-2.5">
          <TurtleLogo size="sm" animated={false} className="h-7 w-7 shrink-0" />
          <h2 className="text-[17px] font-semibold leading-tight">Mönster</h2>
        </header>
        <div className="rounded-2xl bg-card/60 border border-border/30 p-5 text-center space-y-1">
          <div className="text-2xl mb-1">🔒</div>
          <p className="text-sm text-foreground/85">
            {patientName ? `${patientName} delar inte sina mönster ännu` : 'Mönster delas inte ännu'}
          </p>
          <p className="text-[12px] text-muted-foreground">Be användaren slå på AI-insikter för att se mönster här.</p>
        </div>
      </section>
    );
  }

  const lastRunLabel = lastRun?.last_run_at
    ? formatDistanceToNow(new Date(lastRun.last_run_at), { locale: sv, addSuffix: true })
    : null;

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2.5 px-1">
        <TurtleLogo size="sm" animated={false} className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold leading-tight">Mönster</h2>
          {(lastRun?.entries_analyzed || lastRunLabel) && (
            <p className="text-[11px] text-muted-foreground/80 leading-tight">
              {lastRun?.entries_analyzed ? `Baserat på ${lastRun.entries_analyzed} check-ins` : ''}
              {lastRun?.entries_analyzed && lastRunLabel ? ' · ' : ''}
              {lastRunLabel ? `uppdaterat ${lastRunLabel}` : ''}
            </p>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="py-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="rounded-2xl bg-card/60 border border-border/30 p-5 text-center space-y-1">
          <div className="text-2xl mb-1">✨</div>
          <p className="text-sm text-foreground/85">Inga tydliga mönster ännu</p>
          <p className="text-[12px] text-muted-foreground">Mönsteranalysen behöver fler check-ins.</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((insight) => (
            <PatternCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </section>
  );
}

import { useMemo } from 'react';
import { parseISO, differenceInDays, isAfter, isBefore, isEqual, subDays } from 'date-fns';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Medication } from '@/types/medication';
import { useMoodData } from '@/hooks/useMoodData';
import { MoodType } from '@/types/mood';

interface Props {
  med: Medication;
}

const MOOD_SCORE: Record<MoodType, number> = {
  severe_depressed: -3, depressed: -2, somewhat_depressed: -1,
  stable: 0,
  somewhat_elevated: 1, elevated: 2, severe_elevated: 3,
};

const isExtreme = (m: MoodType) => m === 'severe_depressed' || m === 'severe_elevated';

/**
 * Jämför mående under medicinens period mot lika lång period före insättning.
 * Hjälper användaren se: "Hjälpte denna medicin mig att stabiliseras eller inte?"
 */
export function MedicationBeforeAfter({ med }: Props) {
  const { entries } = useMoodData();

  const comparison = useMemo(() => {
    if (!med.started_at) return null;
    const start = parseISO(med.started_at);
    const end = med.stopped_at ? parseISO(med.stopped_at) : new Date();
    const periodDays = Math.max(7, differenceInDays(end, start));

    const beforeStart = subDays(start, periodDays);

    const inWindow = (dateStr: string, from: Date, to: Date) => {
      const d = parseISO(dateStr);
      return (isAfter(d, from) || isEqual(d, from)) && (isBefore(d, to) || isEqual(d, to));
    };

    const beforeEntries = entries.filter(e => inWindow(e.date, beforeStart, start));
    const duringEntries = entries.filter(e => inWindow(e.date, start, end));

    const summarize = (arr: typeof entries) => {
      if (arr.length === 0) return null;
      const scoreSum = arr.reduce((s, e) => s + MOOD_SCORE[e.mood], 0);
      const extreme = arr.filter(e => isExtreme(e.mood)).length;
      const stable = arr.filter(e =>
        e.mood === 'stable' || e.mood === 'somewhat_depressed' || e.mood === 'somewhat_elevated'
      ).length;
      return {
        days: arr.length,
        avgScore: scoreSum / arr.length,
        extreme,
        stablePct: Math.round((stable / arr.length) * 100),
      };
    };

    return {
      before: summarize(beforeEntries),
      during: summarize(duringEntries),
      periodDays,
    };
  }, [med, entries]);

  if (!comparison) return null;
  if (!comparison.before || !comparison.during) {
    // Inte tillräckligt med data — visa hjälpsam förklaring istället för att gömma kortet
    return (
      <div className="rounded-2xl bg-foreground/[0.03] p-4">
        <p className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider mb-2">
          Före vs under
        </p>
        <p className="text-[12px] text-foreground/50">
          {!comparison.before
            ? 'Inga incheckningar finns från perioden innan denna medicin sattes in. När du loggar mer mående kan vi börja jämföra.'
            : 'Inga incheckningar än under denna medicins period.'}
        </p>
      </div>
    );
  }

  const { before, during } = comparison;

  // Tolka diff: negativ = lägre snitt nu (mer nedstämd), positiv = högre snitt (mer uppvarvad)
  // Det "bra" är om |avgScore| minskar (närmare stabil) ELLER stabilPct ökar.
  const stableDelta = during.stablePct - before.stablePct;
  const extremeDelta = during.extreme - before.extreme;
  const towardStable = Math.abs(during.avgScore) < Math.abs(before.avgScore);

  return (
    <div className="rounded-2xl bg-foreground/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider">
          Före vs under
        </p>
        <span className="text-[10px] text-foreground/30">
          {comparison.periodDays} dagar var
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Side label="Innan" data={before} />
        <ArrowRight className="h-4 w-4 text-foreground/25" />
        <Side label="Under" data={during} highlight />
      </div>

      <div className="border-t border-foreground/[0.06] pt-3 space-y-2">
        <DeltaRow
          label="Stabila dagar"
          delta={stableDelta}
          unit="%"
          goodIfPositive
        />
        <DeltaRow
          label="Extremdagar"
          delta={extremeDelta}
          unit=" dagar"
          goodIfPositive={false}
        />
        {towardStable && (
          <p className="text-[12px] text-emerald-300/90 flex items-center gap-1.5 pt-1">
            <TrendingUp className="h-3 w-3" />
            Snittmåendet är närmare stabilt nu än innan.
          </p>
        )}
      </div>
    </div>
  );
}

function Side({
  label, data, highlight,
}: {
  label: string;
  data: { days: number; avgScore: number; extreme: number; stablePct: number };
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-primary/[0.08] border border-primary/20' : 'bg-foreground/[0.03]'}`}>
      <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">{label}</p>
      <p className={`text-[20px] font-semibold tabular-nums mt-0.5 ${highlight ? 'text-foreground/95' : 'text-foreground/75'}`}>
        {data.stablePct}%
      </p>
      <p className="text-[10px] text-foreground/30">stabila dagar</p>
      <p className="text-[10px] text-foreground/30 mt-1.5">
        Snitt {formatScore(data.avgScore)} · {data.days}d loggat
      </p>
    </div>
  );
}

function DeltaRow({
  label, delta, unit, goodIfPositive,
}: { label: string; delta: number; unit: string; goodIfPositive: boolean }) {
  const isZero = delta === 0;
  const isGood = goodIfPositive ? delta > 0 : delta < 0;
  const color = isZero
    ? 'text-foreground/40'
    : isGood
      ? 'text-emerald-300'
      : 'text-rose-300';
  const Icon = isZero ? Minus : (delta > 0 ? TrendingUp : TrendingDown);
  const sign = delta > 0 ? '+' : '';
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-foreground/60">{label}</span>
      <span className={`flex items-center gap-1.5 tabular-nums font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {sign}{delta}{unit}
      </span>
    </div>
  );
}

function formatScore(s: number) {
  if (Math.abs(s) < 0.05) return '0';
  const sign = s > 0 ? '+' : '';
  return `${sign}${s.toFixed(1)}`;
}

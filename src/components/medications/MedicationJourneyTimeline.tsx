import { useMemo } from 'react';
import { format, parseISO, differenceInDays, isAfter, isBefore, isEqual, min, max, addMonths, startOfMonth } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Pill, FlaskConical, TrendingUp, Sparkles } from 'lucide-react';
import { Medication, EFFECTIVENESS_COLORS, EFFECTIVENESS_LABELS } from '@/types/medication';
import { useMoodData } from '@/hooks/useMoodData';
import { MoodType } from '@/types/mood';

interface MoodEntryLite {
  date: string;
  mood: MoodType;
}

interface Props {
  medications: Medication[];
  onSelect: (med: Medication) => void;
  /** Optional override of entries (used in doctor/relative views with patient data) */
  entries?: MoodEntryLite[];
}

const MOOD_SCORE: Record<MoodType, number> = {
  severe_depressed: -3, depressed: -2, somewhat_depressed: -1,
  stable: 0,
  somewhat_elevated: 1, elevated: 2, severe_elevated: 3,
};

/**
 * MedicationJourneyTimeline
 * – Horisontell tidslinje där varje medicin är en stapel mellan startdatum och stoppdatum (eller idag).
 * – Bakom medicinerna ligger en gradient som visar genomsnittligt mående per månad,
 *   så man kan se korrelation: när byttes mediciner och vad hände med måendet?
 * – Klick på medicin öppnar detaljvy.
 */
export function MedicationJourneyTimeline({ medications, onSelect, entries: entriesProp }: Props) {
  const { entries: ownEntries } = useMoodData();
  const entries = entriesProp ?? ownEntries;

  const journey = useMemo(() => {
    if (medications.length === 0) return null;

    // Bestäm tidsspann: tidigaste startdatum -> idag (eller senaste stoppdatum om alla är stoppade)
    const today = new Date();
    const starts = medications
      .map(m => m.started_at ? parseISO(m.started_at) : null)
      .filter((d): d is Date => !!d);
    if (starts.length === 0) return null;

    const allCurrent = medications.some(m => (m.status ?? (m.active ? 'current' : 'previous')) === 'current');
    const stoppedDates = medications
      .filter(m => m.stopped_at)
      .map(m => parseISO(m.stopped_at as string));

    let earliest = min(starts);
    let latest = allCurrent || stoppedDates.length === 0 ? today : max([...stoppedDates, today]);

    // Buffer min 6 mån
    const totalDays = Math.max(180, differenceInDays(latest, earliest) + 30);
    if (differenceInDays(latest, earliest) < 180) {
      earliest = new Date(latest.getTime() - 180 * 24 * 60 * 60 * 1000);
    }

    const span = differenceInDays(latest, earliest);
    const pctOf = (d: Date) => {
      const days = differenceInDays(d, earliest);
      return Math.max(0, Math.min(100, (days / span) * 100));
    };

    // Sortera mediciner: nuvarande överst, sedan kronologiskt efter startdatum (nyaste först)
    const sorted = [...medications]
      .filter(m => m.started_at)
      .sort((a, b) => {
        const aActive = (a.status ?? (a.active ? 'current' : 'previous')) === 'current';
        const bActive = (b.status ?? (b.active ? 'current' : 'previous')) === 'current';
        if (aActive !== bActive) return aActive ? -1 : 1;
        return parseISO(b.started_at).getTime() - parseISO(a.started_at).getTime();
      });

    const bars = sorted.map(med => {
      const start = parseISO(med.started_at);
      const isCurrent = (med.status ?? (med.active ? 'current' : 'previous')) === 'current';
      const end = med.stopped_at ? parseISO(med.stopped_at) : (isCurrent ? today : start);
      const left = pctOf(start);
      const right = pctOf(end);
      const width = Math.max(2, right - left); // minst 2% bredd så väldigt korta perioder syns
      return { med, left, width, isCurrent, start, end };
    });

    // Månadsmarkeringar (max ~8 etiketter)
    const monthsBetween = Math.max(1, Math.round(span / 30));
    const stepMonths = Math.max(1, Math.ceil(monthsBetween / 7));
    const monthLabels: { left: number; label: string }[] = [];
    let cursor = startOfMonth(earliest);
    while (cursor <= latest) {
      monthLabels.push({
        left: pctOf(cursor),
        label: format(cursor, 'MMM yy', { locale: sv }),
      });
      cursor = addMonths(cursor, stepMonths);
    }

    // Beräkna mående-snitt per månad i spannet — för bakgrundsgradient
    const moodByMonth = new Map<string, { sum: number; count: number }>();
    entries.forEach(e => {
      const d = parseISO(e.date);
      if (isBefore(d, earliest) || isAfter(d, latest)) return;
      const key = format(d, 'yyyy-MM');
      const cur = moodByMonth.get(key) ?? { sum: 0, count: 0 };
      cur.sum += MOOD_SCORE[e.mood];
      cur.count += 1;
      moodByMonth.set(key, cur);
    });

    // Skapa månads-celler för bakgrund
    const moodCells: { left: number; width: number; avg: number; count: number }[] = [];
    let mc = startOfMonth(earliest);
    while (mc <= latest) {
      const key = format(mc, 'yyyy-MM');
      const next = addMonths(mc, 1);
      const data = moodByMonth.get(key);
      if (data && data.count > 0) {
        moodCells.push({
          left: pctOf(mc),
          width: Math.max(0.5, pctOf(next) - pctOf(mc)),
          avg: data.sum / data.count,
          count: data.count,
        });
      }
      mc = next;
    }

    return { bars, monthLabels, moodCells, earliest, latest };
  }, [medications, entries]);

  if (!journey || journey.bars.length === 0) return null;

  return (
    <section
      className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden"
      aria-label="Medicineringsresa över tid"
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground/90">Din medicineringsresa</h2>
              <p className="text-[12px] text-foreground/40 mt-0.5">
                Hur dina mediciner har följt — och påverkat — ditt mående över tid.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Tidslinje */}
        <div className="relative">
          {/* Mående-bakgrund (månads-gradient) */}
          <div className="absolute inset-x-0 top-0 bottom-7 rounded-lg overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-foreground/[0.02]" />
            {journey.moodCells.map((cell, i) => {
              // -3 (nedstämd) -> blå, 0 stabil -> grön/transparent, +3 (uppvarvad) -> orange
              const intensity = Math.min(1, Math.abs(cell.avg) / 2.5);
              const color = cell.avg < -0.4
                ? `hsla(220, 80%, 60%, ${0.08 + intensity * 0.18})`
                : cell.avg > 0.4
                  ? `hsla(20, 90%, 60%, ${0.08 + intensity * 0.18})`
                  : `hsla(150, 60%, 50%, ${0.06 + (1 - Math.abs(cell.avg) / 0.4) * 0.08})`;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${cell.left}%`,
                    width: `${cell.width}%`,
                    background: color,
                  }}
                />
              );
            })}
          </div>

          {/* Medicin-staplar */}
          <div className="relative space-y-2 pb-7">
            {journey.bars.map(({ med, left, width, isCurrent }) => {
              const effClass = med.effectiveness ? EFFECTIVENESS_COLORS[med.effectiveness] : '';
              return (
                <button
                  key={med.id}
                  onClick={() => onSelect(med)}
                  className="relative h-9 w-full group"
                  aria-label={`${med.name}, ${med.dosage}`}
                >
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 gap-1.5 transition-all
                      ${isCurrent
                        ? 'bg-primary/25 border border-primary/40 shadow-[0_0_12px_-4px_hsl(45_85%_55%/0.5)]'
                        : 'bg-foreground/[0.07] border border-foreground/[0.1]'}
                      group-hover:scale-y-110 group-hover:bg-opacity-90`}
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: 24 }}
                  >
                    {med.is_trial ? (
                      <FlaskConical className="h-3 w-3 text-amber-400 shrink-0" />
                    ) : (
                      <Pill className={`h-3 w-3 shrink-0 ${isCurrent ? 'text-primary' : 'text-foreground/50'}`} />
                    )}
                    <span className={`text-[11px] font-medium truncate ${isCurrent ? 'text-foreground/95' : 'text-foreground/70'}`}>
                      {med.name}
                    </span>
                  </div>
                  {/* Tooltip visad vid hover (desktop) */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground/90 text-background text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {med.name} · {med.dosage}
                    {med.effectiveness && ` · ${EFFECTIVENESS_LABELS[med.effectiveness]}`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Månads-axel */}
          <div className="relative h-5 border-t border-foreground/[0.06]">
            {journey.monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute top-1 -translate-x-1/2 text-[10px] text-foreground/30 whitespace-nowrap"
                style={{ left: `${m.left}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Förklaring */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-foreground/40">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-primary/40 border border-primary/40" /> Pågående
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-foreground/[0.1] border border-foreground/[0.15]" /> Avslutad
          </span>
          <span className="flex items-center gap-1.5">
            <FlaskConical className="h-2.5 w-2.5 text-amber-400" /> Provmedicin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: 'hsla(220, 80%, 60%, 0.25)' }} />
            <span className="h-2 w-3 rounded-sm" style={{ background: 'hsla(150, 60%, 50%, 0.15)' }} />
            <span className="h-2 w-3 rounded-sm" style={{ background: 'hsla(20, 90%, 60%, 0.25)' }} />
            <span className="ml-1">Mående: nedstämd → stabil → uppvarvad</span>
          </span>
        </div>

        {medications.length >= 3 && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/[0.06] border border-primary/15">
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[12px] text-foreground/70 leading-relaxed">
              Klicka på en medicin för att se dess effekt och biverkningar i detalj.
              Tidslinjens bakgrundsfärg visar ditt snittmående per månad — så du kan se hur byten har påverkat dig.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

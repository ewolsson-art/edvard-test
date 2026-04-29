import { useMemo } from 'react';
import { format, parseISO, differenceInDays, isAfter, isBefore, min, max, addMonths, startOfMonth } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Pill, FlaskConical, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { Medication } from '@/types/medication';
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
 * MedicationJourneyTimeline – enkel & pedagogisk
 * Varje medicin = en rad: namn + dosering till vänster, en horisontell "livslängd"-stapel till höger.
 * Stapeln visar när du började och slutade (eller "pågår"). Bakom alla staplar löper en svag färgremsa
 * som visar genomsnittligt mående per månad — så man ser om mående blev bättre eller sämre.
 */
export function MedicationJourneyTimeline({ medications, onSelect, entries: entriesProp }: Props) {
  const { entries: ownEntries } = useMoodData();
  const entries = entriesProp ?? ownEntries;

  const journey = useMemo(() => {
    const meds = medications.filter(m => m.started_at);
    if (meds.length === 0) return null;

    const today = new Date();
    const starts = meds.map(m => parseISO(m.started_at));
    const allCurrent = meds.some(m => (m.status ?? (m.active ? 'current' : 'previous')) === 'current');
    const stoppedDates = meds.filter(m => m.stopped_at).map(m => parseISO(m.stopped_at as string));

    let earliest = min(starts);
    let latest = allCurrent || stoppedDates.length === 0 ? today : max([...stoppedDates, today]);

    // Garantera minst 6 månaders span så väldigt korta historiker inte ser konstiga ut
    if (differenceInDays(latest, earliest) < 180) {
      earliest = new Date(latest.getTime() - 180 * 24 * 60 * 60 * 1000);
    }

    const span = Math.max(1, differenceInDays(latest, earliest));
    const pctOf = (d: Date) => Math.max(0, Math.min(100, (differenceInDays(d, earliest) / span) * 100));

    // Sortera: pågående överst, sedan nyast först
    const sorted = [...meds].sort((a, b) => {
      const aActive = (a.status ?? (a.active ? 'current' : 'previous')) === 'current';
      const bActive = (b.status ?? (b.active ? 'current' : 'previous')) === 'current';
      if (aActive !== bActive) return aActive ? -1 : 1;
      return parseISO(b.started_at).getTime() - parseISO(a.started_at).getTime();
    });

    const rows = sorted.map(med => {
      const start = parseISO(med.started_at);
      const isCurrent = (med.status ?? (med.active ? 'current' : 'previous')) === 'current';
      const end = med.stopped_at ? parseISO(med.stopped_at) : (isCurrent ? today : start);
      const left = pctOf(start);
      const right = pctOf(end);
      const width = Math.max(3, right - left);
      return { med, left, width, isCurrent, start, end };
    });

    // Få månads-etiketter (start, mitten, slut räcker)
    const monthLabels = [
      { left: 0, label: format(earliest, 'MMM yyyy', { locale: sv }) },
      { left: 50, label: format(new Date((earliest.getTime() + latest.getTime()) / 2), 'MMM yyyy', { locale: sv }) },
      { left: 100, label: format(latest, 'MMM yyyy', { locale: sv }) },
    ];

    // Mående per månad för bakgrundsremsa
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

    const moodCells: { left: number; width: number; avg: number }[] = [];
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
        });
      }
      mc = next;
    }

    return { rows, monthLabels, moodCells, earliest, latest };
  }, [medications, entries]);

  if (!journey || journey.rows.length === 0) return null;

  return (
    <section
      className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden"
      aria-label="Medicineringsresa över tid"
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-[18px] leading-none">
            <span aria-hidden="true">📈</span>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-foreground/90">Din medicineringsresa</h2>
            <p className="text-[12px] text-foreground/40 mt-0.5">
              När du började, slutade och hur måendet följde med. 📈
            </p>
          </div>
        </div>
      </div>

      {/* Mående-bakgrundsremsa + månads-axel högst upp */}
      <div className="px-5">
        <div className="relative h-2 rounded-full bg-foreground/[0.04] overflow-hidden" aria-hidden="true">
          {journey.moodCells.map((cell, i) => {
            const intensity = Math.min(1, Math.abs(cell.avg) / 2.5);
            const color = cell.avg < -0.4
              ? `hsla(220, 80%, 60%, ${0.25 + intensity * 0.45})`
              : cell.avg > 0.4
                ? `hsla(20, 90%, 60%, ${0.25 + intensity * 0.45})`
                : `hsla(150, 60%, 50%, ${0.2 + (1 - Math.abs(cell.avg) / 0.4) * 0.15})`;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0"
                style={{ left: `${cell.left}%`, width: `${cell.width}%`, background: color }}
              />
            );
          })}
        </div>
        <div className="relative h-4 mt-1">
          {journey.monthLabels.map((m, i) => (
            <span
              key={i}
              className="absolute top-0 text-[10px] text-foreground/30 whitespace-nowrap capitalize"
              style={{
                left: `${m.left}%`,
                transform: i === 0 ? 'none' : i === journey.monthLabels.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Lista: en rad per medicin */}
      <div className="px-2 pb-2">
        {journey.rows.map(({ med, left, width, isCurrent, start, end }) => (
          <button
            key={med.id}
            onClick={() => onSelect(med)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-foreground/[0.04] active:bg-foreground/[0.06] transition-colors text-left"
          >
            {/* Vänster: ikon + namn + datum */}
            <div className="flex items-center gap-2.5 w-[42%] min-w-0">
              <div className={`shrink-0 p-1.5 rounded-md ${isCurrent ? 'bg-primary/15' : 'bg-foreground/[0.06]'}`}>
                {med.is_trial ? (
                  <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Pill className={`h-3.5 w-3.5 ${isCurrent ? 'text-primary' : 'text-foreground/50'}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-medium truncate ${isCurrent ? 'text-foreground/95' : 'text-foreground/75'}`}>
                  {med.name}
                </p>
                <p className="text-[11px] text-foreground/40 truncate">
                  {format(start, 'MMM yy', { locale: sv })}
                  {' – '}
                  {isCurrent ? <span className="text-primary/80 font-medium">nu</span> : format(end, 'MMM yy', { locale: sv })}
                </p>
              </div>
            </div>

            {/* Höger: livslängds-stapel */}
            <div className="relative flex-1 h-6">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-foreground/[0.05]" />
              <div
                className={`absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full ${
                  isCurrent
                    ? 'bg-primary/70 shadow-[0_0_10px_-2px_hsl(45_85%_55%/0.6)]'
                    : 'bg-foreground/25'
                }`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            </div>

            <ChevronRight className="h-4 w-4 text-foreground/30 shrink-0" />
          </button>
        ))}
      </div>

      {/* Förklaring */}
      <div className="px-5 pb-5 pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-foreground/40">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-primary/70" /> Pågående
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-foreground/25" /> Avslutad
        </span>
        <span className="flex items-center gap-1.5">
          <FlaskConical className="h-2.5 w-2.5 text-amber-400" /> Provmedicin
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="h-1.5 w-3 rounded-sm" style={{ background: 'hsla(220, 80%, 60%, 0.6)' }} />
          <span className="h-1.5 w-3 rounded-sm" style={{ background: 'hsla(150, 60%, 50%, 0.4)' }} />
          <span className="h-1.5 w-3 rounded-sm" style={{ background: 'hsla(20, 90%, 60%, 0.6)' }} />
          <span>nedstämd → stabil → uppvarvad</span>
        </span>
      </div>

      {medications.length >= 3 && (
        <div className="mx-5 mb-5 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/[0.06] border border-primary/15">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[12px] text-foreground/70 leading-relaxed">
            Tryck på en medicin för att se effekt, biverkningar och hur måendet förändrades efter att du började.
          </p>
        </div>
      )}
    </section>
  );
}

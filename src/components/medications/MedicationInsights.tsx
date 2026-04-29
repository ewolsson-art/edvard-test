import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, differenceInDays, isAfter, isBefore, isEqual } from 'date-fns';
import { sv } from 'date-fns/locale';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Sparkles, Flame, CloudRain } from 'lucide-react';
import { Medication } from '@/types/medication';
import { useMoodData } from '@/hooks/useMoodData';
import { MoodType, MOOD_LABELS } from '@/types/mood';

interface Props {
  med: Medication;
}

// Map mood -> numeric scale (-3 nedstämd … +3 uppvarvad)
const MOOD_SCORE: Record<MoodType, number> = {
  severe_depressed: -3,
  depressed: -2,
  somewhat_depressed: -1,
  stable: 0,
  somewhat_elevated: 1,
  elevated: 2,
  severe_elevated: 3,
};

const isExtremeMood = (m: MoodType) =>
  m === 'severe_depressed' || m === 'severe_elevated';

export function MedicationInsights({ med }: Props) {
  const { entries } = useMoodData();

  const insights = useMemo(() => {
    if (!med.started_at) return null;
    const start = parseISO(med.started_at);
    const end = med.stopped_at ? parseISO(med.stopped_at) : new Date();

    // entries that fall within the medication's active window
    const inRange = entries.filter(e => {
      const d = parseISO(e.date);
      return (isAfter(d, start) || isEqual(d, start)) &&
             (isBefore(d, end) || isEqual(d, end));
    });

    const totalDays = Math.max(1, differenceInDays(end, start) + 1);
    const loggedDays = inRange.length;

    // Mood breakdown
    const moodCounts: Record<MoodType, number> = {
      severe_depressed: 0, depressed: 0, somewhat_depressed: 0,
      stable: 0,
      somewhat_elevated: 0, elevated: 0, severe_elevated: 0,
    };
    let scoreSum = 0;
    let extremeDays = 0;
    let depressiveExtreme = 0;
    let elevatedExtreme = 0;
    inRange.forEach(e => {
      moodCounts[e.mood]++;
      scoreSum += MOOD_SCORE[e.mood];
      if (isExtremeMood(e.mood)) extremeDays++;
      if (e.mood === 'severe_depressed') depressiveExtreme++;
      if (e.mood === 'severe_elevated') elevatedExtreme++;
    });
    const avgScore = loggedDays > 0 ? scoreSum / loggedDays : 0;
    const stableDays = moodCounts.stable + moodCounts.somewhat_depressed + moodCounts.somewhat_elevated;
    const stablePct = loggedDays > 0 ? Math.round((stableDays / loggedDays) * 100) : 0;

    // Side effect frequency from check-ins
    const sideEffectCounts = new Map<string, number>();
    inRange.forEach(e => {
      (e.medicationSideEffects ?? []).forEach(s => {
        sideEffectCounts.set(s, (sideEffectCounts.get(s) ?? 0) + 1);
      });
    });
    const topSideEffects = Array.from(sideEffectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Sparkline points (one per logged day, max 60)
    const sortedAsc = [...inRange].sort((a, b) => a.date.localeCompare(b.date));
    const sparkPoints = sortedAsc.slice(-60).map(e => MOOD_SCORE[e.mood]);

    return {
      totalDays,
      loggedDays,
      avgScore,
      stablePct,
      extremeDays,
      depressiveExtreme,
      elevatedExtreme,
      moodCounts,
      topSideEffects,
      sparkPoints,
      reportedSideEffects: med.side_effects ?? [],
    };
  }, [med, entries]);

  if (!insights) return null;

  if (insights.loggedDays === 0) {
    return (
      <div className="rounded-2xl bg-foreground/[0.03] p-5 text-center">
        <Sparkles className="h-5 w-5 text-foreground/30 mx-auto mb-2" />
        <p className="text-[13px] text-foreground/50">
          Inga incheckningar ännu under den här medicinens period.
        </p>
        <p className="text-[12px] text-foreground/30 mt-1">
          När du checkar in dagligen byggs en bild av hur {med.name} påverkar ditt mående.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Headline metrics */}
      <div className="grid grid-cols-3 gap-2">
        <Metric
          label="Stabila dagar"
          value={`${insights.stablePct}%`}
          tone={insights.stablePct >= 70 ? 'good' : insights.stablePct >= 40 ? 'neutral' : 'bad'}
        />
        <Metric
          label="Extremdagar"
          value={`${insights.extremeDays}`}
          sub={insights.loggedDays > 0 ? `av ${insights.loggedDays}` : undefined}
          tone={insights.extremeDays === 0 ? 'good' : insights.extremeDays <= 2 ? 'neutral' : 'bad'}
        />
        <Metric
          label="Snittmående"
          value={formatScore(insights.avgScore)}
          tone={Math.abs(insights.avgScore) < 0.6 ? 'good' : Math.abs(insights.avgScore) < 1.4 ? 'neutral' : 'bad'}
        />
      </div>

      {/* Sparkline */}
      <Sparkline points={insights.sparkPoints} loggedDays={insights.loggedDays} />

      {/* Mood distribution bar */}
      <MoodDistribution counts={insights.moodCounts} total={insights.loggedDays} />

      {/* Extreme days breakdown */}
      {insights.extremeDays > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <ExtremeCard
            icon={<CloudRain className="h-4 w-4" />}
            label="Kraftigt nedstämda"
            value={insights.depressiveExtreme}
            color="text-blue-300 bg-blue-400/10 border-blue-400/20"
          />
          <ExtremeCard
            icon={<Flame className="h-4 w-4" />}
            label="Kraftigt uppvarvade"
            value={insights.elevatedExtreme}
            color="text-orange-300 bg-orange-400/10 border-orange-400/20"
          />
        </div>
      )}

      {/* Side effects from check-ins (frequency) */}
      {insights.topSideEffects.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Biverkningar i incheckningar
            </p>
            <span className="text-[11px] text-foreground/30">{insights.loggedDays} dagar</span>
          </div>
          <div className="space-y-1.5">
            {insights.topSideEffects.map(([name, count]) => {
              const pct = Math.round((count / insights.loggedDays) * 100);
              return (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground/80">{name}</span>
                    <span className="text-foreground/40 tabular-nums">{count} ggr · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400/70 to-amber-500/80"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Self-reported side effects (the ones added in form) */}
      {insights.reportedSideEffects.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" /> Markerade biverkningar
          </p>
          <div className="flex flex-wrap gap-1.5">
            {insights.reportedSideEffects.map(s => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-full text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatScore(s: number) {
  if (s === 0) return '0';
  const sign = s > 0 ? '+' : '';
  return `${sign}${s.toFixed(1)}`;
}

function Metric({
  label, value, sub, tone,
}: { label: string; value: string; sub?: string; tone: 'good' | 'neutral' | 'bad' }) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-300'
      : tone === 'bad'
        ? 'text-rose-300'
        : 'text-foreground/80';
  return (
    <div className="rounded-xl bg-foreground/[0.04] p-3">
      <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <p className={`text-[18px] font-semibold tabular-nums ${toneClass}`}>{value}</p>
        {sub && <span className="text-[10px] text-foreground/30">{sub}</span>}
      </div>
    </div>
  );
}

function ExtremeCard({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-medium opacity-80">{label}</span>
      </div>
      <p className="text-[20px] font-semibold tabular-nums mt-1">{value}</p>
      <p className="text-[10px] opacity-60 mt-0.5">dagar</p>
    </div>
  );
}

function Sparkline({ points, loggedDays }: { points: number[]; loggedDays: number }) {
  if (points.length < 2) {
    return (
      <div className="rounded-xl bg-foreground/[0.04] p-4 text-center text-[12px] text-foreground/40">
        Mer än en incheckning behövs för att visa kurvan.
      </div>
    );
  }
  const w = 320;
  const h = 70;
  const pad = 6;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const stepX = innerW / Math.max(1, points.length - 1);
  // y: -3 (nedstämd) → bottom, +3 → top
  const yFor = (v: number) => pad + ((3 - v) / 6) * innerH;
  const path = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * stepX} ${yFor(v)}`)
    .join(' ');
  const fillPath = `${path} L ${pad + (points.length - 1) * stepX} ${pad + innerH} L ${pad} ${pad + innerH} Z`;

  return (
    <div className="rounded-xl bg-foreground/[0.04] p-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" /> Måendekurva
        </p>
        <span className="text-[10px] text-foreground/30">senaste {points.length} incheckningar</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[70px] overflow-visible">
        <defs>
          <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(45 85% 55%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(45 85% 55%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* zero line (stable) */}
        <line
          x1={pad} x2={w - pad}
          y1={yFor(0)} y2={yFor(0)}
          stroke="currentColor" strokeOpacity="0.12" strokeDasharray="2 3"
        />
        {/* extreme bands */}
        <line x1={pad} x2={w - pad} y1={yFor(2.5)} y2={yFor(2.5)} stroke="hsl(20 80% 60%)" strokeOpacity="0.18" />
        <line x1={pad} x2={w - pad} y1={yFor(-2.5)} y2={yFor(-2.5)} stroke="hsl(220 80% 65%)" strokeOpacity="0.18" />
        <path d={fillPath} fill="url(#sparkFill)" />
        <path d={path} fill="none" stroke="hsl(45 85% 55%)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v, i) => {
          const cx = pad + i * stepX;
          const cy = yFor(v);
          const extreme = Math.abs(v) === 3;
          return (
            <circle
              key={i}
              cx={cx} cy={cy}
              r={extreme ? 2.4 : 1.4}
              fill={extreme ? (v > 0 ? 'hsl(20 90% 65%)' : 'hsl(220 85% 70%)') : 'hsl(45 85% 60%)'}
            />
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-1 text-[10px] text-foreground/30">
        <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Nedstämd</span>
        <span>Stabil</span>
        <span className="flex items-center gap-1">Uppvarvad <TrendingUp className="h-3 w-3" /></span>
      </div>
    </div>
  );
}

function MoodDistribution({ counts, total }: { counts: Record<MoodType, number>; total: number }) {
  if (total === 0) return null;
  const segments: { key: MoodType; color: string }[] = [
    { key: 'severe_depressed', color: 'bg-blue-500/80' },
    { key: 'depressed', color: 'bg-blue-400/70' },
    { key: 'somewhat_depressed', color: 'bg-sky-300/60' },
    { key: 'stable', color: 'bg-emerald-400/70' },
    { key: 'somewhat_elevated', color: 'bg-amber-300/60' },
    { key: 'elevated', color: 'bg-orange-400/70' },
    { key: 'severe_elevated', color: 'bg-rose-500/80' },
  ];
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider">Fördelning</p>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/[0.05]">
        {segments.map(seg => {
          const pct = (counts[seg.key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={seg.key}
              className={seg.color}
              style={{ width: `${pct}%` }}
              title={`${MOOD_LABELS[seg.key]}: ${counts[seg.key]}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        {segments.filter(s => counts[s.key] > 0).map(s => (
          <div key={s.key} className="flex items-center gap-1.5 text-[11px] text-foreground/50">
            <span className={`h-2 w-2 rounded-full ${s.color}`} />
            {MOOD_LABELS[s.key]} · {counts[s.key]}
          </div>
        ))}
      </div>
    </div>
  );
}

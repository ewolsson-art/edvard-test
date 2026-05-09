// === EPISODE BANDS (smart episode detection visualization) ===
// Isolated component — to remove this entire feature:
//   1. Delete this file (src/components/EpisodeBands.tsx)
//   2. Delete src/lib/episodeDetection.ts
//   3. Remove the <EpisodeBands /> block in src/pages/Overview.tsx
//      (it's wrapped in === EPISODE BANDS START/END === comments)

import { useMemo, useState } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MoodEntry } from '@/types/mood';
import { detectEpisodes, EPISODE_META, type Episode, type EpisodeKind } from '@/lib/episodeDetection';
import { findSimilarPastPeriod, type SimilarPastPeriod } from '@/lib/userPatternProfile';


interface EpisodeBandsProps {
  entries: MoodEntry[];
  /** Number of days to render in the timeline. Defaults to 30. */
  days?: number;
}

const KIND_FILL: Record<EpisodeKind, string> = {
  hypomanic: 'hsl(45 85% 55%)',
  manic: 'hsl(28 90% 55%)',
  depressive: 'hsl(215 75% 55%)',
  mixed: 'hsl(0 75% 55%)',
};

// === TIDIGA SIGNALER (prodromer) ===
// Diskreta observationer i den senaste veckan jämfört med personlig baseline (60 d).
// Returnerar 0–3 enradiga svenska meningar. Aldrig varningar — bara konstateranden.
function detectEarlySignals(entries: MoodEntry[]): string[] {
  if (!entries || entries.length < 14) return [];

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7); // senaste 7 in-checkningarna
  const baseline = sorted.slice(-67, -7); // föregående ~60 dagar
  if (baseline.length < 14) return [];

  const SHORT_SLEEP = new Set(['very_little', 'little']);
  const LOW_EAT = new Set(['very_little', 'little']);
  const HIGH_EAT = new Set(['very_good']); // proxy för "äter mycket mer än vanligt"

  const signals: string[] = [];

  // Sömn: hur många nätter i rad senast har varit korta?
  let shortRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].sleepQuality && SHORT_SLEEP.has(recent[i].sleepQuality!)) shortRun++;
    else break;
  }
  const baselineShortRate =
    baseline.filter((e) => e.sleepQuality && SHORT_SLEEP.has(e.sleepQuality!)).length /
    baseline.length;
  if (shortRun >= 3 && baselineShortRate < 0.4) {
    signals.push(`Sömnen har varit kortare än ditt snitt ${shortRun} nätter i rad.`);
  }

  // Energi: hög energi flera dagar i rad
  let highEnergyRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].energyLevel === 'high') highEnergyRun++;
    else break;
  }
  const baselineHighRate =
    baseline.filter((e) => e.energyLevel === 'high').length / baseline.length;
  if (highEnergyRun >= 3 && baselineHighRate < 0.4) {
    signals.push(`Energin har legat högt ${highEnergyRun} dagar i rad.`);
  }

  // Aptit: minskad aptit flera dagar i rad
  let lowEatRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].eatingQuality && LOW_EAT.has(recent[i].eatingQuality!)) lowEatRun++;
    else break;
  }
  const baselineLowEatRate =
    baseline.filter((e) => e.eatingQuality && LOW_EAT.has(e.eatingQuality!)).length /
    baseline.length;
  if (lowEatRun >= 3 && baselineLowEatRate < 0.4) {
    signals.push(`Aptiten har varit lägre än ditt snitt ${lowEatRun} dagar i rad.`);
  }

  // Ökad aptit (hyperfagi-signal)
  let highEatRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].eatingQuality && HIGH_EAT.has(recent[i].eatingQuality!)) highEatRun++;
    else break;
  }
  const baselineHighEatRate =
    baseline.filter((e) => e.eatingQuality && HIGH_EAT.has(e.eatingQuality!)).length /
    baseline.length;
  if (highEatRun >= 3 && baselineHighEatRate < 0.3) {
    signals.push(`Aptiten har varit högre än ditt snitt ${highEatRun} dagar i rad.`);
  }

  return signals.slice(0, 3);
}


export function EpisodeBands({ entries, days = 14 }: EpisodeBandsProps) {
  const [expanded, setExpanded] = useState(false);

  const today = useMemo(() => new Date(), []);
  const startDate = useMemo(() => subDays(today, days - 1), [today, days]);

  const windowEntries = useMemo(
    () => entries.filter((e) => parseISO(e.date) >= startDate),
    [entries, startDate],
  );

  const episodes = useMemo(() => detectEpisodes(windowEntries), [windowEntries]);
  const allEpisodes = useMemo(() => detectEpisodes(entries), [entries]);
  const earlySignals = useMemo(() => detectEarlySignals(entries), [entries]);
  const similarPast = useMemo(() => findSimilarPastPeriod(entries), [entries]);

  const historicalContext = useMemo(() => {
    const map = new Map<string, { priorDate: string; followedBy?: Episode }>();
    for (const current of episodes) {
      const priorSameKind = [...allEpisodes]
        .filter(
          (e) =>
            e.kind === current.kind &&
            parseISO(e.endDate) < startDate,
        )
        .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];

      if (!priorSameKind) continue;

      const priorEnd = parseISO(priorSameKind.endDate);
      const followedBy = allEpisodes
        .filter((e) => {
          const start = parseISO(e.startDate);
          const diff = (start.getTime() - priorEnd.getTime()) / 86_400_000;
          return diff > 0 && diff <= 30 && e.kind !== priorSameKind.kind;
        })
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

      map.set(`${current.kind}-${current.startDate}`, {
        priorDate: priorSameKind.startDate,
        followedBy,
      });
    }
    return map;
  }, [episodes, allEpisodes, startDate]);

  if (windowEntries.length < 3) return null;

  if (episodes.length === 0) {
    const stableDays = windowEntries.filter((e) => e.mood === 'stable' || e.mood === 'somewhat_elevated' || e.mood === 'somewhat_depressed').length;
    return (
      <div className="rounded-2xl bg-foreground/[0.03] border border-border/30 px-4 py-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🌿</span>
          <span className="text-sm font-medium text-foreground/85">
            Stabil period
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Inga tydliga mönster de senaste {days} dagarna
          {stableDays > 0 && ` — ${stableDays} av ${windowEntries.length} dagar inom ditt vanliga spann`}.
        </p>
        {earlySignals.length > 0 && (
          <div className="pt-2 mt-1 border-t border-border/20 space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-foreground/45 font-medium">Trender just nu</p>
            <ul className="space-y-0.5">
              {earlySignals.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-foreground/40 shrink-0">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {similarPast && <SimilarPastRow match={similarPast} />}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-foreground/[0.03] border border-border/30 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground/90">
            Mönster senaste {days} dagarna
          </span>
          <span className="text-xs text-muted-foreground/70">
            {episodes.length} {episodes.length === 1 ? 'period' : 'perioder'}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        )}
      </button>

      <div className="px-4 pb-3">
        <Timeline episodes={episodes} startDate={startDate} days={days} />
      </div>

      {expanded && (
        <div className="border-t border-border/20 p-4 space-y-2.5">
          {earlySignals.length > 0 && (
            <div className="space-y-1 pb-1">
              <p className="text-[10px] uppercase tracking-wide text-foreground/45 font-medium">Trender</p>
              <ul className="space-y-0.5">
                {earlySignals.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground/85 leading-relaxed flex gap-2"
                  >
                    <span className="text-foreground/50 shrink-0">·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {similarPast && <SimilarPastRow match={similarPast} />}
          {episodes.map((ep, i) => (
            <EpisodeRow
              key={`${ep.kind}-${ep.startDate}-${i}`}
              episode={ep}
              history={historicalContext.get(`${ep.kind}-${ep.startDate}`)}
            />
          ))}
          <p className="text-[11px] leading-relaxed text-muted-foreground/70 pt-1.5 border-t border-border/15">
            Mönster i din egen data — inte en klinisk bedömning.
          </p>
        </div>
      )}
    </div>
  );
}

function Timeline({ episodes, startDate, days }: { episodes: Episode[]; startDate: Date; days: number }) {
  return (
    <div className="relative h-6 w-full rounded-md bg-foreground/[0.04] overflow-hidden">
      {episodes.map((ep, i) => {
        const epStart = parseISO(ep.startDate);
        const epEnd = parseISO(ep.endDate);
        const offsetDays = Math.max(0, differenceInDays(epStart, startDate));
        const widthDays = Math.max(1, differenceInDays(epEnd, epStart) + 1);
        const left = (offsetDays / days) * 100;
        const width = (widthDays / days) * 100;
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              backgroundColor: KIND_FILL[ep.kind],
              opacity: ep.kind === 'mixed' ? 0.95 : 0.8,
            }}
            title={`${EPISODE_META[ep.kind].label} (${ep.days} dagar)`}
          />
        );
      })}
      {/* Today marker */}
      <div className="absolute top-0 bottom-0 right-0 w-px bg-foreground/40" />
    </div>
  );
}

// === Per-episod observationer ur faktiska data ===
function summarizeEpisode(ep: Episode): string[] {
  const out: string[] = [];
  const total = ep.entries.length;
  if (total === 0) return out;

  const lowSleep = ep.entries.filter((e) => e.sleepQuality && ['very_little', 'little'].includes(e.sleepQuality)).length;
  const longSleep = ep.entries.filter((e) => e.sleepQuality === 'very_good').length;
  const highEnergy = ep.entries.filter((e) => e.energyLevel === 'high').length;
  const lowEnergy = ep.entries.filter((e) => e.energyLevel === 'low').length;
  const lowEat = ep.entries.filter((e) => e.eatingQuality && ['very_little', 'little'].includes(e.eatingQuality)).length;
  const suicidalDays = ep.entries.filter((e) => e.tags?.includes('suicidtankar')).length;

  if (ep.kind === 'hypomanic' || ep.kind === 'manic') {
    if (lowSleep > 0) out.push(`Sömnen var kortare än vanligt ${lowSleep} av ${total} nätter`);
    if (highEnergy > 0) out.push(`Hög energi ${highEnergy} av ${total} dagar`);
    if (lowEat > 0) out.push(`Lägre aptit ${lowEat} av ${total} dagar`);
  } else if (ep.kind === 'depressive') {
    if (lowEnergy > 0) out.push(`Låg energi ${lowEnergy} av ${total} dagar`);
    if (longSleep > 0) out.push(`Längre sömn än vanligt ${longSleep} nätter`);
    else if (lowSleep > 0) out.push(`Kortare sömn än vanligt ${lowSleep} nätter`);
    if (lowEat > 0) out.push(`Lägre aptit ${lowEat} av ${total} dagar`);
  } else if (ep.kind === 'mixed') {
    if (highEnergy > 0) out.push(`Hög energi ${highEnergy} av ${total} dagar`);
    if (lowSleep > 0) out.push(`Kort sömn ${lowSleep} nätter`);
    if (suicidalDays > 0) out.push(`Mörka tankar registrerade ${suicidalDays} ${suicidalDays === 1 ? 'dag' : 'dagar'}`);
  }

  return out.slice(0, 3);
}


function EpisodeRow({
  episode,
  history,
}: {
  episode: Episode;
  history?: { priorDate: string; followedBy?: Episode };
}) {
  const meta = EPISODE_META[episode.kind];
  const startLabel = format(parseISO(episode.startDate), 'd MMM', { locale: sv });
  const endLabel = format(parseISO(episode.endDate), 'd MMM', { locale: sv });
  const dateLabel = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

  const observations = summarizeEpisode(episode);

  const priorLabel = history
    ? format(parseISO(history.priorDate), 'd MMM yyyy', { locale: sv })
    : null;
  const followedKindLabel = history?.followedBy
    ? EPISODE_META[history.followedBy.kind].label.toLowerCase()
    : null;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-3.5 space-y-3`}>
      {/* Rubrik */}
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
        <span className="text-[11px] text-muted-foreground/80">
          {dateLabel} · {episode.days} {episode.days === 1 ? 'dag' : 'dagar'}
        </span>
      </div>

      {/* Mini-graf över episodens dagar */}
      {episode.entries.length > 1 && <EpisodeMiniChart entries={episode.entries} />}

      {/* Fynd ur datan */}
      {observations.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-foreground/50 font-medium">Fynd</p>
          <ul className="space-y-0.5">
            {observations.map((o, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-relaxed flex gap-2">
                <span className="text-foreground/40 shrink-0">·</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Förklaring */}
      <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>

      {/* Historiskt mönster */}
      {history && priorLabel && (
        <div className="pt-2 border-t border-foreground/[0.06]">
          <p className="text-[11px] text-muted-foreground/85 leading-relaxed">
            <span className="text-foreground/70 font-medium">Tidigare mönster: </span>
            {followedKindLabel ? (
              <>
                Liknande period sågs runt {priorLabel} och följdes då av{' '}
                <span className="text-foreground/80">{followedKindLabel}</span>.
              </>
            ) : (
              <>Liknande mönster senast {priorLabel}.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// Kompakt graf över episodens dagar — energi över nollinje, nedstämdhet under
function EpisodeMiniChart({ entries }: { entries: MoodEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="flex items-stretch gap-1 h-10">
      {sorted.map((e) => {
        const energy = ENERGY_LEVEL[e.energyLevel ?? 'normal'] ?? 1;
        const elevation = MOOD_ELEVATION_LEVEL[e.mood] ?? 0;
        const depression = MOOD_DEPRESSION_LEVEL[e.mood] ?? 0;
        const upMag = Math.max(energy / 2, elevation / 3);
        const downMag = depression / 3;
        return (
          <div key={e.date} className="flex-1 flex flex-col items-center min-w-0">
            <div className="w-full h-1/2 flex flex-col justify-end">
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${upMag * 100}%`, backgroundColor: 'hsl(28 85% 60%)', opacity: 0.75 }}
              />
            </div>
            <div className="w-full h-px bg-foreground/15" />
            <div className="w-full h-1/2 flex flex-col justify-start">
              <div
                className="w-full rounded-b-sm"
                style={{ height: `${downMag * 100}%`, backgroundColor: 'hsl(215 75% 60%)', opacity: 0.75 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimilarPastRow({ match }: { match: SimilarPastPeriod }) {
  const { pastEpisode, sharedSignals } = match;
  const dateLabel = format(parseISO(pastEpisode.startDate), 'd MMM yyyy', { locale: sv });
  const kindLabel = EPISODE_META[pastEpisode.kind].label.toLowerCase();
  const signalsText = sharedSignals.slice(0, 3).join(', ');
  return (
    <div className="rounded-xl border border-border/30 bg-foreground/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1">
        Liknande tidigare period
      </p>
      <p className="text-xs text-foreground/85 leading-relaxed">
        Den senaste tiden påminner om perioden runt{' '}
        <span className="font-medium text-foreground">{dateLabel}</span> — då följde en period av{' '}
        <span className="font-medium text-foreground">{kindLabel}</span>.
      </p>
      {signalsText && (
        <p className="text-[11px] text-muted-foreground/75 leading-relaxed mt-1.5">
          Gemensamma signaler: {signalsText}.
        </p>
      )}
    </div>
  );
}

// Map mood → "depression-magnitud" 0..3 (negativ sida av en symmetrisk skala)
const MOOD_DEPRESSION_LEVEL: Record<string, number> = {
  severe_depressed: 3,
  depressed: 2,
  somewhat_depressed: 1,
  stable: 0,
  somewhat_elevated: 0,
  elevated: 0,
  severe_elevated: 0,
};
// Map mood → "uppvarvnings-magnitud" 0..3
const MOOD_ELEVATION_LEVEL: Record<string, number> = {
  severe_elevated: 3,
  elevated: 2,
  somewhat_elevated: 1,
  stable: 0,
  somewhat_depressed: 0,
  depressed: 0,
  severe_depressed: 0,
};
// Energi → 0..2
const ENERGY_LEVEL: Record<string, number> = { low: 0, normal: 1, high: 2 };


// === EPISODE DETECTION (smart bands) ===
// Isolated module — safe to delete together with components/EpisodeBands.tsx
// to fully remove the feature. No other code imports from here.

import type { MoodEntry, MoodType } from '@/types/mood';

export type EpisodeKind = 'hypomanic' | 'manic' | 'depressive' | 'mixed';

export interface Episode {
  kind: EpisodeKind;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  days: number;
  entries: MoodEntry[];
}

const ELEVATED: MoodType[] = ['somewhat_elevated', 'elevated', 'severe_elevated'];
const STRONG_ELEVATED: MoodType[] = ['elevated', 'severe_elevated'];
const DEPRESSED: MoodType[] = ['somewhat_depressed', 'depressed', 'severe_depressed'];
const STRONG_DEPRESSED: MoodType[] = ['depressed', 'severe_depressed'];

const SUICIDAL_TAG = 'suicidtankar';
const LOW_SLEEP = ['little', 'very_little', 'bad'];

function sortByDate(entries: MoodEntry[]): MoodEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

// Find runs of consecutive days where predicate(entry) is true.
// "Consecutive" allows a single missed/no-entry day inside a run (max 1 gap).
function findRuns(
  entries: MoodEntry[],
  predicate: (e: MoodEntry) => boolean,
  minDays: number,
  kind: EpisodeKind,
): Episode[] {
  const sorted = sortByDate(entries.filter(predicate));
  if (sorted.length === 0) return [];

  const out: Episode[] = [];
  let run: MoodEntry[] = [sorted[0]];

  const dayDiff = (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

  for (let i = 1; i < sorted.length; i++) {
    const gap = dayDiff(sorted[i - 1].date, sorted[i].date);
    if (gap <= 2) {
      run.push(sorted[i]);
    } else {
      if (run.length >= minDays) {
        out.push({
          kind,
          startDate: run[0].date,
          endDate: run[run.length - 1].date,
          days: dayDiff(run[0].date, run[run.length - 1].date) + 1,
          entries: run,
        });
      }
      run = [sorted[i]];
    }
  }
  if (run.length >= minDays) {
    out.push({
      kind,
      startDate: run[0].date,
      endDate: run[run.length - 1].date,
      days: dayDiff(run[0].date, run[run.length - 1].date) + 1,
      entries: run,
    });
  }
  return out;
}

export function detectEpisodes(entries: MoodEntry[]): Episode[] {
  if (!entries || entries.length === 0) return [];

  // Manic: 4+ days strongly elevated
  const manic = findRuns(entries, (e) => STRONG_ELEVATED.includes(e.mood), 4, 'manic');

  // Hypomanic: 3+ days elevated AND (high energy OR reduced sleep)
  const hypomanic = findRuns(
    entries,
    (e) =>
      ELEVATED.includes(e.mood) &&
      (e.energyLevel === 'high' || (e.sleepQuality && LOW_SLEEP.includes(e.sleepQuality))),
    3,
    'hypomanic',
  );

  // Depressive: 5+ days nedstämd
  const depressive = findRuns(entries, (e) => DEPRESSED.includes(e.mood), 5, 'depressive');

  // Mixed: any day where suicidal tag occurs in same week as elevated mood
  // OR an elevated day with suicidal tag on the same day
  const sorted = sortByDate(entries);
  const mixedSet = new Map<string, Episode>(); // key by start date

  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const hasSuicidal = e.tags?.includes(SUICIDAL_TAG);
    if (!hasSuicidal) continue;

    // Look for elevated mood within ±3 days
    const eDay = new Date(e.date).getTime();
    const elevatedNear = sorted.find((x) => {
      const diff = Math.abs(new Date(x.date).getTime() - eDay) / 86_400_000;
      return diff <= 3 && ELEVATED.includes(x.mood);
    });

    if (elevatedNear || ELEVATED.includes(e.mood)) {
      const key = e.date;
      if (!mixedSet.has(key)) {
        mixedSet.set(key, {
          kind: 'mixed',
          startDate: elevatedNear ? (elevatedNear.date < e.date ? elevatedNear.date : e.date) : e.date,
          endDate: elevatedNear ? (elevatedNear.date > e.date ? elevatedNear.date : e.date) : e.date,
          days: 1,
          entries: elevatedNear ? [elevatedNear, e] : [e],
        });
      }
    }
  }

  return [...manic, ...hypomanic, ...depressive, ...mixedSet.values()].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
}

export const EPISODE_META: Record<EpisodeKind, { label: string; color: string; bg: string; border: string; description: string }> = {
  hypomanic: {
    label: 'Möjlig hypoman fas',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    description: 'Tre eller fler dagar uppvarvad med hög energi eller minskad sömn.',
  },
  manic: {
    label: 'Möjlig uppvarvad fas',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    description: 'Fyra eller fler dagar tydligt uppvarvad. Värt att kontakta vården.',
  },
  depressive: {
    label: 'Möjlig nedstämd fas',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    description: 'Fem eller fler dagar nedstämd i rad. Du är inte ensam — sök stöd om det känns tungt.',
  },
  mixed: {
    label: 'Blandade tecken — viktigt',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    description: 'Uppvarvade dagar i kombination med mörka tankar. Det här är en period med ökad risk — prata med någon nu.',
  },
};

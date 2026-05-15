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

// ============================================================
// === ACTIVE WARNING DETECTION (forward-looking prodromer) ===
// ============================================================
// Looks at the trailing window (default 14 days ending today) and detects
// patterns BEFORE they become full episodes. Compares against historical
// episodes detected by detectEpisodes() to give context like
// "this pattern preceded your March episode".

export type WarningSeverity = 'info' | 'attention' | 'high' | 'critical';

export interface ActiveWarning {
  kind: EpisodeKind | 'sleep_deprivation';
  severity: WarningSeverity;
  title: string;
  body: string;
  daysObserved: number;
  /** A past episode whose prodrom matches the current pattern, if any. */
  pastReference?: { kind: EpisodeKind; startDate: string; days: number };
  /** True if the suicidal-thoughts tag was seen in window — always force critical. */
  suicidalSignal: boolean;
}

const SWE_MONTHS = ['jan', 'feb', 'mars', 'april', 'maj', 'juni', 'juli', 'aug', 'sept', 'okt', 'nov', 'dec'];
function formatPastRef(date: string): string {
  const d = new Date(date);
  return `${SWE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function entriesInWindow(entries: MoodEntry[], days: number): MoodEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = today.getTime() - (days - 1) * 86_400_000;
  return sortByDate(entries.filter((e) => new Date(e.date).getTime() >= cutoff));
}

function trailingRunCount(window: MoodEntry[], pred: (e: MoodEntry) => boolean): number {
  // Count consecutive matching days ending at the most recent entry.
  let count = 0;
  for (let i = window.length - 1; i >= 0; i--) {
    if (pred(window[i])) count++;
    else break;
  }
  return count;
}

export function detectActiveWarnings(entries: MoodEntry[]): ActiveWarning[] {
  if (!entries || entries.length === 0) return [];
  const window = entriesInWindow(entries, 14);
  if (window.length === 0) return [];

  const pastEpisodes = detectEpisodes(entries.slice(0, -window.length).concat(window.slice(0, -3)));
  const findPast = (kind: EpisodeKind) =>
    [...pastEpisodes].reverse().find((ep) => ep.kind === kind);

  const out: ActiveWarning[] = [];

  // 1. Suicidal signal in last 7 days → critical, regardless
  const last7 = entriesInWindow(entries, 7);
  const suicidalEntry = last7.find((e) => e.tags?.includes(SUICIDAL_TAG));
  if (suicidalEntry) {
    const elevatedNear = last7.find((e) => ELEVATED.includes(e.mood));
    out.push({
      kind: 'mixed',
      severity: 'critical',
      title: elevatedNear ? 'Blandade tecken — akut viktigt' : 'Mörka tankar registrerade',
      body: elevatedNear
        ? 'Du har loggat mörka tankar samtidigt som uppvarvad energi. Det här är en period med kraftigt ökad risk. Ring 90101 (Mind), 1177 eller 112 om du är i fara.'
        : 'Du har loggat mörka tankar i senaste check-in. Du behöver inte vara ensam — Mind självmordslinjen 90101 är öppen dygnet runt.',
      daysObserved: 1,
      suicidalSignal: true,
    });
  }

  // 2. Manic escalation — 2+ trailing days strongly elevated
  const manicRun = trailingRunCount(window, (e) => STRONG_ELEVATED.includes(e.mood));
  if (manicRun >= 2) {
    const past = findPast('manic');
    out.push({
      kind: 'manic',
      severity: manicRun >= 3 ? 'high' : 'attention',
      title: `${manicRun} dagar tydligt uppvarvad`,
      body: past
        ? `Det här mönstret föregick din uppvarvade fas i ${formatPastRef(past.startDate)} (${past.days} dagar). Hör av dig till vården nu — innan det eskalerar är insatserna enklast.`
        : 'Två eller fler dagar starkt uppvarvad i rad är en tidig signal. Prata med vården eller någon nära nu.',
      daysObserved: manicRun,
      pastReference: past ? { kind: past.kind, startDate: past.startDate, days: past.days } : undefined,
      suicidalSignal: false,
    });
  }

  // 3. Hypomanic prodrome — 3+ trailing days elevated AND (high energy OR low sleep)
  const hypoRun = trailingRunCount(
    window,
    (e) =>
      ELEVATED.includes(e.mood) &&
      (e.energyLevel === 'high' || (e.sleepQuality && LOW_SLEEP.includes(e.sleepQuality))),
  );
  if (hypoRun >= 3 && manicRun < 2) {
    const past = findPast('hypomanic') ?? findPast('manic');
    out.push({
      kind: 'hypomanic',
      severity: hypoRun >= 5 ? 'high' : 'attention',
      title: `${hypoRun} dagar uppvarvad med kort sömn`,
      body: past
        ? `Förra gången det här mönstret höll i sig ledde det till en ${past.kind === 'manic' ? 'uppvarvad' : 'hypoman'} fas i ${formatPastRef(past.startDate)} (${past.days} dagar). Prioritera 7+ h sömn de kommande nätterna och håll kontakten med vården.`
        : 'Uppvarvning + minskad sömn är klassiska tidiga tecken. Prioritera sömn och hör av dig till vården om det fortsätter.',
      daysObserved: hypoRun,
      pastReference: past ? { kind: past.kind, startDate: past.startDate, days: past.days } : undefined,
      suicidalSignal: false,
    });
  }

  // 4. Depressive prodrome — 3+ trailing days nedstämd
  const depRun = trailingRunCount(window, (e) => DEPRESSED.includes(e.mood));
  if (depRun >= 3) {
    const past = findPast('depressive');
    const isStrong = trailingRunCount(window, (e) => STRONG_DEPRESSED.includes(e.mood)) >= 2;
    out.push({
      kind: 'depressive',
      severity: isStrong ? 'high' : depRun >= 5 ? 'high' : 'attention',
      title: `${depRun} dagar nedstämd i rad`,
      body: past
        ? `Det här mönstret liknar starten på din nedstämda period i ${formatPastRef(past.startDate)} (${past.days} dagar). Du är inte ensam — hör av dig till någon nära eller vården. Vid akut behov: 1177 eller 90101.`
        : 'Tre eller fler dagar nedstämd är en signal att inte ignorera. Hör av dig till någon du litar på, eller ring 1177.',
      daysObserved: depRun,
      pastReference: past ? { kind: past.kind, startDate: past.startDate, days: past.days } : undefined,
      suicidalSignal: false,
    });
  }

  // 5. Sleep deprivation alone — 3+ trailing days low/very_little sleep without obvious mood pattern
  const sleepRun = trailingRunCount(
    window,
    (e) => !!e.sleepQuality && LOW_SLEEP.includes(e.sleepQuality),
  );
  if (sleepRun >= 3 && manicRun < 2 && hypoRun < 3) {
    out.push({
      kind: 'sleep_deprivation',
      severity: sleepRun >= 5 ? 'high' : 'attention',
      title: `${sleepRun} nätter med för lite sömn`,
      body: 'Sömnbrist är den enskilt starkaste utlösaren för en uppvarvad fas. Prioritera 7+ h i natt — och kontakta vården om det fortsätter.',
      daysObserved: sleepRun,
      suicidalSignal: false,
    });
  }

  // Sort: critical > high > attention > info
  const sevRank: Record<WarningSeverity, number> = { critical: 0, high: 1, attention: 2, info: 3 };
  return out.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
}

export const SEVERITY_META: Record<WarningSeverity, { bg: string; border: string; text: string; icon: string; label: string }> = {
  critical: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/50',
    text: 'text-red-300',
    icon: '🚨',
    label: 'Akut',
  },
  high: {
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    text: 'text-orange-300',
    icon: '⚠️',
    label: 'Viktigt',
  },
  attention: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-200',
    icon: '👀',
    label: 'Var vaksam',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    text: 'text-blue-200',
    icon: '💡',
    label: 'Info',
  },
};

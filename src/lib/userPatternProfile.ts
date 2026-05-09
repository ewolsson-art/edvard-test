// === USER PATTERN PROFILE ===
// Tyst lärande: räknar fram personlig baseline och episod-fingeravtryck
// från användarens egna in-checkningar och sparar i DB. Körs i bakgrunden
// utan att synas i UI. Fingeravtrycken används av EpisodeBands för att säga
// "sist du visade detta mönster ledde det till X".

import { parseISO, subDays, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { MoodEntry } from '@/types/mood';
import { detectEpisodes, type Episode } from './episodeDetection';

const RECOMPUTE_INTERVAL_HOURS = 6; // räkna om max 4 ggr per dygn
const BASELINE_DAYS = 60;
const PRODROME_WINDOW_DAYS = 14;

export interface PatternBaseline {
  // Hur ofta varje mood-typ förekommer (0..1)
  moodDistribution: Record<string, number>;
  // Hur ofta sömn/aptit/energi-värden förekommer
  sleepShortRate: number;     // very_little + little
  sleepLongRate: number;      // bad (för mycket)
  energyHighRate: number;
  energyLowRate: number;
  appetiteLowRate: number;
  appetiteHighRate: number;
  // Typisk episodlängd
  avgEpisodeDays: number | null;
  longestStableStreak: number;
  // Antal in-checkningar baselinen bygger på
  sampleSize: number;
}

export interface EpisodeFingerprint {
  kind: string;
  startDate: string;
  endDate: string;
  days: number;
  // Prodromer i 14 dagar innan episoden började
  prodromes: {
    shortSleepNights: number;
    longSleepNights: number;
    highEnergyDays: number;
    lowEnergyDays: number;
    lowAppetiteDays: number;
    highAppetiteDays: number;
    suicidalTagDays: number;
  };
  // Vad som följde inom 30 dagar efter episoden slutade
  followedBy: { kind: string; daysAfter: number } | null;
}

export interface PatternStats {
  episodeCount: number;
  totalCheckins: number;
  observationDays: number;
}

const SHORT_SLEEP = new Set(['very_little', 'little']);
const LONG_SLEEP = new Set(['bad']);
const LOW_APPETITE = new Set(['very_little', 'little']);
const HIGH_APPETITE = new Set(['very_good']);

function computeBaseline(entries: MoodEntry[]): PatternBaseline {
  const today = new Date();
  const cutoff = subDays(today, BASELINE_DAYS);
  const recent = entries.filter((e) => parseISO(e.date) >= cutoff);

  const sample = recent.length;
  const safe = (n: number) => (sample > 0 ? n / sample : 0);

  const moodDistribution: Record<string, number> = {};
  for (const e of recent) {
    moodDistribution[e.mood] = (moodDistribution[e.mood] ?? 0) + 1;
  }
  for (const k of Object.keys(moodDistribution)) {
    moodDistribution[k] = safe(moodDistribution[k]);
  }

  // Längsta stabila streck (oavbrutet 'stable')
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let cur = 0;
  for (const e of sorted) {
    if (e.mood === 'stable') {
      cur++;
      if (cur > longest) longest = cur;
    } else cur = 0;
  }

  // Snitt-episodlängd från ALL historik
  const allEpisodes = detectEpisodes(entries);
  const avgEpisodeDays =
    allEpisodes.length > 0
      ? allEpisodes.reduce((s, ep) => s + ep.days, 0) / allEpisodes.length
      : null;

  return {
    moodDistribution,
    sleepShortRate: safe(recent.filter((e) => e.sleepQuality && SHORT_SLEEP.has(e.sleepQuality)).length),
    sleepLongRate: safe(recent.filter((e) => e.sleepQuality && LONG_SLEEP.has(e.sleepQuality)).length),
    energyHighRate: safe(recent.filter((e) => e.energyLevel === 'high').length),
    energyLowRate: safe(recent.filter((e) => e.energyLevel === 'low').length),
    appetiteLowRate: safe(recent.filter((e) => e.eatingQuality && LOW_APPETITE.has(e.eatingQuality)).length),
    appetiteHighRate: safe(recent.filter((e) => e.eatingQuality && HIGH_APPETITE.has(e.eatingQuality)).length),
    avgEpisodeDays,
    longestStableStreak: longest,
    sampleSize: sample,
  };
}

function buildFingerprint(episode: Episode, allEntries: MoodEntry[], allEpisodes: Episode[]): EpisodeFingerprint {
  const epStart = parseISO(episode.startDate);
  const prodromeStart = subDays(epStart, PRODROME_WINDOW_DAYS);
  const prodromeEntries = allEntries.filter((e) => {
    const d = parseISO(e.date);
    return d >= prodromeStart && d < epStart;
  });

  const prodromes = {
    shortSleepNights: prodromeEntries.filter((e) => e.sleepQuality && SHORT_SLEEP.has(e.sleepQuality)).length,
    longSleepNights: prodromeEntries.filter((e) => e.sleepQuality && LONG_SLEEP.has(e.sleepQuality)).length,
    highEnergyDays: prodromeEntries.filter((e) => e.energyLevel === 'high').length,
    lowEnergyDays: prodromeEntries.filter((e) => e.energyLevel === 'low').length,
    lowAppetiteDays: prodromeEntries.filter((e) => e.eatingQuality && LOW_APPETITE.has(e.eatingQuality)).length,
    highAppetiteDays: prodromeEntries.filter((e) => e.eatingQuality && HIGH_APPETITE.has(e.eatingQuality)).length,
    suicidalTagDays: prodromeEntries.filter((e) => e.tags?.includes('suicidtankar')).length,
  };

  // Vad följde inom 30 dagar efter denna episod slutade?
  const epEnd = parseISO(episode.endDate);
  const followedEpisode = allEpisodes
    .filter((other) => {
      if (other === episode) return false;
      const otherStart = parseISO(other.startDate);
      const diff = differenceInDays(otherStart, epEnd);
      return diff > 0 && diff <= 30 && other.kind !== episode.kind;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  return {
    kind: episode.kind,
    startDate: episode.startDate,
    endDate: episode.endDate,
    days: episode.days,
    prodromes,
    followedBy: followedEpisode
      ? {
          kind: followedEpisode.kind,
          daysAfter: differenceInDays(parseISO(followedEpisode.startDate), epEnd),
        }
      : null,
  };
}

export async function refreshUserPatternProfile(userId: string, entries: MoodEntry[]): Promise<void> {
  if (!userId || entries.length < 7) return;

  // Hämta nuvarande profil för att se senaste omräkning
  const { data: existing } = await supabase
    .from('user_pattern_profile')
    .select('last_computed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.last_computed_at) {
    const lastMs = new Date(existing.last_computed_at).getTime();
    const ageHours = (Date.now() - lastMs) / 3_600_000;
    if (ageHours < RECOMPUTE_INTERVAL_HOURS) return;
  }

  const baseline = computeBaseline(entries);
  const allEpisodes = detectEpisodes(entries);
  const fingerprints = allEpisodes.map((ep) => buildFingerprint(ep, entries, allEpisodes));

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const stats: PatternStats = {
    episodeCount: allEpisodes.length,
    totalCheckins: entries.length,
    observationDays:
      sorted.length > 1
        ? differenceInDays(parseISO(sorted[sorted.length - 1].date), parseISO(sorted[0].date)) + 1
        : sorted.length,
  };

  await supabase.from('user_pattern_profile').upsert(
    [
      {
        user_id: userId,
        baseline: baseline as unknown as Record<string, unknown>,
        episode_fingerprints: fingerprints as unknown as Record<string, unknown>[],
        stats: stats as unknown as Record<string, unknown>,
        last_computed_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'user_id' },
  );
}

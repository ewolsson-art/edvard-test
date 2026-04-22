import { useMemo } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { MoodEntry } from '@/types/mood';

export const MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const;

export interface MilestoneInfo {
  reached: number | null;       // The milestone just reached (or null)
  next: number | null;          // Next milestone to reach
  daysUntilNext: number | null; // Days remaining
  isNewMilestone: boolean;      // True if current streak exactly equals a milestone
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  hasCheckedInToday: boolean;
  lastCheckinDate: string | null;
  milestone: MilestoneInfo;
  /** Recent missed days (yyyy-MM-dd), most recent first. Up to 3 days, only past days, excluding today. */
  missedDays: string[];
}

function getMilestoneInfo(streak: number): MilestoneInfo {
  let reached: number | null = null;
  let next: number | null = null;

  for (const m of MILESTONES) {
    if (streak >= m) {
      reached = m;
    } else {
      next = m;
      break;
    }
  }

  const isNewMilestone = MILESTONES.includes(streak as any);
  const daysUntilNext = next ? next - streak : null;

  return { reached, next, daysUntilNext, isNewMilestone };
}

export function useStreak(entries: MoodEntry[]): StreakData {
  return useMemo(() => {
    if (entries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        hasCheckedInToday: false,
        lastCheckinDate: null,
        milestone: getMilestoneInfo(0),
        missedDays: [],
      };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    const entryDates = new Set(entries.map(e => e.date));
    const hasCheckedInToday = entryDates.has(today);
    
    const sortedDates = [...entryDates].sort((a, b) => b.localeCompare(a));
    const lastCheckinDate = sortedDates[0] || null;

    let currentStreak = 0;
    let checkDate = hasCheckedInToday ? today : yesterday;
    
    if (entryDates.has(checkDate)) {
      currentStreak = 1;
      let prevDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
      while (entryDates.has(prevDate)) {
        currentStreak++;
        prevDate = format(subDays(parseISO(prevDate), 1), 'yyyy-MM-dd');
      }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    const ascendingDates = [...entryDates].sort((a, b) => a.localeCompare(b));
    
    for (let i = 0; i < ascendingDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = differenceInDays(parseISO(ascendingDates[i]), parseISO(ascendingDates[i - 1]));
        tempStreak = diff === 1 ? tempStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      currentStreak,
      longestStreak,
      hasCheckedInToday,
      lastCheckinDate,
      milestone: getMilestoneInfo(currentStreak),
    };
  }, [entries]);
}

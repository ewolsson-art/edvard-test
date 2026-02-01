import { useMemo } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { MoodEntry } from '@/types/mood';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  hasCheckedInToday: boolean;
  lastCheckinDate: string | null;
}

export function useStreak(entries: MoodEntry[]): StreakData {
  return useMemo(() => {
    if (entries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        hasCheckedInToday: false,
        lastCheckinDate: null,
      };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Create a set of all dates with entries for O(1) lookup
    const entryDates = new Set(entries.map(e => e.date));
    
    const hasCheckedInToday = entryDates.has(today);
    
    // Sort entries by date descending
    const sortedDates = [...entryDates].sort((a, b) => b.localeCompare(a));
    const lastCheckinDate = sortedDates[0] || null;

    // Calculate current streak
    let currentStreak = 0;
    
    // Start from today if checked in, otherwise from yesterday
    let checkDate = hasCheckedInToday ? today : yesterday;
    
    // Only count streak if the start date has an entry
    if (entryDates.has(checkDate)) {
      currentStreak = 1;
      let prevDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
      
      while (entryDates.has(prevDate)) {
        currentStreak++;
        prevDate = format(subDays(parseISO(prevDate), 1), 'yyyy-MM-dd');
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort dates ascending for longest streak calculation
    const ascendingDates = [...entryDates].sort((a, b) => a.localeCompare(b));
    
    for (let i = 0; i < ascendingDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = parseISO(ascendingDates[i - 1]);
        const currDate = parseISO(ascendingDates[i]);
        const diff = differenceInDays(currDate, prevDate);
        
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      currentStreak,
      longestStreak,
      hasCheckedInToday,
      lastCheckinDate,
    };
  }, [entries]);
}

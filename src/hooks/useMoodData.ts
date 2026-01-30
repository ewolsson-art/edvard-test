import { useState, useEffect, useCallback } from 'react';
import { MoodEntry, MoodType, MoodStats } from '@/types/mood';

const STORAGE_KEY = 'bipolar-mood-tracker';

export function useMoodData() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEntries(parsed);
      } catch (e) {
        console.error('Failed to parse mood data:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addEntry = useCallback((date: string, mood: MoodType, comment?: string) => {
    setEntries(prev => {
      // Remove any existing entry for this date
      const filtered = prev.filter(e => e.date !== date);
      return [...filtered, { date, mood, comment, timestamp: Date.now() }];
    });
  }, []);

  const updateComment = useCallback((date: string, comment: string) => {
    setEntries(prev => prev.map(e => 
      e.date === date ? { ...e, comment } : e
    ));
  }, []);

  const getEntryForDate = useCallback((date: string): MoodEntry | undefined => {
    return entries.find(e => e.date === date);
  }, [entries]);

  const getEntriesForMonth = useCallback((year: number, month: number): Record<number, MoodType> => {
    const result: Record<number, MoodType> = {};
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
        result[entryDate.getDate()] = entry.mood;
      }
    });
    return result;
  }, [entries]);

  const getEntriesForYear = useCallback((year: number): MoodEntry[] => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year;
    });
  }, [entries]);

  const getStatsForYear = useCallback((year: number): MoodStats => {
    const yearEntries = getEntriesForYear(year);
    return {
      elevated: yearEntries.filter(e => e.mood === 'elevated').length,
      stable: yearEntries.filter(e => e.mood === 'stable').length,
      depressed: yearEntries.filter(e => e.mood === 'depressed').length,
      total: yearEntries.length,
    };
  }, [getEntriesForYear]);

  const removeEntry = useCallback((date: string) => {
    setEntries(prev => prev.filter(e => e.date !== date));
  }, []);

  return {
    entries,
    isLoaded,
    addEntry,
    updateComment,
    getEntryForDate,
    getEntriesForMonth,
    getEntriesForYear,
    getStatsForYear,
    removeEntry,
  };
}

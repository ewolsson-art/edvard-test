import { useState, useEffect, useCallback } from 'react';
import { MoodEntry, MoodType, MoodStats, QualityType, ExerciseType, SleepQualityType } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UsePatientMoodDataProps {
  patientId: string | null;
}

export function usePatientMoodData({ patientId }: UsePatientMoodDataProps) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // Fetch entries from database for the specified patient
  useEffect(() => {
    if (!user || !patientId) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    const fetchEntries = async () => {
      setIsLoaded(false);
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', patientId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching patient mood entries:', error);
      } else {
        const formattedEntries: MoodEntry[] = (data || []).map(entry => ({
          date: entry.date,
          mood: entry.mood as MoodType,
          comment: entry.comment || undefined,
          sleepQuality: entry.sleep_quality as SleepQualityType | undefined,
          sleepComment: entry.sleep_comment || undefined,
          eatingQuality: entry.eating_quality as QualityType | undefined,
          eatingComment: entry.eating_comment || undefined,
          exercised: entry.exercised ?? undefined,
          exerciseComment: entry.exercise_comment || undefined,
          exerciseTypes: (entry.exercise_types as ExerciseType[] | null) ?? undefined,
          timestamp: new Date(entry.created_at).getTime(),
        }));
        setEntries(formattedEntries);
      }
      setIsLoaded(true);
    };

    fetchEntries();

    // Set up realtime subscription
    const channel = supabase
      .channel(`patient-mood-${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_entries',
          filter: `user_id=eq.${patientId}`,
        },
        (payload) => {
          
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newEntry: MoodEntry = {
              date: payload.new.date,
              mood: payload.new.mood as MoodType,
              comment: payload.new.comment || undefined,
              sleepQuality: payload.new.sleep_quality as SleepQualityType | undefined,
              sleepComment: payload.new.sleep_comment || undefined,
              eatingQuality: payload.new.eating_quality as QualityType | undefined,
              eatingComment: payload.new.eating_comment || undefined,
              exercised: payload.new.exercised ?? undefined,
              exerciseComment: payload.new.exercise_comment || undefined,
              exerciseTypes: (payload.new.exercise_types as ExerciseType[] | null) ?? undefined,
              timestamp: new Date(payload.new.created_at).getTime(),
            };
            
            setEntries(prev => {
              const filtered = prev.filter(e => e.date !== newEntry.date);
              return [newEntry, ...filtered].sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setEntries(prev => prev.filter(e => e.date !== payload.old.date));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, patientId]);

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
    const severe_elevated = yearEntries.filter(e => e.mood === 'severe_elevated').length;
    const elevated = yearEntries.filter(e => e.mood === 'elevated').length;
    const somewhat_elevated = yearEntries.filter(e => e.mood === 'somewhat_elevated').length;
    const stable = yearEntries.filter(e => e.mood === 'stable').length;
    const somewhat_depressed = yearEntries.filter(e => e.mood === 'somewhat_depressed').length;
    const depressed = yearEntries.filter(e => e.mood === 'depressed').length;
    const severe_depressed = yearEntries.filter(e => e.mood === 'severe_depressed').length;
    const total = severe_elevated + elevated + somewhat_elevated + stable + somewhat_depressed + depressed + severe_depressed;
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { severe_elevated, elevated, somewhat_elevated, stable, somewhat_depressed, depressed, severe_depressed, unregistered, total, totalDays };
  }, [getEntriesForYear]);

  return {
    entries,
    isLoaded,
    getEntryForDate,
    getEntriesForMonth,
    getEntriesForYear,
    getStatsForYear,
  };
}

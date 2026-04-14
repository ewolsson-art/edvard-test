import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoodEntry, MoodType, MoodStats, CheckinData, QualityType, ExerciseType, EnergyType, normalizeMoodType } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const MOOD_ENTRIES_KEY = 'mood-entries';

async function fetchMoodEntries(userId: string): Promise<MoodEntry[]> {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;

  return (data || []).map(entry => ({
    date: entry.date,
    mood: normalizeMoodType(entry.mood),
    energyLevel: entry.energy_level as EnergyType | undefined,
    comment: entry.comment || undefined,
    sleepQuality: normalizeSleepQuality(entry.sleep_quality) as SleepQualityType | undefined,
    sleepComment: entry.sleep_comment || undefined,
    eatingQuality: entry.eating_quality as QualityType | undefined,
    eatingComment: entry.eating_comment || undefined,
    exercised: entry.exercised ?? undefined,
    exerciseComment: entry.exercise_comment || undefined,
    exerciseTypes: (entry.exercise_types as ExerciseType[] | null) ?? undefined,
    medicationComment: (entry as { medication_comment?: string }).medication_comment || undefined,
    medicationSideEffects: (entry as { medication_side_effects?: string[] }).medication_side_effects ?? undefined,
    tags: (entry as { tags?: string[] }).tags ?? undefined,
    timestamp: new Date(entry.created_at).getTime(),
  }));
}

export function useMoodData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isSuccess } = useQuery({
    queryKey: [MOOD_ENTRIES_KEY, user?.id],
    queryFn: () => fetchMoodEntries(user!.id),
    enabled: !!user,
  });

  const isLoaded = !user || isSuccess;

  // Optimistic helper: update cache entries
  const setEntries = useCallback(
    (updater: (prev: MoodEntry[]) => MoodEntry[]) => {
      queryClient.setQueryData<MoodEntry[]>([MOOD_ENTRIES_KEY, user?.id], (old) =>
        updater(old || [])
      );
    },
    [queryClient, user?.id]
  );

  const saveCheckinMutation = useMutation({
    mutationFn: async ({ date, data }: { date: string; data: CheckinData }) => {
      if (!user) throw new Error('No user');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upsertData: any = {
        user_id: user.id,
        date,
        mood: data.mood,
        energy_level: data.energyLevel || null,
        comment: data.moodComment || null,
        sleep_quality: data.sleepQuality || null,
        sleep_comment: data.sleepComment || null,
        eating_quality: data.eatingQuality || null,
        eating_comment: data.eatingComment || null,
        exercised: data.exercised ?? null,
        exercise_comment: data.exerciseComment || null,
        exercise_types: data.exerciseTypes || null,
        medication_comment: data.medicationComment || null,
        medication_side_effects: data.medicationSideEffects || null,
        tags: data.tags || null,
      };
      const { error } = await supabase
        .from('mood_entries')
        .upsert(upsertData, { onConflict: 'user_id,date' });
      if (error) throw error;
      return { date, data };
    },
    onSuccess: ({ date, data }) => {
      const newEntry: MoodEntry = {
        date,
        mood: data.mood!,
        energyLevel: data.energyLevel,
        comment: data.moodComment,
        sleepQuality: data.sleepQuality,
        sleepComment: data.sleepComment,
        eatingQuality: data.eatingQuality,
        eatingComment: data.eatingComment,
        exercised: data.exercised,
        exerciseComment: data.exerciseComment,
        exerciseTypes: data.exerciseTypes,
        medicationComment: data.medicationComment,
        medicationSideEffects: data.medicationSideEffects,
        tags: data.tags,
        timestamp: Date.now(),
      };
      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== date);
        return [...filtered, newEntry];
      });
      toast({ title: "Incheckning sparad!" });
    },
    onError: () => {
      toast({ title: "Kunde inte spara", description: "Försök igen.", variant: "destructive" });
    },
  });

  const saveCheckin = useCallback(async (date: string, data: CheckinData): Promise<boolean> => {
    try {
      await saveCheckinMutation.mutateAsync({ date, data });
      return true;
    } catch {
      return false;
    }
  }, [saveCheckinMutation]);

  const updateExerciseTypes = useCallback(async (date: string, exerciseTypes: ExerciseType[]): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase
      .from('mood_entries')
      .update({ exercise_types: exerciseTypes.length > 0 ? exerciseTypes : null })
      .eq('user_id', user.id)
      .eq('date', date);
    if (error) {
      toast({ title: "Kunde inte uppdatera", description: "Försök igen.", variant: "destructive" });
      return false;
    }
    setEntries(prev => prev.map(e =>
      e.date === date ? { ...e, exerciseTypes: exerciseTypes.length > 0 ? exerciseTypes : undefined } : e
    ));
    toast({ title: "Träningstyp sparad!" });
    return true;
  }, [user, toast, setEntries]);

  const addEntry = useCallback(async (date: string, mood: MoodType, comment?: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('mood_entries')
      .upsert({ user_id: user.id, date, mood, comment: comment || null }, { onConflict: 'user_id,date' });
    if (error) {
      toast({ title: "Kunde inte spara", description: "Försök igen.", variant: "destructive" });
    } else {
      setEntries(prev => {
        const existing = prev.find(e => e.date === date);
        const filtered = prev.filter(e => e.date !== date);
        return [...filtered, { ...existing, date, mood, comment, timestamp: Date.now() }];
      });
    }
  }, [user, toast, setEntries]);

  const updateComment = useCallback(async (date: string, comment: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('mood_entries')
      .update({ comment: comment || null })
      .eq('user_id', user.id)
      .eq('date', date);
    if (error) {
      toast({ title: "Kunde inte uppdatera", description: "Försök igen.", variant: "destructive" });
    } else {
      setEntries(prev => prev.map(e => e.date === date ? { ...e, comment } : e));
      toast({ title: "Kommentar sparad" });
    }
  }, [user, toast, setEntries]);

  const removeEntry = useCallback(async (date: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('mood_entries')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date);
    if (error) {
      toast({ title: "Kunde inte ta bort", description: "Försök igen.", variant: "destructive" });
    } else {
      setEntries(prev => prev.filter(e => e.date !== date));
    }
  }, [user, toast, setEntries]);

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
    return entries.filter(entry => new Date(entry.date).getFullYear() === year);
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
    addEntry,
    saveCheckin,
    updateComment,
    updateExerciseTypes,
    getEntryForDate,
    getEntriesForMonth,
    getEntriesForYear,
    getStatsForYear,
    removeEntry,
  };
}

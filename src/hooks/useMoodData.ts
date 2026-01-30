import { useState, useEffect, useCallback } from 'react';
import { MoodEntry, MoodType, MoodStats, CheckinData, QualityType } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useMoodData() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch entries from database
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching mood entries:', error);
        toast({
          title: "Kunde inte hämta data",
          description: "Försök ladda om sidan.",
          variant: "destructive",
        });
      } else {
        const formattedEntries: MoodEntry[] = (data || []).map(entry => ({
          date: entry.date,
          mood: entry.mood as MoodType,
          comment: entry.comment || undefined,
          sleepQuality: entry.sleep_quality as QualityType | undefined,
          sleepComment: entry.sleep_comment || undefined,
          eatingQuality: entry.eating_quality as QualityType | undefined,
          eatingComment: entry.eating_comment || undefined,
          exercised: entry.exercised ?? undefined,
          exerciseComment: entry.exercise_comment || undefined,
          timestamp: new Date(entry.created_at).getTime(),
        }));
        setEntries(formattedEntries);
      }
      setIsLoaded(true);
    };

    fetchEntries();
  }, [user, toast]);

  const saveCheckin = useCallback(async (date: string, data: CheckinData) => {
    if (!user) return;

    const { error } = await supabase
      .from('mood_entries')
      .upsert({
        user_id: user.id,
        date,
        mood: data.mood,
        comment: data.moodComment || null,
        sleep_quality: data.sleepQuality || null,
        sleep_comment: data.sleepComment || null,
        eating_quality: data.eatingQuality || null,
        eating_comment: data.eatingComment || null,
        exercised: data.exercised ?? null,
        exercise_comment: data.exerciseComment || null,
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      console.error('Error saving checkin:', error);
      toast({
        title: "Kunde inte spara",
        description: "Försök igen.",
        variant: "destructive",
      });
      return false;
    } else {
      // Update local state
      const newEntry: MoodEntry = {
        date,
        mood: data.mood!,
        comment: data.moodComment,
        sleepQuality: data.sleepQuality,
        sleepComment: data.sleepComment,
        eatingQuality: data.eatingQuality,
        eatingComment: data.eatingComment,
        exercised: data.exercised,
        exerciseComment: data.exerciseComment,
        timestamp: Date.now(),
      };
      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== date);
        return [...filtered, newEntry];
      });
      toast({
        title: "Incheckning sparad!",
      });
      return true;
    }
  }, [user, toast]);

  const addEntry = useCallback(async (date: string, mood: MoodType, comment?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('mood_entries')
      .upsert({
        user_id: user.id,
        date,
        mood,
        comment: comment || null,
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      console.error('Error saving mood entry:', error);
      toast({
        title: "Kunde inte spara",
        description: "Försök igen.",
        variant: "destructive",
      });
    } else {
      // Update local state
      setEntries(prev => {
        const existing = prev.find(e => e.date === date);
        const filtered = prev.filter(e => e.date !== date);
        return [...filtered, { 
          ...existing,
          date, 
          mood, 
          comment, 
          timestamp: Date.now() 
        }];
      });
    }
  }, [user, toast]);

  const updateComment = useCallback(async (date: string, comment: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('mood_entries')
      .update({ comment: comment || null })
      .eq('user_id', user.id)
      .eq('date', date);

    if (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Kunde inte uppdatera",
        description: "Försök igen.",
        variant: "destructive",
      });
    } else {
      setEntries(prev => prev.map(e => 
        e.date === date ? { ...e, comment } : e
      ));
      toast({
        title: "Kommentar sparad",
      });
    }
  }, [user, toast]);

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
    const elevated = yearEntries.filter(e => e.mood === 'elevated').length;
    const stable = yearEntries.filter(e => e.mood === 'stable').length;
    const depressed = yearEntries.filter(e => e.mood === 'depressed').length;
    const total = elevated + stable + depressed;
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { elevated, stable, depressed, unregistered, total, totalDays };
  }, [getEntriesForYear]);

  const removeEntry = useCallback(async (date: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('mood_entries')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date);

    if (error) {
      console.error('Error removing entry:', error);
      toast({
        title: "Kunde inte ta bort",
        description: "Försök igen.",
        variant: "destructive",
      });
    } else {
      setEntries(prev => prev.filter(e => e.date !== date));
    }
  }, [user, toast]);

  return {
    entries,
    isLoaded,
    addEntry,
    saveCheckin,
    updateComment,
    getEntryForDate,
    getEntriesForMonth,
    getEntriesForYear,
    getStatsForYear,
    removeEntry,
  };
}

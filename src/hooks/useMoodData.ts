import { useState, useEffect, useCallback } from 'react';
import { MoodEntry, MoodType, MoodStats } from '@/types/mood';
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
          timestamp: new Date(entry.created_at).getTime(),
        }));
        setEntries(formattedEntries);
      }
      setIsLoaded(true);
    };

    fetchEntries();
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
        const filtered = prev.filter(e => e.date !== date);
        return [...filtered, { date, mood, comment, timestamp: Date.now() }];
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
    // Calculate total days in the year (handle leap years)
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
    updateComment,
    getEntryForDate,
    getEntriesForMonth,
    getEntriesForYear,
    getStatsForYear,
    removeEntry,
  };
}

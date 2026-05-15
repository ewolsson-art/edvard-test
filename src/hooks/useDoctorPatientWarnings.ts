import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { detectActiveWarnings, type ActiveWarning } from '@/lib/episodeDetection';
import { normalizeMoodType } from '@/types/mood';
import type { MoodEntry, EnergyType, QualityType } from '@/types/mood';

/**
 * Fetch trailing-30-day mood entries for many patients in ONE query
 * and run detectActiveWarnings per patient to surface critical states
 * in the doctor dashboard.
 */
export function useDoctorPatientWarnings(patientIds: string[]) {
  const [warnings, setWarnings] = useState<Record<string, ActiveWarning[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const key = [...patientIds].sort().join(',');

  useEffect(() => {
    if (patientIds.length === 0) {
      setWarnings({});
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from('mood_entries')
        .select('user_id, mood, date, sleep_quality, energy_level, tags, comment, created_at')
        .in('user_id', patientIds)
        .gte('date', since.toISOString().slice(0, 10))
        .order('date', { ascending: false });

      if (cancelled) return;
      if (error || !data) {
        setIsLoading(false);
        return;
      }

      const grouped: Record<string, MoodEntry[]> = {};
      (data as Array<Record<string, unknown>>).forEach((row) => {
        const uid = row.user_id as string;
        if (!grouped[uid]) grouped[uid] = [];
        grouped[uid].push({
          date: row.date as string,
          mood: normalizeMoodType(row.mood as string),
          energyLevel: (row.energy_level as EnergyType | null) ?? undefined,
          sleepQuality: (row.sleep_quality as QualityType | null) ?? undefined,
          tags: (row.tags as string[] | null) ?? undefined,
          comment: (row.comment as string | null) ?? undefined,
          timestamp: new Date(row.created_at as string).getTime(),
        });
      });

      const result: Record<string, ActiveWarning[]> = {};
      patientIds.forEach((pid) => {
        result[pid] = detectActiveWarnings(grouped[pid] ?? []);
      });
      setWarnings(result);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { warnings, isLoading };
}

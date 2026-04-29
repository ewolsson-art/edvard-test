import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type StatusKind = 'elevated' | 'stable' | 'depressed' | 'inactive' | 'unknown';

export interface PatientStatus {
  patientId: string;
  latestDate: string | null;
  latestMood: string | null;
  daysSince: number | null;
  status: StatusKind;
}

const ELEVATED = new Set(['severe_elevated', 'elevated', 'somewhat_elevated']);
const DEPRESSED = new Set(['severe_depressed', 'depressed', 'somewhat_depressed']);

function classify(latestDate: string | null, latestMood: string | null): { status: StatusKind; daysSince: number | null } {
  if (!latestDate || !latestMood) return { status: 'unknown', daysSince: null };
  const days = Math.floor((Date.now() - new Date(latestDate).getTime()) / 86400000);
  if (days > 7) return { status: 'inactive', daysSince: days };
  if (ELEVATED.has(latestMood)) return { status: 'elevated', daysSince: days };
  if (DEPRESSED.has(latestMood)) return { status: 'depressed', daysSince: days };
  return { status: 'stable', daysSince: days };
}

/**
 * Hämtar senaste mood-entry för varje given patient (lättviktigt: en query).
 * Returnerar en map patientId -> status.
 */
export function usePatientsLatestStatus(patientIds: string[]) {
  const [statuses, setStatuses] = useState<Record<string, PatientStatus>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Stable key for effect
  const key = [...patientIds].sort().join(',');

  useEffect(() => {
    if (patientIds.length === 0) {
      setStatuses({});
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('user_id, mood, date')
        .in('user_id', patientIds)
        .order('date', { ascending: false });

      if (cancelled) return;

      if (error || !data) {
        setIsLoading(false);
        return;
      }

      // First entry per patient is the most recent (sorted desc)
      const map: Record<string, PatientStatus> = {};
      for (const row of data as Array<{ user_id: string; mood: string; date: string }>) {
        if (map[row.user_id]) continue;
        const cls = classify(row.date, row.mood);
        map[row.user_id] = {
          patientId: row.user_id,
          latestDate: row.date,
          latestMood: row.mood,
          ...cls,
        };
      }
      // Fill in unknowns for patients without any entry
      patientIds.forEach(pid => {
        if (!map[pid]) {
          map[pid] = { patientId: pid, latestDate: null, latestMood: null, daysSince: null, status: 'unknown' };
        }
      });
      setStatuses(map);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { statuses, isLoading };
}

export const STATUS_META: Record<StatusKind, { color: string; label: string }> = {
  elevated: { color: 'hsl(45 95% 55%)', label: 'Uppvarvad' },
  stable: { color: 'hsl(142 70% 45%)', label: 'Stabil' },
  depressed: { color: 'hsl(0 75% 55%)', label: 'Nedstämd' },
  inactive: { color: 'hsl(var(--muted-foreground))', label: 'Inaktiv' },
  unknown: { color: 'hsl(var(--muted-foreground) / 0.4)', label: 'Ingen data' },
};

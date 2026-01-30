export type MoodType = 'elevated' | 'stable' | 'depressed';

export interface MoodEntry {
  date: string; // ISO date string YYYY-MM-DD
  mood: MoodType;
  comment?: string;
  timestamp: number;
}

export interface MoodStats {
  elevated: number;
  stable: number;
  depressed: number;
  unregistered: number;
  total: number;
  totalDays: number;
}

export const MOOD_LABELS: Record<MoodType, string> = {
  elevated: 'Uppvarvad',
  stable: 'Stabil',
  depressed: 'Nedstämd',
};

export const MOOD_ICONS: Record<MoodType, string> = {
  elevated: '⚡',
  stable: '☀️',
  depressed: '🌧️',
};

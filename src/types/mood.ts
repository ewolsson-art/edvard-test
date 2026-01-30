export type MoodType = 'elevated' | 'stable' | 'depressed';
export type QualityType = 'good' | 'bad';
export type ExerciseType = 'chest' | 'shoulders' | 'back' | 'legs';

export interface MoodEntry {
  date: string; // ISO date string YYYY-MM-DD
  mood: MoodType;
  comment?: string;
  sleepQuality?: QualityType;
  sleepComment?: string;
  eatingQuality?: QualityType;
  eatingComment?: string;
  exercised?: boolean;
  exerciseComment?: string;
  exerciseTypes?: ExerciseType[];
  timestamp: number;
}

export interface CheckinData {
  mood?: MoodType;
  moodComment?: string;
  sleepQuality?: QualityType;
  sleepComment?: string;
  eatingQuality?: QualityType;
  eatingComment?: string;
  exercised?: boolean;
  exerciseComment?: string;
  exerciseTypes?: ExerciseType[];
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

export const QUALITY_LABELS: Record<QualityType, string> = {
  good: 'Bra',
  bad: 'Dåligt',
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  chest: 'Bröst',
  shoulders: 'Axlar',
  back: 'Rygg',
  legs: 'Ben',
};

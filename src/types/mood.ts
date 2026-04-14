export type MoodType = 'depressed' | 'somewhat_depressed' | 'stable' | 'somewhat_elevated' | 'elevated';
export type EnergyType = 'low' | 'normal' | 'high';
export type QualityType = 'good' | 'okay' | 'bad';
export type ExerciseType = 'chest' | 'shoulders' | 'back' | 'legs';

export interface MoodEntry {
  date: string; // ISO date string YYYY-MM-DD
  mood: MoodType;
  energyLevel?: EnergyType;
  comment?: string;
  sleepQuality?: QualityType;
  sleepComment?: string;
  eatingQuality?: QualityType;
  eatingComment?: string;
  exercised?: boolean;
  exerciseComment?: string;
  exerciseTypes?: ExerciseType[];
  medicationComment?: string;
  medicationSideEffects?: string[];
  tags?: string[];
  timestamp: number;
}

export interface CheckinData {
  mood?: MoodType;
  energyLevel?: EnergyType;
  moodComment?: string;
  sleepQuality?: QualityType;
  sleepComment?: string;
  eatingQuality?: QualityType;
  eatingComment?: string;
  exercised?: boolean;
  exerciseComment?: string;
  exerciseTypes?: ExerciseType[];
  medicationComment?: string;
  medicationSideEffects?: string[];
  tags?: string[];
}

export interface MoodStats {
  elevated: number;
  somewhat_elevated: number;
  stable: number;
  somewhat_depressed: number;
  depressed: number;
  unregistered: number;
  total: number;
  totalDays: number;
}

export const MOOD_LABELS: Record<MoodType, string> = {
  elevated: 'Mycket upp',
  somewhat_elevated: 'Upp',
  stable: 'Stabil',
  somewhat_depressed: 'Låg',
  depressed: 'Mycket låg',
};

export const MOOD_ICONS: Record<MoodType, string> = {
  elevated: '🔥',
  somewhat_elevated: '⚡',
  stable: '☀️',
  somewhat_depressed: '🌥️',
  depressed: '🌧️',
};

export const ENERGY_LABELS: Record<EnergyType, string> = {
  low: 'Låg',
  normal: 'Normal',
  high: 'Hög',
};

export const QUALITY_LABELS: Record<QualityType, string> = {
  good: 'Bra och lagom mycket',
  okay: 'Ovanligt lite',
  bad: 'Ovanligt mycket',
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  chest: 'Bröst',
  shoulders: 'Axlar',
  back: 'Rygg',
  legs: 'Ben',
};

export const EXERCISE_TYPE_EMOJIS: Record<ExerciseType, string> = {
  chest: '💪',
  shoulders: '🏋️',
  back: '🧗',
  legs: '🦵',
};

// Map legacy 3-level mood types to new 5-level system
export function normalizeMoodType(mood: string): MoodType {
  switch (mood) {
    case 'elevated': return 'elevated';
    case 'somewhat_elevated': return 'somewhat_elevated';
    case 'stable': return 'stable';
    case 'somewhat_depressed': return 'somewhat_depressed';
    case 'depressed': return 'depressed';
    default: return 'stable';
  }
}

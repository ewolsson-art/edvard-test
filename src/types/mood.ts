export type MoodType = 'severe_depressed' | 'depressed' | 'somewhat_depressed' | 'stable' | 'somewhat_elevated' | 'elevated' | 'severe_elevated';
export type EnergyType = 'low' | 'normal' | 'high';
export type QualityType = 'good' | 'okay' | 'bad' | 'very_good' | 'little' | 'very_little';
export type SleepQualityType = 'very_good' | 'good' | 'okay' | 'little' | 'very_little' | 'bad';
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
  severe_elevated: number;
  elevated: number;
  somewhat_elevated: number;
  stable: number;
  somewhat_depressed: number;
  depressed: number;
  severe_depressed: number;
  unregistered: number;
  total: number;
  totalDays: number;
}

export const MOOD_LABELS: Record<MoodType, string> = {
  severe_elevated: 'Svår uppvarvning',
  elevated: 'Måttlig uppvarvning',
  somewhat_elevated: 'Lindrig uppvarvning',
  stable: 'Normalt stämningsläge',
  somewhat_depressed: 'Lindrig nedstämdhet',
  depressed: 'Måttlig nedstämdhet',
  severe_depressed: 'Svår nedstämdhet',
};

export const MOOD_ICONS: Record<MoodType, string> = {
  severe_elevated: '🔥',
  elevated: '⚡',
  somewhat_elevated: '🌤️',
  stable: '☀️',
  somewhat_depressed: '🌥️',
  depressed: '🌧️',
  severe_depressed: '🌑',
};

export const ENERGY_LABELS: Record<EnergyType, string> = {
  low: 'Låg',
  normal: 'Normal',
  high: 'Hög',
};

export const QUALITY_LABELS: Record<string, string> = {
  good: 'Bra och lagom mycket',
  okay: 'Helt okej',
  bad: 'För mycket sömn',
  very_good: 'Djup och lugn sömn',
  little: 'Ovanligt lite',
  very_little: 'Nästan ingenting',
};

export const SLEEP_QUALITY_LABELS: Record<SleepQualityType, string> = {
  very_good: 'Djup och lugn sömn',
  good: 'Bra och lagom mycket',
  okay: 'Helt okej',
  little: 'Ovanligt lite',
  very_little: 'Nästan ingenting',
  bad: 'För mycket sömn',
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

// All valid mood types in order from highest to lowest
export const MOOD_ORDER: MoodType[] = [
  'severe_elevated', 'elevated', 'somewhat_elevated', 'stable',
  'somewhat_depressed', 'depressed', 'severe_depressed',
];

// Map legacy mood types to new 7-level system
export function normalizeMoodType(mood: string): MoodType {
  switch (mood) {
    case 'severe_elevated': return 'severe_elevated';
    case 'elevated': return 'elevated';
    case 'somewhat_elevated': return 'somewhat_elevated';
    case 'stable': return 'stable';
    case 'somewhat_depressed': return 'somewhat_depressed';
    case 'depressed': return 'depressed';
    case 'severe_depressed': return 'severe_depressed';
    default: return 'stable';
  }
}

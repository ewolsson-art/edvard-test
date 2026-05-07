import type { TurtleMood } from '@/components/TurtleLogo';
import type { MoodType } from '@/types/mood';

export function getTurtleMoodForMood(mood?: MoodType): TurtleMood | undefined {
  if (!mood) return undefined;
  if (mood.includes('elevated')) return 'elevated';
  if (mood.includes('depressed')) return 'depressed';
  return 'stable';
}
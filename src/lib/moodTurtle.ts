import type { TurtleMood } from '@/components/TurtleLogo';
import type { MoodType } from '@/types/mood';

// Mappa direkt 1:1 — varje stämningsläge har en egen sköldpaddsfärg
// så det är tydligt vilken nivå dagen visar.
export function getTurtleMoodForMood(mood?: MoodType): TurtleMood | undefined {
  if (!mood) return undefined;
  return mood as TurtleMood;
}

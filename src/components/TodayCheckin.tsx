import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Zap, Sun, CloudRain, Check } from 'lucide-react';
import { MoodType, MOOD_LABELS } from '@/types/mood';
import { cn } from '@/lib/utils';

interface TodayCheckinProps {
  todayMood: MoodType | undefined;
  onCheckin: (mood: MoodType) => void;
}

const moodButtons: { mood: MoodType; icon: typeof Zap; label: string }[] = [
  { mood: 'elevated', icon: Zap, label: MOOD_LABELS.elevated },
  { mood: 'stable', icon: Sun, label: MOOD_LABELS.stable },
  { mood: 'depressed', icon: CloudRain, label: MOOD_LABELS.depressed },
];

export function TodayCheckin({ todayMood, onCheckin }: TodayCheckinProps) {
  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: sv });

  return (
    <div className="glass-card p-8 fade-in">
      <div className="text-center mb-8">
        <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">
          Idag
        </p>
        <h2 className="font-display text-3xl font-semibold capitalize">
          {formattedDate}
        </h2>
      </div>

      <div className="space-y-4">
        <p className="text-center text-muted-foreground">
          Hur mår du idag?
        </p>

        <div className="grid grid-cols-3 gap-4">
          {moodButtons.map(({ mood, icon: Icon, label }) => {
            const isSelected = todayMood === mood;
            
            return (
              <button
                key={mood}
                onClick={() => onCheckin(mood)}
                className={cn(
                  "mood-btn rounded-2xl p-6 flex flex-col items-center gap-3",
                  mood === 'elevated' && "mood-btn-elevated",
                  mood === 'stable' && "mood-btn-stable",
                  mood === 'depressed' && "mood-btn-depressed",
                  isSelected && "ring-4 ring-offset-4 ring-offset-background"
                )}
              >
                <div className="relative">
                  <Icon className="w-8 h-8" />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-foreground" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm">{label}</span>
              </button>
            );
          })}
        </div>

        {todayMood && (
          <p className="text-center text-sm text-muted-foreground mt-4 fade-in">
            Du har checkat in som <span className="font-medium">{MOOD_LABELS[todayMood].toLowerCase()}</span> idag ✓
          </p>
        )}
      </div>
    </div>
  );
}

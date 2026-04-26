import { MoodType } from '@/types/mood';
import { Flame, Zap, Sun, Cloud, CloudRain } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface MoodOption {
  mood: MoodType;
  label: string;
  sublabel: string;
}

interface MoodTapButtonsProps {
  options: MoodOption[];
  value?: MoodType;
  onSelect: (mood: MoodType) => void;
}

const moodIcons: Record<MoodType, typeof Zap> = {
  severe_elevated: Flame,
  elevated: Flame,
  somewhat_elevated: Zap,
  stable: Sun,
  somewhat_depressed: Cloud,
  depressed: CloudRain,
  severe_depressed: CloudRain,
};

const moodColorVars: Record<MoodType, string> = {
  severe_elevated: 'var(--mood-severe-elevated)',
  elevated: 'var(--mood-elevated)',
  somewhat_elevated: 'var(--mood-somewhat-elevated)',
  stable: 'var(--mood-stable)',
  somewhat_depressed: 'var(--mood-somewhat-depressed)',
  depressed: 'var(--mood-depressed)',
  severe_depressed: 'var(--mood-severe-depressed)',
};

export function MoodTapButtons({ options, value, onSelect }: MoodTapButtonsProps) {
  const { selection: hapticSelection } = useHaptics();

  const handleSelect = (mood: MoodType) => {
    hapticSelection();
    onSelect(mood);
  };

  const selected = value ? options.find(o => o.mood === value) : undefined;

  return (
    <div className="flex flex-col items-center w-full select-none gap-6">
      {/* Live label of currently chosen mood */}
      <div className="h-14 flex flex-col items-center justify-center text-center px-4">
        {selected ? (
          <div key={selected.mood} className="animate-fade-in">
            <div
              className="text-lg font-semibold leading-tight"
              style={{ color: `hsl(${moodColorVars[selected.mood]})` }}
            >
              {selected.label}
            </div>
            <div className="text-xs leading-tight text-muted-foreground mt-1">
              {selected.sublabel}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground/60">
            Tryck för att välja stämning
          </div>
        )}
      </div>

      {/* Vertical stack of large tap targets — easiest UX, one tap = done */}
      <div className="w-full max-w-sm flex flex-col gap-2.5">
        {options.map(opt => {
          const Icon = moodIcons[opt.mood];
          const colorVar = moodColorVars[opt.mood];
          const isSelected = value === opt.mood;

          return (
            <button
              key={opt.mood}
              type="button"
              onClick={() => handleSelect(opt.mood)}
              className={cn(
                'group relative w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl',
                'border transition-all duration-200 text-left',
                'active:scale-[0.98]',
                isSelected
                  ? 'border-transparent shadow-lg'
                  : 'border-border/40 bg-card/40 hover:bg-card/70'
              )}
              style={
                isSelected
                  ? {
                      backgroundColor: `hsl(${colorVar} / 0.15)`,
                      boxShadow: `0 4px 20px hsl(${colorVar} / 0.25), inset 0 0 0 1.5px hsl(${colorVar} / 0.6)`,
                    }
                  : undefined
              }
              aria-pressed={isSelected}
            >
              {/* Color indicator dot */}
              <div
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200"
                style={{
                  backgroundColor: `hsl(${colorVar} / ${isSelected ? '0.9' : '0.18'})`,
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    color: isSelected ? 'hsl(var(--background))' : `hsl(${colorVar})`,
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    'text-base font-semibold leading-tight transition-colors',
                    isSelected ? 'text-foreground' : 'text-foreground/90'
                  )}
                >
                  {opt.label}
                </div>
                <div className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                  {opt.sublabel}
                </div>
              </div>

              {/* Selected check indicator */}
              {isSelected && (
                <div
                  className="flex-shrink-0 w-2.5 h-2.5 rounded-full animate-fade-in"
                  style={{ backgroundColor: `hsl(${colorVar})` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

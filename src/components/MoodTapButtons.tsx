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
  const selectedColor = selected ? moodColorVars[selected.mood] : null;

  return (
    <div className="flex flex-col items-center w-full select-none gap-8">
      {/* Live label of currently chosen mood — large, visible feedback */}
      <div className="h-20 flex flex-col items-center justify-center text-center px-4">
        {selected ? (
          <div key={selected.mood} className="animate-fade-in">
            <div
              className="text-2xl font-bold leading-tight tracking-tight"
              style={{ color: `hsl(${moodColorVars[selected.mood]})` }}
            >
              {selected.label}
            </div>
            <div className="text-sm leading-tight text-muted-foreground mt-1.5">
              {selected.sublabel}
            </div>
          </div>
        ) : (
          <div className="text-base text-muted-foreground/60">
            Tryck för att välja
          </div>
        )}
      </div>

      {/* Horizontal row — all 7 moods visible at once, no scrolling */}
      <div className="w-full max-w-md">
        {/* Scale endpoints labels */}
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/50 px-1 mb-2.5 font-medium">
          <span>Nedstämd</span>
          <span>Uppvarvad</span>
        </div>

        <div className="flex items-center justify-between gap-1.5">
          {options.map(opt => {
            const Icon = moodIcons[opt.mood];
            const colorVar = moodColorVars[opt.mood];
            const isSelected = value === opt.mood;

            return (
              <button
                key={opt.mood}
                type="button"
                onClick={() => handleSelect(opt.mood)}
                aria-label={opt.label}
                aria-pressed={isSelected}
                className={cn(
                  'group relative flex-1 aspect-square rounded-2xl flex items-center justify-center',
                  'transition-all duration-200 active:scale-90',
                  isSelected ? 'scale-110' : 'scale-100 hover:scale-105'
                )}
                style={{
                  backgroundColor: isSelected
                    ? `hsl(${colorVar})`
                    : `hsl(${colorVar} / 0.14)`,
                  boxShadow: isSelected
                    ? `0 6px 20px hsl(${colorVar} / 0.5), 0 0 0 2px hsl(${colorVar} / 0.25)`
                    : 'none',
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    color: isSelected ? 'hsl(var(--background))' : `hsl(${colorVar})`,
                  }}
                  strokeWidth={2.5}
                />
              </button>
            );
          })}
        </div>

        {/* Subtle gradient track underneath, shows it's a scale */}
        <div
          className="mt-3 mx-1 h-1 rounded-full opacity-30"
          style={{
            background: `linear-gradient(to right,
              hsl(var(--mood-severe-depressed)),
              hsl(var(--mood-depressed)),
              hsl(var(--mood-somewhat-depressed)),
              hsl(var(--mood-stable)),
              hsl(var(--mood-somewhat-elevated)),
              hsl(var(--mood-elevated)),
              hsl(var(--mood-severe-elevated)))`,
          }}
        />
      </div>
    </div>
  );
}

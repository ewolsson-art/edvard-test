import { useState, useRef, useCallback, useEffect } from 'react';
import { MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Flame, Zap, Sun, Cloud, CloudRain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MoodOption {
  mood: MoodType;
  label: string;
  sublabel: string;
}

interface VerticalMoodSliderProps {
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

export function VerticalMoodSlider({ options, value, onSelect }: VerticalMoodSliderProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(() => {
    if (value) {
      const idx = options.findIndex(o => o.mood === value);
      return idx >= 0 ? idx : null;
    }
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const stepCount = options.length;

  const getIndexFromY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const fraction = Math.max(0, Math.min(1, relativeY / rect.height));
    return Math.round(fraction * (stepCount - 1));
  }, [stepCount]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const idx = getIndexFromY(e.clientY);
    setActiveIndex(idx);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getIndexFromY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const idx = getIndexFromY(e.clientY);
    setActiveIndex(idx);
  }, [isDragging, getIndexFromY]);

  const handlePointerUp = useCallback(() => {
    if (isDragging && activeIndex !== null) {
      onSelect(options[activeIndex].mood);
    }
    setIsDragging(false);
  }, [isDragging, activeIndex, onSelect, options]);

  const handleStepClick = (index: number) => {
  const { t } = useTranslation();
    setActiveIndex(index);
    onSelect(options[index].mood);
  };

  // Thumb position as percentage
  const thumbPercent = activeIndex !== null ? (activeIndex / (stepCount - 1)) * 100 : null;

  // Active mood color
  const activeMood = activeIndex !== null ? options[activeIndex] : null;
  const activeColorVar = activeMood ? moodColorVars[activeMood.mood] : null;

  return (
    <div className="flex items-stretch gap-5 max-w-md w-full select-none" style={{ minHeight: '340px' }}>
      {/* Labels left side */}
      <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
        {options.map((opt, i) => {
          const isActive = activeIndex === i;
          const Icon = moodIcons[opt.mood];
          return (
            <button
              key={opt.mood}
              onClick={() => handleStepClick(i)}
              className={cn(
                "flex items-center gap-3 text-left rounded-xl px-3 py-2 transition-all duration-200 -mx-1",
                isActive
                  ? "bg-white/10 scale-[1.03]"
                  : "opacity-50 hover:opacity-75 hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-all duration-200",
                  isActive && "scale-110"
                )}
                style={isActive && activeColorVar ? { color: `hsl(${activeColorVar})` } : { color: 'hsl(var(--muted-foreground))' }}
              />
              <div className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold leading-tight transition-colors duration-200",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "block text-[11px] leading-tight transition-colors duration-200 mt-0.5",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/50"
                  )}
                >
                  {opt.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Slider track */}
      <div
        className="relative flex flex-col items-center"
        style={{ width: '48px' }}
      >
        <div
          ref={trackRef}
          className="relative w-full h-full cursor-pointer touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Gradient track bar */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-3 rounded-full overflow-hidden"
            style={{
              top: '8px',
              bottom: '8px',
              background: `linear-gradient(
                to bottom,
                hsl(var(--mood-severe-elevated)),
                hsl(var(--mood-elevated)),
                hsl(var(--mood-somewhat-elevated)),
                hsl(var(--mood-stable)),
                hsl(var(--mood-somewhat-depressed)),
                hsl(var(--mood-depressed)),
                hsl(var(--mood-severe-depressed))
              )`,
              opacity: 0.7,
            }}
          />

          {/* Step dots */}
          {options.map((opt, i) => {
            const percent = (i / (stepCount - 1)) * 100;
            const isActive = activeIndex === i;
            return (
              <div
                key={opt.mood}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                style={{ top: `calc(8px + (100% - 16px) * ${i / (stepCount - 1)})` }}
              >
                <div
                  className={cn(
                    "rounded-full border-2 border-background transition-all duration-200",
                    isActive ? "w-4 h-4" : "w-2.5 h-2.5"
                  )}
                  style={{
                    backgroundColor: `hsl(${moodColorVars[opt.mood]})`,
                    boxShadow: isActive ? `0 0 12px hsl(${moodColorVars[opt.mood]} / 0.5)` : 'none',
                  }}
                />
              </div>
            );
          })}

          {/* Draggable thumb */}
          {thumbPercent !== null && (
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all z-10"
              style={{
                top: `calc(8px + (100% - 16px) * ${thumbPercent / 100})`,
                transitionProperty: isDragging ? 'none' : 'top',
                transitionDuration: '200ms',
              }}
            >
              <div
                className="w-8 h-8 rounded-full border-4 border-background shadow-lg flex items-center justify-center"
                style={{
                  backgroundColor: activeColorVar ? `hsl(${activeColorVar})` : 'hsl(var(--muted))',
                  boxShadow: activeColorVar
                    ? `0 4px 20px hsl(${activeColorVar} / 0.4), 0 0 0 4px hsl(${activeColorVar} / 0.1)`
                    : '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

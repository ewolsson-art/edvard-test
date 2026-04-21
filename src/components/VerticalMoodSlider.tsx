import { useState, useRef, useCallback } from 'react';
import { MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Flame, Zap, Sun, Cloud, CloudRain } from 'lucide-react';

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
    onSelect(options[idx].mood);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getIndexFromY, onSelect, options]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const idx = getIndexFromY(e.clientY);
    if (idx !== activeIndex) {
      setActiveIndex(idx);
      onSelect(options[idx].mood);
    }
  }, [isDragging, getIndexFromY, activeIndex, onSelect, options]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const thumbPercent = activeIndex !== null ? (activeIndex / (stepCount - 1)) * 100 : null;
  const activeMood = activeIndex !== null ? options[activeIndex] : null;
  const activeColorVar = activeMood ? moodColorVars[activeMood.mood] : null;
  const ActiveIcon = activeMood ? moodIcons[activeMood.mood] : null;

  return (
    <div className="flex flex-col items-center w-full select-none mx-auto" style={{ maxWidth: '320px' }}>
      {/* Slider track — centered as the hero element */}
      <div className="relative flex justify-center w-full" style={{ height: '340px' }}>
        <div
          ref={trackRef}
          className="relative h-full cursor-pointer touch-none"
          style={{ width: '56px' }}
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
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                top: `calc(8px + (100% - 16px) * ${thumbPercent / 100})`,
                transitionProperty: isDragging ? 'none' : 'top',
                transitionDuration: '200ms',
              }}
            >
              <div
                className="w-9 h-9 rounded-full border-4 border-background shadow-lg"
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

      {/* Active label area — only renders once a mood is selected */}
      <div className="mt-8 min-h-[72px] w-full flex items-center justify-center">
        {activeMood && ActiveIcon ? (
          <div
            key={activeMood.mood}
            className="flex items-center gap-3 rounded-2xl px-5 py-3 bg-white/5 backdrop-blur-sm animate-fade-in"
          >
            <ActiveIcon
              className="w-7 h-7 flex-shrink-0"
              style={activeColorVar ? { color: `hsl(${activeColorVar})` } : undefined}
            />
            <div className="min-w-0 text-left">
              <span className="block text-base font-semibold leading-tight text-foreground">
                {activeMood.label}
              </span>
              <span className="block text-xs leading-tight text-muted-foreground mt-0.5">
                {activeMood.sublabel}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60">
            Tryck eller dra på skalan
          </p>
        )}
      </div>
    </div>
  );
}

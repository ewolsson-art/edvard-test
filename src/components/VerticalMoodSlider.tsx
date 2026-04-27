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
  // Find the "stable" (normal) mood index to use as default
  const defaultIndex = options.findIndex(o => o.mood === 'stable');
  const stableIndex = defaultIndex >= 0 ? defaultIndex : 3; // fallback to middle if stable not found

  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (value) {
      const idx = options.findIndex(o => o.mood === value);
      return idx >= 0 ? idx : stableIndex;
    }
    return stableIndex;
  });
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const stepCount = options.length;

  const getIndexFromX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, relativeX / rect.width));
    return Math.round(fraction * (stepCount - 1));
  }, [stepCount]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const idx = getIndexFromX(e.clientX);
    setActiveIndex(idx);
    onSelect(options[idx].mood);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getIndexFromX, onSelect, options]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const idx = getIndexFromX(e.clientX);
    if (idx !== activeIndex) {
      setActiveIndex(idx);
      onSelect(options[idx].mood);
    }
  }, [isDragging, getIndexFromX, activeIndex, onSelect, options]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const thumbPercent = activeIndex !== null ? (activeIndex / (stepCount - 1)) * 100 : null;
  const activeMood = activeIndex !== null ? options[activeIndex] : null;
  const activeColorVar = activeMood ? moodColorVars[activeMood.mood] : null;
  const ActiveIcon = activeMood ? moodIcons[activeMood.mood] : null;

  return (
    <div className="flex flex-col items-center w-full select-none mx-auto" style={{ maxWidth: '420px' }}>
      {/* Active label area — acts as heading, sits ABOVE the slider */}
      <div className="mb-10 min-h-[72px] w-full flex items-center justify-center">
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

      {/* Horizontal slider track */}
      <div className="relative flex items-center w-full px-4" style={{ height: '64px' }}>
        <div
          ref={trackRef}
          className="relative w-full cursor-pointer touch-none"
          style={{ height: '56px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Gradient track bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden"
            style={{
              left: '8px',
              right: '8px',
              background: `linear-gradient(
                to right,
                hsl(var(--mood-severe-depressed)),
                hsl(var(--mood-depressed)),
                hsl(var(--mood-somewhat-depressed)),
                hsl(var(--mood-stable)),
                hsl(var(--mood-somewhat-elevated)),
                hsl(var(--mood-elevated)),
                hsl(var(--mood-severe-elevated))
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
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                style={{ left: `calc(8px + (100% - 16px) * ${i / (stepCount - 1)})` }}
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
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `calc(8px + (100% - 16px) * ${thumbPercent / 100})`,
                transitionProperty: isDragging ? 'none' : 'left',
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
    </div>
  );
}

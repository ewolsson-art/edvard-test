import { useState, useRef, useCallback, useEffect } from 'react';
import { MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Flame, Zap, Sun, Cloud, CloudRain } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

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
  const { selection: hapticSelection } = useHaptics();

  // Find the "stable" (normal) mood index to use as default
  const defaultIndex = options.findIndex(o => o.mood === 'stable');
  const stableIndex = defaultIndex >= 0 ? defaultIndex : 3;

  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (value) {
      const idx = options.findIndex(o => o.mood === value);
      return idx >= 0 ? idx : stableIndex;
    }
    return stableIndex;
  });
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const stepCount = options.length;

  // Sync external value changes
  useEffect(() => {
    if (value) {
      const idx = options.findIndex(o => o.mood === value);
      if (idx >= 0 && idx !== activeIndex) {
        setActiveIndex(idx);
      }
    }
  }, [value, options, activeIndex]);

  const updateIndex = useCallback((newIdx: number) => {
    const clamped = Math.max(0, Math.min(stepCount - 1, newIdx));
    if (clamped !== activeIndex) {
      setActiveIndex(clamped);
      onSelect(options[clamped].mood);
      // Haptic tick at every step boundary (no-op on web)
      hapticSelection();
    }
  }, [activeIndex, stepCount, onSelect, options, hapticSelection]);

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
    updateIndex(idx);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    // Focus the slider so keyboard nav works after pointer interaction
    sliderRef.current?.focus({ preventScroll: true });
  }, [getIndexFromX, updateIndex]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const idx = getIndexFromX(e.clientX);
    updateIndex(idx);
  }, [isDragging, getIndexFromX, updateIndex]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        updateIndex(activeIndex + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        updateIndex(activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        updateIndex(0);
        break;
      case 'End':
        e.preventDefault();
        updateIndex(stepCount - 1);
        break;
      case 'PageUp':
        e.preventDefault();
        updateIndex(activeIndex + 2);
        break;
      case 'PageDown':
        e.preventDefault();
        updateIndex(activeIndex - 2);
        break;
    }
  }, [activeIndex, stepCount, updateIndex]);

  const thumbPercent = (activeIndex / (stepCount - 1)) * 100;
  const activeMood = options[activeIndex];
  const activeColorVar = moodColorVars[activeMood.mood];
  const ActiveIcon = moodIcons[activeMood.mood];

  return (
    <div className="flex flex-col items-center w-full select-none mx-auto" style={{ maxWidth: '420px' }}>
      {/* Active label — premium mood pill */}
      <div className="mb-10 min-h-[80px] w-full flex items-center justify-center">
        <div
          key={activeMood.mood}
          className="relative animate-fade-in"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Soft colored halo behind the pill */}
          <div
            className="absolute -inset-6 rounded-[2rem] opacity-60 blur-2xl pointer-events-none transition-opacity duration-500"
            style={{ background: `radial-gradient(closest-side, hsl(${activeColorVar} / 0.35), transparent 70%)` }}
            aria-hidden="true"
          />
          <div
            className="relative flex items-center gap-3.5 rounded-2xl pl-2.5 pr-5 py-2.5 bg-foreground/[0.03] backdrop-blur-sm"
          >
          >
            {/* Icon in tinted circle */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300"
              style={{
                background: `hsl(${activeColorVar} / 0.14)`,
                boxShadow: `inset 0 0 0 1px hsl(${activeColorVar} / 0.25)`,
              }}
            >
              <ActiveIcon
                className="w-5 h-5"
                style={{ color: `hsl(${activeColorVar})` }}
                strokeWidth={2.25}
              />
            </div>
            <div className="min-w-0 text-left pr-1">
              <span className="block text-[15px] font-semibold leading-tight text-foreground tracking-[-0.01em]">
                {activeMood.label}
              </span>
              <span className="block text-[11px] leading-tight text-muted-foreground/80 mt-0.5 tracking-wide">
                {activeMood.sublabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slider track — wrapped in focusable, keyboard-driven, ARIA-compliant role="slider" */}
      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={stepCount - 1}
        aria-valuenow={activeIndex}
        aria-valuetext={`${activeMood.label} — ${activeMood.sublabel}`}
        aria-label="Stämningsläge"
        onKeyDown={handleKeyDown}
        className="relative flex items-center w-full px-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
        style={{ height: '72px' }}
      >
        <div
          ref={trackRef}
          className="relative w-full cursor-pointer touch-none"
          style={{ height: '64px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Gradient track bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden pointer-events-none"
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
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none"
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

          {/* Draggable thumb — visible 36px, 48px tap-target via invisible padding ring */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
            style={{
              left: `calc(8px + (100% - 16px) * ${thumbPercent / 100})`,
              width: '48px',
              height: '48px',
              transitionProperty: isDragging ? 'none' : 'left',
              transitionDuration: '200ms',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              className={cn(
                "rounded-full border-4 border-background shadow-lg transition-transform duration-150",
                isDragging ? "scale-110" : "scale-100"
              )}
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: `hsl(${activeColorVar})`,
                boxShadow: `0 4px 20px hsl(${activeColorVar} / 0.4), 0 0 0 4px hsl(${activeColorVar} / 0.1)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ScaleOption<T extends string = string> {
  value: T;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string; // HSL values like "150 60% 45%"
}

interface VerticalScaleSliderProps<T extends string = string> {
  options: ScaleOption<T>[];
  value?: T;
  onSelect: (value: T) => void;
}

export function VerticalScaleSlider<T extends string>({ options, value, onSelect }: VerticalScaleSliderProps<T>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(() => {
    if (value) {
      const idx = options.findIndex(o => o.value === value);
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
    onSelect(options[idx].value);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getIndexFromY, onSelect, options]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const idx = getIndexFromY(e.clientY);
    if (idx !== activeIndex) {
      setActiveIndex(idx);
      onSelect(options[idx].value);
    }
  }, [isDragging, getIndexFromY, activeIndex, onSelect, options]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const thumbPercent = activeIndex !== null ? (activeIndex / (stepCount - 1)) * 100 : null;
  const activeOpt = activeIndex !== null ? options[activeIndex] : null;
  const ActiveIcon = activeOpt ? activeOpt.icon : null;

  // Build gradient from option colors
  const gradientStops = options.map((o, i) => {
    const pct = (i / (stepCount - 1)) * 100;
    return `hsl(${o.color}) ${pct}%`;
  }).join(', ');

  const trackHeight = Math.max(280, stepCount * 56);

  return (
    <div className="flex flex-col items-center w-full select-none mx-auto" style={{ maxWidth: '320px' }}>
      {/* Slider track — centered as the hero element */}
      <div className="relative flex justify-center w-full" style={{ height: `${trackHeight}px` }}>
        <div
          ref={trackRef}
          className="relative h-full cursor-pointer touch-none"
          style={{ width: '56px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Gradient bar */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-3 rounded-full overflow-hidden"
            style={{
              top: '8px',
              bottom: '8px',
              background: `linear-gradient(to bottom, ${gradientStops})`,
              opacity: 0.7,
            }}
          />

          {/* Step dots */}
          {options.map((opt, i) => {
            const isActive = activeIndex === i;
            return (
              <div
                key={opt.value}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                style={{ top: `calc(8px + (100% - 16px) * ${i / (stepCount - 1)})` }}
              >
                <div
                  className={cn(
                    "rounded-full border-2 border-background transition-all duration-200",
                    isActive ? "w-4 h-4" : "w-2.5 h-2.5"
                  )}
                  style={{
                    backgroundColor: `hsl(${opt.color})`,
                    boxShadow: isActive ? `0 0 12px hsl(${opt.color} / 0.5)` : 'none',
                  }}
                />
              </div>
            );
          })}

          {/* Thumb */}
          {thumbPercent !== null && activeOpt && (
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                top: `calc(8px + (100% - 16px) * ${thumbPercent / 100})`,
                transition: isDragging ? 'none' : 'top 200ms',
              }}
            >
              <div
                className="w-9 h-9 rounded-full border-4 border-background shadow-lg"
                style={{
                  backgroundColor: `hsl(${activeOpt.color})`,
                  boxShadow: `0 4px 20px hsl(${activeOpt.color} / 0.4), 0 0 0 4px hsl(${activeOpt.color} / 0.1)`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Active label area — only renders once a value is selected */}
      <div className="mt-8 min-h-[72px] w-full flex items-center justify-center">
        {activeOpt && ActiveIcon ? (
          <div
            key={activeOpt.value}
            className="flex items-center gap-3 rounded-2xl px-5 py-3 bg-white/5 backdrop-blur-sm animate-fade-in"
          >
            <ActiveIcon
              className="w-7 h-7 flex-shrink-0"
              style={{ color: `hsl(${activeOpt.color})` }}
            />
            <div className="min-w-0 text-left">
              <span className="block text-base font-semibold leading-tight text-foreground">
                {activeOpt.label}
              </span>
              <span className="block text-xs leading-tight text-muted-foreground mt-0.5">
                {activeOpt.sublabel}
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

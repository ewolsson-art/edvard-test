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
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getIndexFromY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const idx = getIndexFromY(e.clientY);
    setActiveIndex(idx);
  }, [isDragging, getIndexFromY]);

  const handlePointerUp = useCallback(() => {
    if (isDragging && activeIndex !== null) {
      onSelect(options[activeIndex].value);
    }
    setIsDragging(false);
  }, [isDragging, activeIndex, onSelect, options]);

  const handleStepClick = (index: number) => {
    setActiveIndex(index);
    onSelect(options[index].value);
  };

  const thumbPercent = activeIndex !== null ? (activeIndex / (stepCount - 1)) * 100 : null;
  const activeOpt = activeIndex !== null ? options[activeIndex] : null;

  // Build gradient from option colors
  const gradientStops = options.map((o, i) => {
    const pct = (i / (stepCount - 1)) * 100;
    return `hsl(${o.color}) ${pct}%`;
  }).join(', ');

  return (
    <div className="flex items-stretch gap-5 max-w-md w-full select-none" style={{ minHeight: `${Math.max(260, stepCount * 56)}px` }}>
      {/* Labels */}
      <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
        {options.map((opt, i) => {
          const isActive = activeIndex === i;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => handleStepClick(i)}
              className={cn(
                "flex items-center gap-3 text-left rounded-xl px-3 py-2 transition-all duration-200 -mx-1",
                isActive
                  ? "bg-white/10 scale-[1.03]"
                  : "opacity-50 hover:opacity-75 hover:bg-white/5"
              )}
            >
              <Icon
                className={cn("w-5 h-5 flex-shrink-0 transition-all duration-200", isActive && "scale-110")}
                style={isActive ? { color: `hsl(${opt.color})` } : { color: 'hsl(var(--muted-foreground))' }}
              />
              <div className="min-w-0">
                <span className={cn(
                  "block text-sm font-semibold leading-tight transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {opt.label}
                </span>
                <span className={cn(
                  "block text-[11px] leading-tight transition-colors duration-200 mt-0.5",
                  isActive ? "text-muted-foreground" : "text-muted-foreground/50"
                )}>
                  {opt.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Track */}
      <div className="relative flex flex-col items-center" style={{ width: '48px' }}>
        <div
          ref={trackRef}
          className="relative w-full h-full cursor-pointer touch-none"
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
                className="w-8 h-8 rounded-full border-4 border-background shadow-lg"
                style={{
                  backgroundColor: `hsl(${activeOpt.color})`,
                  boxShadow: `0 4px 20px hsl(${activeOpt.color} / 0.4), 0 0 0 4px hsl(${activeOpt.color} / 0.1)`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

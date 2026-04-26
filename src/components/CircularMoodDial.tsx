import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Flame, Zap, Sun, Cloud, CloudRain } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface MoodOption {
  mood: MoodType;
  label: string;
  sublabel: string;
}

interface CircularMoodDialProps {
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

// Web Audio "tick" sound — synthesized so we don't need an asset
function useTickSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      try {
        const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
        if (!Ctor) return null;
        ctxRef.current = new Ctor();
      } catch {
        return null;
      }
    }
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const tick = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Short, dry "click" — like a vault dial
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }, [ensureCtx]);

  return tick;
}

export function CircularMoodDial({ options, value, onSelect }: CircularMoodDialProps) {
  const stepCount = options.length;
  const stableIndex = Math.max(0, options.findIndex(o => o.mood === 'stable'));

  const initialIndex = (() => {
    if (value) {
      const idx = options.findIndex(o => o.mood === value);
      return idx >= 0 ? idx : stableIndex;
    }
    return stableIndex;
  })();

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const lastIndexRef = useRef<number>(initialIndex);
  const rafRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const tick = useTickSound();
  const { selection: hapticSelection, medium: hapticMedium } = useHaptics();

  // Geometry — arc covers from -135° (left) to +135° (right) = 270° total at top
  const ARC_START = -135; // degrees, where step 0 sits
  const ARC_SWEEP = 270; // total sweep
  const stepAngle = ARC_SWEEP / (stepCount - 1);

  const indexToAngle = useCallback(
    (i: number) => ARC_START + i * stepAngle,
    [stepAngle]
  );

  // Returns continuous angle (clamped to dial sweep) — NOT snapped
  const getAngleFromPointer = useCallback(
    (clientX: number, clientY: number): number | null => {
      const dial = dialRef.current;
      if (!dial) return null;
      const rect = dial.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
      if (angle < ARC_START - (360 - ARC_SWEEP) / 2) angle += 360;
      if (angle > ARC_START + ARC_SWEEP + (360 - ARC_SWEEP) / 2) angle -= 360;
      return Math.max(ARC_START, Math.min(ARC_START + ARC_SWEEP, angle));
    },
    []
  );

  const angleToIndex = useCallback(
    (angle: number) => {
      const idx = Math.round((angle - ARC_START) / stepAngle);
      return Math.max(0, Math.min(stepCount - 1, idx));
    },
    [stepAngle, stepCount]
  );

  // Imperatively position the knob — bypasses React render for buttery motion
  const applyAngle = useCallback((angle: number) => {
    const knob = knobRef.current;
    if (knob) {
      knob.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
  }, []);

  const commitIndex = useCallback(
    (idx: number) => {
      if (idx === lastIndexRef.current) return;
      lastIndexRef.current = idx;
      setActiveIndex(idx);
      onSelect(options[idx].mood);
      tick();
      hapticSelection();
    },
    [onSelect, options, tick, hapticSelection]
  );

  const processPointer = useCallback(() => {
    rafRef.current = null;
    const p = pendingPointerRef.current;
    if (!p) return;
    const angle = getAngleFromPointer(p.x, p.y);
    if (angle === null) return;
    applyAngle(angle);
    const idx = angleToIndex(angle);
    commitIndex(idx);
  }, [getAngleFromPointer, applyAngle, angleToIndex, commitIndex]);

  const schedulePointer = useCallback(
    (clientX: number, clientY: number) => {
      pendingPointerRef.current = { x: clientX, y: clientY };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(processPointer);
      }
    },
    [processPointer]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      // Force a commit on tap even if same index
      lastIndexRef.current = -1;
      const angle = getAngleFromPointer(e.clientX, e.clientY);
      if (angle !== null) {
        applyAngle(angle);
        commitIndex(angleToIndex(angle));
      }
      hapticMedium();
    },
    [getAngleFromPointer, applyAngle, angleToIndex, commitIndex, hapticMedium]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      schedulePointer(e.clientX, e.clientY);
    },
    [isDragging, schedulePointer]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Snap knob to nearest step on release
    requestAnimationFrame(() => {
      applyAngle(indexToAngle(lastIndexRef.current));
    });
  }, [applyAngle, indexToAngle]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Keep dial in sync if value changes externally
  useEffect(() => {
    if (!value) return;
    const idx = options.findIndex(o => o.mood === value);
    if (idx >= 0 && idx !== activeIndex) {
      lastIndexRef.current = idx;
      setActiveIndex(idx);
      applyAngle(indexToAngle(idx));
    }
  }, [value, options, activeIndex, applyAngle, indexToAngle]);

  // Set initial knob angle on mount
  useEffect(() => {
    applyAngle(indexToAngle(initialIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeOpt = options[activeIndex];
  const ActiveIcon = moodIcons[activeOpt.mood];
  const activeColorVar = moodColorVars[activeOpt.mood];
  const knobAngle = indexToAngle(activeIndex);

  // Build the SVG arc path background
  const dialSize = 280; // px
  const radius = 116;
  const center = dialSize / 2;

  const polarToXY = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  // Arc from ARC_START to ARC_START + ARC_SWEEP, but for SVG we need start/end relative to 12 o'clock = 0
  const arcStartXY = polarToXY(ARC_START, radius);
  const arcEndXY = polarToXY(ARC_START + ARC_SWEEP, radius);
  const largeArc = ARC_SWEEP > 180 ? 1 : 0;
  const arcPath = `M ${arcStartXY.x} ${arcStartXY.y} A ${radius} ${radius} 0 ${largeArc} 1 ${arcEndXY.x} ${arcEndXY.y}`;

  // Active arc — from start to current angle
  const activeEndXY = polarToXY(knobAngle, radius);
  const activeSweep = knobAngle - ARC_START;
  const activeLargeArc = activeSweep > 180 ? 1 : 0;
  const activeArcPath = `M ${arcStartXY.x} ${arcStartXY.y} A ${radius} ${radius} 0 ${activeLargeArc} 1 ${activeEndXY.x} ${activeEndXY.y}`;

  // Tick marks
  const ticks = useMemo(() => {
    return options.map((opt, i) => {
      const angle = indexToAngle(i);
      const inner = polarToXY(angle, radius - 14);
      const outer = polarToXY(angle, radius + 4);
      return { i, mood: opt.mood, angle, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
    });
  }, [options, indexToAngle]);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Dial */}
      <div
        ref={dialRef}
        className="relative touch-none cursor-grab active:cursor-grabbing"
        style={{ width: dialSize, height: dialSize }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={stepCount - 1}
        aria-valuenow={activeIndex}
        aria-valuetext={activeOpt.label}
      >
        {/* Outer ring with subtle inner shadow — like a metallic dial */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, hsl(var(--card) / 0.9), hsl(var(--background) / 0.4))',
            boxShadow:
              'inset 0 1px 0 hsl(0 0% 100% / 0.05), inset 0 -2px 8px hsl(0 0% 0% / 0.4), 0 8px 32px hsl(0 0% 0% / 0.35)',
            border: '1px solid hsl(var(--border) / 0.3)',
          }}
        />

        <svg
          width={dialSize}
          height={dialSize}
          viewBox={`0 0 ${dialSize} ${dialSize}`}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Background arc track */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--foreground) / 0.08)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Active gradient arc */}
          <defs>
            <linearGradient id="moodArcGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--mood-severe-depressed))" />
              <stop offset="33%" stopColor="hsl(var(--mood-somewhat-depressed))" />
              <stop offset="50%" stopColor="hsl(var(--mood-stable))" />
              <stop offset="66%" stopColor="hsl(var(--mood-somewhat-elevated))" />
              <stop offset="100%" stopColor="hsl(var(--mood-severe-elevated))" />
            </linearGradient>
          </defs>
          <path
            d={activeArcPath}
            fill="none"
            stroke="url(#moodArcGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px hsl(${activeColorVar} / 0.6))`,
              transition: isDragging ? 'none' : 'd 200ms ease-out',
            }}
          />

          {/* Tick marks for each mood */}
          {ticks.map(t => {
            const isActive = t.i === activeIndex;
            return (
              <line
                key={t.mood}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={isActive ? `hsl(${moodColorVars[t.mood]})` : 'hsl(var(--foreground) / 0.25)'}
                strokeWidth={isActive ? 3 : 1.5}
                strokeLinecap="round"
                style={{
                  transition: 'stroke 200ms, stroke-width 200ms',
                }}
              />
            );
          })}
        </svg>

        {/* Rotating knob indicator — positioned imperatively for max smoothness */}
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 pointer-events-none will-change-transform"
          style={{
            width: 0,
            height: 0,
            transform: `translate(-50%, -50%) rotate(${knobAngle}deg)`,
            transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
        >
          <div
            className="absolute"
            style={{
              top: -(radius + 2),
              left: -16,
              width: 32,
              height: 32,
              borderRadius: '9999px',
              backgroundColor: `hsl(${activeColorVar})`,
              border: '4px solid hsl(var(--background))',
              boxShadow: `0 4px 18px hsl(${activeColorVar} / 0.55), 0 0 0 4px hsl(${activeColorVar} / 0.12)`,
            }}
          />
        </div>

        {/* Center display — current mood */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div
            key={activeOpt.mood}
            className="flex flex-col items-center gap-2 animate-fade-in"
          >
            <ActiveIcon
              className="w-10 h-10"
              style={{ color: `hsl(${activeColorVar})` }}
            />
            <div className="text-center px-6">
              <div className="text-base font-semibold leading-tight text-foreground">
                {activeOpt.label}
              </div>
              <div className="text-xs leading-tight text-muted-foreground mt-1">
                {activeOpt.sublabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="mt-6 text-xs text-muted-foreground/60 text-center">
        Snurra reglaget för att välja stämning
      </p>
    </div>
  );
}

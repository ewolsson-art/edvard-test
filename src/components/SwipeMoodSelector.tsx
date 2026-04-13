import { useState, useRef, useCallback, useEffect } from 'react';
import { Flame, Zap, Sun, Cloud, CloudRain } from 'lucide-react';
import { MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';

interface SwipeMoodSelectorProps {
  onSelect: (mood: MoodType) => void;
  initialMood?: MoodType;
}

const MOODS: { mood: MoodType; icon: typeof Zap; label: string; sublabel: string; color: string; bgClass: string }[] = [
  { mood: 'elevated', icon: Flame, label: 'Mycket upp', sublabel: 'Rastlös, racing thoughts', color: 'hsl(38, 92%, 50%)', bgClass: 'bg-mood-elevated' },
  { mood: 'somewhat_elevated', icon: Zap, label: 'Upp', sublabel: 'Energisk, positiv', color: 'hsl(45, 85%, 55%)', bgClass: 'bg-mood-somewhat-elevated' },
  { mood: 'stable', icon: Sun, label: 'Stabil', sublabel: 'Balanserad, lugn', color: 'hsl(142, 60%, 45%)', bgClass: 'bg-mood-stable' },
  { mood: 'somewhat_depressed', icon: Cloud, label: 'Låg', sublabel: 'Tung, trött', color: 'hsl(210, 40%, 55%)', bgClass: 'bg-mood-somewhat-depressed' },
  { mood: 'depressed', icon: CloudRain, label: 'Mycket låg', sublabel: 'Väldigt tungt idag', color: 'hsl(220, 30%, 40%)', bgClass: 'bg-mood-depressed' },
];

const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 5;

export function SwipeMoodSelector({ onSelect, initialMood }: SwipeMoodSelectorProps) {
  const initialIndex = initialMood ? MOODS.findIndex(m => m.mood === initialMood) : 2;
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startY = useRef(0);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const snapTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(MOODS.length - 1, index));
    setActiveIndex(clamped);
    setDragOffset(0);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    lastY.current = e.touches[0].clientY;
    velocity.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    velocity.current = currentY - lastY.current;
    lastY.current = currentY;
    setDragOffset(diff);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Calculate which item to snap to based on drag distance + velocity
    const threshold = ITEM_HEIGHT * 0.3;
    let indexChange = 0;
    
    if (Math.abs(dragOffset) > threshold || Math.abs(velocity.current) > 5) {
      indexChange = dragOffset > 0 ? -1 : 1;
      // For large drags, allow multi-step
      if (Math.abs(dragOffset) > ITEM_HEIGHT * 1.2) {
        indexChange = dragOffset > 0 ? -2 : 2;
      }
    }
    
    snapTo(activeIndex + indexChange);
  }, [isDragging, dragOffset, activeIndex, snapTo]);

  // Mouse support for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    lastY.current = e.clientY;
    velocity.current = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - startY.current;
      velocity.current = e.clientY - lastY.current;
      lastY.current = e.clientY;
      setDragOffset(diff);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      const threshold = ITEM_HEIGHT * 0.3;
      let indexChange = 0;
      // Use the dragOffset from the last known state
      const finalOffset = lastY.current - startY.current;
      if (Math.abs(finalOffset) > threshold) {
        indexChange = finalOffset > 0 ? -1 : 1;
        if (Math.abs(finalOffset) > ITEM_HEIGHT * 1.2) {
          indexChange = finalOffset > 0 ? -2 : 2;
        }
      }
      setDragOffset(0);
      setActiveIndex(prev => Math.max(0, Math.min(MOODS.length - 1, prev + indexChange)));
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const activeMood = MOODS[activeIndex];
  const ActiveIcon = activeMood.icon;

  // Auto-confirm after settling
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (isDragging) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      return;
    }
    // Don't auto-confirm, let user tap
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, [isDragging, activeIndex]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hero indicator */}
      <div 
        className="relative flex flex-col items-center transition-all duration-300"
        style={{ transform: isDragging ? 'scale(1.05)' : 'scale(1)' }}
      >
        <div 
          className={cn(
            "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-lg",
            activeMood.bgClass
          )}
          style={{ 
            boxShadow: `0 8px 32px ${activeMood.color}40`,
          }}
        >
          <ActiveIcon className="w-12 h-12 text-white drop-shadow-md" />
        </div>
        <p className="mt-3 text-xl font-bold text-foreground transition-all duration-200">{activeMood.label}</p>
        <p className="text-sm text-muted-foreground/60">{activeMood.sublabel}</p>
      </div>

      {/* Swipe track */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-sm overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
        style={{ height: ITEM_HEIGHT * 3 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Gradient masks */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        {/* Center highlight */}
        <div className="absolute inset-x-4 z-0 rounded-2xl border border-primary/15 bg-primary/[0.04]"
          style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }} 
        />

        {/* Items */}
        <div 
          className="transition-transform"
          style={{ 
            transform: `translateY(${ITEM_HEIGHT - activeIndex * ITEM_HEIGHT + (isDragging ? dragOffset * 0.6 : 0)}px)`,
            transitionDuration: isDragging ? '0ms' : '300ms',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {MOODS.map((m, i) => {
            const distance = Math.abs(i - activeIndex);
            const isActive = i === activeIndex;
            const Icon = m.icon;
            
            return (
              <button
                key={m.mood}
                onClick={() => {
                  snapTo(i);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-5 transition-all duration-300",
                  isActive ? "opacity-100" : distance === 1 ? "opacity-40" : "opacity-15"
                )}
                style={{ height: ITEM_HEIGHT }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                  isActive ? m.bgClass : "bg-muted/30"
                )}>
                  <Icon className={cn(
                    "transition-all duration-300",
                    isActive ? "w-5 h-5 text-white" : "w-4 h-4 text-muted-foreground/50"
                  )} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className={cn(
                    "font-semibold block transition-all duration-300",
                    isActive ? "text-base text-foreground" : "text-sm text-muted-foreground/50"
                  )}>
                    {m.label}
                  </span>
                  {isActive && (
                    <span className="text-xs text-muted-foreground/50 block">{m.sublabel}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Swipe hint */}
      <p className="text-[11px] text-muted-foreground/30 flex items-center gap-1.5">
        <span className="inline-block animate-bounce">↕</span>
        Svep för att välja · tryck för att bekräfta
      </p>

      {/* Confirm button */}
      <button
        onClick={() => onSelect(activeMood.mood)}
        className="px-10 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:shadow-[0_8px_32px_hsl(45_85%_55%/0.5)] hover:bg-[hsl(45_85%_62%)] hover:scale-105 active:scale-[0.98] transition-all duration-200"
      >
        Välj {activeMood.label}
      </button>
    </div>
  );
}
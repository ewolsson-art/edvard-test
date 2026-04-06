import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStreak } from '@/hooks/useStreak';

interface CelebrationAnimationProps {
  className?: string;
}

const CONFETTI_COLORS = [
  'hsl(45 85% 55%)',   // primary gold
  'hsl(160 70% 45%)',  // stable green
  'hsl(38 85% 55%)',   // warm amber
  'hsl(330 80% 65%)',  // pink
  'hsl(260 60% 65%)',  // purple
  'hsl(181 80% 50%)',  // teal
  'hsl(20 90% 60%)',   // coral
];

const EMOJIS = ['🎉', '✨', '💪', '🌟', '⭐', '💛', '🙌', '🎊'];

const MESSAGES = [
  'Snyggt jobbat!',
  'Du är grym!',
  'Bra gjort!',
  'Fantastiskt!',
  'Stark insats!',
  'Imponerande!',
];

const SUB_MESSAGES = [
  'Varje dag räknas',
  'Du bygger bra vanor',
  'Steg för steg framåt',
  'Fortsätt så här',
];

export function CelebrationAnimation({ className }: CelebrationAnimationProps) {
  const [phase, setPhase] = useState(0); // 0: initial, 1: check, 2: text, 3: details
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  const [subMessage] = useState(() => SUB_MESSAGES[Math.floor(Math.random() * SUB_MESSAGES.length)]);
  const [emoji] = useState(() => EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 500);
    const t3 = setTimeout(() => setPhase(3), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={cn("relative flex flex-col items-center justify-center py-12 celebration-container", className)}>
      {/* Confetti burst */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="celebration-confetti"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--drift': `${(Math.random() - 0.5) * 120}px`,
              '--spin': `${Math.random() * 720 - 360}deg`,
              '--delay': `${Math.random() * 0.4}s`,
              '--size': `${6 + Math.random() * 10}px`,
              '--color': CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
              '--shape': Math.random() > 0.5 ? '50%' : '2px',
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Ripple rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="celebration-ring" style={{ '--ring-delay': '0s', '--ring-size': '120px' } as React.CSSProperties} />
        <div className="celebration-ring" style={{ '--ring-delay': '0.15s', '--ring-size': '180px' } as React.CSSProperties} />
        <div className="celebration-ring" style={{ '--ring-delay': '0.3s', '--ring-size': '240px' } as React.CSSProperties} />
      </div>

      {/* Main check icon */}
      <div className={cn(
        "relative z-10 transition-all",
        phase >= 1 ? "celebration-check-enter" : "scale-0 opacity-0"
      )}>
        {/* Glow pulse */}
        <div className="absolute inset-[-16px] bg-mood-stable/20 rounded-full blur-xl celebration-glow" />

        {/* Sparkles */}
        {phase >= 2 && (
          <>
            <Sparkles className="absolute -top-5 -right-5 w-7 h-7 text-primary celebration-sparkle" style={{ '--sparkle-delay': '0s' } as React.CSSProperties} />
            <Sparkles className="absolute -bottom-3 -left-5 w-5 h-5 text-mood-elevated celebration-sparkle" style={{ '--sparkle-delay': '0.15s' } as React.CSSProperties} />
            <Sparkles className="absolute top-1 -left-7 w-4 h-4 text-primary/70 celebration-sparkle" style={{ '--sparkle-delay': '0.3s' } as React.CSSProperties} />
          </>
        )}

        {/* Check circle */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-mood-stable to-mood-stable/80 shadow-[0_0_40px_rgba(34,197,94,0.3)] flex items-center justify-center">
          <Check 
            className={cn(
              "w-12 h-12 md:w-16 md:h-16 text-white transition-all duration-500",
              phase >= 1 ? "celebration-check-draw" : "opacity-0"
            )} 
            strokeWidth={3}
          />
        </div>
      </div>

      {/* Emoji pop */}
      <div className={cn(
        "relative z-10 mt-4 text-4xl transition-all duration-500",
        phase >= 2 ? "celebration-emoji-pop" : "scale-0 opacity-0"
      )}>
        {emoji}
      </div>

      {/* Message */}
      <div className={cn(
        "relative z-10 mt-3 text-center transition-all duration-700",
        phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}>
        <p className="text-2xl md:text-3xl font-bold text-foreground">
          {message}
        </p>
      </div>

      {/* Sub message */}
      <div className={cn(
        "relative z-10 mt-2 text-center transition-all duration-700 delay-200",
        phase >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}>
        <p className="text-sm text-muted-foreground">
          {subMessage}
        </p>
      </div>
    </div>
  );
}

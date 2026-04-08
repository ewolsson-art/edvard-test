import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TurtleLogo } from '@/components/TurtleLogo';

interface CelebrationAnimationProps {
  className?: string;
}

const CONFETTI_COLORS = [
  'hsl(45 85% 55%)',
  'hsl(160 70% 45%)',
  'hsl(38 85% 55%)',
  'hsl(330 80% 65%)',
  'hsl(260 60% 65%)',
  'hsl(181 80% 50%)',
  'hsl(20 90% 60%)',
];

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
  const [phase, setPhase] = useState(0);
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  const [subMessage] = useState(() => SUB_MESSAGES[Math.floor(Math.random() * SUB_MESSAGES.length)]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={cn("relative flex flex-col items-center justify-center py-8 overflow-hidden", className)}>
      {/* Confetti burst */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="celebration-confetti"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--drift': `${(Math.random() - 0.5) * 150}px`,
              '--spin': `${Math.random() * 720 - 360}deg`,
              '--delay': `${Math.random() * 0.6}s`,
              '--size': `${6 + Math.random() * 10}px`,
              '--color': CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
              '--shape': Math.random() > 0.5 ? '50%' : '2px',
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Ripple rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="celebration-ring" style={{ '--ring-delay': '0s', '--ring-size': '140px' } as React.CSSProperties} />
        <div className="celebration-ring" style={{ '--ring-delay': '0.2s', '--ring-size': '220px' } as React.CSSProperties} />
        <div className="celebration-ring" style={{ '--ring-delay': '0.4s', '--ring-size': '300px' } as React.CSSProperties} />
      </div>

      {/* Turtle mascot - bouncing in */}
      <div className={cn(
        "relative z-10 transition-all duration-700",
        phase >= 1 ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-8"
      )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Glow behind turtle */}
        <div className="absolute inset-[-24px] bg-primary/15 rounded-full blur-2xl animate-pulse" />
        
        {/* Floating stars around turtle */}
        {phase >= 2 && (
          <>
            <span className="absolute -top-4 -right-2 text-2xl celebration-star" style={{ '--star-delay': '0s' } as React.CSSProperties}>⭐</span>
            <span className="absolute -top-2 -left-4 text-xl celebration-star" style={{ '--star-delay': '0.15s' } as React.CSSProperties}>✨</span>
            <span className="absolute -bottom-2 -right-4 text-lg celebration-star" style={{ '--star-delay': '0.3s' } as React.CSSProperties}>🌟</span>
            <span className="absolute top-1/2 -left-6 text-base celebration-star" style={{ '--star-delay': '0.45s' } as React.CSSProperties}>💛</span>
          </>
        )}
        
        <TurtleLogo size="hero" animated className="drop-shadow-[0_0_30px_hsl(45_85%_55%/0.3)]" />
      </div>

      {/* Message */}
      <div className={cn(
        "relative z-10 mt-6 text-center transition-all duration-700",
        phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}>
        <p className="text-3xl md:text-4xl font-bold text-foreground font-display">
          {message}
        </p>
      </div>

      {/* Sub message */}
      <div className={cn(
        "relative z-10 mt-3 text-center transition-all duration-700",
        phase >= 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}>
        <p className="text-base text-muted-foreground">
          {subMessage}
        </p>
      </div>
    </div>
  );
}

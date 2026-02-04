import { useEffect, useState } from 'react';
import { Check, Sparkles, Star, Heart, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  type: 'confetti' | 'star' | 'heart' | 'circle';
}

interface CelebrationAnimationProps {
  className?: string;
}

const COLORS = [
  'hsl(210 25% 45%)', // primary
  'hsl(160 84% 39%)', // mood-stable
  'hsl(38 92% 50%)', // mood-elevated
  'hsl(45 100% 51%)', // Gold
  'hsl(330 100% 71%)', // Hot pink
  'hsl(181 100% 41%)', // Cyan
  'hsl(260 55% 65%)', // Purple
  'hsl(9 100% 64%)', // Tomato
];

export function CelebrationAnimation({ className }: CelebrationAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCheck, setShowCheck] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    // Generate confetti particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.random() * 12,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
        type: ['confetti', 'star', 'heart', 'circle'][Math.floor(Math.random() * 4)] as Particle['type'],
      });
    }
    setParticles(newParticles);

    // Show check after a short delay
    setTimeout(() => setShowCheck(true), 200);
    setTimeout(() => setShowSparkle(true), 400);
  }, []);

  const renderParticle = (particle: Particle) => {
    switch (particle.type) {
      case 'star':
        return <Star className="w-full h-full" fill={particle.color} stroke={particle.color} />;
      case 'heart':
        return <Heart className="w-full h-full" fill={particle.color} stroke={particle.color} />;
      case 'circle':
        return <div className="w-full h-full rounded-full" style={{ backgroundColor: particle.color }} />;
      default:
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: particle.color,
              borderRadius: '2px',
            }}
          />
        );
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center py-16", className)}>
      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: `rotate(${particle.rotation}deg)`,
              animationDelay: `${particle.delay}s`,
            }}
          >
            {renderParticle(particle)}
          </div>
        ))}
      </div>

      {/* Burst rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-32 h-32 rounded-full border-4 border-primary/40 animate-burst-ring" style={{ animationDelay: '0s' }} />
        <div className="absolute w-48 h-48 rounded-full border-4 border-mood-stable/30 animate-burst-ring" style={{ animationDelay: '0.15s' }} />
        <div className="absolute w-64 h-64 rounded-full border-4 border-mood-elevated/20 animate-burst-ring" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Main celebration icon */}
      <div className={cn(
        "relative z-10 transition-all duration-500",
        showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
      )}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-mood-stable/30 rounded-full blur-2xl scale-150 animate-pulse" />
        
        {/* Sparkle decorations */}
        {showSparkle && (
          <>
            <Sparkles 
              className="absolute -top-4 -right-4 w-8 h-8 text-mood-elevated animate-sparkle" 
              style={{ animationDelay: '0s' }}
            />
            <Sparkles 
              className="absolute -bottom-2 -left-4 w-6 h-6 text-primary animate-sparkle" 
              style={{ animationDelay: '0.2s' }}
            />
            <Sparkles 
              className="absolute top-0 -left-6 w-5 h-5 text-mood-elevated animate-sparkle" 
              style={{ animationDelay: '0.4s' }}
            />
            <PartyPopper 
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-mood-elevated animate-bounce-slow" 
            />
          </>
        )}

        {/* Main check circle */}
        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-mood-stable via-mood-stable to-mood-stable-light shadow-2xl shadow-mood-stable/40 flex items-center justify-center animate-celebration-pop">
          <Check className="w-14 h-14 md:w-18 md:h-18 text-white drop-shadow-lg animate-check-draw" />
        </div>
      </div>

      {/* Celebration text */}
      <div className={cn(
        "relative z-10 mt-6 text-center transition-all duration-700",
        showSparkle ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}>
        <p className="text-2xl md:text-3xl font-bold text-mood-stable animate-text-glow">
          🎉 Fantastiskt! 🎉
        </p>
      </div>
    </div>
  );
}

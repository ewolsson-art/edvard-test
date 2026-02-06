import { cn } from '@/lib/utils';

interface TurtleLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
  className?: string;
}

export function TurtleLogo({ size = 'md', animated = true, className }: TurtleLogoProps) {
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    hero: 'w-48 h-48 md:w-64 md:h-64',
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg
        viewBox="0 0 300 180"
        className={cn("w-full h-full")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.65)" />
          </linearGradient>
          <linearGradient id="shellPatternGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.4)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.2)" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(160 40% 38%)" />
            <stop offset="100%" stopColor="hsl(160 35% 28%)" />
          </linearGradient>
          <linearGradient id="bellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(50 35% 65%)" />
            <stop offset="100%" stopColor="hsl(45 30% 50%)" />
          </linearGradient>
        </defs>

        {/* === LYING DOWN TURTLE === */}

        {/* Tail */}
        <path
          d="M225 130 Q240 125 248 132"
          stroke="hsl(160 35% 28%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          className={animated ? 'turtle-tail-wag' : ''}
        />

        {/* Back legs */}
        <ellipse cx="210" cy="148" rx="12" ry="8" fill="url(#bodyGrad)" transform="rotate(15 210 148)" />
        <ellipse cx="220" cy="152" rx="6" ry="4" fill="url(#bodyGrad)" />

        {/* Body base */}
        <ellipse cx="150" cy="140" rx="70" ry="18" fill="url(#bodyGrad)" />

        {/* Belly (visible from lying position) */}
        <ellipse cx="140" cy="145" rx="45" ry="10" fill="url(#bellyGrad)" />

        {/* Shell (dome on top) */}
        <ellipse cx="155" cy="120" rx="60" ry="45" fill="url(#shellGrad)" />

        {/* Shell pattern - hexagonal */}
        <path d="M155 82 L172 92 L172 110 L155 120 L138 110 L138 92 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
        <path d="M138 92 L122 100 L122 116 L138 122 L138 110 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M172 92 L188 100 L188 116 L172 122 L172 110 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M155 120 L172 128 L172 142 L155 148 L138 142 L138 128 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />

        {/* Shell shine */}
        <ellipse cx="145" cy="95" rx="14" ry="8" fill="white" opacity="0.12" transform="rotate(-15 145 95)" />

        {/* Front legs */}
        <ellipse cx="92" cy="148" rx="14" ry="8" fill="url(#bodyGrad)" transform="rotate(-10 92 148)" />
        <ellipse cx="80" cy="150" rx="6" ry="4" fill="url(#bodyGrad)" />

        {/* Neck */}
        <ellipse cx="88" cy="120" rx="14" ry="12" fill="url(#bodyGrad)" transform="rotate(15 88 120)" />

        {/* Head - resting on ground, slightly tilted */}
        <g className={animated ? 'turtle-head-bob' : ''}>
          <ellipse cx="65" cy="108" rx="28" ry="25" fill="url(#bodyGrad)" />

          {/* Cheek blush */}
          <ellipse cx="44" cy="114" rx="6" ry="4" fill="hsl(0 65% 80%)" opacity="0.4" />
          <ellipse cx="82" cy="114" rx="6" ry="4" fill="hsl(0 65% 80%)" opacity="0.4" />

          {/* Eyes */}
          <g className={animated ? 'turtle-blink' : ''}>
            {/* Left eye */}
            <ellipse cx="52" cy="102" rx="9" ry="10" fill="white" />
            <ellipse cx="55" cy="103" rx="5" ry="6" fill="hsl(220 35% 25%)" />
            <ellipse cx="56" cy="101" rx="2.5" ry="3" fill="hsl(220 30% 10%)" />
            <circle cx="57" cy="99" r="2" fill="white" />

            {/* Right eye */}
            <ellipse cx="76" cy="102" rx="9" ry="10" fill="white" />
            <ellipse cx="73" cy="103" rx="5" ry="6" fill="hsl(220 35% 25%)" />
            <ellipse cx="72" cy="101" rx="2.5" ry="3" fill="hsl(220 30% 10%)" />
            <circle cx="71" cy="99" r="2" fill="white" />
          </g>

          {/* Nose */}
          <ellipse cx="64" cy="111" rx="2.5" ry="2" fill="hsl(160 40% 30%)" />

          {/* Gentle smile */}
          <path
            d="M52 117 Q58 125 64 125 Q70 125 76 117"
            stroke="hsl(220 20% 25%)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Yellow hat */}
          <path
            d="M37 96 Q42 74 65 68 Q88 74 93 96"
            fill="hsl(45 85% 55%)"
            stroke="hsl(40 80% 45%)"
            strokeWidth="1"
          />
          <ellipse cx="65" cy="96" rx="30" ry="4.5" fill="hsl(40 80% 48%)" />
          <ellipse cx="58" cy="82" rx="8" ry="3.5" fill="white" opacity="0.25" transform="rotate(-10 58 82)" />
        </g>
      </svg>
    </div>
  );
}

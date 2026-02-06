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
        viewBox="0 0 200 260"
        className={cn("w-full h-full", animated && "turtle-idle")}
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

        {/* === STANDING TURTLE === */}

        {/* Left arm waving */}
        <g className={animated ? 'turtle-wave' : ''}>
          <ellipse cx="58" cy="145" rx="14" ry="10" fill="url(#bodyGrad)" transform="rotate(-30 58 145)" />
          <circle cx="47" cy="137" r="5" fill="url(#bodyGrad)" />
        </g>

        {/* Right arm */}
        <ellipse cx="142" cy="148" rx="14" ry="10" fill="url(#bodyGrad)" transform="rotate(20 142 148)" />
        <circle cx="153" cy="143" r="5" fill="url(#bodyGrad)" />

        {/* Left foot */}
        <ellipse cx="80" cy="240" rx="16" ry="8" fill="url(#bodyGrad)" />
        {/* Right foot */}
        <ellipse cx="120" cy="240" rx="16" ry="8" fill="url(#bodyGrad)" />

        {/* Left leg */}
        <rect x="72" y="215" width="16" height="28" rx="8" fill="url(#bodyGrad)" />
        {/* Right leg */}
        <rect x="112" y="215" width="16" height="28" rx="8" fill="url(#bodyGrad)" />

        {/* Shell */}
        <ellipse cx="100" cy="155" rx="48" ry="55" fill="url(#shellGrad)" />

        {/* Shell pattern */}
        <path d="M100 108 L118 120 L118 140 L100 152 L82 140 L82 120 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
        <path d="M82 120 L65 130 L65 148 L82 156 L82 140 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M118 120 L135 130 L135 148 L118 156 L118 140 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M100 152 L118 160 L118 178 L100 188 L82 178 L82 160 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />

        {/* Shell shine */}
        <ellipse cx="90" cy="125" rx="12" ry="8" fill="white" opacity="0.12" transform="rotate(-20 90 125)" />

        {/* Belly */}
        <ellipse cx="100" cy="175" rx="30" ry="42" fill="url(#bellyGrad)" />

        {/* Tail */}
        <path
          d="M100 210 C95 218, 88 220, 85 215"
          stroke="hsl(160 35% 28%)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          className={animated ? 'turtle-tail-wag' : ''}
        />

        {/* Head */}
        <g className={animated ? 'turtle-head-bob' : ''}>
          {/* Neck */}
          <rect x="88" y="90" width="24" height="22" rx="12" fill="url(#bodyGrad)" />
          
          {/* Head shape */}
          <ellipse cx="100" cy="65" rx="32" ry="30" fill="url(#bodyGrad)" />
          
          {/* Cheek blush */}
          <ellipse cx="75" cy="72" rx="7" ry="5" fill="hsl(0 65% 80%)" opacity="0.45" />
          <ellipse cx="125" cy="72" rx="7" ry="5" fill="hsl(0 65% 80%)" opacity="0.45" />

          {/* Eyes */}
          <g className={animated ? 'turtle-blink' : ''}>
            <ellipse cx="86" cy="58" rx="11" ry="12" fill="white" />
            <ellipse cx="89" cy="59" rx="6" ry="7" fill="hsl(220 35% 25%)" />
            <ellipse cx="90" cy="58" rx="3" ry="3.5" fill="hsl(220 30% 10%)" />
            <circle cx="92" cy="55" r="2.5" fill="white" />
            
            <ellipse cx="114" cy="58" rx="11" ry="12" fill="white" />
            <ellipse cx="111" cy="59" rx="6" ry="7" fill="hsl(220 35% 25%)" />
            <ellipse cx="110" cy="58" rx="3" ry="3.5" fill="hsl(220 30% 10%)" />
            <circle cx="108" cy="55" r="2.5" fill="white" />
          </g>

          {/* Nose */}
          <ellipse cx="100" cy="68" rx="3" ry="2.5" fill="hsl(160 40% 30%)" />

          {/* Smile */}
          <path
            d="M85 76 Q92 86 100 86 Q108 86 115 76"
            stroke="hsl(220 20% 25%)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Yellow hat */}
          <path
            d="M68 52 Q72 28 100 22 Q128 28 132 52"
            fill="hsl(45 85% 55%)"
            stroke="hsl(40 80% 45%)"
            strokeWidth="1"
          />
          <ellipse cx="100" cy="52" rx="35" ry="5" fill="hsl(40 80% 48%)" />
          <ellipse cx="92" cy="38" rx="10" ry="4" fill="white" opacity="0.25" transform="rotate(-10 92 38)" />
        </g>
      </svg>
    </div>
  );
}

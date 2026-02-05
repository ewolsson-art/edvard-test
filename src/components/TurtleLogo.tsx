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
        viewBox="0 0 200 200"
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
            <stop offset="0%" stopColor="hsl(160 50% 55%)" />
            <stop offset="100%" stopColor="hsl(160 45% 42%)" />
          </linearGradient>
        </defs>

        {/* Tail */}
        <path
          d="M42 125 C30 128, 24 122, 28 116"
          stroke="hsl(160 45% 45%)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          className={animated ? 'turtle-tail-wag' : ''}
        />

        {/* Back left leg */}
        <ellipse cx="62" cy="140" rx="12" ry="18" fill="url(#bodyGrad)" transform="rotate(-15 62 140)"
          className={animated ? 'turtle-leg-back-left' : ''} />

        {/* Back right leg */}
        <ellipse cx="138" cy="140" rx="12" ry="18" fill="url(#bodyGrad)" transform="rotate(15 138 140)"
          className={animated ? 'turtle-leg-back-right' : ''} />

        {/* Front left leg */}
        <ellipse cx="58" cy="105" rx="11" ry="20" fill="url(#bodyGrad)" transform="rotate(-25 58 105)"
          className={animated ? 'turtle-leg-front-left' : ''} />

        {/* Front right leg */}
        <ellipse cx="142" cy="105" rx="11" ry="20" fill="url(#bodyGrad)" transform="rotate(25 142 105)"
          className={animated ? 'turtle-leg-front-right' : ''} />

        {/* Shell body (large dome) */}
        <ellipse cx="100" cy="110" rx="52" ry="38" fill="url(#shellGrad)" />

        {/* Shell pattern - hexagonal shapes */}
        <path d="M100 78 L115 88 L115 102 L100 112 L85 102 L85 88 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
        <path d="M85 88 L70 95 L70 108 L85 115 L85 102 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M115 88 L130 95 L130 108 L115 115 L115 102 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M100 112 L115 118 L115 130 L100 138 L85 130 L85 118 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />

        {/* Shell shine */}
        <ellipse cx="92" cy="90" rx="15" ry="8" fill="white" opacity="0.15" transform="rotate(-15 92 90)" />

        {/* Head */}
        <g className={animated ? 'turtle-head-bob' : ''}>
          {/* Neck */}
          <ellipse cx="152" cy="95" rx="14" ry="10" fill="url(#bodyGrad)" />
          
          {/* Head shape */}
          <ellipse cx="165" cy="85" rx="20" ry="18" fill="url(#bodyGrad)" />
          
          {/* Cheek blush */}
          <ellipse cx="173" cy="92" rx="6" ry="4" fill="hsl(0 60% 75%)" opacity="0.4" />

          {/* Eyes */}
          <g className={animated ? 'turtle-blink' : ''}>
            {/* Left eye white */}
            <ellipse cx="160" cy="80" rx="7" ry="8" fill="white" />
            {/* Left eye iris */}
            <ellipse cx="162" cy="81" rx="4" ry="5" fill="hsl(220 30% 25%)" />
            {/* Left eye pupil */}
            <ellipse cx="163" cy="80" rx="2" ry="2.5" fill="hsl(220 30% 10%)" />
            {/* Left eye shine */}
            <circle cx="164" cy="78" r="1.5" fill="white" />
            
            {/* Right eye white */}
            <ellipse cx="174" cy="78" rx="6" ry="7" fill="white" />
            {/* Right eye iris */}
            <ellipse cx="175" cy="79" rx="3.5" ry="4.5" fill="hsl(220 30% 25%)" />
            {/* Right eye pupil */}
            <ellipse cx="176" cy="78" rx="1.8" ry="2.2" fill="hsl(220 30% 10%)" />
            {/* Right eye shine */}
            <circle cx="177" cy="76" r="1.3" fill="white" />
          </g>

          {/* Wise little smile */}
          <path
            d="M162 92 Q168 97 175 92"
            stroke="hsl(220 20% 30%)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tiny glasses (wise look) */}
          <circle cx="160" cy="80" r="9" stroke="hsl(220 15% 40%)" strokeWidth="1.5" fill="none" opacity="0.5" />
          <circle cx="174" cy="78" r="8" stroke="hsl(220 15% 40%)" strokeWidth="1.5" fill="none" opacity="0.5" />
          <line x1="169" y1="79" x2="166" y2="80" stroke="hsl(220 15% 40%)" strokeWidth="1.5" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

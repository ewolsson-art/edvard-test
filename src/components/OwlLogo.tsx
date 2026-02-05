import { cn } from '@/lib/utils';

interface OwlLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
  className?: string;
}

export function OwlLogo({ size = 'md', animated = true, className }: OwlLogoProps) {
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    hero: 'w-56 h-56 md:w-72 md:h-72',
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg
        viewBox="0 0 200 230"
        className={cn("w-full h-full", animated && "owl-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="owlBodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(30 40% 55%)" />
            <stop offset="100%" stopColor="hsl(28 38% 42%)" />
          </linearGradient>
          <linearGradient id="owlBellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(42 60% 88%)" />
            <stop offset="100%" stopColor="hsl(38 50% 78%)" />
          </linearGradient>
          <linearGradient id="owlWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(28 38% 48%)" />
            <stop offset="100%" stopColor="hsl(25 35% 36%)" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(30 70% 50%)" />
            <stop offset="100%" stopColor="hsl(25 60% 35%)" />
          </radialGradient>
        </defs>

        {/* === Left wing tucked in */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M42 120 Q32 142 38 168 Q44 176 58 170 Q62 154 58 125 Z"
            fill="url(#owlWingGrad)" />
          <path d="M45 138 Q51 142 57 137" stroke="hsl(25 30% 30%)" strokeWidth="1" opacity="0.3" fill="none" />
          <path d="M43 150 Q50 155 57 150" stroke="hsl(25 30% 30%)" strokeWidth="1" opacity="0.3" fill="none" />
        </g>

        {/* === Right wing tucked in */}
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M158 120 Q168 142 162 168 Q156 176 142 170 Q138 154 142 125 Z"
            fill="url(#owlWingGrad)" />
          <path d="M155 138 Q149 142 143 137" stroke="hsl(25 30% 30%)" strokeWidth="1" opacity="0.3" fill="none" />
          <path d="M157 150 Q150 155 143 150" stroke="hsl(25 30% 30%)" strokeWidth="1" opacity="0.3" fill="none" />
        </g>

        {/* === Chubby round body */}
        <ellipse cx="100" cy="148" rx="46" ry="55" fill="url(#owlBodyGrad)" />

        {/* Soft fluffy belly */}
        <ellipse cx="100" cy="162" rx="32" ry="40" fill="url(#owlBellyGrad)" />
        {/* Belly feather pattern - soft V shapes */}
        <path d="M90 148 L100 153 L110 148" stroke="hsl(35 40% 70%)" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M88 158 L100 163 L112 158" stroke="hsl(35 40% 70%)" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M89 168 L100 173 L111 168" stroke="hsl(35 40% 70%)" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M90 178 L100 183 L110 178" stroke="hsl(35 40% 70%)" strokeWidth="1" fill="none" opacity="0.4" />

        {/* === Big round head */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          <ellipse cx="100" cy="82" rx="42" ry="38" fill="url(#owlBodyGrad)" />

          {/* Soft ear tufts - rounder, cuter */}
          <ellipse cx="66" cy="52" rx="10" ry="16" fill="hsl(28 38% 48%)" transform="rotate(-15 66 52)" />
          <ellipse cx="134" cy="52" rx="10" ry="16" fill="hsl(28 38% 48%)" transform="rotate(15 134 52)" />
          {/* Inner ear tuft highlight */}
          <ellipse cx="67" cy="53" rx="6" ry="10" fill="hsl(30 42% 58%)" transform="rotate(-15 67 53)" />
          <ellipse cx="133" cy="53" rx="6" ry="10" fill="hsl(30 42% 58%)" transform="rotate(15 133 53)" />

          {/* Facial disc - heart shaped / soft */}
          <path d="M100 60 Q70 62 62 85 Q66 108 100 112 Q134 108 138 85 Q130 62 100 60 Z"
            fill="hsl(38 45% 72%)" opacity="0.5" />

          {/* === BIG kind eyes === */}
          {/* Eye backgrounds - large and round */}
          <circle cx="80" cy="80" r="18" fill="hsl(35 35% 55%)" />
          <circle cx="120" cy="80" r="18" fill="hsl(35 35% 55%)" />

          <g className={animated ? 'owl-blink' : ''}>
            {/* Left eye */}
            <circle cx="80" cy="80" r="15" fill="white" />
            <circle cx="80" cy="80" r="11" fill="url(#eyeGlow)" />
            <circle cx="80" cy="81" r="6" fill="hsl(20 18% 15%)" />
            {/* Big sparkly highlights - makes eyes look kind */}
            <circle cx="85" cy="75" r="4" fill="white" opacity="0.95" />
            <circle cx="76" cy="84" r="2" fill="white" opacity="0.6" />
            {/* Slight upward curve on lower eyelid for smiling eyes */}
            <path d="M67 86 Q74 90 80 90 Q86 90 93 86"
              fill="url(#owlBodyGrad)" opacity="0.15" />

            {/* Right eye */}
            <circle cx="120" cy="80" r="15" fill="white" />
            <circle cx="120" cy="80" r="11" fill="url(#eyeGlow)" />
            <circle cx="120" cy="81" r="6" fill="hsl(20 18% 15%)" />
            <circle cx="125" cy="75" r="4" fill="white" opacity="0.95" />
            <circle cx="116" cy="84" r="2" fill="white" opacity="0.6" />
            <path d="M107 86 Q114 90 120 90 Q126 90 133 86"
              fill="url(#owlBodyGrad)" opacity="0.15" />
          </g>

          {/* Small cute beak */}
          <path d="M96 95 L100 103 L104 95 Z" fill="hsl(42 70% 58%)" />
          <path d="M97 95 L100 100 L103 95 Z" fill="hsl(45 75% 68%)" />

          {/* Big warm smile */}
          <path
            d="M88 106 Q94 114 100 114 Q106 114 112 106"
            stroke="hsl(25 35% 35%)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Rosy cheeks - bigger and warmer */}
          <ellipse cx="66" cy="94" rx="8" ry="5" fill="hsl(350 55% 75%)" opacity="0.5" />
          <ellipse cx="134" cy="94" rx="8" ry="5" fill="hsl(350 55% 75%)" opacity="0.5" />

          {/* Small round glasses - wise but friendly */}
          <circle cx="80" cy="80" r="17" stroke="hsl(220 15% 50%)" strokeWidth="1.5" fill="none" opacity="0.35" />
          <circle cx="120" cy="80" r="17" stroke="hsl(220 15% 50%)" strokeWidth="1.5" fill="none" opacity="0.35" />
          <line x1="97" y1="80" x2="103" y2="80" stroke="hsl(220 15% 50%)" strokeWidth="1.5" opacity="0.35" />
          {/* Glasses arms */}
          <line x1="63" y1="78" x2="58" y2="72" stroke="hsl(220 15% 50%)" strokeWidth="1.3" opacity="0.3" />
          <line x1="137" y1="78" x2="142" y2="72" stroke="hsl(220 15% 50%)" strokeWidth="1.3" opacity="0.3" />

          {/* Tiny book in wing (smart detail) - only in hero */}
          <rect x="52" y="155" width="12" height="16" rx="1.5" fill="hsl(var(--primary))" opacity="0.7" transform="rotate(-15 58 163)" />
          <line x1="55" y1="158" x2="62" y2="156" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.8" />
          <line x1="54" y1="162" x2="61" y2="160" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.8" />
        </g>

        {/* Feet */}
        <g>
          <path d="M80 200 L72 210 M80 200 L80 212 M80 200 L88 210"
            stroke="hsl(38 55% 50%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M120 200 L112 210 M120 200 L120 212 M120 200 L128 210"
            stroke="hsl(38 55% 50%)" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Branch */}
        <path d="M15 214 Q60 206 100 212 Q140 218 185 210"
          stroke="hsl(25 40% 28%)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M160 212 Q172 202 178 196" stroke="hsl(25 40% 28%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <ellipse cx="180" cy="193" rx="5" ry="8" fill="hsl(140 40% 35%)" transform="rotate(-25 180 193)" />
        <path d="M30 212 Q20 204 16 198" stroke="hsl(25 40% 28%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="14" cy="195" rx="4" ry="7" fill="hsl(140 40% 35%)" transform="rotate(20 14 195)" />
      </svg>
    </div>
  );
}

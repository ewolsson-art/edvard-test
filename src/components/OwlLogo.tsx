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
        viewBox="0 0 200 220"
        className={cn("w-full h-full", animated && "owl-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="owlBodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 45% 42%)" />
            <stop offset="100%" stopColor="hsl(25 40% 32%)" />
          </linearGradient>
          <linearGradient id="owlBellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(40 55% 80%)" />
            <stop offset="100%" stopColor="hsl(35 45% 70%)" />
          </linearGradient>
          <linearGradient id="owlWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 40% 38%)" />
            <stop offset="100%" stopColor="hsl(25 35% 28%)" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45 90% 65%)" />
            <stop offset="100%" stopColor="hsl(35 80% 45%)" />
          </radialGradient>
        </defs>

        {/* === Left wing */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M38 110 Q30 130 35 160 Q40 170 55 165 Q60 150 58 120 Z"
            fill="url(#owlWingGrad)" />
          {/* Wing feather lines */}
          <path d="M42 130 Q48 135 55 130" stroke="hsl(25 30% 25%)" strokeWidth="1" opacity="0.4" fill="none" />
          <path d="M40 142 Q47 148 55 142" stroke="hsl(25 30% 25%)" strokeWidth="1" opacity="0.4" fill="none" />
          <path d="M38 154 Q45 160 54 155" stroke="hsl(25 30% 25%)" strokeWidth="1" opacity="0.4" fill="none" />
        </g>

        {/* === Right wing */}
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M162 110 Q170 130 165 160 Q160 170 145 165 Q140 150 142 120 Z"
            fill="url(#owlWingGrad)" />
          <path d="M158 130 Q152 135 145 130" stroke="hsl(25 30% 25%)" strokeWidth="1" opacity="0.4" fill="none" />
          <path d="M160 142 Q153 148 145 142" stroke="hsl(25 30% 25%)" strokeWidth="1" opacity="0.4" fill="none" />
          <path d="M162 154 Q155 160 146 155" stroke="hsl(25 30% 25%)" strokeWidth="1" opacity="0.4" fill="none" />
        </g>

        {/* === Body */}
        <ellipse cx="100" cy="140" rx="42" ry="52" fill="url(#owlBodyGrad)" />

        {/* Belly pattern */}
        <ellipse cx="100" cy="155" rx="28" ry="35" fill="url(#owlBellyGrad)" />
        {/* Belly feather chevrons */}
        <path d="M88 140 L100 145 L112 140" stroke="hsl(30 35% 60%)" strokeWidth="1.2" fill="none" opacity="0.5" />
        <path d="M86 150 L100 155 L114 150" stroke="hsl(30 35% 60%)" strokeWidth="1.2" fill="none" opacity="0.5" />
        <path d="M87 160 L100 165 L113 160" stroke="hsl(30 35% 60%)" strokeWidth="1.2" fill="none" opacity="0.5" />
        <path d="M89 170 L100 175 L111 170" stroke="hsl(30 35% 60%)" strokeWidth="1.2" fill="none" opacity="0.5" />

        {/* === Head */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          {/* Head shape */}
          <ellipse cx="100" cy="85" rx="38" ry="34" fill="url(#owlBodyGrad)" />

          {/* Ear tufts */}
          <path d="M68 62 L62 38 L78 55 Z" fill="hsl(25 40% 35%)" />
          <path d="M132 62 L138 38 L122 55 Z" fill="hsl(25 40% 35%)" />
          {/* Inner ear tufts */}
          <path d="M70 60 L66 44 L77 56 Z" fill="hsl(25 45% 45%)" />
          <path d="M130 60 L134 44 L123 56 Z" fill="hsl(25 45% 45%)" />

          {/* Facial disc */}
          <ellipse cx="100" cy="88" rx="32" ry="28" fill="hsl(30 40% 50%)" opacity="0.3" />

          {/* Eye area - left */}
          <ellipse cx="82" cy="82" rx="16" ry="16" fill="hsl(30 30% 45%)" />
          {/* Eye area - right */}
          <ellipse cx="118" cy="82" rx="16" ry="16" fill="hsl(30 30% 45%)" />

          {/* Eyes */}
          <g className={animated ? 'owl-blink' : ''}>
            {/* Left eye */}
            <circle cx="82" cy="82" r="12" fill="white" />
            <circle cx="82" cy="82" r="9" fill="url(#eyeGlow)" />
            <circle cx="82" cy="82" r="5" fill="hsl(20 20% 12%)" />
            <circle cx="85" cy="78" r="3" fill="white" opacity="0.9" />
            <circle cx="79" cy="84" r="1.5" fill="white" opacity="0.5" />

            {/* Right eye */}
            <circle cx="118" cy="82" r="12" fill="white" />
            <circle cx="118" cy="82" r="9" fill="url(#eyeGlow)" />
            <circle cx="118" cy="82" r="5" fill="hsl(20 20% 12%)" />
            <circle cx="121" cy="78" r="3" fill="white" opacity="0.9" />
            <circle cx="115" cy="84" r="1.5" fill="white" opacity="0.5" />
          </g>

          {/* Beak */}
          <path d="M95 92 L100 102 L105 92 Z" fill="hsl(40 70% 55%)" />
          <path d="M96 92 L100 98 L104 92 Z" fill="hsl(45 75% 65%)" />

          {/* Cute smile under beak */}
          <path
            d="M92 103 Q96 107 100 107 Q104 107 108 103"
            stroke="hsl(25 35% 30%)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cheek blush */}
          <ellipse cx="70" cy="92" rx="6" ry="4" fill="hsl(350 60% 75%)" opacity="0.45" />
          <ellipse cx="130" cy="92" rx="6" ry="4" fill="hsl(350 60% 75%)" opacity="0.45" />
        </g>

        {/* Feet on branch */}
        <g>
          {/* Left foot */}
          <path d="M82 190 L75 198 M82 190 L82 200 M82 190 L89 198"
            stroke="hsl(35 55% 45%)" strokeWidth="3" strokeLinecap="round" />
          {/* Right foot */}
          <path d="M118 190 L111 198 M118 190 L118 200 M118 190 L125 198"
            stroke="hsl(35 55% 45%)" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Branch */}
        <path d="M20 202 Q60 195 100 200 Q140 205 180 198"
          stroke="hsl(25 40% 28%)" strokeWidth="7" strokeLinecap="round" fill="none" />
        {/* Branch texture */}
        <path d="M40 200 Q45 196 50 200" stroke="hsl(25 30% 22%)" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M130 203 Q135 199 140 203" stroke="hsl(25 30% 22%)" strokeWidth="1.5" fill="none" opacity="0.5" />
        {/* Small twig */}
        <path d="M155 200 Q165 190 170 185" stroke="hsl(25 40% 28%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Leaf on twig */}
        <ellipse cx="172" cy="182" rx="5" ry="8" fill="hsl(140 40% 35%)" transform="rotate(-30 172 182)" />
      </svg>
    </div>
  );
}

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
        viewBox="0 0 200 235"
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

        {/* Big yellow beak */}
          <path d="M93 94 L100 106 L107 94 Z" fill="hsl(45 90% 50%)" />
          <path d="M95 94 L100 103 L105 94 Z" fill="hsl(48 95% 60%)" />

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

          {/* Wise round glasses - prominent */}
          <circle cx="80" cy="80" r="17.5" stroke="hsl(30 20% 35%)" strokeWidth="2.2" fill="none" opacity="0.7" />
          <circle cx="120" cy="80" r="17.5" stroke="hsl(30 20% 35%)" strokeWidth="2.2" fill="none" opacity="0.7" />
          {/* Bridge */}
          <path d="M97 79 Q100 76 103 79" stroke="hsl(30 20% 35%)" strokeWidth="2" fill="none" opacity="0.7" />
          {/* Arms curling around ears */}
          <path d="M63 78 Q56 72 58 64" stroke="hsl(30 20% 35%)" strokeWidth="1.8" fill="none" opacity="0.6" strokeLinecap="round" />
          <path d="M137 78 Q144 72 142 64" stroke="hsl(30 20% 35%)" strokeWidth="1.8" fill="none" opacity="0.6" strokeLinecap="round" />
          {/* Tiny glint on glasses */}
          <path d="M68 72 Q70 70 72 72" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M128 72 Q130 70 132 72" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
        </g>

        {/* === Big old book the owl is reading === */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book body - massive leather-bound tome */}
          <rect x="38" y="168" width="124" height="42" rx="4" fill="hsl(15 45% 28%)" />
          {/* Book spine */}
          <rect x="96" y="165" width="8" height="48" rx="2" fill="hsl(15 50% 22%)" />
          {/* Left page */}
          <rect x="42" y="171" width="52" height="36" rx="2" fill="hsl(42 50% 90%)" />
          {/* Right page */}
          <rect x="106" y="171" width="52" height="36" rx="2" fill="hsl(42 45% 88%)" />
          {/* Text lines on left page */}
          <line x1="48" y1="179" x2="88" y2="179" stroke="hsl(25 20% 60%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="48" y1="184" x2="86" y2="184" stroke="hsl(25 20% 60%)" strokeWidth="0.5" opacity="0.5" />
          <line x1="48" y1="189" x2="89" y2="189" stroke="hsl(25 20% 60%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="48" y1="194" x2="84" y2="194" stroke="hsl(25 20% 60%)" strokeWidth="0.5" opacity="0.4" />
          <line x1="48" y1="199" x2="87" y2="199" stroke="hsl(25 20% 60%)" strokeWidth="0.8" opacity="0.4" />
          {/* Text lines on right page */}
          <line x1="112" y1="179" x2="152" y2="179" stroke="hsl(25 20% 60%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="112" y1="184" x2="150" y2="184" stroke="hsl(25 20% 60%)" strokeWidth="0.5" opacity="0.5" />
          <line x1="112" y1="189" x2="153" y2="189" stroke="hsl(25 20% 60%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="112" y1="194" x2="148" y2="194" stroke="hsl(25 20% 60%)" strokeWidth="0.5" opacity="0.4" />
          <line x1="112" y1="199" x2="151" y2="199" stroke="hsl(25 20% 60%)" strokeWidth="0.8" opacity="0.4" />
          {/* Book corner decorations - gold embossing */}
          <rect x="40" y="169" width="6" height="6" rx="0.5" fill="none" stroke="hsl(42 65% 55%)" strokeWidth="0.8" opacity="0.5" />
          <rect x="154" y="169" width="6" height="6" rx="0.5" fill="none" stroke="hsl(42 65% 55%)" strokeWidth="0.8" opacity="0.5" />
          <rect x="40" y="201" width="6" height="6" rx="0.5" fill="none" stroke="hsl(42 65% 55%)" strokeWidth="0.8" opacity="0.5" />
          <rect x="154" y="201" width="6" height="6" rx="0.5" fill="none" stroke="hsl(42 65% 55%)" strokeWidth="0.8" opacity="0.5" />
          {/* Bookmark ribbon */}
          <path d="M145 168 L145 160 L149 164 L153 160 L153 168" fill="hsl(0 60% 45%)" opacity="0.7" />
        </g>

        {/* Feet peeking behind book */}
        <g>
          <path d="M80 204 L74 212 M80 204 L80 214 M80 204 L86 212"
            stroke="hsl(38 55% 50%)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M120 204 L114 212 M120 204 L120 214 M120 204 L126 212"
            stroke="hsl(38 55% 50%)" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Branch */}
        <path d="M15 218 Q60 210 100 216 Q140 222 185 214"
          stroke="hsl(25 40% 28%)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M160 216 Q172 206 178 200" stroke="hsl(25 40% 28%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <ellipse cx="180" cy="197" rx="5" ry="8" fill="hsl(140 40% 35%)" transform="rotate(-25 180 197)" />
        <path d="M30 216 Q20 208 16 202" stroke="hsl(25 40% 28%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="14" cy="199" rx="4" ry="7" fill="hsl(140 40% 35%)" transform="rotate(20 14 199)" />
      </svg>
    </div>
  );
}

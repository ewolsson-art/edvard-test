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
            <stop offset="0%" stopColor="hsl(25 55% 38%)" />
            <stop offset="100%" stopColor="hsl(22 50% 28%)" />
          </linearGradient>
          <linearGradient id="owlBellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(35 45% 78%)" />
            <stop offset="100%" stopColor="hsl(30 40% 68%)" />
          </linearGradient>
          <linearGradient id="owlWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(22 50% 35%)" />
            <stop offset="100%" stopColor="hsl(20 48% 24%)" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45 95% 55%)" />
            <stop offset="100%" stopColor="hsl(40 85% 42%)" />
          </radialGradient>
        </defs>

        {/* === Left wing tucked in */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M42 120 Q32 142 38 168 Q44 176 58 170 Q62 154 58 125 Z"
            fill="url(#owlWingGrad)" />
          {/* Feather scallops */}
          <path d="M42 135 Q48 140 56 134" stroke="hsl(20 45% 22%)" strokeWidth="1.2" opacity="0.4" fill="none" />
          <path d="M40 148 Q48 154 56 148" stroke="hsl(20 45% 22%)" strokeWidth="1.2" opacity="0.4" fill="none" />
          <path d="M39 160 Q47 166 55 160" stroke="hsl(20 45% 22%)" strokeWidth="1.2" opacity="0.3" fill="none" />
        </g>

        {/* === Right wing tucked in */}
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M158 120 Q168 142 162 168 Q156 176 142 170 Q138 154 142 125 Z"
            fill="url(#owlWingGrad)" />
          <path d="M158 135 Q152 140 144 134" stroke="hsl(20 45% 22%)" strokeWidth="1.2" opacity="0.4" fill="none" />
          <path d="M160 148 Q152 154 144 148" stroke="hsl(20 45% 22%)" strokeWidth="1.2" opacity="0.4" fill="none" />
          <path d="M161 160 Q153 166 145 160" stroke="hsl(20 45% 22%)" strokeWidth="1.2" opacity="0.3" fill="none" />
        </g>

        {/* === Chubby round body */}
        <ellipse cx="100" cy="148" rx="46" ry="55" fill="url(#owlBodyGrad)" />

        {/* Soft fluffy belly with scalloped feathers */}
        <ellipse cx="100" cy="162" rx="32" ry="40" fill="url(#owlBellyGrad)" />
        <path d="M82 145 Q88 150 94 145 Q100 150 106 145 Q112 150 118 145" stroke="hsl(25 40% 35%)" strokeWidth="1.2" fill="none" opacity="0.3" />
        <path d="M80 155 Q87 160 94 155 Q100 160 106 155 Q113 160 120 155" stroke="hsl(25 40% 35%)" strokeWidth="1.2" fill="none" opacity="0.3" />
        <path d="M81 165 Q88 170 95 165 Q100 170 105 165 Q112 170 119 165" stroke="hsl(25 40% 35%)" strokeWidth="1.2" fill="none" opacity="0.25" />
        <path d="M83 175 Q90 180 97 175 Q100 178 103 175 Q110 180 117 175" stroke="hsl(25 40% 35%)" strokeWidth="1" fill="none" opacity="0.2" />

        {/* === Big round head */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          <ellipse cx="100" cy="82" rx="42" ry="38" fill="url(#owlBodyGrad)" />

          {/* Fluffy hair / head tufts - like reference image */}
          {/* Main fluffy top feathers */}
          <path d="M72 55 Q78 30 88 42 Q90 28 100 38 Q110 28 112 42 Q122 30 128 55"
            fill="hsl(22 50% 32%)" />
          <path d="M76 58 Q82 38 90 48 Q95 36 100 44 Q105 36 110 48 Q118 38 124 58"
            fill="hsl(25 52% 36%)" />
          {/* Pointed ear tufts sticking up */}
          <path d="M68 56 Q62 32 72 48" fill="hsl(22 48% 30%)" />
          <path d="M132 56 Q138 32 128 48" fill="hsl(22 48% 30%)" />

          {/* Facial disc - heart shaped / warm */}
          <path d="M100 60 Q70 62 62 85 Q66 108 100 112 Q134 108 138 85 Q130 62 100 60 Z"
            fill="hsl(30 40% 62%)" opacity="0.5" />

          {/* === BIG kind eyes === */}
          {/* Eye backgrounds - large and round */}
          <circle cx="80" cy="80" r="18" fill="hsl(25 30% 40%)" />
          <circle cx="120" cy="80" r="18" fill="hsl(25 30% 40%)" />

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

          {/* Big yellow-orange beak */}
          <path d="M93 94 L100 108 L107 94 Z" fill="hsl(38 90% 50%)" />
          <path d="M95 94 L100 104 L105 94 Z" fill="hsl(42 95% 58%)" />

          {/* Big warm smile */}
          <path
            d="M88 106 Q94 114 100 114 Q106 114 112 106"
            stroke="hsl(25 35% 35%)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Rosy cheeks - bigger and warmer */}
          <ellipse cx="66" cy="96" rx="8" ry="5" fill="hsl(350 55% 72%)" opacity="0.45" />
          <ellipse cx="134" cy="96" rx="8" ry="5" fill="hsl(350 55% 72%)" opacity="0.45" />

          {/* Wise round glasses */}
          <circle cx="80" cy="80" r="17.5" stroke="hsl(25 18% 28%)" strokeWidth="2.2" fill="none" opacity="0.7" />
          <circle cx="120" cy="80" r="17.5" stroke="hsl(25 18% 28%)" strokeWidth="2.2" fill="none" opacity="0.7" />
          <path d="M97 79 Q100 76 103 79" stroke="hsl(25 18% 28%)" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M63 78 Q56 72 58 64" stroke="hsl(25 18% 28%)" strokeWidth="1.8" fill="none" opacity="0.6" strokeLinecap="round" />
          <path d="M137 78 Q144 72 142 64" stroke="hsl(25 18% 28%)" strokeWidth="1.8" fill="none" opacity="0.6" strokeLinecap="round" />
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
          <path d="M80 208 L74 216 M80 208 L80 218 M80 208 L86 216"
            stroke="hsl(38 80% 50%)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M120 208 L114 216 M120 208 L120 218 M120 208 L126 216"
            stroke="hsl(38 80% 50%)" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Branch */}
        <path d="M15 222 Q60 214 100 220 Q140 226 185 218"
          stroke="hsl(20 45% 22%)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M160 220 Q172 210 178 204" stroke="hsl(20 45% 22%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <ellipse cx="180" cy="201" rx="5" ry="8" fill="hsl(140 40% 35%)" transform="rotate(-25 180 201)" />
        <path d="M30 220 Q20 212 16 206" stroke="hsl(20 45% 22%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="14" cy="203" rx="4" ry="7" fill="hsl(140 40% 35%)" transform="rotate(20 14 203)" />
      </svg>
    </div>
  );
}

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
        viewBox="0 0 200 260"
        className={cn("w-full h-full", animated && "owl-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(25 45% 55%)" />
            <stop offset="100%" stopColor="hsl(22 40% 38%)" />
          </radialGradient>
          <radialGradient id="bellyGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="hsl(40 55% 90%)" />
            <stop offset="100%" stopColor="hsl(35 45% 78%)" />
          </radialGradient>
          <radialGradient id="eyeIris" cx="45%" cy="40%" r="50%">
            <stop offset="0%" stopColor="hsl(30 70% 48%)" />
            <stop offset="60%" stopColor="hsl(20 60% 30%)" />
            <stop offset="100%" stopColor="hsl(15 50% 20%)" />
          </radialGradient>
          <linearGradient id="bookCover" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 55% 42%)" />
            <stop offset="100%" stopColor="hsl(0 50% 30%)" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(22 40% 42%)" />
            <stop offset="100%" stopColor="hsl(20 35% 30%)" />
          </linearGradient>
        </defs>

        {/* === EAR TUFTS === */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          {/* Left tuft cluster */}
          <ellipse cx="58" cy="38" rx="12" ry="22" fill="hsl(22 40% 42%)" transform="rotate(-20 58 38)" />
          <ellipse cx="54" cy="34" rx="8" ry="18" fill="hsl(25 42% 48%)" transform="rotate(-25 54 34)" />
          <ellipse cx="62" cy="36" rx="6" ry="16" fill="hsl(28 38% 52%)" transform="rotate(-15 62 36)" />
          {/* Right tuft cluster */}
          <ellipse cx="142" cy="38" rx="12" ry="22" fill="hsl(22 40% 42%)" transform="rotate(20 142 38)" />
          <ellipse cx="146" cy="34" rx="8" ry="18" fill="hsl(25 42% 48%)" transform="rotate(25 146 34)" />
          <ellipse cx="138" cy="36" rx="6" ry="16" fill="hsl(28 38% 52%)" transform="rotate(15 138 36)" />
        </g>

        {/* === BIG ROUND HEAD === */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          <ellipse cx="100" cy="82" rx="50" ry="46" fill="url(#bodyGrad)" />
          
          {/* Face disc - lighter area around eyes */}
          <ellipse cx="100" cy="86" rx="42" ry="38" fill="hsl(35 40% 65%)" opacity="0.45" />

          {/* === BIG ROUND EYES - cartoon style === */}
          {/* Eye whites - very large */}
          <circle cx="76" cy="82" r="20" fill="white" />
          <circle cx="124" cy="82" r="20" fill="white" />
          
          {/* Eye outlines */}
          <circle cx="76" cy="82" r="20" stroke="hsl(22 35% 35%)" strokeWidth="1.5" fill="none" />
          <circle cx="124" cy="82" r="20" stroke="hsl(22 35% 35%)" strokeWidth="1.5" fill="none" />

          <g className={animated ? 'owl-blink' : ''}>
            {/* Iris - large brown */}
            <circle cx="76" cy="84" r="14" fill="url(#eyeIris)" />
            <circle cx="124" cy="84" r="14" fill="url(#eyeIris)" />
            
            {/* Pupils */}
            <circle cx="76" cy="85" r="7" fill="hsl(0 0% 8%)" />
            <circle cx="124" cy="85" r="7" fill="hsl(0 0% 8%)" />
            
            {/* Big sparkly reflections - gives life */}
            <circle cx="82" cy="78" r="5" fill="white" opacity="0.95" />
            <circle cx="130" cy="78" r="5" fill="white" opacity="0.95" />
            <circle cx="72" cy="88" r="2.5" fill="white" opacity="0.6" />
            <circle cx="120" cy="88" r="2.5" fill="white" opacity="0.6" />
          </g>

          {/* === PROMINENT PURPLE GLASSES === */}
          <circle cx="76" cy="82" r="23" stroke="hsl(270 45% 40%)" strokeWidth="4" fill="none" />
          <circle cx="124" cy="82" r="23" stroke="hsl(270 45% 40%)" strokeWidth="4" fill="none" />
          {/* Inner rim highlight */}
          <circle cx="76" cy="82" r="21" stroke="hsl(270 50% 55%)" strokeWidth="1.2" fill="none" opacity="0.5" />
          <circle cx="124" cy="82" r="21" stroke="hsl(270 50% 55%)" strokeWidth="1.2" fill="none" opacity="0.5" />
          {/* Bridge */}
          <path d="M98 80 Q100 74 102 80" stroke="hsl(270 45% 40%)" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Arms going behind head */}
          <path d="M53 80 Q46 72 48 60" stroke="hsl(270 45% 40%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M147 80 Q154 72 152 60" stroke="hsl(270 45% 40%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Lens glint */}
          <path d="M62 74 Q65 70 69 74" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M131 74 Q134 70 137 74" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />

          {/* Orange beak - triangular */}
          <path d="M93 100 L100 112 L107 100 Z" fill="hsl(35 85% 55%)" />
          <path d="M95 100 L100 108 L105 100 Z" fill="hsl(40 90% 65%)" />
          
          {/* Nostrils */}
          <circle cx="97" cy="103" r="1" fill="hsl(30 60% 45%)" opacity="0.4" />
          <circle cx="103" cy="103" r="1" fill="hsl(30 60% 45%)" opacity="0.4" />

          {/* Warm smile */}
          <path d="M90 114 Q95 120 100 120 Q105 120 110 114"
            stroke="hsl(22 35% 32%)" strokeWidth="2" strokeLinecap="round" fill="none" />
          
          {/* Rosy cheeks */}
          <ellipse cx="58" cy="98" rx="8" ry="5" fill="hsl(350 55% 75%)" opacity="0.4" />
          <ellipse cx="142" cy="98" rx="8" ry="5" fill="hsl(350 55% 75%)" opacity="0.4" />
        </g>

        {/* === ROUND CHUBBY BODY === */}
        <ellipse cx="100" cy="160" rx="52" ry="56" fill="url(#bodyGrad)" />
        
        {/* Lighter fluffy belly */}
        <ellipse cx="100" cy="168" rx="36" ry="42" fill="url(#bellyGrad)" />
        {/* Belly feather fluff marks */}
        <path d="M85 152 Q92 148 100 152 Q108 148 115 152" stroke="hsl(35 35% 72%)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M83 162 Q92 158 100 162 Q108 158 117 162" stroke="hsl(35 35% 72%)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M84 172 Q92 168 100 172 Q108 168 116 172" stroke="hsl(35 35% 72%)" strokeWidth="1" fill="none" opacity="0.4" />

        {/* === WINGS HOLDING BOOK === */}
        {/* Left wing - wrapping around left side of book */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M48 130 Q30 148 32 174 Q34 186 46 184 L54 170 Q46 155 52 138 Z"
            fill="url(#wingGrad)" />
          {/* Feather lines */}
          <path d="M38 155 Q44 160 50 155" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M36 165 Q43 170 50 165" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          {/* Wing tip gripping */}
          <ellipse cx="48" cy="180" rx="5" ry="4" fill="hsl(22 38% 36%)" />
        </g>
        
        {/* Right wing */}
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M152 130 Q170 148 168 174 Q166 186 154 184 L146 170 Q154 155 148 138 Z"
            fill="url(#wingGrad)" />
          <path d="M162 155 Q156 160 150 155" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M164 165 Q157 170 150 165" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <ellipse cx="152" cy="180" rx="5" ry="4" fill="hsl(22 38% 36%)" />
        </g>

        {/* === BIG RED BOOK === */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book back / thickness */}
          <rect x="44" y="172" width="112" height="44" rx="4" fill="hsl(0 45% 28%)" />
          
          {/* Book cover - rich red */}
          <rect x="44" y="170" width="112" height="42" rx="4" fill="url(#bookCover)" />
          
          {/* Book spine */}
          <rect x="96" y="168" width="8" height="46" rx="2" fill="hsl(0 50% 25%)" />
          {/* Spine gold bands */}
          <rect x="97" y="174" width="6" height="2" rx="1" fill="hsl(42 70% 55%)" opacity="0.6" />
          <rect x="97" y="182" width="6" height="2" rx="1" fill="hsl(42 70% 55%)" opacity="0.6" />
          <rect x="97" y="200" width="6" height="2" rx="1" fill="hsl(42 70% 55%)" opacity="0.6" />
          
          {/* Pages - yellowed parchment */}
          <rect x="48" y="174" width="46" height="34" rx="2" fill="hsl(42 50% 92%)" />
          <rect x="106" y="174" width="46" height="34" rx="2" fill="hsl(42 45% 89%)" />
          
          {/* Page curl effect */}
          <path d="M94 174 Q96 178 94 182" stroke="hsl(35 30% 75%)" strokeWidth="0.5" fill="none" />
          <path d="M106 174 Q104 178 106 182" stroke="hsl(35 30% 75%)" strokeWidth="0.5" fill="none" />
          
          {/* Text lines - left page */}
          <line x1="53" y1="180" x2="89" y2="180" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="53" y1="184" x2="87" y2="184" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="53" y1="188" x2="90" y2="188" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="53" y1="192" x2="84" y2="192" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="53" y1="196" x2="88" y2="196" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="53" y1="200" x2="82" y2="200" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.25" />
          {/* Text lines - right page */}
          <line x1="111" y1="180" x2="147" y2="180" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="111" y1="184" x2="145" y2="184" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="111" y1="188" x2="148" y2="188" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="111" y1="192" x2="142" y2="192" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="111" y1="196" x2="146" y2="196" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="111" y1="200" x2="140" y2="200" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.25" />

          {/* Gold corner embossing on cover edges */}
          <path d="M46 172 L46 178 M46 172 L52 172" stroke="hsl(42 70% 55%)" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
          <path d="M154 172 L154 178 M154 172 L148 172" stroke="hsl(42 70% 55%)" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
          <path d="M46 210 L46 204 M46 210 L52 210" stroke="hsl(42 70% 55%)" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
          <path d="M154 210 L154 204 M154 210 L148 210" stroke="hsl(42 70% 55%)" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
          
          {/* Bookmark ribbon */}
          <path d="M138 168 L138 158 L141 162 L144 158 L144 168" fill="hsl(45 80% 50%)" opacity="0.8" />
        </g>

        {/* === FEET / TALONS === */}
        <g>
          {/* Left foot */}
          <path d="M78 214 L70 226 M78 214 L78 228 M78 214 L86 226"
            stroke="hsl(38 70% 50%)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Right foot */}
          <path d="M122 214 L114 226 M122 214 L122 228 M122 214 L130 226"
            stroke="hsl(38 70% 50%)" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

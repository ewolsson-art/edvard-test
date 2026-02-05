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
        viewBox="0 0 220 300"
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

        {/* === FLUFFY HAIR / HEAD FEATHERS === */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          {/* Big fluffy hair tuft cluster on top */}
          <ellipse cx="80" cy="28" rx="14" ry="20" fill="hsl(22 42% 44%)" transform="rotate(-25 80 28)" />
          <ellipse cx="110" cy="24" rx="12" ry="22" fill="hsl(25 44% 48%)" transform="rotate(5 110 24)" />
          <ellipse cx="95" cy="22" rx="16" ry="24" fill="hsl(24 40% 42%)" transform="rotate(-8 95 22)" />
          <ellipse cx="125" cy="30" rx="13" ry="18" fill="hsl(22 38% 40%)" transform="rotate(20 125 30)" />
          <ellipse cx="70" cy="34" rx="10" ry="16" fill="hsl(25 40% 46%)" transform="rotate(-30 70 34)" />
          <ellipse cx="135" cy="36" rx="10" ry="14" fill="hsl(25 40% 46%)" transform="rotate(28 135 36)" />
          {/* Lighter hair highlights */}
          <ellipse cx="90" cy="20" rx="8" ry="14" fill="hsl(28 45% 55%)" transform="rotate(-12 90 20)" opacity="0.6" />
          <ellipse cx="115" cy="22" rx="7" ry="12" fill="hsl(28 45% 55%)" transform="rotate(10 115 22)" opacity="0.6" />
          <ellipse cx="100" cy="18" rx="10" ry="16" fill="hsl(30 42% 52%)" transform="rotate(0 100 18)" opacity="0.5" />
          
          {/* Ear tufts - sticking out from hair */}
          <ellipse cx="56" cy="42" rx="10" ry="20" fill="hsl(22 40% 42%)" transform="rotate(-22 56 42)" />
          <ellipse cx="58" cy="40" rx="6" ry="14" fill="hsl(28 42% 52%)" transform="rotate(-22 58 40)" />
          <ellipse cx="144" cy="42" rx="10" ry="20" fill="hsl(22 40% 42%)" transform="rotate(22 144 42)" />
          <ellipse cx="142" cy="40" rx="6" ry="14" fill="hsl(28 42% 52%)" transform="rotate(22 142 40)" />
        </g>

        {/* === BIG ROUND HEAD === */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          <ellipse cx="100" cy="82" rx="52" ry="48" fill="url(#bodyGrad)" />
          
          {/* Face disc */}
          <ellipse cx="100" cy="86" rx="44" ry="40" fill="hsl(35 40% 65%)" opacity="0.45" />

          {/* === BIG ROUND EYES === */}
          <circle cx="76" cy="82" r="22" fill="white" />
          <circle cx="124" cy="82" r="22" fill="white" />
          <circle cx="76" cy="82" r="22" stroke="hsl(22 35% 35%)" strokeWidth="1.5" fill="none" />
          <circle cx="124" cy="82" r="22" stroke="hsl(22 35% 35%)" strokeWidth="1.5" fill="none" />

          <g className={animated ? 'owl-blink' : ''}>
            <circle cx="76" cy="84" r="15" fill="url(#eyeIris)" />
            <circle cx="124" cy="84" r="15" fill="url(#eyeIris)" />
            <circle cx="76" cy="85" r="8" fill="hsl(0 0% 8%)" />
            <circle cx="124" cy="85" r="8" fill="hsl(0 0% 8%)" />
            {/* Sparkly reflections */}
            <circle cx="83" cy="78" r="5.5" fill="white" opacity="0.95" />
            <circle cx="131" cy="78" r="5.5" fill="white" opacity="0.95" />
            <circle cx="72" cy="89" r="2.5" fill="white" opacity="0.6" />
            <circle cx="120" cy="89" r="2.5" fill="white" opacity="0.6" />
          </g>

          {/* === RED GLASSES - bold and prominent === */}
          <circle cx="76" cy="82" r="25" stroke="hsl(0 65% 40%)" strokeWidth="4.5" fill="none" />
          <circle cx="124" cy="82" r="25" stroke="hsl(0 65% 40%)" strokeWidth="4.5" fill="none" />
          {/* Inner rim - lighter red */}
          <circle cx="76" cy="82" r="23" stroke="hsl(0 55% 55%)" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="124" cy="82" r="23" stroke="hsl(0 55% 55%)" strokeWidth="1" fill="none" opacity="0.4" />
          {/* Bridge */}
          <path d="M100 76 Q100 68 100 76" stroke="hsl(0 65% 40%)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <line x1="98" y1="74" x2="102" y2="74" stroke="hsl(0 65% 40%)" strokeWidth="4.5" strokeLinecap="round" />
          {/* Arms wrapping behind ears */}
          <path d="M51 80 Q42 68 46 54" stroke="hsl(0 65% 40%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M149 80 Q158 68 154 54" stroke="hsl(0 65% 40%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Lens glint */}
          <path d="M58 72 Q62 66 67 72" stroke="white" strokeWidth="1.8" fill="none" opacity="0.4" />
          <path d="M133 72 Q137 66 141 72" stroke="white" strokeWidth="1.8" fill="none" opacity="0.4" />

          {/* Orange beak */}
          <path d="M93 102 L100 115 L107 102 Z" fill="hsl(35 85% 55%)" />
          <path d="M95 102 L100 111 L105 102 Z" fill="hsl(40 90% 65%)" />
          <circle cx="97" cy="105" r="1" fill="hsl(30 60% 45%)" opacity="0.4" />
          <circle cx="103" cy="105" r="1" fill="hsl(30 60% 45%)" opacity="0.4" />

          {/* Warm smile */}
          <path d="M90 118 Q95 125 100 125 Q105 125 110 118"
            stroke="hsl(22 35% 32%)" strokeWidth="2" strokeLinecap="round" fill="none" />
          
          {/* Rosy cheeks */}
          <ellipse cx="56" cy="100" rx="8" ry="5" fill="hsl(350 55% 75%)" opacity="0.45" />
          <ellipse cx="144" cy="100" rx="8" ry="5" fill="hsl(350 55% 75%)" opacity="0.45" />
        </g>

        {/* === ROUND CHUBBY BODY === */}
        <ellipse cx="100" cy="162" rx="54" ry="58" fill="url(#bodyGrad)" />
        
        {/* Fluffy belly */}
        <ellipse cx="100" cy="170" rx="38" ry="44" fill="url(#bellyGrad)" />
        <path d="M82 154 Q92 150 100 154 Q108 150 118 154" stroke="hsl(35 35% 72%)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M80 164 Q92 160 100 164 Q108 160 120 164" stroke="hsl(35 35% 72%)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M81 174 Q92 170 100 174 Q108 170 119 174" stroke="hsl(35 35% 72%)" strokeWidth="1" fill="none" opacity="0.4" />

        {/* === WINGS HOLDING BIG BOOK === */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M46 130 Q24 150 22 182 Q24 198 38 196 L48 178 Q38 158 48 138 Z"
            fill="url(#wingGrad)" />
          <path d="M30 158 Q38 164 46 158" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M28 170 Q37 176 46 170" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M26 180 Q36 186 46 180" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          {/* Wing tip gripping book */}
          <ellipse cx="40" cy="192" rx="6" ry="5" fill="hsl(22 38% 36%)" />
        </g>
        
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M154 130 Q176 150 178 182 Q176 198 162 196 L152 178 Q162 158 152 138 Z"
            fill="url(#wingGrad)" />
          <path d="M170 158 Q162 164 154 158" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M172 170 Q163 176 154 170" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M174 180 Q164 186 154 180" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
          <ellipse cx="160" cy="192" rx="6" ry="5" fill="hsl(22 38% 36%)" />
        </g>

        {/* === BIG RED BOOK === */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book thickness/shadow */}
          <rect x="28" y="182" width="144" height="58" rx="5" fill="hsl(0 45% 25%)" />
          
          {/* Book cover - rich red */}
          <rect x="28" y="180" width="144" height="56" rx="5" fill="url(#bookCover)" />
          
          {/* Book spine - thick center */}
          <rect x="95" y="177" width="10" height="62" rx="3" fill="hsl(0 50% 22%)" />
          {/* Spine gold bands */}
          <rect x="96" y="184" width="8" height="3" rx="1" fill="hsl(42 70% 55%)" opacity="0.6" />
          <rect x="96" y="194" width="8" height="3" rx="1" fill="hsl(42 70% 55%)" opacity="0.6" />
          <rect x="96" y="204" width="8" height="3" rx="1" fill="hsl(42 70% 55%)" opacity="0.6" />
          <rect x="96" y="224" width="8" height="3" rx="1" fill="hsl(42 70% 55%)" opacity="0.6" />
          
          {/* Left page - aged parchment */}
          <rect x="33" y="184" width="60" height="48" rx="2" fill="hsl(42 50% 92%)" />
          {/* Right page */}
          <rect x="107" y="184" width="60" height="48" rx="2" fill="hsl(42 45% 89%)" />
          
          {/* Page curl shadows */}
          <path d="M93 184 Q95 190 93 196" stroke="hsl(35 25% 78%)" strokeWidth="0.6" fill="none" />
          <path d="M107 184 Q105 190 107 196" stroke="hsl(35 25% 78%)" strokeWidth="0.6" fill="none" />
          
          {/* Text lines - left page */}
          <line x1="38" y1="192" x2="88" y2="192" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="38" y1="197" x2="86" y2="197" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="38" y1="202" x2="89" y2="202" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="38" y1="207" x2="83" y2="207" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="38" y1="212" x2="87" y2="212" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="38" y1="217" x2="80" y2="217" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.25" />
          <line x1="38" y1="222" x2="85" y2="222" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.2" />
          {/* Text lines - right page */}
          <line x1="112" y1="192" x2="162" y2="192" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="112" y1="197" x2="160" y2="197" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="112" y1="202" x2="163" y2="202" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="112" y1="207" x2="157" y2="207" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="112" y1="212" x2="161" y2="212" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="112" y1="217" x2="155" y2="217" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.25" />
          <line x1="112" y1="222" x2="158" y2="222" stroke="hsl(25 20% 65%)" strokeWidth="0.8" opacity="0.2" />

          {/* Gold corner embossing */}
          <path d="M30 182 L30 190 M30 182 L38 182" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <path d="M170 182 L170 190 M170 182 L162 182" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <path d="M30 234 L30 226 M30 234 L38 234" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <path d="M170 234 L170 226 M170 234 L162 234" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          
          {/* Bookmark ribbon */}
          <path d="M150 178 L150 166 L153.5 171 L157 166 L157 178" fill="hsl(45 80% 50%)" opacity="0.85" />
        </g>

        {/* === FEET / TALONS === */}
        <g>
          <path d="M78 236 L68 252 M78 236 L78 254 M78 236 L88 252"
            stroke="hsl(38 70% 50%)" strokeWidth="4" strokeLinecap="round" />
          <path d="M122 236 L112 252 M122 236 L122 254 M122 236 L132 252"
            stroke="hsl(38 70% 50%)" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

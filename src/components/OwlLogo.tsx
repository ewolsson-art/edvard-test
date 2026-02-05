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
    hero: 'w-64 h-64 md:w-80 md:h-80',
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
          <radialGradient id="bodyFur" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="hsl(25 45% 55%)" />
            <stop offset="100%" stopColor="hsl(20 40% 38%)" />
          </radialGradient>
          <radialGradient id="bellyFur" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="hsl(40 55% 90%)" />
            <stop offset="100%" stopColor="hsl(35 40% 78%)" />
          </radialGradient>
          <radialGradient id="eyeIris" cx="40%" cy="38%" r="50%">
            <stop offset="0%" stopColor="hsl(25 70% 48%)" />
            <stop offset="60%" stopColor="hsl(18 60% 30%)" />
            <stop offset="100%" stopColor="hsl(12 50% 16%)" />
          </radialGradient>
          <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(20 55% 42%)" />
            <stop offset="100%" stopColor="hsl(18 50% 30%)" />
          </linearGradient>
          <linearGradient id="branch" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="hsl(22 35% 30%)" />
            <stop offset="100%" stopColor="hsl(20 30% 22%)" />
          </linearGradient>
        </defs>

        {/* ====== BRANCH ====== */}
        <path d="M10 188 Q60 178 100 182 Q140 186 190 180"
          stroke="url(#branch)" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Small leaves */}
        <ellipse cx="22" cy="176" rx="5" ry="9" fill="hsl(130 35% 40%)" transform="rotate(-20 22 176)" opacity="0.8" />
        <ellipse cx="28" cy="180" rx="4" ry="7" fill="hsl(135 30% 45%)" transform="rotate(15 28 180)" opacity="0.7" />
        <ellipse cx="172" cy="176" rx="5" ry="9" fill="hsl(130 35% 40%)" transform="rotate(20 172 176)" opacity="0.8" />
        <ellipse cx="166" cy="180" rx="4" ry="7" fill="hsl(135 30% 45%)" transform="rotate(-15 166 180)" opacity="0.7" />

        {/* ====== TALONS ====== */}
        <g>
          <path d="M72 180 Q68 188 64 194" stroke="hsl(42 65% 55%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M76 180 Q76 189 76 195" stroke="hsl(42 65% 55%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M80 180 Q84 188 88 194" stroke="hsl(42 65% 55%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M120 181 Q116 189 112 195" stroke="hsl(42 65% 55%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M124 181 Q124 190 124 196" stroke="hsl(42 65% 55%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M128 181 Q132 189 136 195" stroke="hsl(42 65% 55%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </g>

        {/* ====== BIG ROUND BODY ====== */}
        <ellipse cx="100" cy="130" rx="56" ry="55" fill="url(#bodyFur)" />

        {/* Cream belly */}
        <ellipse cx="100" cy="140" rx="38" ry="38" fill="url(#bellyFur)" />
        {/* Belly feather scallops */}
        <path d="M78 125 Q88 120 100 125 Q112 120 122 125" stroke="hsl(35 30% 72%)" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M76 135 Q88 129 100 135 Q112 129 124 135" stroke="hsl(35 30% 72%)" strokeWidth="1" fill="none" opacity="0.45" />
        <path d="M77 145 Q88 139 100 145 Q112 139 123 145" stroke="hsl(35 30% 72%)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M80 155 Q90 149 100 155 Q110 149 120 155" stroke="hsl(35 30% 72%)" strokeWidth="1" fill="none" opacity="0.35" />

        {/* ====== HEAD (overlaps body top) ====== */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          {/* Main head */}
          <ellipse cx="100" cy="75" rx="52" ry="46" fill="url(#bodyFur)" />

          {/* Ear tufts - fluffy pointed */}
          <ellipse cx="56" cy="42" rx="10" ry="20" fill="hsl(22 42% 42%)" transform="rotate(-18 56 42)" />
          <ellipse cx="59" cy="40" rx="6" ry="14" fill="hsl(28 45% 52%)" transform="rotate(-18 59 40)" />
          <ellipse cx="144" cy="42" rx="10" ry="20" fill="hsl(22 42% 42%)" transform="rotate(18 144 42)" />
          <ellipse cx="141" cy="40" rx="6" ry="14" fill="hsl(28 45% 52%)" transform="rotate(18 141 40)" />

          {/* Fluffy head top */}
          <ellipse cx="80" cy="36" rx="14" ry="18" fill="hsl(24 42% 46%)" transform="rotate(-10 80 36)" opacity="0.9" />
          <ellipse cx="100" cy="32" rx="16" ry="20" fill="hsl(25 44% 48%)" opacity="0.85" />
          <ellipse cx="120" cy="36" rx="14" ry="18" fill="hsl(24 42% 46%)" transform="rotate(10 120 36)" opacity="0.9" />
          <ellipse cx="90" cy="30" rx="8" ry="12" fill="hsl(28 46% 54%)" opacity="0.5" />
          <ellipse cx="110" cy="30" rx="8" ry="12" fill="hsl(28 46% 54%)" opacity="0.5" />

          {/* Face disc - lighter heart shape */}
          <path d="M100 52 Q72 56 64 78 Q68 104 100 110 Q132 104 136 78 Q128 56 100 52 Z"
            fill="hsl(38 45% 75%)" opacity="0.5" />

          {/* ====== BIG CUTE EYES ====== */}
          {/* Eye whites */}
          <circle cx="80" cy="78" r="20" fill="hsl(0 0% 100%)" />
          <circle cx="120" cy="78" r="20" fill="hsl(0 0% 100%)" />
          {/* Subtle outline */}
          <circle cx="80" cy="78" r="20" stroke="hsl(22 25% 42%)" strokeWidth="1" fill="none" />
          <circle cx="120" cy="78" r="20" stroke="hsl(22 25% 42%)" strokeWidth="1" fill="none" />

          <g className={animated ? 'owl-blink' : ''}>
            {/* Irises */}
            <circle cx="82" cy="80" r="14" fill="url(#eyeIris)" />
            <circle cx="118" cy="80" r="14" fill="url(#eyeIris)" />
            {/* Pupils */}
            <circle cx="83" cy="82" r="7" fill="hsl(0 0% 5%)" />
            <circle cx="117" cy="82" r="7" fill="hsl(0 0% 5%)" />
            {/* Big sparkle reflections */}
            <circle cx="88" cy="74" r="5" fill="hsl(0 0% 100%)" opacity="0.9" />
            <circle cx="124" cy="74" r="5" fill="hsl(0 0% 100%)" opacity="0.9" />
            {/* Small secondary sparkle */}
            <circle cx="78" cy="86" r="2.5" fill="hsl(0 0% 100%)" opacity="0.5" />
            <circle cx="114" cy="86" r="2.5" fill="hsl(0 0% 100%)" opacity="0.5" />
            {/* Tiny extra sparkle */}
            <circle cx="86" cy="76" r="1.5" fill="hsl(0 0% 100%)" opacity="0.35" />
            <circle cx="122" cy="76" r="1.5" fill="hsl(0 0% 100%)" opacity="0.35" />
          </g>

          {/* ====== ROUND GLASSES ====== */}
          <circle cx="80" cy="78" r="22" stroke="hsl(220 15% 25%)" strokeWidth="3" fill="none" />
          <circle cx="120" cy="78" r="22" stroke="hsl(220 15% 25%)" strokeWidth="3" fill="none" />
          {/* Bridge */}
          <path d="M99 74 Q100 68 101 74" stroke="hsl(220 15% 25%)" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Arms */}
          <path d="M58 76 Q52 66 54 52" stroke="hsl(220 15% 25%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M142 76 Q148 66 146 52" stroke="hsl(220 15% 25%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Lens glare */}
          <path d="M66 72 Q69 67 73 72" stroke="hsl(0 0% 100%)" strokeWidth="1.5" fill="none" opacity="0.3" />
          <path d="M127 72 Q130 67 133 72" stroke="hsl(0 0% 100%)" strokeWidth="1.5" fill="none" opacity="0.3" />

          {/* ====== BEAK ====== */}
          <path d="M95 96 L100 106 L105 96 Z" fill="hsl(30 85% 55%)" />
          <path d="M96 96 L100 104 L104 96 Z" fill="hsl(38 90% 62%)" />

          {/* Rosy cheeks */}
          <ellipse cx="60" cy="92" rx="8" ry="5" fill="hsl(350 50% 75%)" opacity="0.35" />
          <ellipse cx="140" cy="92" rx="8" ry="5" fill="hsl(350 50% 75%)" opacity="0.35" />
        </g>

        {/* ====== WINGS (small, gripping book) ====== */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M46 115 Q28 130 30 155 Q34 162 42 158 L48 142 Q36 130 46 118 Z"
            fill="hsl(22 40% 38%)" />
          <path d="M34 135 Q40 140 48 135" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M32 145 Q40 150 48 145" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
        </g>
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M154 115 Q172 130 170 155 Q166 162 158 158 L152 142 Q164 130 154 118 Z"
            fill="hsl(22 40% 38%)" />
          <path d="M166 135 Q160 140 152 135" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M168 145 Q160 150 152 145" stroke="hsl(20 30% 28%)" strokeWidth="0.8" fill="none" opacity="0.35" />
        </g>

        {/* ====== BOOK ====== */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book shadow */}
          <rect x="34" y="156" width="132" height="36" rx="4" fill="hsl(18 40% 22%)" />
          {/* Book cover */}
          <rect x="34" y="154" width="132" height="34" rx="4" fill="url(#bookCover)" />
          {/* Spine */}
          <rect x="96" y="152" width="8" height="38" rx="2" fill="hsl(18 45% 18%)" />
          {/* Spine gold lines */}
          <rect x="97" y="157" width="6" height="2" rx="1" fill="hsl(42 65% 55%)" opacity="0.6" />
          <rect x="97" y="164" width="6" height="2" rx="1" fill="hsl(42 65% 55%)" opacity="0.6" />
          <rect x="97" y="178" width="6" height="2" rx="1" fill="hsl(42 65% 55%)" opacity="0.6" />
          {/* Left page */}
          <rect x="38" y="157" width="56" height="28" rx="2" fill="hsl(42 50% 93%)" />
          {/* Right page */}
          <rect x="106" y="157" width="56" height="28" rx="2" fill="hsl(40 45% 90%)" />
          {/* Page curl */}
          <path d="M94 157 Q96 164 94 172" stroke="hsl(35 22% 80%)" strokeWidth="0.5" fill="none" />
          <path d="M106 157 Q104 164 106 172" stroke="hsl(35 22% 80%)" strokeWidth="0.5" fill="none" />
          {/* Text lines - left */}
          <line x1="42" y1="163" x2="90" y2="163" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="42" y1="167" x2="88" y2="167" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="42" y1="171" x2="90" y2="171" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="42" y1="175" x2="85" y2="175" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="42" y1="179" x2="87" y2="179" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.25" />
          {/* Text lines - right */}
          <line x1="110" y1="163" x2="158" y2="163" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="110" y1="167" x2="156" y2="167" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="110" y1="171" x2="158" y2="171" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.35" />
          <line x1="110" y1="175" x2="152" y2="175" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="110" y1="179" x2="155" y2="179" stroke="hsl(25 15% 65%)" strokeWidth="0.8" opacity="0.25" />
          {/* Gold corner decorations */}
          <path d="M36 156 L36 162 M36 156 L42 156" stroke="hsl(42 65% 55%)" strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
          <path d="M164 156 L164 162 M164 156 L158 156" stroke="hsl(42 65% 55%)" strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
          {/* Bookmark */}
          <path d="M148 152 L148 144 L151 148 L154 144 L154 152" fill="hsl(0 55% 45%)" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
}

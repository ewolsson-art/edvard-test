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
        viewBox="0 0 240 280"
        className={cn("w-full h-full", animated && "owl-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Rich body fur gradient */}
          <radialGradient id="owlBody2" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="hsl(22 52% 56%)" />
            <stop offset="50%" stopColor="hsl(20 45% 42%)" />
            <stop offset="100%" stopColor="hsl(18 40% 32%)" />
          </radialGradient>
          {/* Cream belly */}
          <radialGradient id="owlBelly2" cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor="hsl(42 65% 94%)" />
            <stop offset="60%" stopColor="hsl(38 50% 85%)" />
            <stop offset="100%" stopColor="hsl(32 40% 75%)" />
          </radialGradient>
          {/* Eye iris - rich amber/brown */}
          <radialGradient id="iris2" cx="38%" cy="35%" r="55%">
            <stop offset="0%" stopColor="hsl(30 80% 52%)" />
            <stop offset="50%" stopColor="hsl(20 70% 35%)" />
            <stop offset="100%" stopColor="hsl(12 60% 18%)" />
          </radialGradient>
          {/* Book */}
          <linearGradient id="bookRed2" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(5 65% 52%)" />
            <stop offset="100%" stopColor="hsl(0 58% 36%)" />
          </linearGradient>
          {/* Face disc */}
          <radialGradient id="faceDisc2" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="hsl(40 55% 82%)" />
            <stop offset="100%" stopColor="hsl(30 40% 65%)" />
          </radialGradient>
          {/* Wing */}
          <linearGradient id="wing2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(22 45% 44%)" />
            <stop offset="100%" stopColor="hsl(18 38% 30%)" />
          </linearGradient>
        </defs>

        {/* ====== TALONS ====== */}
        <g>
          {/* Left foot */}
          <path d="M82 248 Q76 256 70 262" stroke="hsl(42 70% 52%)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M88 248 Q86 258 84 264" stroke="hsl(42 70% 52%)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M94 248 Q98 256 104 262" stroke="hsl(42 70% 52%)" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Right foot */}
          <path d="M146 248 Q140 256 134 262" stroke="hsl(42 70% 52%)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M152 248 Q150 258 148 264" stroke="hsl(42 70% 52%)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M158 248 Q162 256 168 262" stroke="hsl(42 70% 52%)" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>

        {/* ====== BIG ROUND BODY ====== */}
        <ellipse cx="120" cy="185" rx="68" ry="66" fill="url(#owlBody2)" />
        {/* Body edge highlight */}
        <ellipse cx="120" cy="185" rx="68" ry="66" fill="none" stroke="hsl(18 35% 28%)" strokeWidth="1" opacity="0.2" />

        {/* Cream belly - large and fluffy */}
        <ellipse cx="120" cy="195" rx="48" ry="50" fill="url(#owlBelly2)" />
        {/* Feather scallop pattern on belly */}
        <path d="M90 175 Q104 168 120 175 Q136 168 150 175" stroke="hsl(35 35% 72%)" strokeWidth="1.4" fill="none" opacity="0.5" />
        <path d="M86 188 Q104 180 120 188 Q136 180 154 188" stroke="hsl(35 35% 72%)" strokeWidth="1.4" fill="none" opacity="0.45" />
        <path d="M88 201 Q104 193 120 201 Q136 193 152 201" stroke="hsl(35 35% 72%)" strokeWidth="1.4" fill="none" opacity="0.4" />
        <path d="M90 214 Q104 206 120 214 Q136 206 150 214" stroke="hsl(35 35% 72%)" strokeWidth="1.4" fill="none" opacity="0.35" />
        <path d="M94 226 Q106 219 120 226 Q134 219 146 226" stroke="hsl(35 35% 72%)" strokeWidth="1.4" fill="none" opacity="0.3" />

        {/* ====== HEAD ====== */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          {/* Big round head */}
          <ellipse cx="120" cy="95" rx="64" ry="58" fill="url(#owlBody2)" />

          {/* ====== FLUFFY HAIR / FEATHER TUFTS ====== */}
          {/* Main messy top feathers */}
          <ellipse cx="90" cy="42" rx="16" ry="26" fill="hsl(22 48% 46%)" transform="rotate(-12 90 42)" />
          <ellipse cx="120" cy="36" rx="18" ry="30" fill="hsl(24 46% 48%)" />
          <ellipse cx="150" cy="42" rx="16" ry="26" fill="hsl(22 48% 46%)" transform="rotate(12 150 42)" />
          {/* Extra tufts for volume */}
          <ellipse cx="75" cy="52" rx="12" ry="20" fill="hsl(20 44% 44%)" transform="rotate(-22 75 52)" />
          <ellipse cx="165" cy="52" rx="12" ry="20" fill="hsl(20 44% 44%)" transform="rotate(22 165 52)" />
          {/* Lighter highlights */}
          <ellipse cx="100" cy="38" rx="10" ry="18" fill="hsl(28 52% 56%)" transform="rotate(-6 100 38)" opacity="0.65" />
          <ellipse cx="140" cy="38" rx="10" ry="18" fill="hsl(28 52% 56%)" transform="rotate(6 140 38)" opacity="0.65" />
          <ellipse cx="120" cy="32" rx="12" ry="20" fill="hsl(30 50% 58%)" opacity="0.4" />
          {/* Wispy tips */}
          <ellipse cx="82" cy="36" rx="6" ry="14" fill="hsl(26 50% 52%)" transform="rotate(-20 82 36)" opacity="0.5" />
          <ellipse cx="158" cy="36" rx="6" ry="14" fill="hsl(26 50% 52%)" transform="rotate(20 158 36)" opacity="0.5" />

          {/* Ear tufts - pointed and feathery */}
          <ellipse cx="60" cy="56" rx="12" ry="26" fill="hsl(20 42% 38%)" transform="rotate(-25 60 56)" />
          <ellipse cx="64" cy="52" rx="7" ry="18" fill="hsl(26 48% 50%)" transform="rotate(-25 64 52)" />
          <ellipse cx="180" cy="56" rx="12" ry="26" fill="hsl(20 42% 38%)" transform="rotate(25 180 56)" />
          <ellipse cx="176" cy="52" rx="7" ry="18" fill="hsl(26 48% 50%)" transform="rotate(25 176 52)" />

          {/* Face disc - heart-shaped lighter area */}
          <path d="M120 62 Q78 68 68 96 Q74 130 120 138 Q166 130 172 96 Q162 68 120 62 Z"
            fill="url(#faceDisc2)" opacity="0.55" />

          {/* ====== HUGE CUTE EYES ====== */}
          {/* Eye shadow */}
          <circle cx="90" cy="98" r="28" fill="hsl(28 25% 45%)" opacity="0.2" />
          <circle cx="150" cy="98" r="28" fill="hsl(28 25% 45%)" opacity="0.2" />

          {/* Eye whites - big and round */}
          <circle cx="90" cy="98" r="26" fill="hsl(0 0% 100%)" />
          <circle cx="150" cy="98" r="26" fill="hsl(0 0% 100%)" />

          <g className={animated ? 'owl-blink' : ''}>
            {/* Irises - large amber */}
            <circle cx="92" cy="100" r="19" fill="url(#iris2)" />
            <circle cx="148" cy="100" r="19" fill="url(#iris2)" />

            {/* Pupils - dark and round */}
            <circle cx="93" cy="102" r="10" fill="hsl(0 0% 5%)" />
            <circle cx="147" cy="102" r="10" fill="hsl(0 0% 5%)" />

            {/* Big primary sparkle */}
            <circle cx="100" cy="92" r="7" fill="hsl(0 0% 100%)" opacity="0.95" />
            <circle cx="156" cy="92" r="7" fill="hsl(0 0% 100%)" opacity="0.95" />
            {/* Secondary sparkle */}
            <circle cx="86" cy="108" r="3.5" fill="hsl(0 0% 100%)" opacity="0.55" />
            <circle cx="142" cy="108" r="3.5" fill="hsl(0 0% 100%)" opacity="0.55" />
            {/* Tiny extra sparkles */}
            <circle cx="98" cy="96" r="2" fill="hsl(0 0% 100%)" opacity="0.4" />
            <circle cx="154" cy="96" r="2" fill="hsl(0 0% 100%)" opacity="0.4" />
          </g>

          {/* ====== GLASSES - purple/violet round frames ====== */}
          <circle cx="90" cy="98" r="29" stroke="hsl(270 35% 40%)" strokeWidth="4.5" fill="none" />
          <circle cx="150" cy="98" r="29" stroke="hsl(270 35% 40%)" strokeWidth="4.5" fill="none" />
          {/* Inner rim highlight */}
          <circle cx="90" cy="98" r="27" stroke="hsl(270 40% 55%)" strokeWidth="1" fill="none" opacity="0.3" />
          <circle cx="150" cy="98" r="27" stroke="hsl(270 40% 55%)" strokeWidth="1" fill="none" opacity="0.3" />
          {/* Bridge */}
          <path d="M117 93 Q120 84 123 93" stroke="hsl(270 35% 40%)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Arms wrapping behind head */}
          <path d="M61 96 Q52 80 56 62" stroke="hsl(270 35% 40%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M179 96 Q188 80 184 62" stroke="hsl(270 35% 40%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Lens glare */}
          <path d="M70 88 Q74 82 79 88" stroke="hsl(0 0% 100%)" strokeWidth="2" fill="none" opacity="0.3" />
          <path d="M160 88 Q164 82 169 88" stroke="hsl(0 0% 100%)" strokeWidth="2" fill="none" opacity="0.3" />

          {/* ====== BIG BEAK - prominent yellow/orange ====== */}
          <path d="M110 122 L120 142 L130 122 Z" fill="hsl(38 90% 50%)" />
          <path d="M113 122 L120 138 L127 122 Z" fill="hsl(45 92% 60%)" />
          {/* Nostril dots */}
          <circle cx="117" cy="127" r="1.3" fill="hsl(30 50% 40%)" opacity="0.35" />
          <circle cx="123" cy="127" r="1.3" fill="hsl(30 50% 40%)" opacity="0.35" />

          {/* Rosy cheeks */}
          <ellipse cx="62" cy="114" rx="10" ry="6" fill="hsl(350 55% 75%)" opacity="0.4" />
          <ellipse cx="178" cy="114" rx="10" ry="6" fill="hsl(350 55% 75%)" opacity="0.4" />
        </g>

        {/* ====== WINGS ====== */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M52 148 Q24 170 24 205 Q28 220 40 216 L52 195 Q34 175 52 154 Z"
            fill="url(#wing2)" />
          {/* Feather lines */}
          <path d="M32 180 Q40 186 50 180" stroke="hsl(18 30% 26%)" strokeWidth="1" fill="none" opacity="0.35" />
          <path d="M30 192 Q40 198 50 192" stroke="hsl(18 30% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M28 204 Q38 210 48 204" stroke="hsl(18 30% 26%)" strokeWidth="1" fill="none" opacity="0.25" />
        </g>
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M188 148 Q216 170 216 205 Q212 220 200 216 L188 195 Q206 175 188 154 Z"
            fill="url(#wing2)" />
          <path d="M208 180 Q200 186 190 180" stroke="hsl(18 30% 26%)" strokeWidth="1" fill="none" opacity="0.35" />
          <path d="M210 192 Q200 198 190 192" stroke="hsl(18 30% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M212 204 Q202 210 192 204" stroke="hsl(18 30% 26%)" strokeWidth="1" fill="none" opacity="0.25" />
        </g>

        {/* ====== BIG RED BOOK ====== */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book thickness/shadow */}
          <rect x="30" y="210" width="180" height="44" rx="5" fill="hsl(0 45% 24%)" />
          {/* Book cover */}
          <rect x="30" y="208" width="180" height="42" rx="5" fill="url(#bookRed2)" />

          {/* Spine */}
          <rect x="116" y="205" width="8" height="48" rx="3" fill="hsl(0 48% 20%)" />
          {/* Gold spine bands */}
          <rect x="117" y="212" width="6" height="2.5" rx="1" fill="hsl(42 72% 55%)" opacity="0.65" />
          <rect x="117" y="222" width="6" height="2.5" rx="1" fill="hsl(42 72% 55%)" opacity="0.65" />
          <rect x="117" y="240" width="6" height="2.5" rx="1" fill="hsl(42 72% 55%)" opacity="0.65" />

          {/* Left page */}
          <rect x="35" y="212" width="79" height="34" rx="2" fill="hsl(42 55% 94%)" />
          {/* Right page */}
          <rect x="126" y="212" width="79" height="34" rx="2" fill="hsl(40 50% 91%)" />

          {/* Page curl shadow */}
          <path d="M114 212 Q116 222 114 232" stroke="hsl(35 25% 82%)" strokeWidth="0.6" fill="none" />
          <path d="M126 212 Q124 222 126 232" stroke="hsl(35 25% 82%)" strokeWidth="0.6" fill="none" />

          {/* Text lines - left */}
          <line x1="40" y1="219" x2="110" y2="219" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.4" />
          <line x1="40" y1="224" x2="107" y2="224" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.35" />
          <line x1="40" y1="229" x2="110" y2="229" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.35" />
          <line x1="40" y1="234" x2="104" y2="234" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.3" />
          <line x1="40" y1="239" x2="108" y2="239" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.25" />
          {/* Text lines - right */}
          <line x1="131" y1="219" x2="200" y2="219" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.4" />
          <line x1="131" y1="224" x2="198" y2="224" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.35" />
          <line x1="131" y1="229" x2="200" y2="229" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.35" />
          <line x1="131" y1="234" x2="194" y2="234" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.3" />
          <line x1="131" y1="239" x2="197" y2="239" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.25" />

          {/* Gold corner embossing */}
          <path d="M32 210 L32 218 M32 210 L40 210" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.45" strokeLinecap="round" />
          <path d="M208 210 L208 218 M208 210 L200 210" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.45" strokeLinecap="round" />
          <path d="M32 248 L32 240 M32 248 L40 248" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.45" strokeLinecap="round" />
          <path d="M208 248 L208 240 M208 248 L200 248" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.45" strokeLinecap="round" />

          {/* Bookmark ribbon */}
          <path d="M190 206 L190 194 L193 200 L196 194 L196 206" fill="hsl(0 60% 45%)" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

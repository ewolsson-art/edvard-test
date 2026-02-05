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
        viewBox="0 0 240 320"
        className={cn("w-full h-full", animated && "owl-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Body gradients */}
          <radialGradient id="owlBody" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="hsl(25 50% 58%)" />
            <stop offset="70%" stopColor="hsl(22 42% 42%)" />
            <stop offset="100%" stopColor="hsl(20 38% 34%)" />
          </radialGradient>
          <radialGradient id="owlBelly" cx="50%" cy="25%" r="65%">
            <stop offset="0%" stopColor="hsl(42 60% 92%)" />
            <stop offset="100%" stopColor="hsl(36 45% 80%)" />
          </radialGradient>
          <radialGradient id="iris" cx="42%" cy="38%" r="52%">
            <stop offset="0%" stopColor="hsl(32 75% 50%)" />
            <stop offset="55%" stopColor="hsl(22 65% 32%)" />
            <stop offset="100%" stopColor="hsl(15 55% 18%)" />
          </radialGradient>
          <linearGradient id="bookRed" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 60% 48%)" />
            <stop offset="100%" stopColor="hsl(0 55% 32%)" />
          </linearGradient>
          <linearGradient id="wingG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(22 42% 46%)" />
            <stop offset="100%" stopColor="hsl(20 38% 32%)" />
          </linearGradient>
          <linearGradient id="branchG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 40% 32%)" />
            <stop offset="100%" stopColor="hsl(22 35% 22%)" />
          </linearGradient>
          <radialGradient id="faceDisc" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="hsl(38 50% 78%)" />
            <stop offset="100%" stopColor="hsl(32 40% 62%)" />
          </radialGradient>
        </defs>

        {/* ====== BRANCH ====== */}
        <path d="M0 270 Q50 258 120 264 Q190 272 240 260"
          stroke="url(#branchG)" strokeWidth="12" strokeLinecap="round" fill="none" />
        {/* Branch texture */}
        <path d="M30 264 Q35 260 42 264" stroke="hsl(22 30% 26%)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M100 262 Q108 258 116 262" stroke="hsl(22 30% 26%)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M170 266 Q178 262 186 266" stroke="hsl(22 30% 26%)" strokeWidth="1" fill="none" opacity="0.4" />
        {/* Left branch twig */}
        <path d="M30 266 Q16 256 10 246" stroke="url(#branchG)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <ellipse cx="8" cy="242" rx="6" ry="10" fill="hsl(140 40% 32%)" transform="rotate(20 8 242)" />
        <ellipse cx="14" cy="246" rx="5" ry="8" fill="hsl(145 35% 38%)" transform="rotate(35 14 246)" />
        {/* Right branch twig */}
        <path d="M205 264 Q218 254 226 244" stroke="url(#branchG)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <ellipse cx="228" cy="240" rx="6" ry="10" fill="hsl(140 40% 32%)" transform="rotate(-20 228 240)" />
        <ellipse cx="222" cy="244" rx="5" ry="8" fill="hsl(145 35% 38%)" transform="rotate(-35 222 244)" />

        {/* ====== TALONS on branch ====== */}
        <g>
          <path d="M88 260 Q82 268 76 274 M88 260 Q88 270 88 276 M88 260 Q94 268 100 274"
            stroke="hsl(38 65% 52%)" strokeWidth="4" strokeLinecap="round" />
          <path d="M152 262 Q146 270 140 276 M152 262 Q152 272 152 278 M152 262 Q158 270 164 276"
            stroke="hsl(38 65% 52%)" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* ====== CHUBBY BODY ====== */}
        <ellipse cx="120" cy="195" rx="62" ry="68" fill="url(#owlBody)" />
        
        {/* Fluffy belly - cream colored */}
        <ellipse cx="120" cy="205" rx="42" ry="50" fill="url(#owlBelly)" />
        {/* Belly feather pattern - wavy lines */}
        <path d="M98 185 Q108 180 120 185 Q132 180 142 185" stroke="hsl(35 35% 75%)" strokeWidth="1.2" fill="none" opacity="0.5" />
        <path d="M95 196 Q108 190 120 196 Q132 190 145 196" stroke="hsl(35 35% 75%)" strokeWidth="1.2" fill="none" opacity="0.45" />
        <path d="M96 207 Q108 201 120 207 Q132 201 144 207" stroke="hsl(35 35% 75%)" strokeWidth="1.2" fill="none" opacity="0.4" />
        <path d="M98 218 Q108 212 120 218 Q132 212 142 218" stroke="hsl(35 35% 75%)" strokeWidth="1.2" fill="none" opacity="0.35" />

        {/* ====== FLUFFY HEAD HAIR / TUFTS ====== */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          {/* Big fluffy hair cluster */}
          <ellipse cx="95" cy="30" rx="18" ry="28" fill="hsl(22 44% 44%)" transform="rotate(-15 95 30)" />
          <ellipse cx="120" cy="24" rx="20" ry="30" fill="hsl(24 42% 46%)" />
          <ellipse cx="145" cy="30" rx="18" ry="28" fill="hsl(22 44% 44%)" transform="rotate(15 145 30)" />
          <ellipse cx="80" cy="40" rx="14" ry="22" fill="hsl(25 42% 48%)" transform="rotate(-25 80 40)" />
          <ellipse cx="160" cy="40" rx="14" ry="22" fill="hsl(25 42% 48%)" transform="rotate(25 160 40)" />
          {/* Lighter fluffy highlights */}
          <ellipse cx="105" cy="24" rx="10" ry="16" fill="hsl(28 48% 56%)" transform="rotate(-8 105 24)" opacity="0.7" />
          <ellipse cx="135" cy="24" rx="10" ry="16" fill="hsl(28 48% 56%)" transform="rotate(8 135 24)" opacity="0.7" />
          <ellipse cx="120" cy="20" rx="12" ry="18" fill="hsl(30 46% 54%)" opacity="0.5" />
          
          {/* Ear tufts - spiky feathery */}
          <ellipse cx="64" cy="48" rx="11" ry="24" fill="hsl(22 40% 40%)" transform="rotate(-28 64 48)" />
          <ellipse cx="67" cy="44" rx="7" ry="16" fill="hsl(28 44% 52%)" transform="rotate(-28 67 44)" />
          <ellipse cx="176" cy="48" rx="11" ry="24" fill="hsl(22 40% 40%)" transform="rotate(28 176 48)" />
          <ellipse cx="173" cy="44" rx="7" ry="16" fill="hsl(28 44% 52%)" transform="rotate(28 173 44)" />
        </g>

        {/* ====== BIG ROUND HEAD ====== */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          <ellipse cx="120" cy="100" rx="58" ry="54" fill="url(#owlBody)" />
          
          {/* Face disc - heart-shaped lighter area */}
          <path d="M120 62 Q80 66 70 95 Q76 126 120 132 Q164 126 170 95 Q160 66 120 62 Z"
            fill="url(#faceDisc)" opacity="0.6" />

          {/* ====== HUGE CUTE EYES ====== */}
          {/* Eye sockets - slight shadow */}
          <circle cx="92" cy="96" r="26" fill="hsl(30 25% 48%)" opacity="0.3" />
          <circle cx="148" cy="96" r="26" fill="hsl(30 25% 48%)" opacity="0.3" />
          
          {/* Eye whites */}
          <circle cx="92" cy="96" r="24" fill="white" />
          <circle cx="148" cy="96" r="24" fill="white" />
          
          {/* Subtle eye outline */}
          <circle cx="92" cy="96" r="24" stroke="hsl(22 30% 40%)" strokeWidth="1.2" fill="none" />
          <circle cx="148" cy="96" r="24" stroke="hsl(22 30% 40%)" strokeWidth="1.2" fill="none" />

          <g className={animated ? 'owl-blink' : ''}>
            {/* Irises */}
            <circle cx="92" cy="98" r="17" fill="url(#iris)" />
            <circle cx="148" cy="98" r="17" fill="url(#iris)" />
            
            {/* Pupils */}
            <circle cx="92" cy="100" r="9" fill="hsl(0 0% 6%)" />
            <circle cx="148" cy="100" r="9" fill="hsl(0 0% 6%)" />
            
            {/* Big sparkly reflections */}
            <circle cx="100" cy="90" r="6" fill="white" opacity="0.95" />
            <circle cx="156" cy="90" r="6" fill="white" opacity="0.95" />
            <circle cx="86" cy="104" r="3" fill="white" opacity="0.55" />
            <circle cx="142" cy="104" r="3" fill="white" opacity="0.55" />
            {/* Tiny extra sparkle */}
            <circle cx="98" cy="94" r="2" fill="white" opacity="0.4" />
            <circle cx="154" cy="94" r="2" fill="white" opacity="0.4" />
          </g>

          {/* ====== GLASSES - purple/red frames ====== */}
          <circle cx="92" cy="96" r="27" stroke="hsl(280 40% 38%)" strokeWidth="4.5" fill="none" />
          <circle cx="148" cy="96" r="27" stroke="hsl(280 40% 38%)" strokeWidth="4.5" fill="none" />
          {/* Inner rim shine */}
          <circle cx="92" cy="96" r="25" stroke="hsl(280 45% 52%)" strokeWidth="1" fill="none" opacity="0.35" />
          <circle cx="148" cy="96" r="25" stroke="hsl(280 45% 52%)" strokeWidth="1" fill="none" opacity="0.35" />
          {/* Bridge */}
          <path d="M116 92 Q120 84 124 92" stroke="hsl(280 40% 38%)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Arms wrapping behind head */}
          <path d="M65 94 Q56 80 60 64" stroke="hsl(280 40% 38%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M175 94 Q184 80 180 64" stroke="hsl(280 40% 38%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Lens glints */}
          <path d="M73 86 Q77 80 82 86" stroke="white" strokeWidth="2" fill="none" opacity="0.35" />
          <path d="M158 86 Q162 80 166 86" stroke="white" strokeWidth="2" fill="none" opacity="0.35" />

          {/* ====== BEAK - big orange triangle ====== */}
          <path d="M112 118 L120 134 L128 118 Z" fill="hsl(35 90% 55%)" />
          <path d="M114 118 L120 130 L126 118 Z" fill="hsl(42 92% 65%)" />
          {/* Nostrils */}
          <circle cx="117" cy="122" r="1.2" fill="hsl(30 55% 42%)" opacity="0.4" />
          <circle cx="123" cy="122" r="1.2" fill="hsl(30 55% 42%)" opacity="0.4" />

          {/* Warm smile */}
          <path d="M108 136 Q114 144 120 144 Q126 144 132 136"
            stroke="hsl(22 32% 30%)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          
          {/* Rosy cheeks */}
          <ellipse cx="68" cy="112" rx="9" ry="5.5" fill="hsl(350 55% 75%)" opacity="0.4" />
          <ellipse cx="172" cy="112" rx="9" ry="5.5" fill="hsl(350 55% 75%)" opacity="0.4" />
        </g>

        {/* ====== WINGS HOLDING BOOK ====== */}
        {/* Left wing */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M58 155 Q30 175 28 210 Q30 228 44 226 L56 206 Q42 185 58 162 Z"
            fill="url(#wingG)" />
          {/* Feather details */}
          <path d="M36 185 Q44 192 54 185" stroke="hsl(20 28% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M34 198 Q43 205 54 198" stroke="hsl(20 28% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M32 210 Q42 217 52 210" stroke="hsl(20 28% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          {/* Wing tip gripping */}
          <ellipse cx="46" cy="222" rx="7" ry="5" fill="hsl(22 36% 34%)" />
        </g>
        
        {/* Right wing */}
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M182 155 Q210 175 212 210 Q210 228 196 226 L184 206 Q198 185 182 162 Z"
            fill="url(#wingG)" />
          <path d="M204 185 Q196 192 186 185" stroke="hsl(20 28% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M206 198 Q197 205 186 198" stroke="hsl(20 28% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M208 210 Q198 217 188 210" stroke="hsl(20 28% 26%)" strokeWidth="1" fill="none" opacity="0.3" />
          <ellipse cx="194" cy="222" rx="7" ry="5" fill="hsl(22 36% 34%)" />
        </g>

        {/* ====== BIG RED BOOK (open, held by wings) ====== */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book shadow/thickness */}
          <rect x="32" y="218" width="176" height="48" rx="5" fill="hsl(0 45% 24%)" />
          {/* Book cover */}
          <rect x="32" y="216" width="176" height="46" rx="5" fill="url(#bookRed)" />
          
          {/* Spine */}
          <rect x="115" y="213" width="10" height="52" rx="3" fill="hsl(0 50% 20%)" />
          {/* Spine gold bands */}
          <rect x="116" y="220" width="8" height="2.5" rx="1" fill="hsl(42 70% 55%)" opacity="0.65" />
          <rect x="116" y="230" width="8" height="2.5" rx="1" fill="hsl(42 70% 55%)" opacity="0.65" />
          <rect x="116" y="248" width="8" height="2.5" rx="1" fill="hsl(42 70% 55%)" opacity="0.65" />
          
          {/* Left page */}
          <rect x="37" y="220" width="76" height="38" rx="2" fill="hsl(42 52% 93%)" />
          {/* Right page */}
          <rect x="127" y="220" width="76" height="38" rx="2" fill="hsl(42 48% 90%)" />
          
          {/* Page curl shadows */}
          <path d="M113 220 Q115 228 113 236" stroke="hsl(35 25% 80%)" strokeWidth="0.6" fill="none" />
          <path d="M127 220 Q125 228 127 236" stroke="hsl(35 25% 80%)" strokeWidth="0.6" fill="none" />
          
          {/* Text - left page */}
          <line x1="42" y1="227" x2="108" y2="227" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.45" />
          <line x1="42" y1="232" x2="105" y2="232" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.4" />
          <line x1="42" y1="237" x2="109" y2="237" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.4" />
          <line x1="42" y1="242" x2="102" y2="242" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.35" />
          <line x1="42" y1="247" x2="106" y2="247" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.3" />
          <line x1="42" y1="252" x2="98" y2="252" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.25" />
          {/* Text - right page */}
          <line x1="132" y1="227" x2="198" y2="227" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.45" />
          <line x1="132" y1="232" x2="196" y2="232" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.4" />
          <line x1="132" y1="237" x2="199" y2="237" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.4" />
          <line x1="132" y1="242" x2="192" y2="242" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.35" />
          <line x1="132" y1="247" x2="196" y2="247" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.3" />
          <line x1="132" y1="252" x2="190" y2="252" stroke="hsl(25 18% 62%)" strokeWidth="0.9" opacity="0.25" />

          {/* Gold corner embossing */}
          <path d="M34 218 L34 226 M34 218 L42 218" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <path d="M206 218 L206 226 M206 218 L198 218" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <path d="M34 260 L34 252 M34 260 L42 260" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <path d="M206 260 L206 252 M206 260 L198 260" stroke="hsl(42 70% 55%)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          
          {/* Bookmark ribbon */}
          <path d="M185 214 L185 202 L189 208 L193 202 L193 214" fill="hsl(0 60% 45%)" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

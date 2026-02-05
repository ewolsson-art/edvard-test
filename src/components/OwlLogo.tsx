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
            <stop offset="0%" stopColor="hsl(30 35% 50%)" />
            <stop offset="100%" stopColor="hsl(28 32% 38%)" />
          </linearGradient>
          <linearGradient id="owlBellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(40 50% 82%)" />
            <stop offset="100%" stopColor="hsl(36 42% 72%)" />
          </linearGradient>
          <linearGradient id="owlWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(28 32% 44%)" />
            <stop offset="100%" stopColor="hsl(25 30% 32%)" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(35 65% 50%)" />
            <stop offset="100%" stopColor="hsl(25 55% 32%)" />
          </radialGradient>
          <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(12 50% 25%)" />
            <stop offset="100%" stopColor="hsl(10 45% 18%)" />
          </linearGradient>
        </defs>

        {/* === Branch (behind everything) === */}
        <path d="M10 218 Q55 208 100 214 Q145 220 190 212"
          stroke="hsl(25 35% 25%)" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M162 214 Q174 204 180 198" stroke="hsl(25 35% 25%)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="182" cy="195" rx="5" ry="8" fill="hsl(140 35% 30%)" transform="rotate(-25 182 195)" />
        <path d="M28 216 Q18 208 14 200" stroke="hsl(25 35% 25%)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <ellipse cx="12" cy="197" rx="4" ry="7" fill="hsl(140 35% 30%)" transform="rotate(20 12 197)" />

        {/* === Chubby round body === */}
        <ellipse cx="100" cy="150" rx="44" ry="52" fill="url(#owlBodyGrad)" />

        {/* Soft fluffy belly with aged feather pattern */}
        <ellipse cx="100" cy="162" rx="30" ry="38" fill="url(#owlBellyGrad)" />
        <path d="M90 148 L100 153 L110 148" stroke="hsl(35 35% 65%)" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M88 157 L100 162 L112 157" stroke="hsl(35 35% 65%)" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M89 166 L100 171 L111 166" stroke="hsl(35 35% 65%)" strokeWidth="1" fill="none" opacity="0.5" />

        {/* === Big old book held open by wings === */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book body - thick leather-bound tome */}
          <rect x="48" y="168" width="104" height="36" rx="4" fill="url(#bookCover)" />
          {/* Worn leather texture lines */}
          <line x1="52" y1="172" x2="52" y2="200" stroke="hsl(10 30% 22%)" strokeWidth="0.5" opacity="0.4" />
          <line x1="148" y1="172" x2="148" y2="200" stroke="hsl(10 30% 22%)" strokeWidth="0.5" opacity="0.4" />
          {/* Book spine - prominent center */}
          <rect x="96" y="166" width="8" height="40" rx="2" fill="hsl(10 45% 16%)" />
          {/* Spine gold decorations */}
          <line x1="98" y1="172" x2="102" y2="172" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.6" />
          <line x1="98" y1="178" x2="102" y2="178" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.6" />
          <line x1="98" y1="196" x2="102" y2="196" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.6" />
          
          {/* Left page - yellowed parchment */}
          <rect x="52" y="171" width="42" height="30" rx="2" fill="hsl(42 45% 85%)" />
          {/* Right page */}
          <rect x="106" y="171" width="42" height="30" rx="2" fill="hsl(42 40% 82%)" />
          
          {/* Text lines on left page */}
          <line x1="56" y1="178" x2="90" y2="178" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="56" y1="182" x2="88" y2="182" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="56" y1="186" x2="91" y2="186" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="56" y1="190" x2="85" y2="190" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="56" y1="194" x2="89" y2="194" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.35" />
          {/* Text lines on right page */}
          <line x1="110" y1="178" x2="144" y2="178" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="110" y1="182" x2="142" y2="182" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="110" y1="186" x2="145" y2="186" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="110" y1="190" x2="140" y2="190" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.4" />
          <line x1="110" y1="194" x2="143" y2="194" stroke="hsl(25 20% 55%)" strokeWidth="0.8" opacity="0.35" />

          {/* Gold corner embossing - old-fashioned */}
          <path d="M53 172 L53 177 M53 172 L58 172" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          <path d="M93 172 L93 177 M93 172 L88 172" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          <path d="M53 200 L53 195 M53 200 L58 200" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          <path d="M93 200 L93 195 M93 200 L88 200" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          {/* Right page corners */}
          <path d="M107 172 L107 177 M107 172 L112 172" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          <path d="M147 172 L147 177 M147 172 L142 172" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          <path d="M107 200 L107 195 M107 200 L112 200" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          <path d="M147 200 L147 195 M147 200 L142 200" stroke="hsl(42 70% 55%)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
          
          {/* Bookmark ribbon hanging out */}
          <path d="M135 167 L135 158 L138 162 L141 158 L141 167" fill="hsl(0 55% 40%)" opacity="0.8" />
          {/* Bookmark tassel */}
          <line x1="138" y1="158" x2="138" y2="154" stroke="hsl(0 55% 40%)" strokeWidth="0.8" opacity="0.6" />
        </g>

        {/* === Wings holding the book === */}
        {/* Left wing - gripping left side of book */}
        <g className={animated ? 'owl-wing-left' : ''}>
          <path d="M56 140 Q38 152 36 170 Q38 180 48 178 L52 172 Q50 158 58 145 Z"
            fill="url(#owlWingGrad)" />
          {/* Feather detail */}
          <path d="M44 158 Q48 162 52 158" stroke="hsl(25 28% 28%)" strokeWidth="0.8" opacity="0.3" fill="none" />
          <path d="M42 166 Q47 170 52 166" stroke="hsl(25 28% 28%)" strokeWidth="0.8" opacity="0.3" fill="none" />
          {/* Wing tip/fingers gripping book edge */}
          <ellipse cx="49" cy="175" rx="4" ry="3" fill="hsl(28 32% 40%)" />
        </g>

        {/* Right wing - gripping right side of book */}
        <g className={animated ? 'owl-wing-right' : ''}>
          <path d="M144 140 Q162 152 164 170 Q162 180 152 178 L148 172 Q150 158 142 145 Z"
            fill="url(#owlWingGrad)" />
          <path d="M156 158 Q152 162 148 158" stroke="hsl(25 28% 28%)" strokeWidth="0.8" opacity="0.3" fill="none" />
          <path d="M158 166 Q153 170 148 166" stroke="hsl(25 28% 28%)" strokeWidth="0.8" opacity="0.3" fill="none" />
          <ellipse cx="151" cy="175" rx="4" ry="3" fill="hsl(28 32% 40%)" />
        </g>

        {/* === Big round head === */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          <ellipse cx="100" cy="82" rx="42" ry="38" fill="url(#owlBodyGrad)" />

          {/* Bushy ear tufts - old & wise look */}
          <ellipse cx="64" cy="50" rx="11" ry="18" fill="hsl(28 32% 44%)" transform="rotate(-18 64 50)" />
          <ellipse cx="136" cy="50" rx="11" ry="18" fill="hsl(28 32% 44%)" transform="rotate(18 136 50)" />
          {/* Inner ear tufts - grayed tips for age */}
          <ellipse cx="65" cy="46" rx="5" ry="9" fill="hsl(30 20% 58%)" transform="rotate(-18 65 46)" />
          <ellipse cx="135" cy="46" rx="5" ry="9" fill="hsl(30 20% 58%)" transform="rotate(18 135 46)" />
          {/* Gray wisps at tuft tips */}
          <ellipse cx="62" cy="38" rx="3" ry="5" fill="hsl(30 10% 68%)" transform="rotate(-20 62 38)" opacity="0.6" />
          <ellipse cx="138" cy="38" rx="3" ry="5" fill="hsl(30 10% 68%)" transform="rotate(20 138 38)" opacity="0.6" />

          {/* Facial disc */}
          <path d="M100 60 Q70 62 62 85 Q66 108 100 112 Q134 108 138 85 Q130 62 100 60 Z"
            fill="hsl(38 40% 68%)" opacity="0.5" />

          {/* === Kind wise eyes === */}
          <circle cx="80" cy="80" r="18" fill="hsl(35 30% 50%)" />
          <circle cx="120" cy="80" r="18" fill="hsl(35 30% 50%)" />

          <g className={animated ? 'owl-blink' : ''}>
            {/* Left eye - looking down at book */}
            <circle cx="80" cy="80" r="15" fill="white" />
            <circle cx="80" cy="80" r="11" fill="url(#eyeGlow)" />
            <circle cx="79" cy="83" r="6" fill="hsl(20 18% 15%)" />
            <circle cx="84" cy="77" r="3.5" fill="white" opacity="0.9" />
            <circle cx="76" cy="85" r="1.5" fill="white" opacity="0.5" />
            {/* Slight droopy eyelid - wise/old feel */}
            <path d="M65 76 Q72 72 80 73 Q88 72 95 76"
              fill="url(#owlBodyGrad)" opacity="0.25" />

            {/* Right eye - looking down at book */}
            <circle cx="120" cy="80" r="15" fill="white" />
            <circle cx="120" cy="80" r="11" fill="url(#eyeGlow)" />
            <circle cx="119" cy="83" r="6" fill="hsl(20 18% 15%)" />
            <circle cx="124" cy="77" r="3.5" fill="white" opacity="0.9" />
            <circle cx="116" cy="85" r="1.5" fill="white" opacity="0.5" />
            <path d="M105 76 Q112 72 120 73 Q128 72 135 76"
              fill="url(#owlBodyGrad)" opacity="0.25" />
          </g>

          {/* Small cute beak */}
          <path d="M96 96 L100 104 L104 96 Z" fill="hsl(42 65% 52%)" />
          <path d="M97 96 L100 101 L103 96 Z" fill="hsl(45 70% 62%)" />

          {/* Gentle wise smile */}
          <path d="M89 107 Q94 113 100 113 Q106 113 111 107"
            stroke="hsl(25 30% 32%)" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Rosy cheeks */}
          <ellipse cx="66" cy="94" rx="7" ry="4.5" fill="hsl(350 50% 72%)" opacity="0.45" />
          <ellipse cx="134" cy="94" rx="7" ry="4.5" fill="hsl(350 50% 72%)" opacity="0.45" />

          {/* ===== BOLD OLD-FASHIONED GLASSES ===== */}
          {/* Thick round frames - prominent tortoiseshell */}
          <circle cx="80" cy="80" r="19" stroke="hsl(25 40% 28%)" strokeWidth="3" fill="none" />
          <circle cx="120" cy="80" r="19" stroke="hsl(25 40% 28%)" strokeWidth="3" fill="none" />
          {/* Inner rim highlight */}
          <circle cx="80" cy="80" r="17.5" stroke="hsl(30 30% 45%)" strokeWidth="0.8" fill="none" opacity="0.4" />
          <circle cx="120" cy="80" r="17.5" stroke="hsl(30 30% 45%)" strokeWidth="0.8" fill="none" opacity="0.4" />
          {/* Thick bridge */}
          <path d="M96 78 Q100 73 104 78" stroke="hsl(25 40% 28%)" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Arms wrapping behind ears */}
          <path d="M61 78 Q54 70 55 60 Q56 55 58 53" stroke="hsl(25 40% 28%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M139 78 Q146 70 145 60 Q144 55 142 53" stroke="hsl(25 40% 28%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Lens reflection glint */}
          <path d="M67 72 Q70 68 74 72" stroke="white" strokeWidth="1.2" fill="none" opacity="0.35" />
          <path d="M127 72 Q130 68 134 72" stroke="white" strokeWidth="1.2" fill="none" opacity="0.35" />

          {/* Small crow's feet wrinkles - aged */}
          <path d="M60 88 Q57 90 55 92" stroke="hsl(28 30% 40%)" strokeWidth="0.7" fill="none" opacity="0.3" />
          <path d="M60 90 Q57 92 56 95" stroke="hsl(28 30% 40%)" strokeWidth="0.7" fill="none" opacity="0.3" />
          <path d="M140 88 Q143 90 145 92" stroke="hsl(28 30% 40%)" strokeWidth="0.7" fill="none" opacity="0.3" />
          <path d="M140 90 Q143 92 144 95" stroke="hsl(28 30% 40%)" strokeWidth="0.7" fill="none" opacity="0.3" />
        </g>

        {/* Feet on branch */}
        <g>
          <path d="M82 206 L76 214 M82 206 L82 216 M82 206 L88 214"
            stroke="hsl(38 50% 45%)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M118 206 L112 214 M118 206 L118 216 M118 206 L124 214"
            stroke="hsl(38 50% 45%)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

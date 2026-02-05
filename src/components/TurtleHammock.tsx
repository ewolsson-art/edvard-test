import { cn } from '@/lib/utils';

interface TurtleHammockProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
  className?: string;
}

export function TurtleHammock({ size = 'md', animated = true, className }: TurtleHammockProps) {
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    hero: 'w-full max-w-xl md:max-w-2xl',
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg
        viewBox="0 0 500 320"
        className={cn("w-full h-full")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="trunkGradL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 40% 28%)" />
            <stop offset="100%" stopColor="hsl(25 35% 20%)" />
          </linearGradient>
          <linearGradient id="trunkGradR" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 40% 28%)" />
            <stop offset="100%" stopColor="hsl(25 35% 20%)" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(140 45% 38%)" />
            <stop offset="100%" stopColor="hsl(145 40% 28%)" />
          </linearGradient>
          <linearGradient id="leafGrad2" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(145 50% 32%)" />
            <stop offset="100%" stopColor="hsl(150 40% 22%)" />
          </linearGradient>
          <linearGradient id="tShellGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.65)" />
          </linearGradient>
          <linearGradient id="tShellPattern" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.4)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.2)" />
          </linearGradient>
          <linearGradient id="tBodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(160 55% 58%)" />
            <stop offset="100%" stopColor="hsl(160 45% 42%)" />
          </linearGradient>
          <linearGradient id="hammockGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(30 50% 65%)" />
            <stop offset="100%" stopColor="hsl(25 45% 50%)" />
          </linearGradient>
        </defs>

        {/* ======== LEFT TREE ======== */}
        <rect x="55" y="80" width="28" height="240" rx="5" fill="url(#trunkGradL)" />
        {/* Bark texture */}
        <path d="M62 130 Q69 127 76 130" stroke="hsl(25 30% 18%)" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M60 170 Q69 167 78 170" stroke="hsl(25 30% 18%)" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M61 210 Q69 207 77 210" stroke="hsl(25 30% 18%)" strokeWidth="1.5" fill="none" opacity="0.3" />
        {/* Branches left */}
        <path d="M69 110 Q40 90 25 95" stroke="hsl(25 38% 24%)" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M69 140 Q45 125 30 132" stroke="hsl(25 38% 24%)" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* Foliage left tree */}
        <ellipse cx="69" cy="65" rx="55" ry="45" fill="url(#leafGrad)" />
        <ellipse cx="40" cy="80" rx="35" ry="30" fill="url(#leafGrad2)" />
        <ellipse cx="95" cy="75" rx="32" ry="28" fill="url(#leafGrad2)" />
        <ellipse cx="69" cy="48" rx="38" ry="30" fill="url(#leafGrad)" />
        {/* Leaves detail */}
        <ellipse cx="25" cy="90" rx="14" ry="10" fill="hsl(140 42% 32%)" />
        <ellipse cx="110" cy="85" rx="12" ry="9" fill="hsl(140 42% 32%)" />

        {/* ======== RIGHT TREE ======== */}
        <rect x="417" y="75" width="28" height="245" rx="5" fill="url(#trunkGradR)" />
        <path d="M424 125 Q431 122 438 125" stroke="hsl(25 30% 18%)" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M422 165 Q431 162 440 165" stroke="hsl(25 30% 18%)" strokeWidth="1.5" fill="none" opacity="0.4" />
        {/* Branches right */}
        <path d="M431 105 Q460 85 475 90" stroke="hsl(25 38% 24%)" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M431 135 Q455 120 470 128" stroke="hsl(25 38% 24%)" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* Foliage right tree */}
        <ellipse cx="431" cy="60" rx="55" ry="45" fill="url(#leafGrad)" />
        <ellipse cx="400" cy="72" rx="32" ry="28" fill="url(#leafGrad2)" />
        <ellipse cx="460" cy="75" rx="35" ry="30" fill="url(#leafGrad2)" />
        <ellipse cx="431" cy="42" rx="40" ry="32" fill="url(#leafGrad)" />
        <ellipse cx="475" cy="82" rx="13" ry="10" fill="hsl(140 42% 32%)" />
        <ellipse cx="390" cy="88" rx="12" ry="9" fill="hsl(140 42% 32%)" />

        {/* ======== HAMMOCK ROPES ======== */}
        {/* Left rope */}
        <path d="M78 145 Q120 130 170 168"
          stroke="hsl(30 40% 45%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Right rope */}
        <path d="M422 140 Q380 125 330 168"
          stroke="hsl(30 40% 45%)" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* ======== HAMMOCK ======== */}
        <g className={animated ? 'hammock-swing' : ''}>
          {/* Hammock net/fabric */}
          <path d="M165 168 Q250 215 335 168"
            stroke="url(#hammockGrad)" strokeWidth="4" fill="none" />
          {/* Inner hammock fabric */}
          <path d="M170 170 Q250 212 330 170"
            fill="hsl(35 55% 72%)" opacity="0.6" />
          <path d="M175 172 Q250 208 325 172"
            fill="hsl(40 50% 78%)" opacity="0.5" />
          {/* Hammock net lines */}
          <path d="M180 174 Q250 205 320 174" stroke="hsl(30 40% 55%)" strokeWidth="1" fill="none" opacity="0.4" />
          <path d="M190 178 Q250 200 310 178" stroke="hsl(30 40% 55%)" strokeWidth="1" fill="none" opacity="0.3" />
          {/* Cross lines for net texture */}
          <line x1="210" y1="170" x2="215" y2="195" stroke="hsl(30 40% 55%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="240" y1="170" x2="242" y2="200" stroke="hsl(30 40% 55%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="260" y1="170" x2="258" y2="200" stroke="hsl(30 40% 55%)" strokeWidth="0.8" opacity="0.3" />
          <line x1="290" y1="170" x2="285" y2="195" stroke="hsl(30 40% 55%)" strokeWidth="0.8" opacity="0.3" />

          {/* ======== TURTLE LYING IN HAMMOCK ======== */}
          <g>
            {/* Back legs dangling */}
            <ellipse cx="295" cy="195" rx="8" ry="12" fill="url(#tBodyGrad)" transform="rotate(20 295 195)" />
            <ellipse cx="310" cy="192" rx="7" ry="11" fill="url(#tBodyGrad)" transform="rotate(30 310 192)" />

            {/* Shell (lying on back, slightly tilted) */}
            <ellipse cx="250" cy="175" rx="42" ry="25" fill="url(#tShellGrad)" transform="rotate(-5 250 175)" />
            {/* Shell pattern */}
            <path d="M250 155 L262 163 L262 175 L250 183 L238 175 L238 163 Z"
              fill="url(#tShellPattern)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.2"
              transform="rotate(-5 250 170)" />
            <path d="M238 163 L226 168 L226 178 L238 183 L238 175 Z"
              fill="url(#tShellPattern)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.8"
              transform="rotate(-5 235 172)" />
            <path d="M262 163 L274 168 L274 178 L262 183 L262 175 Z"
              fill="url(#tShellPattern)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.8"
              transform="rotate(-5 268 172)" />
            {/* Shell shine */}
            <ellipse cx="243" cy="164" rx="10" ry="5" fill="white" opacity="0.12" transform="rotate(-15 243 164)" />

            {/* Belly (visible since lying back) */}
            <ellipse cx="250" cy="172" rx="28" ry="16" fill="hsl(50 55% 82%)" transform="rotate(-5 250 172)" />

            {/* Front leg relaxed */}
            <ellipse cx="218" cy="168" rx="8" ry="11" fill="url(#tBodyGrad)" transform="rotate(-20 218 168)" />

            {/* Other front leg up (waving lazily) */}
            <g className={animated ? 'turtle-lazy-wave' : ''}>
              <ellipse cx="230" cy="152" rx="7" ry="10" fill="url(#tBodyGrad)" transform="rotate(-40 230 152)" />
              <circle cx="224" cy="145" r="4" fill="url(#tBodyGrad)" />
            </g>

            {/* Head (tilted, resting) */}
            <g className={animated ? 'turtle-head-rest' : ''}>
              {/* Neck */}
              <ellipse cx="205" cy="168" rx="12" ry="9" fill="url(#tBodyGrad)" transform="rotate(-10 205 168)" />

              {/* Head shape - big round */}
              <ellipse cx="193" cy="155" rx="22" ry="20" fill="url(#tBodyGrad)" transform="rotate(-10 193 155)" />

              {/* Cheek blush */}
              <ellipse cx="180" cy="162" rx="5" ry="3.5" fill="hsl(0 60% 78%)" opacity="0.45" transform="rotate(-10 180 162)" />
              <ellipse cx="203" cy="158" rx="5" ry="3.5" fill="hsl(0 60% 78%)" opacity="0.45" transform="rotate(-10 203 158)" />

              {/* Eyes - half closed (sleepy/content) */}
              <g className={animated ? 'turtle-sleepy-blink' : ''}>
                {/* Left eye */}
                <ellipse cx="184" cy="150" rx="8" ry="5" fill="white" />
                <ellipse cx="186" cy="150" rx="4.5" ry="3.5" fill="hsl(220 35% 25%)" />
                <ellipse cx="187" cy="149" rx="2" ry="1.8" fill="hsl(220 30% 10%)" />
                <circle cx="188" cy="148" r="1.2" fill="white" />

                {/* Right eye */}
                <ellipse cx="200" cy="148" rx="7.5" ry="4.5" fill="white" />
                <ellipse cx="198" cy="148" rx="4" ry="3.2" fill="hsl(220 35% 25%)" />
                <ellipse cx="197" cy="147" rx="1.8" ry="1.6" fill="hsl(220 30% 10%)" />
                <circle cx="196" cy="146" r="1.1" fill="white" />

                {/* Sleepy eyelids (half-closed) */}
                <path d="M176 148 Q184 144 192 148" fill="url(#tBodyGrad)" opacity="0.7" />
                <path d="M192 146 Q200 142 208 146" fill="url(#tBodyGrad)" opacity="0.7" />
              </g>

              {/* Cute nose */}
              <ellipse cx="192" cy="157" rx="2.5" ry="2" fill="hsl(160 40% 35%)" />

              {/* Content smile */}
              <path d="M184 163 Q189 168 192 168 Q195 168 200 163"
                stroke="hsl(220 20% 28%)" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Tiny Z's for sleepy vibe */}
              {animated && (
                <g className="turtle-zzz">
                  <text x="210" y="138" fontSize="10" fill="hsl(220 15% 60%)" fontWeight="bold" opacity="0.6">z</text>
                  <text x="220" y="128" fontSize="8" fill="hsl(220 15% 60%)" fontWeight="bold" opacity="0.4">z</text>
                  <text x="228" y="120" fontSize="6" fill="hsl(220 15% 60%)" fontWeight="bold" opacity="0.25">z</text>
                </g>
              )}
            </g>

            {/* Tail */}
            <path d="M300 185 Q312 188 315 182"
              stroke="hsl(160 45% 45%)" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        </g>

        {/* Small decorative leaves falling */}
        {animated && (
          <>
            <ellipse cx="150" cy="100" rx="4" ry="7" fill="hsl(100 40% 45%)" opacity="0.5"
              className="falling-leaf" style={{ animationDelay: '0s' }} transform="rotate(30 150 100)" />
            <ellipse cx="350" cy="80" rx="3" ry="6" fill="hsl(120 35% 40%)" opacity="0.4"
              className="falling-leaf" style={{ animationDelay: '3s' }} transform="rotate(-20 350 80)" />
          </>
        )}
      </svg>
    </div>
  );
}

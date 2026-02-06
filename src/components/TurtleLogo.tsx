import { cn } from '@/lib/utils';

interface TurtleLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
  className?: string;
}

export function TurtleLogo({ size = 'md', animated = true, className }: TurtleLogoProps) {
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    hero: 'w-48 h-48 md:w-64 md:h-64',
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg
        viewBox="0 0 260 280"
        className={cn("w-full h-full", animated && "turtle-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.65)" />
          </linearGradient>
          <linearGradient id="shellPatternGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.4)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.2)" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(160 40% 38%)" />
            <stop offset="100%" stopColor="hsl(160 35% 28%)" />
          </linearGradient>
          <linearGradient id="bellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(50 35% 65%)" />
            <stop offset="100%" stopColor="hsl(45 30% 50%)" />
          </linearGradient>
          <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220 55% 35%)" />
            <stop offset="100%" stopColor="hsl(225 50% 25%)" />
          </linearGradient>
          <linearGradient id="bookPages" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45 30% 90%)" />
            <stop offset="100%" stopColor="hsl(40 25% 82%)" />
          </linearGradient>
          <linearGradient id="coatGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 0% 97%)" />
            <stop offset="100%" stopColor="hsl(0 0% 90%)" />
          </linearGradient>
          <linearGradient id="stethGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 0% 35%)" />
            <stop offset="100%" stopColor="hsl(0 0% 20%)" />
          </linearGradient>
        </defs>

        {/* === STANDING TURTLE WITH BOOK & GLASSES === */}

        {/* Left arm holding book */}
        <g className={animated ? 'turtle-wave' : ''}>
          <ellipse cx="68" cy="150" rx="14" ry="10" fill="url(#bodyGrad)" transform="rotate(-15 68 150)" />
          <circle cx="57" cy="145" r="5" fill="url(#bodyGrad)" />
        </g>

        {/* Right arm holding book */}
        <ellipse cx="132" cy="150" rx="14" ry="10" fill="url(#bodyGrad)" transform="rotate(15 132 150)" />
        <circle cx="143" cy="145" r="5" fill="url(#bodyGrad)" />

        {/* Left foot */}
        <ellipse cx="80" cy="250" rx="16" ry="8" fill="url(#bodyGrad)" />
        {/* Right foot */}
        <ellipse cx="120" cy="250" rx="16" ry="8" fill="url(#bodyGrad)" />

        {/* Left leg */}
        <rect x="72" y="225" width="16" height="28" rx="8" fill="url(#bodyGrad)" />
        {/* Right leg */}
        <rect x="112" y="225" width="16" height="28" rx="8" fill="url(#bodyGrad)" />

        {/* === WHITE DOCTOR COAT === */}
        {/* Coat body - visible below and around the shell */}
        <path
          d="M55 120 L48 248 L70 258 L70 230 L130 230 L130 258 L152 248 L145 120"
          fill="url(#coatGrad)"
          stroke="hsl(0 0% 80%)"
          strokeWidth="1.5"
        />
        {/* Coat shadow for depth */}
        <path
          d="M55 120 L48 248 L70 258 L70 230"
          fill="hsl(0 0% 88%)"
          stroke="none"
        />
        {/* Coat right side shadow */}
        <path
          d="M145 120 L152 248 L130 258 L130 230"
          fill="hsl(0 0% 88%)"
          stroke="none"
        />
        {/* Coat front opening line */}
        <line x1="100" y1="125" x2="100" y2="245" stroke="hsl(0 0% 78%)" strokeWidth="1" />
        {/* Coat collar - prominent V-shape */}
        <path d="M72 115 L88 145 L100 130 L112 145 L128 115" fill="hsl(0 0% 96%)" stroke="hsl(0 0% 78%)" strokeWidth="1.5" />
        {/* Collar fold shadow */}
        <path d="M78 118 L90 140 L100 130" fill="hsl(0 0% 90%)" stroke="none" />
        <path d="M122 118 L110 140 L100 130" fill="hsl(0 0% 90%)" stroke="none" />
        {/* Left breast pocket */}
        <path d="M68 170 L68 185 L82 185 L82 170" fill="none" stroke="hsl(0 0% 75%)" strokeWidth="1.2" />
        {/* Pocket flap */}
        <path d="M66 170 L84 170" stroke="hsl(0 0% 72%)" strokeWidth="1.5" />
        {/* Right breast pocket */}
        <path d="M118 170 L118 185 L132 185 L132 170" fill="none" stroke="hsl(0 0% 75%)" strokeWidth="1.2" />
        <path d="M116 170 L134 170" stroke="hsl(0 0% 72%)" strokeWidth="1.5" />
        {/* Pens in right pocket */}
        <rect x="122" y="162" width="2.5" height="12" rx="1" fill="hsl(210 80% 45%)" />
        <circle cx="123.25" cy="162" r="1.8" fill="hsl(210 80% 55%)" />
        <rect x="126" y="164" width="2.5" height="10" rx="1" fill="hsl(0 70% 45%)" />
        <circle cx="127.25" cy="164" r="1.8" fill="hsl(0 70% 55%)" />
        {/* Coat buttons */}
        <circle cx="100" cy="155" r="2.5" fill="hsl(0 0% 82%)" stroke="hsl(0 0% 70%)" strokeWidth="0.8" />
        <circle cx="100" cy="175" r="2.5" fill="hsl(0 0% 82%)" stroke="hsl(0 0% 70%)" strokeWidth="0.8" />
        <circle cx="100" cy="195" r="2.5" fill="hsl(0 0% 82%)" stroke="hsl(0 0% 70%)" strokeWidth="0.8" />
        {/* Name badge on left side */}
        <rect x="64" y="148" width="22" height="12" rx="2" fill="white" stroke="hsl(0 0% 70%)" strokeWidth="0.8" />
        <rect x="66" y="151" width="12" height="1.5" rx="0.5" fill="hsl(210 60% 50%)" />
        <rect x="66" y="154" width="8" height="1.5" rx="0.5" fill="hsl(0 0% 65%)" />
        {/* Red cross on badge */}
        <rect x="80" y="151" width="4" height="1.5" rx="0.5" fill="hsl(0 70% 50%)" />
        <rect x="81" y="150" width="1.5" height="4" rx="0.5" fill="hsl(0 70% 50%)" />

        {/* Shell */}
        <ellipse cx="100" cy="165" rx="48" ry="55" fill="url(#shellGrad)" />

        {/* Shell pattern */}
        <path d="M100 118 L118 130 L118 150 L100 162 L82 150 L82 130 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
        <path d="M82 130 L65 140 L65 158 L82 166 L82 150 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M118 130 L135 140 L135 158 L118 166 L118 150 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        <path d="M100 162 L118 170 L118 188 L100 198 L82 188 L82 170 Z"
          fill="url(#shellPatternGrad)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />

        {/* Shell shine */}
        <ellipse cx="90" cy="135" rx="12" ry="8" fill="white" opacity="0.12" transform="rotate(-20 90 135)" />

        {/* Belly */}
        <ellipse cx="100" cy="185" rx="30" ry="42" fill="url(#bellyGrad)" />

        {/* === STETHOSCOPE - more prominent === */}
        {/* Stethoscope tubing - right side draping */}
        <path
          d="M118 108 C125 120, 135 140, 138 160 C140 175, 135 190, 125 200 C118 206, 108 208, 100 202"
          stroke="hsl(0 0% 25%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Stethoscope tubing - left side */}
        <path
          d="M82 108 C75 120, 65 140, 62 160 C60 175, 65 190, 75 200 C82 206, 92 208, 100 202"
          stroke="hsl(0 0% 25%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Stethoscope chest piece */}
        <circle cx="100" cy="205" r="10" fill="hsl(0 0% 30%)" stroke="hsl(0 0% 55%)" strokeWidth="2" />
        <circle cx="100" cy="205" r="5.5" fill="hsl(0 0% 50%)" />
        <circle cx="100" cy="205" r="2.5" fill="hsl(0 0% 60%)" />
        {/* Chest piece shine */}
        <ellipse cx="96" cy="202" rx="2.5" ry="1.5" fill="white" opacity="0.3" transform="rotate(-20 96 202)" />
        {/* Stethoscope earpieces */}
        <circle cx="78" cy="105" r="4" fill="hsl(0 0% 30%)" stroke="hsl(0 0% 50%)" strokeWidth="1" />
        <circle cx="86" cy="103" r="4" fill="hsl(0 0% 30%)" stroke="hsl(0 0% 50%)" strokeWidth="1" />
        {/* Y-connector */}
        <path d="M82 108 L86 103" stroke="hsl(0 0% 25%)" strokeWidth="3" />
        <path d="M82 108 L78 105" stroke="hsl(0 0% 25%)" strokeWidth="3" />

        {/* Tail */}
        <path
          d="M100 220 C95 228, 88 230, 85 225"
          stroke="hsl(160 35% 28%)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          className={animated ? 'turtle-tail-wag' : ''}
        />

        {/* === THICK BOOK held in front === */}
        <g>
          {/* Book back cover */}
          <rect x="48" y="128" width="60" height="42" rx="3" fill="url(#bookCover)" transform="rotate(-5 78 149)" />
          {/* Book pages (thick) */}
          <rect x="50" y="130" width="56" height="38" rx="2" fill="url(#bookPages)" transform="rotate(-5 78 149)" />
          {/* Page lines */}
          <line x1="58" y1="140" x2="98" y2="138" stroke="hsl(220 15% 65%)" strokeWidth="0.8" />
          <line x1="58" y1="146" x2="98" y2="144" stroke="hsl(220 15% 65%)" strokeWidth="0.8" />
          <line x1="58" y1="152" x2="98" y2="150" stroke="hsl(220 15% 65%)" strokeWidth="0.8" />
          <line x1="58" y1="158" x2="90" y2="156" stroke="hsl(220 15% 65%)" strokeWidth="0.8" />
          {/* Book spine (thick) */}
          <rect x="46" y="128" width="6" height="42" rx="2" fill="hsl(225 50% 22%)" transform="rotate(-5 49 149)" />
          {/* Book front cover edge */}
          <rect x="48" y="128" width="60" height="3" rx="1" fill="hsl(220 55% 30%)" transform="rotate(-5 78 129)" />
          <rect x="48" y="167" width="60" height="3" rx="1" fill="hsl(220 55% 30%)" transform="rotate(-5 78 168)" />
          {/* Book title decoration */}
          <rect x="62" y="131" width="28" height="2" rx="1" fill="hsl(45 70% 55%)" transform="rotate(-5 76 132)" opacity="0.8" />
        </g>

        {/* Head */}
        <g className={animated ? 'turtle-head-bob' : ''}>
          {/* Neck */}
          <rect x="88" y="95" width="24" height="22" rx="12" fill="url(#bodyGrad)" />
          
          {/* Head shape */}
          <ellipse cx="100" cy="70" rx="32" ry="30" fill="url(#bodyGrad)" />
          
          {/* Cheek blush */}
          <ellipse cx="75" cy="77" rx="7" ry="5" fill="hsl(0 65% 80%)" opacity="0.45" />
          <ellipse cx="125" cy="77" rx="7" ry="5" fill="hsl(0 65% 80%)" opacity="0.45" />

          {/* === OLD-FASHIONED ROUND GLASSES === */}
          {/* Left lens frame */}
          <circle cx="86" cy="63" r="15" fill="none" stroke="hsl(30 35% 30%)" strokeWidth="2.5" />
          {/* Right lens frame */}
          <circle cx="114" cy="63" r="15" fill="none" stroke="hsl(30 35% 30%)" strokeWidth="2.5" />
          {/* Bridge */}
          <path d="M101 63 Q100 58 99 63" stroke="hsl(30 35% 30%)" strokeWidth="2.5" fill="none" />
          <line x1="97" y1="61" x2="101" y2="61" stroke="hsl(30 35% 30%)" strokeWidth="2" />
          {/* Left temple (arm of glasses) */}
          <path d="M71 60 Q64 58 62 62 Q60 66 58 68" stroke="hsl(30 35% 30%)" strokeWidth="2" fill="none" />
          {/* Right temple */}
          <path d="M129 60 Q136 58 138 62 Q140 66 142 68" stroke="hsl(30 35% 30%)" strokeWidth="2" fill="none" />
          {/* Lens glare */}
          <ellipse cx="80" cy="58" rx="4" ry="3" fill="white" opacity="0.15" transform="rotate(-20 80 58)" />
          <ellipse cx="108" cy="58" rx="4" ry="3" fill="white" opacity="0.15" transform="rotate(-20 108 58)" />

          {/* Eyes (behind glasses) */}
          <g className={animated ? 'turtle-blink' : ''}>
            <ellipse cx="86" cy="63" rx="9" ry="10" fill="white" />
            <ellipse cx="89" cy="64" rx="5" ry="6" fill="hsl(220 35% 25%)" />
            <ellipse cx="90" cy="63" rx="2.5" ry="3" fill="hsl(220 30% 10%)" />
            <circle cx="91" cy="60" r="2" fill="white" />
            
            <ellipse cx="114" cy="63" rx="9" ry="10" fill="white" />
            <ellipse cx="111" cy="64" rx="5" ry="6" fill="hsl(220 35% 25%)" />
            <ellipse cx="110" cy="63" rx="2.5" ry="3" fill="hsl(220 30% 10%)" />
            <circle cx="109" cy="60" r="2" fill="white" />
          </g>

          {/* Nose */}
          <ellipse cx="100" cy="73" rx="3" ry="2.5" fill="hsl(160 40% 30%)" />

          {/* Smile - content reading smile */}
          <path
            d="M88 80 Q94 88 100 88 Q106 88 112 80"
            stroke="hsl(220 20% 25%)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Yellow hat */}
          <path
            d="M68 55 Q72 30 100 24 Q128 30 132 55"
            fill="hsl(45 85% 55%)"
            stroke="hsl(40 80% 45%)"
            strokeWidth="1"
          />
          <ellipse cx="100" cy="55" rx="35" ry="5" fill="hsl(40 80% 48%)" />
          <ellipse cx="92" cy="40" rx="10" ry="4" fill="white" opacity="0.25" transform="rotate(-10 92 40)" />

          {/* Head mirror on hat */}
          <circle cx="100" cy="26" r="8" fill="hsl(0 0% 85%)" stroke="hsl(0 0% 60%)" strokeWidth="1.5" />
          <circle cx="100" cy="26" r="5" fill="hsl(0 0% 92%)" />
          <ellipse cx="98" cy="24" rx="2.5" ry="2" fill="white" opacity="0.5" transform="rotate(-15 98 24)" />
          {/* Mirror band */}
          <path d="M92 26 Q88 20 90 15" stroke="hsl(0 0% 60%)" strokeWidth="1.5" fill="none" />
          <path d="M108 26 Q112 20 110 15" stroke="hsl(0 0% 60%)" strokeWidth="1.5" fill="none" />
        </g>
      </svg>
    </div>
  );
}

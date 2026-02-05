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
        viewBox="0 0 200 300"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="trunkGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(20 40% 24%)" />
            <stop offset="100%" stopColor="hsl(18 38% 16%)" />
          </linearGradient>
          <radialGradient id="leafFront" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="hsl(145 35% 28%)" />
            <stop offset="100%" stopColor="hsl(150 30% 18%)" />
          </radialGradient>
          <radialGradient id="leafBack" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="hsl(140 30% 22%)" />
            <stop offset="100%" stopColor="hsl(148 28% 14%)" />
          </radialGradient>
          <linearGradient id="owlBody" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 55% 42%)" />
            <stop offset="100%" stopColor="hsl(22 50% 32%)" />
          </linearGradient>
          <radialGradient id="owlEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45 95% 58%)" />
            <stop offset="100%" stopColor="hsl(38 85% 42%)" />
          </radialGradient>
        </defs>

        {/* === Trunk from bottom === */}
        <path d="M90 100 Q87 160 85 220 Q83 260 80 300 L120 300 Q117 260 115 220 Q113 160 110 100"
          fill="url(#trunkGrad)" />
        {/* Bark lines */}
        <path d="M89 140 Q100 137 111 140" stroke="hsl(18 30% 13%)" strokeWidth="0.7" opacity="0.3" fill="none" />
        <path d="M87 180 Q100 177 113 180" stroke="hsl(18 30% 13%)" strokeWidth="0.7" opacity="0.3" fill="none" />
        <path d="M85 220 Q100 217 115 220" stroke="hsl(18 30% 13%)" strokeWidth="0.7" opacity="0.3" fill="none" />
        <path d="M84 255 Q100 252 116 255" stroke="hsl(18 30% 13%)" strokeWidth="0.7" opacity="0.3" fill="none" />

        {/* Roots at bottom */}
        <path d="M80 295 Q65 290 55 300" stroke="hsl(20 38% 18%)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M120 295 Q135 288 145 300" stroke="hsl(20 38% 18%)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M85 298 Q75 294 68 300" stroke="hsl(20 38% 18%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* === Branch owl sits on (left) === */}
        <path d="M92 155 Q60 148 30 142" stroke="hsl(20 40% 22%)" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        {/* Small twig on branch */}
        <path d="M42 146 Q34 138 30 130" stroke="hsl(20 40% 22%)" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="28" cy="127" rx="4" ry="7" fill="hsl(145 35% 26%)" transform="rotate(15 28 127)" />

        {/* === Right branch === */}
        <path d="M108 125 Q140 118 168 112" stroke="hsl(20 40% 22%)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M155 115 Q163 106 167 98" stroke="hsl(20 40% 22%)" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="169" cy="95" rx="5" ry="8" fill="hsl(145 35% 26%)" transform="rotate(-20 169 95)" />

        {/* === Upper small branch === */}
        <path d="M95 108 Q75 100 58 95" stroke="hsl(20 40% 22%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="55" cy="90" rx="4" ry="6" fill="hsl(145 35% 26%)" transform="rotate(10 55 90)" />

        {/* === Leafy crown - back === */}
        <ellipse cx="100" cy="55" rx="65" ry="50" fill="url(#leafBack)" />
        <ellipse cx="55" cy="68" rx="38" ry="32" fill="url(#leafBack)" />
        <ellipse cx="148" cy="62" rx="40" ry="34" fill="url(#leafBack)" />

        {/* === Leafy crown - front === */}
        <ellipse cx="100" cy="42" rx="58" ry="42" fill="url(#leafFront)" />
        <ellipse cx="50" cy="58" rx="34" ry="28" fill="url(#leafFront)" />
        <ellipse cx="150" cy="52" rx="36" ry="30" fill="url(#leafFront)" />
        <ellipse cx="100" cy="22" rx="42" ry="26" fill="hsl(142 33% 25%)" />
        <ellipse cx="95" cy="14" rx="28" ry="16" fill="hsl(145 35% 28%)" opacity="0.6" />

        {/* === Small owl on left branch === */}
        <g transform="translate(55, 118)">
          {/* Body */}
          <ellipse cx="0" cy="12" rx="11" ry="14" fill="url(#owlBody)" />
          {/* Belly */}
          <ellipse cx="0" cy="15" rx="7" ry="10" fill="hsl(38 50% 80%)" />
          <path d="M-5 10 Q-2 12 0 10 Q2 12 5 10" stroke="hsl(25 35% 40%)" strokeWidth="0.4" fill="none" opacity="0.3" />
          <path d="M-5 14 Q-2 16 0 14 Q2 16 5 14" stroke="hsl(25 35% 40%)" strokeWidth="0.4" fill="none" opacity="0.25" />

          {/* Head */}
          <circle cx="0" cy="-4" r="10" fill="url(#owlBody)" />

          {/* Ear tufts */}
          <ellipse cx="-7" cy="-12" rx="3" ry="5" fill="hsl(22 50% 35%)" transform="rotate(-10 -7 -12)" />
          <ellipse cx="7" cy="-12" rx="3" ry="5" fill="hsl(22 50% 35%)" transform="rotate(10 7 -12)" />

          {/* Face disc */}
          <ellipse cx="0" cy="-2" rx="8" ry="7" fill="hsl(32 40% 65%)" opacity="0.45" />

          {/* Eyes with blink animation */}
          <g className={animated ? 'owl-blink' : ''}>
            <circle cx="-4" cy="-4" r="3.5" fill="white" />
            <circle cx="-4" cy="-3.8" r="2.4" fill="url(#owlEye)" />
            <circle cx="-4" cy="-3.5" r="1.3" fill="hsl(20 18% 12%)" />
            <circle cx="-2.5" cy="-5.5" r="1" fill="white" opacity="0.9" />

            <circle cx="4" cy="-4" r="3.5" fill="white" />
            <circle cx="4" cy="-3.8" r="2.4" fill="url(#owlEye)" />
            <circle cx="4" cy="-3.5" r="1.3" fill="hsl(20 18% 12%)" />
            <circle cx="5.5" cy="-5.5" r="1" fill="white" opacity="0.9" />
          </g>

          {/* Eye rings */}
          <circle cx="-4" cy="-4" r="4" stroke="hsl(25 30% 30%)" strokeWidth="0.6" fill="none" />
          <circle cx="4" cy="-4" r="4" stroke="hsl(25 30% 30%)" strokeWidth="0.6" fill="none" />

          {/* Beak */}
          <path d="M-1.5 0 L0 3 L1.5 0 Z" fill="hsl(38 90% 55%)" />

          {/* Smile */}
          <path d="M-2.5 3.5 Q0 5.5 2.5 3.5" stroke="hsl(25 35% 35%)" strokeWidth="0.5" strokeLinecap="round" fill="none" />

          {/* Rosy cheeks */}
          <ellipse cx="-8" cy="0" rx="2" ry="1.2" fill="hsl(350 55% 72%)" opacity="0.35" />
          <ellipse cx="8" cy="0" rx="2" ry="1.2" fill="hsl(350 55% 72%)" opacity="0.35" />

          {/* Feet gripping branch */}
          <path d="M-4 25 L-6 28 M-4 25 L-4 28.5 M-4 25 L-2 28"
            stroke="hsl(38 80% 52%)" strokeWidth="1" strokeLinecap="round" />
          <path d="M4 25 L2 28 M4 25 L4 28.5 M4 25 L6 28"
            stroke="hsl(38 80% 52%)" strokeWidth="1" strokeLinecap="round" />

          {/* Small book */}
          <rect x="-9" y="14" width="18" height="8" rx="1" fill="hsl(215 50% 32%)" />
          <rect x="-1" y="13.5" width="2" height="9" rx="0.5" fill="hsl(215 55% 24%)" />
          <rect x="-7.5" y="15" width="6" height="5.5" rx="0.5" fill="hsl(42 50% 92%)" />
          <rect x="2" y="15" width="6" height="5.5" rx="0.5" fill="hsl(42 45% 90%)" />
        </g>
      </svg>
    </div>
  );
}

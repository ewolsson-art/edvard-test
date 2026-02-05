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
        viewBox="0 0 200 280"
        className={cn("w-full h-full", animated && "owl-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="trunkGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(20 40% 24%)" />
            <stop offset="100%" stopColor="hsl(18 38% 18%)" />
          </linearGradient>
          <radialGradient id="leafGrad1" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="hsl(145 35% 28%)" />
            <stop offset="100%" stopColor="hsl(150 30% 18%)" />
          </radialGradient>
          <radialGradient id="leafGrad2" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="hsl(140 32% 24%)" />
            <stop offset="100%" stopColor="hsl(148 28% 15%)" />
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

        {/* === Tall tree trunk === */}
        <path d="M92 90 Q88 140 86 200 Q84 240 82 275 L118 275 Q116 240 114 200 Q112 140 108 90"
          fill="url(#trunkGrad)" />
        {/* Bark texture */}
        <path d="M90 120 Q100 118 110 120" stroke="hsl(18 30% 15%)" strokeWidth="0.8" opacity="0.3" fill="none" />
        <path d="M88 155 Q100 152 112 155" stroke="hsl(18 30% 15%)" strokeWidth="0.8" opacity="0.3" fill="none" />
        <path d="M87 190 Q100 187 113 190" stroke="hsl(18 30% 15%)" strokeWidth="0.8" opacity="0.3" fill="none" />
        <path d="M86 225 Q100 222 114 225" stroke="hsl(18 30% 15%)" strokeWidth="0.8" opacity="0.3" fill="none" />

        {/* === Left branch (where the owl sits) === */}
        <path d="M92 130 Q65 125 35 118" stroke="hsl(20 40% 22%)" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Small twig */}
        <path d="M50 122 Q42 114 38 108" stroke="hsl(20 40% 22%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="36" cy="105" rx="4" ry="7" fill="hsl(145 35% 28%)" transform="rotate(15 36 105)" />

        {/* === Right branch === */}
        <path d="M108 110 Q135 105 160 100" stroke="hsl(20 40% 22%)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M145 103 Q155 95 158 88" stroke="hsl(20 40% 22%)" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="160" cy="85" rx="5" ry="8" fill="hsl(145 35% 28%)" transform="rotate(-20 160 85)" />

        {/* === Big leafy crown - back layer === */}
        <ellipse cx="100" cy="52" rx="62" ry="48" fill="url(#leafGrad2)" />
        <ellipse cx="60" cy="62" rx="38" ry="34" fill="url(#leafGrad2)" />
        <ellipse cx="140" cy="58" rx="40" ry="36" fill="url(#leafGrad2)" />

        {/* === Leafy crown - front layer === */}
        <ellipse cx="100" cy="40" rx="55" ry="40" fill="url(#leafGrad1)" />
        <ellipse cx="55" cy="55" rx="35" ry="30" fill="url(#leafGrad1)" />
        <ellipse cx="145" cy="50" rx="38" ry="32" fill="url(#leafGrad1)" />
        <ellipse cx="100" cy="20" rx="40" ry="25" fill="hsl(142 33% 26%)" />
        {/* Top highlight */}
        <ellipse cx="95" cy="15" rx="25" ry="14" fill="hsl(145 35% 30%)" opacity="0.6" />

        {/* === Small owl sitting on left branch === */}
        <g className={animated ? 'owl-head-tilt' : ''} transform="translate(55, 98)">
          {/* Body */}
          <ellipse cx="0" cy="12" rx="11" ry="14" fill="url(#owlBody)" />
          {/* Belly */}
          <ellipse cx="0" cy="15" rx="7" ry="10" fill="hsl(38 50% 80%)" />
          {/* Belly feathers */}
          <path d="M-5 10 Q-2 12 0 10 Q2 12 5 10" stroke="hsl(25 35% 40%)" strokeWidth="0.4" fill="none" opacity="0.3" />
          <path d="M-5 14 Q-2 16 0 14 Q2 16 5 14" stroke="hsl(25 35% 40%)" strokeWidth="0.4" fill="none" opacity="0.25" />

          {/* Head */}
          <circle cx="0" cy="-4" r="10" fill="url(#owlBody)" />

          {/* Ear tufts */}
          <ellipse cx="-7" cy="-12" rx="3" ry="5" fill="hsl(22 50% 35%)" transform="rotate(-10 -7 -12)" />
          <ellipse cx="7" cy="-12" rx="3" ry="5" fill="hsl(22 50% 35%)" transform="rotate(10 7 -12)" />

          {/* Face disc */}
          <ellipse cx="0" cy="-2" rx="8" ry="7" fill="hsl(32 40% 65%)" opacity="0.45" />

          {/* Eyes */}
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

          {/* Beak */}
          <path d="M-1.5 0 L0 3 L1.5 0 Z" fill="hsl(38 90% 55%)" />

          {/* Smile */}
          <path d="M-2.5 3.5 Q0 5.5 2.5 3.5" stroke="hsl(25 35% 35%)" strokeWidth="0.5" strokeLinecap="round" fill="none" />

          {/* Rosy cheeks */}
          <ellipse cx="-8" cy="0" rx="2" ry="1.2" fill="hsl(350 55% 72%)" opacity="0.35" />
          <ellipse cx="8" cy="0" rx="2" ry="1.2" fill="hsl(350 55% 72%)" opacity="0.35" />

          {/* Feet on branch */}
          <path d="M-4 25 L-6 28 M-4 25 L-4 28.5 M-4 25 L-2 28"
            stroke="hsl(38 80% 52%)" strokeWidth="1" strokeLinecap="round" />
          <path d="M4 25 L2 28 M4 25 L4 28.5 M4 25 L6 28"
            stroke="hsl(38 80% 52%)" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* === Small book the owl holds === */}
        <g className={animated ? 'owl-book-read' : ''} transform="translate(55, 98)">
          <rect x="-9" y="14" width="18" height="8" rx="1" fill="hsl(215 50% 32%)" />
          <rect x="-1" y="13.5" width="2" height="9" rx="0.5" fill="hsl(215 55% 24%)" />
          <rect x="-7.5" y="15" width="6" height="5.5" rx="0.5" fill="hsl(42 50% 92%)" />
          <rect x="2" y="15" width="6" height="5.5" rx="0.5" fill="hsl(42 45% 90%)" />
          {/* Tiny text lines */}
          <line x1="-6.5" y1="17" x2="-2.5" y2="17" stroke="hsl(25 20% 65%)" strokeWidth="0.3" opacity="0.5" />
          <line x1="-6.5" y1="18.5" x2="-3" y2="18.5" stroke="hsl(25 20% 65%)" strokeWidth="0.3" opacity="0.4" />
          <line x1="3" y1="17" x2="7" y2="17" stroke="hsl(25 20% 65%)" strokeWidth="0.3" opacity="0.5" />
          <line x1="3" y1="18.5" x2="6.5" y2="18.5" stroke="hsl(25 20% 65%)" strokeWidth="0.3" opacity="0.4" />
        </g>

        {/* Ground / roots */}
        <path d="M70 272 Q80 268 82 275" stroke="hsl(20 38% 18%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M130 272 Q120 266 118 275" stroke="hsl(20 38% 18%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M0 278 L200 278" stroke="hsl(150 20% 12%)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

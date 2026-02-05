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
        viewBox="0 0 200 220"
        className={cn("w-full h-full", animated && "owl-idle")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="owlBodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 55% 42%)" />
            <stop offset="100%" stopColor="hsl(22 50% 32%)" />
          </linearGradient>
          <linearGradient id="owlBellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(38 50% 82%)" />
            <stop offset="100%" stopColor="hsl(32 42% 72%)" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45 95% 58%)" />
            <stop offset="100%" stopColor="hsl(38 85% 42%)" />
          </radialGradient>
        </defs>

        {/* === Big round body === */}
        <ellipse cx="100" cy="120" rx="52" ry="58" fill="url(#owlBodyGrad)" />

        {/* Soft belly */}
        <ellipse cx="100" cy="132" rx="36" ry="42" fill="url(#owlBellyGrad)" />
        {/* Belly feather scallops */}
        <path d="M76 118 Q83 123 90 118 Q97 123 104 118 Q111 123 118 118" stroke="hsl(25 35% 40%)" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M74 128 Q82 133 90 128 Q98 133 106 128 Q114 133 122 128" stroke="hsl(25 35% 40%)" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M76 138 Q84 143 92 138 Q100 143 108 138 Q116 143 124 138" stroke="hsl(25 35% 40%)" strokeWidth="1" fill="none" opacity="0.2" />

        {/* === Big round head === */}
        <g className={animated ? 'owl-head-tilt' : ''}>
          <circle cx="100" cy="68" r="44" fill="url(#owlBodyGrad)" />

          {/* Ear tufts - soft and rounded */}
          <ellipse cx="68" cy="36" rx="10" ry="18" fill="hsl(22 50% 35%)" transform="rotate(-15 68 36)" />
          <ellipse cx="132" cy="36" rx="10" ry="18" fill="hsl(22 50% 35%)" transform="rotate(15 132 36)" />
          {/* Inner ear tuft highlights */}
          <ellipse cx="70" cy="38" rx="6" ry="12" fill="hsl(25 52% 40%)" transform="rotate(-15 70 38)" />
          <ellipse cx="130" cy="38" rx="6" ry="12" fill="hsl(25 52% 40%)" transform="rotate(15 130 38)" />

          {/* Facial disc - warm heart shape */}
          <path d="M100 48 Q66 50 58 72 Q62 98 100 105 Q138 98 142 72 Q134 50 100 48 Z"
            fill="hsl(32 40% 65%)" opacity="0.5" />

          {/* === Big friendly eyes === */}
          <g className={animated ? 'owl-blink' : ''}>
            {/* Left eye white */}
            <circle cx="80" cy="68" r="16" fill="white" />
            {/* Left iris */}
            <circle cx="80" cy="69" r="11" fill="url(#eyeGlow)" />
            {/* Left pupil */}
            <circle cx="80" cy="70" r="6" fill="hsl(20 18% 12%)" />
            {/* Sparkle highlights */}
            <circle cx="86" cy="63" r="4.5" fill="white" opacity="0.95" />
            <circle cx="76" cy="73" r="2.5" fill="white" opacity="0.6" />

            {/* Right eye white */}
            <circle cx="120" cy="68" r="16" fill="white" />
            {/* Right iris */}
            <circle cx="120" cy="69" r="11" fill="url(#eyeGlow)" />
            {/* Right pupil */}
            <circle cx="120" cy="70" r="6" fill="hsl(20 18% 12%)" />
            {/* Sparkle highlights */}
            <circle cx="126" cy="63" r="4.5" fill="white" opacity="0.95" />
            <circle cx="116" cy="73" r="2.5" fill="white" opacity="0.6" />
          </g>

          {/* Eye rings */}
          <circle cx="80" cy="68" r="17" stroke="hsl(25 30% 35%)" strokeWidth="2" fill="none" />
          <circle cx="120" cy="68" r="17" stroke="hsl(25 30% 35%)" strokeWidth="2" fill="none" />

          {/* Small cute beak */}
          <path d="M95 82 L100 92 L105 82 Z" fill="hsl(38 90% 55%)" />
          <path d="M97 82 L100 89 L103 82 Z" fill="hsl(42 95% 62%)" />

          {/* Warm smile */}
          <path d="M90 93 Q95 99 100 99 Q105 99 110 93"
            stroke="hsl(25 35% 35%)" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Rosy cheeks */}
          <ellipse cx="64" cy="82" rx="8" ry="5" fill="hsl(350 55% 72%)" opacity="0.4" />
          <ellipse cx="136" cy="82" rx="8" ry="5" fill="hsl(350 55% 72%)" opacity="0.4" />
        </g>

        {/* === Book the owl is holding === */}
        <g className={animated ? 'owl-book-read' : ''}>
          {/* Book body */}
          <rect x="52" y="148" width="96" height="34" rx="3" fill="hsl(215 50% 32%)" />
          {/* Spine */}
          <rect x="96" y="146" width="8" height="38" rx="2" fill="hsl(215 55% 24%)" />
          {/* Left page */}
          <rect x="56" y="151" width="38" height="28" rx="2" fill="hsl(42 50% 92%)" />
          {/* Right page */}
          <rect x="106" y="151" width="38" height="28" rx="2" fill="hsl(42 45% 90%)" />
          {/* Text lines left */}
          <line x1="60" y1="158" x2="88" y2="158" stroke="hsl(25 20% 65%)" strokeWidth="0.7" opacity="0.5" />
          <line x1="60" y1="163" x2="86" y2="163" stroke="hsl(25 20% 65%)" strokeWidth="0.5" opacity="0.4" />
          <line x1="60" y1="168" x2="89" y2="168" stroke="hsl(25 20% 65%)" strokeWidth="0.7" opacity="0.5" />
          <line x1="60" y1="173" x2="84" y2="173" stroke="hsl(25 20% 65%)" strokeWidth="0.5" opacity="0.4" />
          {/* Text lines right */}
          <line x1="110" y1="158" x2="138" y2="158" stroke="hsl(25 20% 65%)" strokeWidth="0.7" opacity="0.5" />
          <line x1="110" y1="163" x2="136" y2="163" stroke="hsl(25 20% 65%)" strokeWidth="0.5" opacity="0.4" />
          <line x1="110" y1="168" x2="139" y2="168" stroke="hsl(25 20% 65%)" strokeWidth="0.7" opacity="0.5" />
          <line x1="110" y1="173" x2="134" y2="173" stroke="hsl(25 20% 65%)" strokeWidth="0.5" opacity="0.4" />
          {/* Bookmark */}
          <path d="M130 148 L130 141 L133 144 L136 141 L136 148" fill="hsl(0 60% 50%)" opacity="0.7" />

          {/* Wing-arms resting on book sides */}
          <path d="M58 138 Q50 144 48 152 Q47 156 50 158 Q53 156 52 150 Q54 144 60 140"
            fill="url(#owlBodyGrad)" stroke="hsl(22 48% 28%)" strokeWidth="0.6" />
          <path d="M142 138 Q150 144 152 152 Q153 156 150 158 Q147 156 148 150 Q146 144 140 140"
            fill="url(#owlBodyGrad)" stroke="hsl(22 48% 28%)" strokeWidth="0.6" />
        </g>

        {/* Feet peeking below book */}
        <path d="M82 182 L77 190 M82 182 L82 192 M82 182 L87 190"
          stroke="hsl(38 80% 52%)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M118 182 L113 190 M118 182 L118 192 M118 182 L123 190"
          stroke="hsl(38 80% 52%)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Branch */}
        <path d="M20 198 Q60 190 100 195 Q140 200 180 192"
          stroke="hsl(20 45% 22%)" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M155 194 Q165 185 170 180" stroke="hsl(20 45% 22%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="172" cy="177" rx="5" ry="8" fill="hsl(140 40% 35%)" transform="rotate(-25 172 177)" />
        <path d="M35 196 Q25 188 22 183" stroke="hsl(20 45% 22%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="20" cy="180" rx="4" ry="7" fill="hsl(140 40% 35%)" transform="rotate(20 20 180)" />
      </svg>
    </div>
  );
}

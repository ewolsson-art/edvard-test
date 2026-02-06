import { TurtleLogo } from './TurtleLogo';

export function AuthBackground() {
  return (
    <>
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 45 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              width: `${1 + Math.random() * 2.5}px`,
              height: `${1 + Math.random() * 2.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 55}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Moon */}
      <div className="absolute top-[12%] right-[15%] pointer-events-none">
        <div className="relative w-16 h-16 md:w-24 md:h-24">
          <div className="absolute inset-0 rounded-full shadow-[0_0_40px_15px_rgba(253,224,71,0.15)]" style={{
            background: 'radial-gradient(circle at 35% 40%, hsl(48 90% 90%), hsl(45 80% 80%))'
          }} />
          <div className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full top-[25%] left-[55%]" style={{ backgroundColor: 'hsl(45 60% 78%)' }} />
          <div className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full top-[55%] left-[30%]" style={{ backgroundColor: 'hsl(45 50% 80%)' }} />
        </div>
      </div>

      {/* Nature scene with pond */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1200 350" className="w-full h-auto" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="pondGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(200 40% 18%)" />
              <stop offset="100%" stopColor="hsl(210 35% 12%)" />
            </linearGradient>
            <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(150 35% 16%)" />
              <stop offset="100%" stopColor="hsl(150 30% 10%)" />
            </linearGradient>
            <linearGradient id="lilypadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(140 40% 28%)" />
              <stop offset="100%" stopColor="hsl(145 35% 20%)" />
            </linearGradient>
            <linearGradient id="turtleShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(160 45% 35%)" />
              <stop offset="100%" stopColor="hsl(155 40% 25%)" />
            </linearGradient>
            <linearGradient id="turtleBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(160 50% 45%)" />
              <stop offset="100%" stopColor="hsl(160 40% 35%)" />
            </linearGradient>
          </defs>

          {/* Ground / grass bank */}
          <path d="M0 200 Q200 180 400 195 Q600 210 800 190 Q1000 175 1200 200 L1200 350 L0 350 Z" fill="url(#grassGrad)" />

          {/* Pond water */}
          <ellipse cx="850" cy="280" rx="320" ry="60" fill="url(#pondGrad)" opacity="0.8" />
          {/* Water ripples */}
          <ellipse cx="820" cy="275" rx="100" ry="8" fill="none" stroke="hsl(200 30% 30%)" strokeWidth="0.8" opacity="0.5" />
          <ellipse cx="900" cy="290" rx="70" ry="5" fill="none" stroke="hsl(200 30% 30%)" strokeWidth="0.6" opacity="0.4" />
          <ellipse cx="780" cy="285" rx="50" ry="4" fill="none" stroke="hsl(200 30% 30%)" strokeWidth="0.5" opacity="0.3" />

          {/* Moon reflection in water */}
          <ellipse cx="870" cy="278" rx="15" ry="4" fill="hsl(48 70% 75%)" opacity="0.15" />

          {/* === Lily pads === */}
          {/* Lily pad 1 */}
          <g transform="translate(750, 270)">
            <ellipse cx="0" cy="0" rx="22" ry="10" fill="url(#lilypadGrad)" />
            <path d="M0 -10 L0 0" stroke="hsl(140 30% 15%)" strokeWidth="1.5" />
          </g>
          {/* Lily pad 2 */}
          <g transform="translate(920, 285)">
            <ellipse cx="0" cy="0" rx="18" ry="8" fill="url(#lilypadGrad)" opacity="0.9" />
            <path d="M0 -8 L0 0" stroke="hsl(140 30% 15%)" strokeWidth="1" />
          </g>
          {/* Lily pad 3 with flower */}
          <g transform="translate(840, 268)">
            <ellipse cx="0" cy="0" rx="20" ry="9" fill="url(#lilypadGrad)" />
            <path d="M0 -9 L0 0" stroke="hsl(140 30% 15%)" strokeWidth="1" />
            {/* Lotus flower */}
            <g transform="translate(5, -12)">
              <ellipse cx="-4" cy="0" rx="3" ry="6" fill="hsl(330 50% 75%)" transform="rotate(-20 -4 0)" opacity="0.8" />
              <ellipse cx="4" cy="0" rx="3" ry="6" fill="hsl(330 50% 75%)" transform="rotate(20 4 0)" opacity="0.8" />
              <ellipse cx="0" cy="-1" rx="2.5" ry="5.5" fill="hsl(330 60% 80%)" />
              <circle cx="0" cy="-4" r="2" fill="hsl(45 80% 70%)" />
            </g>
          </g>
          {/* Lily pad 4 */}
          <g transform="translate(980, 275)">
            <ellipse cx="0" cy="0" rx="16" ry="7" fill="url(#lilypadGrad)" opacity="0.85" />
          </g>

          {/* === Reeds/cattails on right side === */}
          <g transform="translate(1080, 180)">
            <line x1="0" y1="0" x2="0" y2="120" stroke="hsl(140 25% 18%)" strokeWidth="3" />
            <ellipse cx="0" cy="-5" rx="4" ry="12" fill="hsl(25 40% 25%)" />
            <line x1="18" y1="15" x2="18" y2="110" stroke="hsl(140 25% 16%)" strokeWidth="2.5" />
            <ellipse cx="18" cy="10" rx="3.5" ry="10" fill="hsl(25 35% 22%)" />
            <line x1="-12" y1="25" x2="-12" y2="115" stroke="hsl(140 25% 14%)" strokeWidth="2" />
            <ellipse cx="-12" cy="20" rx="3" ry="9" fill="hsl(25 38% 23%)" />
          </g>

          {/* === Reeds on left side of pond === */}
          <g transform="translate(580, 195)">
            <line x1="0" y1="0" x2="0" y2="100" stroke="hsl(140 25% 15%)" strokeWidth="2.5" />
            <ellipse cx="0" cy="-5" rx="3.5" ry="10" fill="hsl(25 38% 24%)" />
            <line x1="12" y1="10" x2="12" y2="95" stroke="hsl(140 25% 13%)" strokeWidth="2" />
            <ellipse cx="12" cy="5" rx="3" ry="9" fill="hsl(25 35% 22%)" />
          </g>

          {/* === Big tree on right === */}
          <rect x="1100" y="40" width="28" height="260" rx="4" fill="hsl(25 35% 16%)" />
          <path d="M1114 100 Q1080 85 1060 90" stroke="hsl(25 35% 18%)" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M1114 100 Q1148 80 1170 88" stroke="hsl(25 35% 18%)" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M1114 150 Q1085 138 1070 145" stroke="hsl(25 35% 18%)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <ellipse cx="1114" cy="40" rx="65" ry="50" fill="hsl(150 30% 14%)" />
          <ellipse cx="1085" cy="55" rx="38" ry="30" fill="hsl(150 25% 11%)" />
          <ellipse cx="1148" cy="48" rx="36" ry="28" fill="hsl(150 28% 12%)" />
          <ellipse cx="1114" cy="18" rx="48" ry="36" fill="hsl(150 32% 16%)" />

          {/* === Cute turtle sitting on the bank near the pond === */}
          <g transform="translate(860, 228)" className="turtle-idle">
            {/* Left back foot */}
            <ellipse cx="-18" cy="18" rx="7" ry="4" fill="url(#turtleBodyGrad)" />
            {/* Right back foot */}
            <ellipse cx="18" cy="18" rx="7" ry="4" fill="url(#turtleBodyGrad)" />
            {/* Body */}
            <ellipse cx="0" cy="8" rx="22" ry="14" fill="url(#turtleBodyGrad)" />
            {/* Shell */}
            <ellipse cx="0" cy="2" rx="20" ry="16" fill="url(#turtleShellGrad)" />
            {/* Shell pattern */}
            <path d="M0 -12 L8 -4 L8 6 L0 12 L-8 6 L-8 -4 Z" fill="hsl(155 35% 22%)" stroke="hsl(155 30% 18%)" strokeWidth="0.8" />
            <path d="M-8 -4 L-16 0 L-16 8 L-8 10 L-8 6 Z" fill="hsl(155 35% 22%)" stroke="hsl(155 30% 18%)" strokeWidth="0.6" opacity="0.8" />
            <path d="M8 -4 L16 0 L16 8 L8 10 L8 6 Z" fill="hsl(155 35% 22%)" stroke="hsl(155 30% 18%)" strokeWidth="0.6" opacity="0.8" />
            {/* Shell shine */}
            <ellipse cx="-4" cy="-5" rx="5" ry="3" fill="white" opacity="0.1" transform="rotate(-15 -4 -5)" />
            {/* Tail */}
            <path d="M0 17 Q-5 22 -8 20" stroke="url(#turtleBodyGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Head */}
            <g>
              {/* Neck */}
              <rect x="-5" y="-22" width="10" height="12" rx="5" fill="url(#turtleBodyGrad)" />
              {/* Head shape */}
              <ellipse cx="0" cy="-28" rx="10" ry="9" fill="url(#turtleBodyGrad)" />
              {/* Cheeks */}
              <ellipse cx="-8" cy="-26" rx="2.5" ry="1.8" fill="hsl(0 55% 75%)" opacity="0.35" />
              <ellipse cx="8" cy="-26" rx="2.5" ry="1.8" fill="hsl(0 55% 75%)" opacity="0.35" />
              {/* Eyes */}
              <ellipse cx="-4" cy="-30" rx="3.5" ry="4" fill="white" />
              <ellipse cx="-3" cy="-29.5" rx="2" ry="2.5" fill="hsl(220 35% 25%)" />
              <circle cx="-2" cy="-30.5" r="1" fill="white" />
              <ellipse cx="4" cy="-30" rx="3.5" ry="4" fill="white" />
              <ellipse cx="3" cy="-29.5" rx="2" ry="2.5" fill="hsl(220 35% 25%)" />
              <circle cx="2" cy="-30.5" r="1" fill="white" />
              {/* Nose */}
              <ellipse cx="0" cy="-27" rx="1.2" ry="1" fill="hsl(160 40% 30%)" />
              {/* Smile */}
              <path d="M-5 -24 Q-2 -20 0 -20 Q2 -20 5 -24" stroke="hsl(220 20% 25%)" strokeWidth="1" strokeLinecap="round" fill="none" />
              {/* Little hat */}
              <path d="M-8 -34 Q-5 -42 0 -44 Q5 -42 8 -34" fill="hsl(var(--primary) / 0.85)" stroke="hsl(var(--primary))" strokeWidth="0.5" />
              <ellipse cx="0" cy="-34" rx="10" ry="2" fill="hsl(var(--primary))" />
            </g>
            {/* Left front arm waving */}
            <g className="turtle-wave">
              <ellipse cx="-20" cy="-4" rx="6" ry="4" fill="url(#turtleBodyGrad)" transform="rotate(-30 -20 -4)" />
              <circle cx="-24" cy="-8" r="2.5" fill="url(#turtleBodyGrad)" />
            </g>
            {/* Right front arm */}
            <ellipse cx="20" cy="-2" rx="6" ry="4" fill="url(#turtleBodyGrad)" transform="rotate(20 20 -2)" />
          </g>

          {/* === Small baby turtle near water === */}
          <g transform="translate(770, 255)">
            <ellipse cx="0" cy="3" rx="8" ry="5" fill="hsl(160 45% 38%)" />
            <ellipse cx="0" cy="0" rx="7" ry="6" fill="hsl(155 40% 28%)" />
            <path d="M0 -5 L3 -1 L3 3 L0 5 L-3 3 L-3 -1 Z" fill="hsl(155 35% 22%)" stroke="hsl(155 30% 18%)" strokeWidth="0.4" />
            {/* Head */}
            <ellipse cx="0" cy="-10" rx="4" ry="3.5" fill="hsl(160 45% 38%)" />
            <circle cx="-1.5" cy="-11" r="1.5" fill="white" />
            <circle cx="-1" cy="-10.8" r="0.8" fill="hsl(220 35% 25%)" />
            <circle cx="1.5" cy="-11" r="1.5" fill="white" />
            <circle cx="1" cy="-10.8" r="0.8" fill="hsl(220 35% 25%)" />
            <path d="M-2 -8 Q0 -6.5 2 -8" stroke="hsl(220 20% 25%)" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Feet */}
            <ellipse cx="-6" cy="6" rx="3" ry="1.5" fill="hsl(160 45% 38%)" />
            <ellipse cx="6" cy="6" rx="3" ry="1.5" fill="hsl(160 45% 38%)" />
          </g>

          {/* === Bushes/shrubs === */}
          <g fill="hsl(150 30% 12%)">
            <ellipse cx="100" cy="240" rx="50" ry="60" />
            <ellipse cx="160" cy="245" rx="40" ry="55" />
            <ellipse cx="220" cy="238" rx="55" ry="62" />
          </g>
          <g fill="hsl(150 25% 9%)">
            <ellipse cx="140" cy="250" rx="42" ry="52" />
            <ellipse cx="195" cy="248" rx="48" ry="55" />
          </g>

          {/* More bushes on the right */}
          <g fill="hsl(150 28% 11%)">
            <ellipse cx="1020" cy="240" rx="35" ry="50" />
            <ellipse cx="1055" cy="245" rx="30" ry="45" />
          </g>

          {/* Fireflies */}
          <circle cx="700" cy="200" r="2" fill="hsl(55 90% 70%)" opacity="0.6" className="star-twinkle" style={{ animationDelay: '0.5s' }} />
          <circle cx="950" cy="210" r="1.5" fill="hsl(55 90% 70%)" opacity="0.5" className="star-twinkle" style={{ animationDelay: '1.2s' }} />
          <circle cx="620" cy="185" r="1.8" fill="hsl(55 90% 70%)" opacity="0.4" className="star-twinkle" style={{ animationDelay: '2.1s' }} />
          <circle cx="1050" cy="175" r="1.5" fill="hsl(55 90% 70%)" opacity="0.5" className="star-twinkle" style={{ animationDelay: '0.8s' }} />
          <circle cx="800" cy="220" r="1.3" fill="hsl(55 90% 70%)" opacity="0.45" className="star-twinkle" style={{ animationDelay: '1.8s' }} />

          {/* Ground */}
          <rect x="0" y="300" width="1200" height="50" fill="hsl(150 20% 8%)" />
        </svg>
      </div>
    </>
  );
}

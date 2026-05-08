import { useId } from 'react';
import { cn } from '@/lib/utils';

export type TurtleMood =
  | 'severe_elevated'
  | 'elevated'
  | 'somewhat_elevated'
  | 'stable'
  | 'somewhat_depressed'
  | 'depressed'
  | 'severe_depressed';

interface TurtleLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
  className?: string;
  /**
   * Optional mood variant. When set, the shell color and facial expression
   * change to communicate mood state — same exact turtle, just different
   * outfit/expression. Always reuse this component, never render a separate
   * "similar" turtle.
   */
  mood?: TurtleMood;
  /** 'full' (default) shows the whole turtle. 'face' zooms in on head + expression. */
  framing?: 'full' | 'face';
  /**
   * What the turtle is holding in its hands.
   *  - 'book' (default): the journal/book.
   *  - 'sign': a streak sign rendered in the same spot. Use `signValue` + `signLabel`.
   */
  holding?: 'book' | 'sign';
  /** Big number shown on the sign (e.g. streak count). */
  signValue?: number | string;
  /** Small caption under the number on the sign (e.g. "I RAD"). */
  signLabel?: string;
}


// Bara tre färger: röd (nedstämd), gul (uppvarvad), grön (stabil).
const ELEVATED_SHELL = {
  from: 'hsl(45 95% 60%)',
  to: 'hsl(38 90% 45%)',
  pattern: 'hsl(42 85% 50% / 0.55)',
  patternStroke: 'hsl(38 75% 32% / 0.6)',
};
const STABLE_SHELL = {
  from: 'hsl(142 60% 50%)',
  to: 'hsl(150 55% 35%)',
  pattern: 'hsl(145 55% 38% / 0.55)',
  patternStroke: 'hsl(150 55% 25% / 0.6)',
};
const DEPRESSED_SHELL = {
  from: 'hsl(0 75% 58%)',
  to: 'hsl(0 70% 42%)',
  pattern: 'hsl(0 65% 45% / 0.55)',
  patternStroke: 'hsl(0 65% 28% / 0.6)',
};

const MOOD_SHELL: Record<TurtleMood, { from: string; to: string; pattern: string; patternStroke: string }> = {
  severe_elevated: ELEVATED_SHELL,
  elevated: ELEVATED_SHELL,
  somewhat_elevated: ELEVATED_SHELL,
  stable: STABLE_SHELL,
  somewhat_depressed: DEPRESSED_SHELL,
  depressed: DEPRESSED_SHELL,
  severe_depressed: DEPRESSED_SHELL,
};

const isElevatedMood = (m?: TurtleMood) => m === 'elevated' || m === 'severe_elevated' || m === 'somewhat_elevated';
const isDepressedMood = (m?: TurtleMood) => m === 'depressed' || m === 'severe_depressed' || m === 'somewhat_depressed';

export function TurtleLogo({ size = 'md', animated = true, className, mood, framing = 'full' }: TurtleLogoProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${name}-${rawId}`;
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    hero: 'w-48 h-48 md:w-64 md:h-64',
  };

  const shell = mood ? MOOD_SHELL[mood] : null;
  const shellFrom = shell ? shell.from : 'hsl(var(--primary))';
  const shellTo = shell ? shell.to : 'hsl(var(--primary) / 0.65)';
  const patternFill = shell ? shell.pattern : 'hsl(var(--primary) / 0.4)';
  const patternStroke = shell ? shell.patternStroke : 'hsl(var(--primary) / 0.3)';

  // 'face' framing crops the SVG viewBox to the head area so the expression dominates.
  const viewBox = framing === 'face' ? '52 12 96 90' : '0 0 260 280';

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg
        viewBox={viewBox}
        className={cn(
          "w-full h-full",
          animated && "turtle-idle",
          animated && isElevatedMood(mood) && "turtle-jitter",
        )}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={id('shellGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={shellFrom} />
            <stop offset="100%" stopColor={shellTo} />
          </linearGradient>
          <linearGradient id={id('shellPatternGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={patternFill} />
            <stop offset="100%" stopColor={patternFill} />
          </linearGradient>
          <linearGradient id={id('bodyGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(160 40% 38%)" />
            <stop offset="100%" stopColor="hsl(160 35% 28%)" />
          </linearGradient>
          <linearGradient id={id('bellyGrad')} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(50 35% 65%)" />
            <stop offset="100%" stopColor="hsl(45 30% 50%)" />
          </linearGradient>
          <linearGradient id={id('bookCover')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220 55% 35%)" />
            <stop offset="100%" stopColor="hsl(225 50% 25%)" />
          </linearGradient>
          <linearGradient id={id('bookPages')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45 30% 90%)" />
            <stop offset="100%" stopColor="hsl(40 25% 82%)" />
          </linearGradient>
          <linearGradient id={id('coatGrad')} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 0% 97%)" />
            <stop offset="100%" stopColor="hsl(0 0% 90%)" />
          </linearGradient>
          <linearGradient id={id('stethGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 0% 35%)" />
            <stop offset="100%" stopColor="hsl(0 0% 20%)" />
          </linearGradient>
        </defs>

        {/* === STANDING TURTLE WITH BOOK & GLASSES === */}

        {/* Left arm holding book */}
        <g className={animated ? 'turtle-wave' : ''}>
          <ellipse cx="68" cy="150" rx="14" ry="10" fill={`url(#${id('bodyGrad')})`} transform="rotate(-15 68 150)" />
          <circle cx="57" cy="145" r="5" fill={`url(#${id('bodyGrad')})`} />
        </g>

        {/* Right arm holding book */}
        <ellipse cx="132" cy="150" rx="14" ry="10" fill={`url(#${id('bodyGrad')})`} transform="rotate(15 132 150)" />
        <circle cx="143" cy="145" r="5" fill={`url(#${id('bodyGrad')})`} />

        {/* Left foot */}
        <ellipse cx="80" cy="250" rx="16" ry="8" fill={`url(#${id('bodyGrad')})`} />
        {/* Right foot */}
        <ellipse cx="120" cy="250" rx="16" ry="8" fill={`url(#${id('bodyGrad')})`} />

        {/* Left leg */}
        <rect x="72" y="225" width="16" height="28" rx="8" fill={`url(#${id('bodyGrad')})`} />
        {/* Right leg */}
        <rect x="112" y="225" width="16" height="28" rx="8" fill={`url(#${id('bodyGrad')})`} />

        {/* (coat removed) */}

        {/* Shell */}
        <ellipse cx="100" cy="165" rx="48" ry="55" fill={`url(#${id('shellGrad')})`} />

        {/* Shell pattern */}
        <path d="M100 118 L118 130 L118 150 L100 162 L82 150 L82 130 Z"
          fill={`url(#${id('shellPatternGrad')})`} stroke={patternStroke} strokeWidth="1.5" />
        <path d="M82 130 L65 140 L65 158 L82 166 L82 150 Z"
          fill={`url(#${id('shellPatternGrad')})`} stroke={patternStroke} strokeWidth="1" />
        <path d="M118 130 L135 140 L135 158 L118 166 L118 150 Z"
          fill={`url(#${id('shellPatternGrad')})`} stroke={patternStroke} strokeWidth="1" />
        <path d="M100 162 L118 170 L118 188 L100 198 L82 188 L82 170 Z"
          fill={`url(#${id('shellPatternGrad')})`} stroke={patternStroke} strokeWidth="1" />

        {/* Shell shine */}
        <ellipse cx="90" cy="135" rx="12" ry="8" fill="white" opacity="0.12" transform="rotate(-20 90 135)" />

        {/* Belly */}
        <ellipse cx="100" cy="185" rx="30" ry="42" fill={`url(#${id('bellyGrad')})`} />

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
          <rect x="48" y="128" width="60" height="42" rx="3" fill={`url(#${id('bookCover')})`} transform="rotate(-5 78 149)" />
          {/* Book pages (thick) */}
          <rect x="50" y="130" width="56" height="38" rx="2" fill={`url(#${id('bookPages')})`} transform="rotate(-5 78 149)" />
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
          <rect x="88" y="95" width="24" height="22" rx="12" fill={`url(#${id('bodyGrad')})`} />
          
          {/* Head shape */}
          <ellipse cx="100" cy="70" rx="32" ry="30" fill={`url(#${id('bodyGrad')})`} />
          
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
            <g className={animated && isElevatedMood(mood) ? 'turtle-eye-dart' : ''}>
              <ellipse cx="90" cy="63" rx="2.5" ry="3" fill="hsl(220 30% 10%)" />
              <circle cx="91" cy="60" r="2" fill="white" />
            </g>
            
            <ellipse cx="114" cy="63" rx="9" ry="10" fill="white" />
            <ellipse cx="111" cy="64" rx="5" ry="6" fill="hsl(220 35% 25%)" />
            <g className={animated && isElevatedMood(mood) ? 'turtle-eye-dart' : ''}>
              <ellipse cx="110" cy="63" rx="2.5" ry="3" fill="hsl(220 30% 10%)" />
              <circle cx="109" cy="60" r="2" fill="white" />
            </g>
          </g>

          {/* Nose */}
          <ellipse cx="100" cy="73" rx="3" ry="2.5" fill="hsl(160 40% 30%)" />

          {/* Eyebrows — stabil = lugna raka, uppvarvad = höjda (överraskad/wired),
              nedstämd = sneda nedåt (ledsna). */}
          {mood && (
            <g stroke="hsl(220 25% 18%)" strokeWidth="3" strokeLinecap="round" fill="none">
              {isElevatedMood(mood) ? (
                <>
                  {/* höjda ögonbryn — uppspelt/överenergisk */}
                  <path d="M76 44 Q86 40 96 44" />
                  <path d="M124 44 Q114 40 104 44" />
                </>
              ) : isDepressedMood(mood) ? (
                <>
                  {/* sneda nedåt mot ytterkanterna — ledsen */}
                  <path d="M76 53 L96 47" />
                  <path d="M124 53 L104 47" />
                </>
              ) : (
                <>
                  {/* lugna mjukt böjda — avslappnat nöjd */}
                  <path d="M76 51 Q86 48 96 51" />
                  <path d="M124 51 Q114 48 104 51" />
                </>
              )}
            </g>
          )}

          {/* Mouth:
              stable    = mjukt litet leende (lugnt nöjd, "bra")
              elevated  = vidöppen O-mun (uppvarvad/för mycket energi, fortfarande positiv)
              depressed = sorgsen båge nedåt */}
          <path
            d={
              isDepressedMood(mood)
                ? 'M82 88 Q100 74 118 88'
                : isElevatedMood(mood)
                  ? 'M78 80 Q100 100 122 80'
                  : 'M84 82 Q100 94 116 82'
            }
            stroke="hsl(220 25% 18%)"
            strokeWidth={isElevatedMood(mood) ? 4 : 3.5}
            strokeLinecap="round"
            fill="none"
            className={animated ? 'turtle-smile' : ''}
          />

          {/* Uppvarvad-signaler i ansiktet (normalt leende kvar):
              intensivare kindrodnad, svettdroppe vid tinningen, och
              små energilinjer runt huvudet. */}
          {isElevatedMood(mood) && (
            <g>
              <ellipse cx="75" cy="78" rx="7" ry="4.5" fill="hsl(0 75% 65%)" opacity="0.55" />
              <ellipse cx="125" cy="78" rx="7" ry="4.5" fill="hsl(0 75% 65%)" opacity="0.55" />
              <path
                d="M138 48 Q134 56 138 60 Q142 56 138 48 Z"
                fill="hsl(200 85% 70%)"
                stroke="hsl(210 60% 45%)"
                strokeWidth="1"
              />
              <ellipse cx="136.5" cy="52" rx="0.9" ry="1.6" fill="white" opacity="0.8" />
              <g
                stroke="hsl(45 90% 55%)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                className={animated ? 'turtle-energy-flicker' : ''}
              >
                <path d="M58 40 L52 34" />
                <path d="M66 32 L63 25" />
                <path d="M142 40 L148 34" />
                <path d="M134 32 L137 25" />
              </g>
            </g>
          )}

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

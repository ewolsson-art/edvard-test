import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TurtleLogo } from '@/components/TurtleLogo';
import { MilestoneInfo, MILESTONES } from '@/hooks/useStreak';
import { useTranslation } from 'react-i18next';
import { MoodType } from '@/types/mood';
import { Flame, Zap, Sun, Cloud, CloudRain, Heart } from 'lucide-react';

interface CelebrationAnimationProps {
  className?: string;
  streak?: number;
  milestone?: MilestoneInfo;
  mood?: MoodType;
  firstName?: string | null;
}

// Mood-aware visual config: icon, primary HSL color, and a confetti palette
// that fits the emotional register (warm/calm/cool).
const MOOD_VISUALS: Record<MoodType, {
  icon: typeof Sun;
  colorVar: string;
  confetti: string[];
  ringColor: string;
}> = {
  severe_elevated: {
    icon: Flame,
    colorVar: 'var(--mood-severe-elevated)',
    confetti: ['hsl(0 85% 60%)', 'hsl(20 90% 60%)', 'hsl(38 85% 55%)', 'hsl(45 85% 55%)'],
    ringColor: 'hsl(var(--mood-severe-elevated))',
  },
  elevated: {
    icon: Flame,
    colorVar: 'var(--mood-elevated)',
    confetti: ['hsl(20 90% 60%)', 'hsl(38 85% 55%)', 'hsl(45 85% 55%)', 'hsl(330 80% 65%)'],
    ringColor: 'hsl(var(--mood-elevated))',
  },
  somewhat_elevated: {
    icon: Zap,
    colorVar: 'var(--mood-somewhat-elevated)',
    confetti: ['hsl(45 85% 55%)', 'hsl(38 85% 55%)', 'hsl(160 70% 45%)', 'hsl(181 80% 50%)'],
    ringColor: 'hsl(var(--mood-somewhat-elevated))',
  },
  stable: {
    icon: Sun,
    colorVar: 'var(--mood-stable)',
    confetti: ['hsl(45 85% 55%)', 'hsl(160 70% 45%)', 'hsl(181 80% 50%)', 'hsl(38 85% 55%)'],
    ringColor: 'hsl(var(--mood-stable))',
  },
  somewhat_depressed: {
    icon: Cloud,
    colorVar: 'var(--mood-somewhat-depressed)',
    // Softer, calmer palette — celebration shouldn't feel discordant when mood is low
    confetti: ['hsl(220 60% 65%)', 'hsl(260 60% 65%)', 'hsl(181 50% 55%)', 'hsl(160 50% 55%)'],
    ringColor: 'hsl(var(--mood-somewhat-depressed))',
  },
  depressed: {
    icon: CloudRain,
    colorVar: 'var(--mood-depressed)',
    confetti: ['hsl(220 60% 65%)', 'hsl(260 55% 65%)', 'hsl(200 55% 60%)', 'hsl(181 50% 55%)'],
    ringColor: 'hsl(var(--mood-depressed))',
  },
  severe_depressed: {
    icon: CloudRain,
    colorVar: 'var(--mood-severe-depressed)',
    confetti: ['hsl(220 55% 65%)', 'hsl(260 50% 65%)', 'hsl(200 50% 60%)', 'hsl(181 45% 55%)'],
    ringColor: 'hsl(var(--mood-severe-depressed))',
  },
};

// Bucket helpers
const isLowMood = (m?: MoodType) =>
  m === 'severe_depressed' || m === 'depressed' || m === 'somewhat_depressed';
const isHighMood = (m?: MoodType) =>
  m === 'severe_elevated' || m === 'elevated' || m === 'somewhat_elevated';

export function CelebrationAnimation({
  className,
  streak = 0,
  milestone,
  mood,
  firstName,
}: CelebrationAnimationProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(0);

  const isMilestone = milestone?.isNewMilestone && streak > 0;
  const visuals = mood ? MOOD_VISUALS[mood] : null;

  const MILESTONE_CONFIG: Record<number, { emoji: string; title: string; subtitle: string }> = useMemo(() => ({
    3: { emoji: '🌱', title: t('celebration.milestone3Title'), subtitle: t('celebration.milestone3Sub') },
    7: { emoji: '🔥', title: t('celebration.milestone7Title'), subtitle: t('celebration.milestone7Sub') },
    14: { emoji: '⭐', title: t('celebration.milestone14Title'), subtitle: t('celebration.milestone14Sub') },
    30: { emoji: '🏆', title: t('celebration.milestone30Title'), subtitle: t('celebration.milestone30Sub') },
    60: { emoji: '💎', title: t('celebration.milestone60Title'), subtitle: t('celebration.milestone60Sub') },
    90: { emoji: '👑', title: t('celebration.milestone90Title'), subtitle: t('celebration.milestone90Sub') },
    180: { emoji: '🦸', title: t('celebration.milestone180Title'), subtitle: t('celebration.milestone180Sub') },
    365: { emoji: '🐢', title: t('celebration.milestone365Title'), subtitle: t('celebration.milestone365Sub') },
  }), [t]);

  // Mood-personalized message pools — Swedish, empathetic, never dismissive of low moods.
  const personalizedMessages = useMemo(() => {
    const name = firstName?.trim();
    const namePart = name ? `${name}, ` : '';
    const namePartCap = name ? `${name}!` : '';

    if (isLowMood(mood)) {
      return {
        titles: [
          name ? `Tack för att du checkade in, ${name}` : 'Tack för att du checkade in',
          'Modigt gjort',
          'Du var här idag',
        ],
        subs: [
          'Att registrera en tung dag är också styrka.',
          'Ett steg i taget. Du behöver inte göra mer just nu.',
          'Att se sitt mående är första steget mot förändring.',
        ],
      };
    }
    if (isHighMood(mood)) {
      return {
        titles: [
          name ? `Du brinner idag, ${name}` : 'Du brinner idag',
          'Härlig energi!',
          namePartCap ? `Snyggt, ${namePartCap}` : 'Snyggt jobbat!',
        ],
        subs: [
          'Försök ta en lugn paus någon gång under dagen.',
          'Bra att du fångar känslan — mönster blir tydligare över tid.',
          'Håll lite extra koll på sömnen ikväll.',
        ],
      };
    }
    // stable / unknown — warm neutral
    return {
      titles: [
        namePartCap ? `Bra jobbat, ${namePartCap}` : 'Bra jobbat!',
        'Snyggt incheckat',
        'En dag till i loggen',
      ],
      subs: [
        'Stabilitet är en superkraft.',
        'Små steg, stor skillnad över tid.',
        'Du bygger en värdefull bild av ditt mående.',
      ],
    };
  }, [mood, firstName]);

  const milestoneConfig = isMilestone ? MILESTONE_CONFIG[streak] : null;

  const [message] = useState(
    () =>
      milestoneConfig?.title ||
      personalizedMessages.titles[Math.floor(Math.random() * personalizedMessages.titles.length)],
  );
  const [subMessage] = useState(
    () =>
      milestoneConfig?.subtitle ||
      personalizedMessages.subs[Math.floor(Math.random() * personalizedMessages.subs.length)],
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Calmer celebration for low moods, exuberant for milestones / high
  const confettiCount = isMilestone ? 80 : isLowMood(mood) ? 18 : 50;
  const confettiPalette = visuals?.confetti ?? [
    'hsl(45 85% 55%)',
    'hsl(160 70% 45%)',
    'hsl(38 85% 55%)',
    'hsl(330 80% 65%)',
    'hsl(260 60% 65%)',
    'hsl(181 80% 50%)',
    'hsl(20 90% 60%)',
  ];

  const MoodIcon = visuals?.icon ?? Sun;
  const moodColor = visuals ? `hsl(${visuals.colorVar})` : 'hsl(var(--primary))';

  return (
    <div className={cn("relative flex flex-col items-center justify-center py-8 overflow-hidden", className)}>
      {/* Confetti — fewer, softer pieces for low moods */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="celebration-confetti"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--drift': `${(Math.random() - 0.5) * 150}px`,
              '--spin': `${Math.random() * 720 - 360}deg`,
              '--delay': `${Math.random() * 0.6}s`,
              '--size': `${6 + Math.random() * 10}px`,
              '--color': confettiPalette[Math.floor(Math.random() * confettiPalette.length)],
              '--shape': Math.random() > 0.5 ? '50%' : '2px',
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Pulse rings tinted by mood */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="celebration-ring"
          style={{
            '--ring-delay': '0s',
            '--ring-size': '140px',
            '--ring-color': visuals?.ringColor ?? 'hsl(45 85% 55%)',
          } as React.CSSProperties}
        />
        <div
          className="celebration-ring"
          style={{
            '--ring-delay': '0.2s',
            '--ring-size': '220px',
            '--ring-color': visuals?.ringColor ?? 'hsl(45 85% 55%)',
          } as React.CSSProperties}
        />
        {isMilestone && (
          <div
            className="celebration-ring"
            style={{
              '--ring-delay': '0.4s',
              '--ring-size': '300px',
              '--ring-color': visuals?.ringColor ?? 'hsl(45 85% 55%)',
            } as React.CSSProperties}
          />
        )}
      </div>

      {/* Hero icon — milestone emoji, mood icon, or default turtle */}
      <div
        className={cn(
          "relative z-10 transition-all duration-700",
          phase >= 1 ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-8",
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div
          className="absolute inset-[-24px] rounded-full blur-2xl animate-pulse"
          style={{ backgroundColor: `${moodColor.replace('hsl(', 'hsl(').replace(')', ' / 0.18)')}` }}
        />

        {/* Sparkles — slightly fewer & softer for low moods */}
        {phase >= 2 && !isLowMood(mood) && (
          <>
            <span className="absolute -top-4 -right-2 text-2xl celebration-star" style={{ '--star-delay': '0s' } as React.CSSProperties}>⭐</span>
            <span className="absolute -top-2 -left-4 text-xl celebration-star" style={{ '--star-delay': '0.15s' } as React.CSSProperties}>✨</span>
            <span className="absolute -bottom-2 -right-4 text-lg celebration-star" style={{ '--star-delay': '0.3s' } as React.CSSProperties}>🌟</span>
            <span className="absolute top-1/2 -left-6 text-base celebration-star" style={{ '--star-delay': '0.45s' } as React.CSSProperties}>💛</span>
          </>
        )}
        {phase >= 2 && isLowMood(mood) && (
          <>
            <span className="absolute -top-2 -right-2 text-lg celebration-star" style={{ '--star-delay': '0s' } as React.CSSProperties}>💙</span>
            <span className="absolute -bottom-2 -left-3 text-base celebration-star" style={{ '--star-delay': '0.25s' } as React.CSSProperties}>🌙</span>
          </>
        )}

        {isMilestone && milestoneConfig ? (
          <div className="w-28 h-28 flex items-center justify-center">
            <span className="text-7xl drop-shadow-lg">{milestoneConfig.emoji}</span>
          </div>
        ) : visuals ? (
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${moodColor.replace(')', ' / 0.12)')}`,
              boxShadow: `0 0 40px ${moodColor.replace(')', ' / 0.35)')}, inset 0 0 0 1px ${moodColor.replace(')', ' / 0.25)')}`,
            }}
          >
            <MoodIcon
              className="w-14 h-14"
              style={{ color: moodColor }}
              strokeWidth={1.75}
            />
          </div>
        ) : (
          <TurtleLogo size="hero" animated className="drop-shadow-[0_0_30px_hsl(45_85%_55%/0.3)]" />
        )}
      </div>

      {isMilestone && phase >= 2 && (
        <div className={cn(
          "relative z-10 mt-2 transition-all duration-500",
          phase >= 2 ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}>
          <span className="text-5xl font-bold tabular-nums tracking-tighter text-foreground">
            {streak}
          </span>
          <span className="text-lg text-muted-foreground/50 ml-1">{t('celebration.daysLabel')}</span>
        </div>
      )}

      <div className={cn(
        "relative z-10 mt-6 text-center transition-all duration-700 px-6",
        phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}>
        <p className={cn(
          "font-bold text-foreground font-display",
          isMilestone ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl",
        )}>
          {message}
        </p>
      </div>

      <div className={cn(
        "relative z-10 mt-3 text-center transition-all duration-700 px-8 max-w-[340px]",
        phase >= 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}>
        <p className="text-base text-muted-foreground leading-relaxed">
          {subMessage}
        </p>
      </div>

      {isMilestone && phase >= 3 && milestone?.reached && (
        <div className={cn(
          "relative z-10 mt-6 flex items-center gap-2 transition-all duration-500",
          phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}>
          {MILESTONES.filter(m => m <= streak).map(m => (
            <span
              key={m}
              className={cn(
                "text-lg transition-all",
                m === streak ? "text-2xl scale-110" : "opacity-40 grayscale",
              )}
            >
              {MILESTONE_CONFIG[m]?.emoji || '🏅'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

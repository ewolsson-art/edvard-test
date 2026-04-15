import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TurtleLogo } from '@/components/TurtleLogo';
import { MilestoneInfo, MILESTONES } from '@/hooks/useStreak';
import { useTranslation } from 'react-i18next';

interface CelebrationAnimationProps {
  className?: string;
  streak?: number;
  milestone?: MilestoneInfo;
}

const CONFETTI_COLORS = [
  'hsl(45 85% 55%)',
  'hsl(160 70% 45%)',
  'hsl(38 85% 55%)',
  'hsl(330 80% 65%)',
  'hsl(260 60% 65%)',
  'hsl(181 80% 50%)',
  'hsl(20 90% 60%)',
];

export function CelebrationAnimation({ className, streak = 0, milestone }: CelebrationAnimationProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(0);
  
  const isMilestone = milestone?.isNewMilestone && streak > 0;

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

  const DEFAULT_MESSAGES = useMemo(() => [
    t('celebration.msg1'), t('celebration.msg2'), t('celebration.msg3'),
    t('celebration.msg4'), t('celebration.msg5'), t('celebration.msg6'),
  ], [t]);

  const DEFAULT_SUB_MESSAGES = useMemo(() => [
    t('celebration.sub1'), t('celebration.sub2'), t('celebration.sub3'), t('celebration.sub4'),
  ], [t]);

  const milestoneConfig = isMilestone ? MILESTONE_CONFIG[streak] : null;
  
  const [message] = useState(() => 
    milestoneConfig?.title || DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)]
  );
  const [subMessage] = useState(() => 
    milestoneConfig?.subtitle || DEFAULT_SUB_MESSAGES[Math.floor(Math.random() * DEFAULT_SUB_MESSAGES.length)]
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const confettiCount = isMilestone ? 80 : 50;

  return (
    <div className={cn("relative flex flex-col items-center justify-center py-8 overflow-hidden", className)}>
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
              '--color': CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
              '--shape': Math.random() > 0.5 ? '50%' : '2px',
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="celebration-ring" style={{ '--ring-delay': '0s', '--ring-size': '140px' } as React.CSSProperties} />
        <div className="celebration-ring" style={{ '--ring-delay': '0.2s', '--ring-size': '220px' } as React.CSSProperties} />
        {isMilestone && (
          <div className="celebration-ring" style={{ '--ring-delay': '0.4s', '--ring-size': '300px' } as React.CSSProperties} />
        )}
      </div>

      <div className={cn(
        "relative z-10 transition-all duration-700",
        phase >= 1 ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-8"
      )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className="absolute inset-[-24px] bg-primary/15 rounded-full blur-2xl animate-pulse" />
        
        {phase >= 2 && (
          <>
            <span className="absolute -top-4 -right-2 text-2xl celebration-star" style={{ '--star-delay': '0s' } as React.CSSProperties}>⭐</span>
            <span className="absolute -top-2 -left-4 text-xl celebration-star" style={{ '--star-delay': '0.15s' } as React.CSSProperties}>✨</span>
            <span className="absolute -bottom-2 -right-4 text-lg celebration-star" style={{ '--star-delay': '0.3s' } as React.CSSProperties}>🌟</span>
            <span className="absolute top-1/2 -left-6 text-base celebration-star" style={{ '--star-delay': '0.45s' } as React.CSSProperties}>💛</span>
          </>
        )}
        
        {isMilestone && milestoneConfig ? (
          <div className="w-28 h-28 flex items-center justify-center">
            <span className="text-7xl drop-shadow-lg">{milestoneConfig.emoji}</span>
          </div>
        ) : (
          <TurtleLogo size="hero" animated className="drop-shadow-[0_0_30px_hsl(45_85%_55%/0.3)]" />
        )}
      </div>

      {isMilestone && phase >= 2 && (
        <div className={cn(
          "relative z-10 mt-2 transition-all duration-500",
          phase >= 2 ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}>
          <span className="text-5xl font-bold tabular-nums tracking-tighter text-foreground">
            {streak}
          </span>
          <span className="text-lg text-muted-foreground/50 ml-1">{t('celebration.daysLabel')}</span>
        </div>
      )}

      <div className={cn(
        "relative z-10 mt-6 text-center transition-all duration-700",
        phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}>
        <p className={cn(
          "font-bold text-foreground font-display",
          isMilestone ? "text-3xl md:text-4xl" : "text-3xl md:text-4xl"
        )}>
          {message}
        </p>
      </div>

      <div className={cn(
        "relative z-10 mt-3 text-center transition-all duration-700",
        phase >= 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}>
        <p className="text-base text-muted-foreground">
          {subMessage}
        </p>
      </div>

      {isMilestone && phase >= 3 && milestone?.reached && (
        <div className={cn(
          "relative z-10 mt-6 flex items-center gap-2 transition-all duration-500",
          phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {MILESTONES.filter(m => m <= streak).map(m => (
            <span 
              key={m} 
              className={cn(
                "text-lg transition-all",
                m === streak ? "text-2xl scale-110" : "opacity-40 grayscale"
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

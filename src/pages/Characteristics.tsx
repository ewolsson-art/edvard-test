import { useNavigate } from 'react-router-dom';
import { Zap, Cloud, Sun, ChevronRight, Sparkles } from 'lucide-react';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CharacteristicsSharingSection } from '@/components/CharacteristicsSharingSection';

const moodCards = [
  {
    type: 'elevated' as const,
    slug: 'uppvarvad',
    title: 'Uppvarvad',
    subtitle: 'Period med förhöjt stämningsläge',
    icon: Zap,
    iconColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    chipColor: 'text-amber-300/70',
  },
  {
    type: 'stable' as const,
    slug: 'stabil',
    title: 'Stabil',
    subtitle: 'Period i balans',
    icon: Sun,
    iconColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    chipColor: 'text-emerald-300/70',
  },
  {
    type: 'depressed' as const,
    slug: 'nedstamd',
    title: 'Nedstämd',
    subtitle: 'Period med sänkt stämningsläge',
    icon: Cloud,
    iconColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    chipColor: 'text-rose-300/70',
  },
];

const Characteristics = () => {
  const navigate = useNavigate();
  const {
    elevatedCharacteristics,
    depressedCharacteristics,
    stableCharacteristics,
    isLoading,
  } = useCharacteristics();

  const { entries, isLoaded: moodLoaded } = useMoodData();
  const latestMood = entries.length > 0
    ? entries.sort((a, b) => b.timestamp - a.timestamp)[0]?.mood
    : null;

  const getCharacteristics = (type: string) => {
    if (type === 'elevated') return elevatedCharacteristics;
    if (type === 'stable') return stableCharacteristics;
    return depressedCharacteristics;
  };

  if (isLoading || !moodLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto md:mx-0">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          Mina kännetecken
        </h1>
        <p className="text-[13px] text-foreground/30">
          Lär känna dina mönster – det hjälper dig och din vårdgivare att tidigt upptäcka förändringar.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {moodCards.map((card, index) => {
          const Icon = card.icon;
          const chars = getCharacteristics(card.type);
          const isActive = latestMood === card.type;

          return (
            <button
              key={card.type}
              onClick={() => navigate(`/kannetecken/${card.slug}`)}
              className={cn(
                "w-full relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 md:p-7",
                "flex items-center gap-5 text-left",
                "transition-all duration-300 group",
                "hover:scale-[1.015] hover:border-border",
                card.hoverShadow,
                isActive && card.borderActive
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Subtle gradient overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-r opacity-60 pointer-events-none", card.gradient)} />

              {/* Icon */}
              <div className={cn(
                "relative z-10 p-3.5 rounded-2xl shrink-0 shadow-lg",
                card.iconBg
              )}>
                <Icon className={cn("h-7 w-7", card.iconColor)} />
              </div>

              {/* Content */}
              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="font-bold text-xl text-foreground tracking-tight">{card.title}</h2>
                  {isActive && (
                    <span className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full animate-pulse", card.activeDot)} />
                      <span className="text-xs font-medium text-muted-foreground">Nu</span>
                    </span>
                  )}
                </div>

                {chars.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {chars.slice(0, 4).map((c) => (
                      <span key={c.id} className={cn("text-xs py-1 px-2.5 rounded-full font-medium", card.badgeItem)}>
                        {c.name}
                      </span>
                    ))}
                    {chars.length > 4 && (
                      <span className={cn("text-xs font-semibold self-center", card.countColor)}>
                        +{chars.length - 4}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">{card.subtitle}</p>
                )}
              </div>

              {/* Arrow */}
              <div className="relative z-10 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-muted/50 group-hover:bg-muted flex items-center justify-center transition-all duration-300">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sharing section */}
      <div className="mt-10">
        <CharacteristicsSharingSection />
      </div>
      </div>
    </div>
  );
};

export default Characteristics;

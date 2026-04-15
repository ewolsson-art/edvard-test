import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Cloud, Sun, ChevronRight, Sparkles } from 'lucide-react';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CharacteristicsSharingSection } from '@/components/CharacteristicsSharingSection';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
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
      <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden divide-y divide-border/20">
        {moodCards.map((card) => {
          const Icon = card.icon;
          const chars = getCharacteristics(card.type);
          const isActive = latestMood === card.type;

          return (
            <button
              key={card.type}
              onClick={() => navigate(`/kannetecken/${card.slug}`)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-5 text-left transition-all duration-200",
                "hover:bg-foreground/[0.04] active:bg-foreground/[0.06] group",
                isActive && "bg-foreground/[0.02]"
              )}
            >
              {/* Icon */}
              <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", card.iconColor)} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-0.5">
                  <span className="text-[15px] font-medium text-foreground/80">{card.title}</span>
                  {isActive && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-foreground/[0.04]">
                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", card.dotColor)} />
                      <span className="text-[10px] font-medium text-foreground/40">Nuvarande</span>
                    </span>
                  )}
                </div>

                {chars.length > 0 ? (
                  <p className="text-[11px] text-foreground/20 mt-1">
                    {chars.slice(0, 4).map(c => c.name).join(' · ')}
                    {chars.length > 4 && ` +${chars.length - 4}`}
                  </p>
                ) : (
                  <p className="text-[12px] text-foreground/25 mt-0.5">{card.subtitle}</p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-foreground/15 flex-shrink-0 group-hover:text-foreground/30 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Sharing section */}
      <div className="mt-12">
        <CharacteristicsSharingSection />
      </div>
      </div>
    </div>
  );
};

export default Characteristics;

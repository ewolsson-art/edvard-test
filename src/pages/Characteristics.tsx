import { useNavigate } from 'react-router-dom';
import { Zap, Cloud, Sun, ChevronRight } from 'lucide-react';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CharacteristicsSharingSection } from '@/components/CharacteristicsSharingSection';

const moodCards = [
  {
    type: 'elevated' as const,
    slug: 'uppvarvad',
    title: 'Uppvarvad period',
    description: 'Kännetecken när du är uppvarvad',
    icon: Zap,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    activeBadge: 'bg-amber-500 text-white',
    activeLabel: 'Aktuellt mående',
    badgeItem: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    borderActive: 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-800',
  },
  {
    type: 'stable' as const,
    slug: 'stabil',
    title: 'Stabil period',
    description: 'Kännetecken när du är i balans',
    icon: Sun,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    activeBadge: 'bg-emerald-500 text-white',
    activeLabel: 'Aktuellt mående',
    badgeItem: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    borderActive: 'ring-2 ring-emerald-400 dark:ring-emerald-500 shadow-lg',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-800',
  },
  {
    type: 'depressed' as const,
    slug: 'nedstamd',
    title: 'Nedstämd period',
    description: 'Kännetecken när du är nedstämd',
    icon: Cloud,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    activeBadge: 'bg-red-500 text-white',
    activeLabel: 'Aktuellt mående',
    badgeItem: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    borderActive: 'ring-2 ring-red-400 dark:ring-red-500 shadow-lg',
    hoverBorder: 'hover:border-red-300 dark:hover:border-red-800',
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
    <div className="max-w-2xl mx-auto py-8 px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mina kännetecken</h1>
        <p className="text-muted-foreground">
          Identifiera hur du brukar känna dig i olika perioder. Det kan hjälpa dig och din vårdgivare att tidigt upptäcka förändringar.
        </p>
      </div>

      <div className="space-y-4">
        {moodCards.map((card) => {
          const Icon = card.icon;
          const chars = getCharacteristics(card.type);
          const isActive = latestMood === card.type;

          return (
            <button
              key={card.type}
              onClick={() => navigate(`/kannetecken/${card.slug}`)}
              className={cn(
                "w-full glass-card p-6 md:p-8 flex items-center gap-5 text-left transition-all duration-300 group hover:scale-[1.01] hover:shadow-lg",
                card.hoverBorder,
                isActive && card.borderActive
              )}
            >
              <div className={cn("p-4 rounded-2xl shrink-0", card.iconBg)}>
                <Icon className={cn("h-8 w-8", card.iconColor)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  <h2 className="font-bold text-xl text-foreground">{card.title}</h2>
                  {isActive && (
                    <Badge className={cn("text-[10px] px-2.5 py-0.5", card.activeBadge)}>
                      {card.activeLabel}
                    </Badge>
                  )}
                </div>

                {chars.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {chars.slice(0, 5).map((c) => (
                      <Badge key={c.id} variant="secondary" className={cn("text-sm py-1 px-3", card.badgeItem)}>
                        {c.name}
                      </Badge>
                    ))}
                    {chars.length > 5 && (
                      <span className="text-sm text-muted-foreground self-center">
                        +{chars.length - 5} till
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{card.description}</p>
                )}
              </div>

              <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Sharing section */}
      <div className="mt-8">
        <CharacteristicsSharingSection />
      </div>
    </div>
  );
};

export default Characteristics;

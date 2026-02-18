import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Zap, Cloud, Sun, ChevronLeft, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { cn } from '@/lib/utils';

const MOOD_CONFIG = {
  uppvarvad: {
    type: 'elevated' as const,
    title: 'Uppvarvad period',
    description: 'Hur känner du dig när du är uppvarvad?',
    icon: Zap,
    colorClasses: {
      badge: 'bg-amber-500 text-white',
      badgeItem: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20',
      badgeItemHover: 'hover:bg-amber-500/15',
      iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
      iconColor: 'text-white',
      button: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40',
      suggestion: 'bg-amber-500/8 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/15 hover:border-amber-500/30',
      headerGradient: 'from-amber-500/15 via-amber-400/5 to-transparent',
      activeDot: 'bg-amber-500',
      emptyBorder: 'border-amber-500/20',
      inputRing: 'focus-within:ring-amber-500/30',
    },
    suggestions: ['Mer social', 'Sover mindre', 'Mer energi', 'Pratar snabbare', 'Tar fler initiativ', 'Rastlös'],
    placeholder: 'T.ex. Mer social, Pratar snabbare...',
    badgeLabel: 'Aktuellt mående',
  },
  stabil: {
    type: 'stable' as const,
    title: 'Stabil period',
    description: 'Hur känner du dig när du är i balans?',
    icon: Sun,
    colorClasses: {
      badge: 'bg-emerald-500 text-white',
      badgeItem: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20',
      badgeItemHover: 'hover:bg-emerald-500/15',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      iconColor: 'text-white',
      button: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40',
      suggestion: 'bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15 hover:border-emerald-500/30',
      headerGradient: 'from-emerald-500/15 via-emerald-400/5 to-transparent',
      activeDot: 'bg-emerald-500',
      emptyBorder: 'border-emerald-500/20',
      inputRing: 'focus-within:ring-emerald-500/30',
    },
    suggestions: ['God sömn', 'Regelbundna rutiner', 'Fokuserad', 'Social balans', 'Stabil aptit', 'Lugn'],
    placeholder: 'T.ex. God sömn, Lugn och fokuserad...',
    badgeLabel: 'Aktuellt mående',
  },
  nedstamd: {
    type: 'depressed' as const,
    title: 'Nedstämd period',
    description: 'Hur känner du dig när du är nedstämd?',
    icon: Cloud,
    colorClasses: {
      badge: 'bg-rose-500 text-white',
      badgeItem: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20',
      badgeItemHover: 'hover:bg-rose-500/15',
      iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
      iconColor: 'text-white',
      button: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40',
      suggestion: 'bg-rose-500/8 hover:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/15 hover:border-rose-500/30',
      headerGradient: 'from-rose-500/15 via-rose-400/5 to-transparent',
      activeDot: 'bg-rose-500',
      emptyBorder: 'border-rose-500/20',
      inputRing: 'focus-within:ring-rose-500/30',
    },
    suggestions: ['Drar mig undan', 'Sover mer', 'Mindre energi', 'Svårt att koncentrera', 'Tappar aptiten', 'Gråter lättare'],
    placeholder: 'T.ex. Drar mig undan, Sover mer...',
    badgeLabel: 'Aktuellt mående',
  },
};

const CharacteristicDetail = () => {
  const { moodType } = useParams<{ moodType: string }>();
  const navigate = useNavigate();
  const config = moodType ? MOOD_CONFIG[moodType as keyof typeof MOOD_CONFIG] : null;

  const {
    elevatedCharacteristics,
    depressedCharacteristics,
    stableCharacteristics,
    isLoading,
    addCharacteristic,
    deleteCharacteristic,
  } = useCharacteristics();

  const { entries, isLoaded: moodLoaded } = useMoodData();
  const latestMood = entries.length > 0
    ? entries.sort((a, b) => b.timestamp - a.timestamp)[0]?.mood
    : null;

  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  if (!config) {
    navigate('/kannetecken');
    return null;
  }

  const characteristics = config.type === 'elevated'
    ? elevatedCharacteristics
    : config.type === 'stable'
    ? stableCharacteristics
    : depressedCharacteristics;

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setIsAdding(true);
    const success = await addCharacteristic(newValue, config.type);
    if (success) {
      setNewValue('');
      setShowInput(false);
    }
    setIsAdding(false);
  };

  if (isLoading || !moodLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = config.icon;
  const isActive = latestMood === config.type;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 md:px-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/kannetecken')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Tillbaka till kännetecken
      </button>

      {/* Hero header */}
      <div className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 md:p-10 mb-8"
      )}>
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80 pointer-events-none", config.colorClasses.headerGradient)} />
        
        <div className="relative z-10 flex items-start gap-5">
          <div className={cn("p-4 rounded-2xl shadow-lg shrink-0", config.colorClasses.iconBg)}>
            <Icon className={cn("h-8 w-8", config.colorClasses.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {config.title}
              </h1>
              {isActive && (
                <span className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/50">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", config.colorClasses.activeDot)} />
                  <span className="text-xs font-medium text-muted-foreground">{config.badgeLabel}</span>
                </span>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Add section */}
      <div className="mb-8">
        {showInput ? (
          <div className={cn(
            "flex gap-2 p-4 rounded-2xl border border-border/60 bg-card animate-in fade-in slide-in-from-top-2 duration-200",
            config.colorClasses.inputRing
          )}>
            <Input
              placeholder={config.placeholder}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setShowInput(false);
                  setNewValue('');
                }
              }}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowInput(false);
                setNewValue('');
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-xl"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newValue.trim() || isAdding}
              className={cn("shrink-0 rounded-xl px-5", config.colorClasses.button)}
            >
              Lägg till
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            className={cn("gap-2.5 rounded-xl px-6 py-5 text-base font-semibold transition-all duration-300", config.colorClasses.button)}
          >
            <Plus className="h-5 w-5" />
            Lägg till kännetecken
          </Button>
        )}
      </div>

      {/* Characteristics list */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Dina kännetecken</h2>
          {characteristics.length > 0 && (
            <span className="text-sm text-muted-foreground">{characteristics.length} st</span>
          )}
        </div>
        {characteristics.length === 0 ? (
          <div className={cn("text-center py-10 rounded-xl border-2 border-dashed", config.colorClasses.emptyBorder)}>
            <div className={cn("w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center opacity-40", config.colorClasses.iconBg)}>
              <Icon className={cn("h-6 w-6", config.colorClasses.iconColor)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Inga kännetecken tillagda ännu
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Tryck på knappen ovan eller välj ett förslag nedan
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {characteristics.map((char) => (
              <span
                key={char.id}
                className={cn(
                  "inline-flex items-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-colors",
                  config.colorClasses.badgeItem,
                  config.colorClasses.badgeItemHover
                )}
              >
                {char.name}
                <button
                  onClick={() => deleteCharacteristic(char.id)}
                  className="text-destructive/60 hover:text-destructive transition-colors"
                  aria-label={`Ta bort ${char.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
        <div className="flex items-center gap-2.5 mb-4">
          <Lightbulb className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Förslag att komma igång</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setNewValue(suggestion);
                setShowInput(true);
              }}
              className={cn(
                "text-sm px-4 py-2 rounded-full font-medium transition-all duration-200 hover:scale-[1.03]",
                config.colorClasses.suggestion
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacteristicDetail;

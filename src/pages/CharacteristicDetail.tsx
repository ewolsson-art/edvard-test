import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Zap, Cloud, Sun, ChevronLeft } from 'lucide-react';
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
      badgeItem: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
      suggestion: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      border: 'border-amber-100 dark:border-amber-900/30',
      ring: 'ring-amber-400 dark:ring-amber-500',
      headerGradient: 'from-amber-500/10 to-transparent',
    },
    suggestions: ['Mer social', 'Sover mindre', 'Mer energi', 'Pratar snabbare', 'Tar fler initiativ', 'Rastlös'],
    placeholder: 'T.ex. Mer social, Pratar snabbare...',
    badgeLabel: 'Senaste incheckning: Uppvarvad',
  },
  stabil: {
    type: 'stable' as const,
    title: 'Stabil period',
    description: 'Hur känner du dig när du är i balans?',
    icon: Sun,
    colorClasses: {
      badge: 'bg-emerald-500 text-white',
      badgeItem: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      suggestion: 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      ring: 'ring-emerald-400 dark:ring-emerald-500',
      headerGradient: 'from-emerald-500/10 to-transparent',
    },
    suggestions: ['God sömn', 'Regelbundna rutiner', 'Fokuserad', 'Social balans', 'Stabil aptit', 'Lugn'],
    placeholder: 'T.ex. God sömn, Lugn och fokuserad...',
    badgeLabel: 'Senaste incheckning: Stabilt',
  },
  nedstamd: {
    type: 'depressed' as const,
    title: 'Nedstämd period',
    description: 'Hur känner du dig när du är nedstämd?',
    icon: Cloud,
    colorClasses: {
      badge: 'bg-red-500 text-white',
      badgeItem: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      button: 'bg-red-500 hover:bg-red-600 text-white',
      suggestion: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300',
      border: 'border-red-100 dark:border-red-900/30',
      ring: 'ring-red-400 dark:ring-red-500',
      headerGradient: 'from-red-500/10 to-transparent',
    },
    suggestions: ['Drar mig undan', 'Sover mer', 'Mindre energi', 'Svårt att koncentrera', 'Tappar aptiten', 'Gråter lättare'],
    placeholder: 'T.ex. Drar mig undan, Sover mer...',
    badgeLabel: 'Senaste incheckning: Nedstämd',
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
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/kannetecken')}
        className="mb-6 gap-1.5"
      >
        <ChevronLeft className="w-4 h-4" />
        Tillbaka
      </Button>

      {/* Header */}
      <div className={cn("glass-card p-6 mb-6 bg-gradient-to-br", config.colorClasses.headerGradient)}>
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("p-4 rounded-2xl", config.colorClasses.iconBg)}>
            <Icon className={cn("h-8 w-8", config.colorClasses.iconColor)} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
        {isActive && (
          <Badge className={cn("text-xs", config.colorClasses.badge)}>
            {config.badgeLabel}
          </Badge>
        )}
      </div>

      {/* Add button */}
      <div className="mb-6">
        {showInput ? (
          <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
              className="flex-1"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowInput(false);
                setNewValue('');
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newValue.trim() || isAdding}
              className={cn("shrink-0", config.colorClasses.button)}
            >
              Lägg till
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            className={cn("gap-2", config.colorClasses.button)}
          >
            <Plus className="h-4 w-4" />
            Lägg till kännetecken
          </Button>
        )}
      </div>

      {/* Characteristics list */}
      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Mina kännetecken</h2>
        {characteristics.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">
            Inga kännetecken tillagda ännu. Tryck på knappen ovan för att lägga till.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {characteristics.map((char) => (
              <Badge
                key={char.id}
                variant="secondary"
                className={cn("gap-1.5 py-2 px-4 text-sm", config.colorClasses.badgeItem)}
              >
                {char.name}
                <button
                  onClick={() => deleteCharacteristic(char.id)}
                  className="ml-1 text-destructive hover:text-destructive/80 transition-colors"
                  aria-label={`Ta bort ${char.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="glass-card p-6">
        <p className="text-sm text-muted-foreground font-medium mb-3">Vanliga exempel:</p>
        <div className="flex flex-wrap gap-2">
          {config.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setNewValue(suggestion);
                setShowInput(true);
              }}
              className={cn("text-sm px-4 py-2 rounded-full transition-colors", config.colorClasses.suggestion)}
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

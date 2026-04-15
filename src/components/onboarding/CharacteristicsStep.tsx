import { useState } from 'react';
import { Plus, X, TrendingUp, Sun, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const SUGGESTIONS = {
  elevated: ['Pratar mycket', 'Sover mindre', 'Rastlös', 'Impulsiv', 'Irriterad', 'Energisk'],
  stable: ['Balanserad', 'God sömn', 'Fokuserad', 'Lugn', 'Social', 'Produktiv'],
  depressed: ['Trött', 'Isolerar mig', 'Hopplös', 'Ångest', 'Sömnproblem', 'Aptitlös'],
};

export interface CharacteristicsInput {
  elevated: string[];
  stable: string[];
  depressed: string[];
}

interface CharacteristicsStepProps {
  characteristics: CharacteristicsInput;
  onCharacteristicsChange: (characteristics: CharacteristicsInput) => void;
}

type MoodType = 'elevated' | 'stable' | 'depressed';

const MOOD_CONFIG = {
  elevated: {
    label: 'Uppvarvad',
    icon: TrendingUp,
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  stable: {
    label: 'Stabil',
    icon: Sun,
    color: 'emerald',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    iconClass: 'text-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  depressed: {
    label: 'Nedstämd',
    icon: TrendingDown,
    color: 'red',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
};

export const CharacteristicsStep = ({ characteristics, onCharacteristicsChange }: CharacteristicsStepProps) => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState<Record<MoodType, string>>({
    elevated: '',
    stable: '',
    depressed: '',
  });

  const handleAdd = (type: MoodType, value: string) => {
    if (!value.trim()) return;
    const trimmed = value.trim();
    if (characteristics[type].some(c => c.toLowerCase() === trimmed.toLowerCase())) return;

    onCharacteristicsChange({
      ...characteristics,
      [type]: [...characteristics[type], trimmed],
    });
    setInputs(prev => ({ ...prev, [type]: '' }));
  };

  const handleRemove = (type: MoodType, value: string) => {
    onCharacteristicsChange({
      ...characteristics,
      [type]: characteristics[type].filter(c => c !== value),
    });
  };

  const handleKeyDown = (type: MoodType, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(type, inputs[type]);
    }
  };

  const totalCount = characteristics.elevated.length + characteristics.stable.length + characteristics.depressed.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground text-center mb-2">
        Lägg till kännetecken för olika perioder så du och dina närstående kan känna igen mönster
      </p>

      <div className="space-y-3">
        {(['elevated', 'stable', 'depressed'] as MoodType[]).map((type) => {
          const config = MOOD_CONFIG[type];
          const Icon = config.icon;
          const items = characteristics[type];
          const availableSuggestions = SUGGESTIONS[type].filter(
            s => !items.some(i => i.toLowerCase() === s.toLowerCase())
          );

          return (
            <div 
              key={type}
              className={cn(
                "rounded-xl border p-3",
                config.bgClass,
                config.borderClass
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", config.iconClass)} />
                <span className="text-sm font-medium">{config.label}</span>
              </div>

              {/* Added characteristics */}
              {items.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {items.map((item) => (
                    <Badge
                      key={item}
                      className={cn("pl-2 pr-1 py-0.5 text-[10px] flex items-center gap-1", config.badgeClass)}
                    >
                      {item}
                      <button
                        onClick={() => handleRemove(type, item)}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex gap-1.5">
                <Input
                  value={inputs[type]}
                  onChange={(e) => setInputs(prev => ({ ...prev, [type]: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(type, e)}
                  placeholder="Skriv kännetecken..."
                  className="h-7 text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleAdd(type, inputs[type])}
                  disabled={!inputs[type].trim()}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    inputs[type].trim() 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick suggestions */}
              {availableSuggestions.length > 0 && items.length < 3 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {availableSuggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleAdd(type, suggestion)}
                      className="px-1.5 py-0.5 text-[9px] rounded-full border border-current/20 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalCount === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Du kan hoppa över detta och lägga till kännetecken senare
        </p>
      )}
    </div>
  );
};

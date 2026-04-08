import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Zap, Cloud, Sun, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MOOD_CONFIG = {
  uppvarvad: {
    type: 'elevated' as const,
    title: 'Uppvarvad period',
    description: 'Hur känner du igen den här perioden?',
    icon: Zap,
    iconColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    placeholder: 'T.ex. Mer social, Pratar snabbare...',
  },
  stabil: {
    type: 'stable' as const,
    title: 'Stabil period',
    description: 'Hur känner du igen den här perioden?',
    icon: Sun,
    iconColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    placeholder: 'T.ex. God sömn, Lugn och fokuserad...',
  },
  nedstamd: {
    type: 'depressed' as const,
    title: 'Nedstämd period',
    description: 'Hur känner du igen den här perioden?',
    icon: Cloud,
    iconColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    placeholder: 'T.ex. Drar mig undan, Sover mer...',
  },
};

const CharacteristicDetail = () => {
  const { moodType } = useParams<{ moodType: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiPatterns, setAiPatterns] = useState<string[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);

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
      setAiSuggestions(prev => prev.filter(s => s.toLowerCase() !== newValue.trim().toLowerCase()));
    }
    setIsAdding(false);
  };

  const handleAddSuggestion = async (suggestion: string) => {
    const success = await addCharacteristic(suggestion, config.type);
    if (success) {
      setAiSuggestions(prev => prev.filter(s => s !== suggestion));
    }
  };

  const handleDismissSuggestion = (suggestion: string) => {
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const loadAiSuggestions = async () => {
    if (!user) return;
    setIsLoadingAi(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-characteristics', {
        body: { moodType: config.type },
      });
      if (error) throw error;
      setAiSuggestions(data.suggestions || []);
      setAiPatterns(data.patternsFound || []);
      setAiLoaded(true);
    } catch (error: any) {
      console.error('Error loading AI suggestions:', error);
      toast({
        title: 'Kunde inte hämta förslag',
        description: 'Försök igen senare.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAi(false);
    }
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
    <div className="p-5 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto md:mx-0">
        {/* Back */}
        <button
          onClick={() => navigate('/kannetecken')}
          className="mb-8 inline-flex items-center gap-1 text-[13px] text-foreground/30 hover:text-foreground/50 transition-colors group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Tillbaka till kännetecken
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <Icon className={cn("w-[18px] h-[18px]", config.iconColor)} />
            <h1 className="font-display text-2xl font-bold text-foreground">
              {config.title}
            </h1>
            {isActive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-foreground/[0.04]">
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.dotColor)} />
                <span className="text-[10px] font-medium text-foreground/40">Nuvarande</span>
              </span>
            )}
          </div>
          <p className="text-[13px] text-foreground/30 ml-[30px]">
            {config.description}
          </p>
        </div>

        {/* Dina kännetecken – primary section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide">
              Dina kännetecken
            </h2>
            {characteristics.length > 0 && (
              <span className="text-[12px] text-foreground/20">{characteristics.length} st</span>
            )}
          </div>

          {characteristics.length > 0 && (
            <div className="space-y-1">
              {characteristics.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-foreground/[0.03] transition-all duration-200 group cursor-default"
                >
                  <span className="text-[14px] text-foreground/70">{char.name}</span>
                  <button
                    onClick={() => deleteCharacteristic(char.id)}
                    className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-destructive transition-all duration-200 p-1 -m-1"
                    aria-label={`Ta bort ${char.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inline add */}
          {showInput ? (
            <div className="flex items-center gap-2 mt-2 px-4">
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
                className="flex-1 border-0 border-b border-foreground/[0.06] rounded-none bg-transparent shadow-none focus-visible:ring-0 text-[14px] h-8 px-0"
                autoFocus
              />
              <button
                onClick={handleAdd}
                disabled={!newValue.trim() || isAdding}
                className="text-[13px] font-medium text-primary hover:text-primary/80 disabled:text-foreground/15 transition-colors"
              >
                Spara
              </button>
              <button
                onClick={() => { setShowInput(false); setNewValue(''); }}
                className="text-foreground/20 hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className={cn(
                "inline-flex items-center gap-1.5 text-[13px] transition-all duration-200 mt-1 px-4",
                "text-foreground/25 hover:text-foreground/45"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              {characteristics.length === 0 ? 'Lägg till ditt första kännetecken' : 'Lägg till kännetecken'}
            </button>
          )}
        </div>

        {/* AI suggestions – secondary, inline */}
        <div className="mb-8 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-foreground/20" />
            <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide">
              AI-förslag
            </h2>
          </div>

          {!aiLoaded && !isLoadingAi ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] text-foreground/25">Analysera dina dagboksanteckningar för att hitta mönster</p>
              <button
                onClick={loadAiSuggestions}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-all duration-200 w-fit"
              >
                <Sparkles className="w-3 h-3" />
                Analysera
              </button>
            </div>
          ) : isLoadingAi ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/20" />
              <p className="text-[13px] text-foreground/20">Analyserar…</p>
            </div>
          ) : aiSuggestions.length > 0 ? (
            <div>
              {aiPatterns.length > 0 && (
                <div className="mb-3 space-y-0.5">
                  {aiPatterns.map((p, i) => (
                    <p key={i} className="text-[11px] text-foreground/20 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-foreground/15" />
                      {p}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion) => (
                  <span key={suggestion} className="inline-flex items-center gap-1">
                    <button
                      onClick={() => handleAddSuggestion(suggestion)}
                      className="text-[13px] px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-foreground/[0.06] text-foreground/30 hover:text-foreground/50 hover:bg-foreground/[0.06] transition-all"
                    >
                      + {suggestion}
                    </button>
                    <button
                      onClick={() => handleDismissSuggestion(suggestion)}
                      className="p-0.5 text-foreground/15 hover:text-foreground/30 transition-colors"
                      aria-label={`Avfärda ${suggestion}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-foreground/20">
              {entries.length < 5
                ? "Du behöver fler incheckningar för att få förslag."
                : "Inga nya förslag just nu."}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default CharacteristicDetail;

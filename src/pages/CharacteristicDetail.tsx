import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Zap, Cloud, Sun, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    chipText: 'text-foreground/60',
    chipBg: 'bg-foreground/[0.04] hover:bg-foreground/[0.06]',
    chipBorder: 'border-foreground/[0.06]',
    suggestionText: 'text-amber-300/70',
    suggestions: ['Mer social', 'Sover mindre', 'Mer energi', 'Pratar snabbare', 'Tar fler initiativ', 'Rastlös'],
    placeholder: 'T.ex. Mer social, Pratar snabbare...',
  },
  stabil: {
    type: 'stable' as const,
    title: 'Stabil period',
    description: 'Hur känner du igen den här perioden?',
    icon: Sun,
    iconColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    chipText: 'text-foreground/60',
    chipBg: 'bg-foreground/[0.04] hover:bg-foreground/[0.06]',
    chipBorder: 'border-foreground/[0.06]',
    suggestionText: 'text-emerald-300/70',
    suggestions: ['God sömn', 'Regelbundna rutiner', 'Fokuserad', 'Social balans', 'Stabil aptit', 'Lugn'],
    placeholder: 'T.ex. God sömn, Lugn och fokuserad...',
  },
  nedstamd: {
    type: 'depressed' as const,
    title: 'Nedstämd period',
    description: 'Hur känner du igen den här perioden?',
    icon: Cloud,
    iconColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    chipText: 'text-foreground/60',
    chipBg: 'bg-foreground/[0.04] hover:bg-foreground/[0.06]',
    chipBorder: 'border-foreground/[0.06]',
    suggestionText: 'text-rose-300/70',
    suggestions: ['Drar mig undan', 'Sover mer', 'Mindre energi', 'Svårt att koncentrera', 'Tappar aptiten', 'Gråter lättare'],
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

        {/* Characteristics section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide">
              Dina kännetecken
            </h2>
            {characteristics.length > 0 && (
              <span className="text-[12px] text-foreground/20">{characteristics.length} st</span>
            )}
          </div>

          <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden">
            {characteristics.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-foreground/25">
                  Inga kännetecken tillagda ännu
                </p>
                <p className="text-[11px] text-foreground/15 mt-1">
                  Lägg till manuellt eller låt AI analysera dina anteckningar
                </p>
              </div>
            ) : (
              <div className="px-4 py-4 flex flex-wrap gap-2">
                {characteristics.map((char) => (
                  <span
                    key={char.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-[13px]",
                      "bg-foreground/[0.04] border border-foreground/[0.06]",
                      "text-foreground/60 transition-colors"
                    )}
                  >
                    {char.name}
                    <button
                      onClick={() => deleteCharacteristic(char.id)}
                      className="text-foreground/20 hover:text-destructive transition-colors"
                      aria-label={`Ta bort ${char.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Inline add */}
            <div className="border-t border-border/20">
              {showInput ? (
                <div className="flex items-center gap-2 px-4 py-3">
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
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-[14px] h-8 px-0"
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
                  className="w-full flex items-center gap-2 px-4 py-3.5 text-[13px] text-foreground/25 hover:text-foreground/40 hover:bg-foreground/[0.02] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Lägg till kännetecken
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Suggestions section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-foreground/20" />
            <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide">
              AI-förslag
            </h2>
          </div>

          <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden">
            {!aiLoaded && !isLoadingAi ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] text-foreground/25 mb-3">
                  Analysera dina dagboksanteckningar för personliga förslag
                </p>
                <button
                  onClick={loadAiSuggestions}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analysera mina anteckningar
                </button>
              </div>
            ) : isLoadingAi ? (
              <div className="flex items-center justify-center gap-2.5 py-8">
                <Loader2 className="w-4 h-4 animate-spin text-foreground/20" />
                <p className="text-[13px] text-foreground/25">Analyserar dina incheckningar…</p>
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="px-4 py-4">
                {aiPatterns.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <p className="text-[11px] font-medium text-foreground/25">Mönster vi hittade:</p>
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
                        className="text-[13px] px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-foreground/[0.06] text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.06] transition-all"
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
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] text-foreground/25">
                  {entries.length < 5
                    ? "Du behöver fler incheckningar med kommentarer för att få förslag."
                    : "Inga nya förslag just nu. Fortsätt logga så kommer fler!"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Static suggestions */}
        <div>
          <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide mb-3">
            Vanliga förslag
          </h2>
          <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {config.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setNewValue(suggestion);
                    setShowInput(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-[13px] px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-foreground/[0.06] text-foreground/30 hover:text-foreground/50 hover:bg-foreground/[0.06] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacteristicDetail;

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Zap, Cloud, Sun, ChevronLeft, Sparkles, Loader2, Info, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const MOOD_CONFIG = {
  uppvarvad: {
    type: 'elevated' as const,
    titleKey: 'characteristics.elevatedPeriod',
    descKey: 'characteristics.howRecognize',
    icon: Zap,
    iconColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    placeholderKey: 'characteristics.placeholderElevated',
  },
  stabil: {
    type: 'stable' as const,
    titleKey: 'characteristics.stablePeriod',
    descKey: 'characteristics.howRecognize',
    icon: Sun,
    iconColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    placeholderKey: 'characteristics.placeholderStable',
  },
  nedstamd: {
    type: 'depressed' as const,
    titleKey: 'characteristics.depressedPeriod',
    descKey: 'characteristics.howRecognize',
    icon: Cloud,
    iconColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    placeholderKey: 'characteristics.placeholderDepressed',
  },
};

interface AISuggestion {
  name: string;
  reason: string;
}

const CharacteristicDetail = () => {
  const { t } = useTranslation();
  const { moodType } = useParams<{ moodType: string }>();
  const navigate = useNavigate();
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

  // AI insights state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());

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

  const handleFetchAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-characteristics', {
        body: { moodType: config.type },
      });

      if (error) throw error;

      if (data?.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiSuggestions([]);
        setAiError(data?.message || t('characteristics.noSuggestionsNow'));
      }
      setAiLoaded(true);
    } catch (e) {
      console.error('AI suggestions error:', e);
      setAiError(t('characteristics.couldNotFetchSuggestions'));
      setAiLoaded(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSuggestion = async (suggestion: AISuggestion) => {
    const success = await addCharacteristic(suggestion.name, config.type);
    if (success) {
      setAddedSuggestions(prev => new Set(prev).add(suggestion.name));
      toast({ title: t('characteristics.addedLabel', { name: suggestion.name }) });
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
          {t('characteristics.backToCharacteristics')}
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <Icon className={cn("w-[18px] h-[18px]", config.iconColor)} />
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t(config.titleKey)}
            </h1>
            {isActive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-foreground/[0.04]">
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.dotColor)} />
                <span className="text-[10px] font-medium text-foreground/40">{t('characteristics.current')}</span>
              </span>
            )}
          </div>
          <p className="text-[13px] text-foreground/30 ml-[30px]">
            {t(config.descKey)}
          </p>
        </div>

        {/* {t('characteristics.yourCharacteristics')} */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide">
              {t('characteristics.yourCharacteristics')}
            </h2>
            {characteristics.length > 0 && (
              <span className="text-[12px] text-foreground/20">{t('characteristics.count', { count: characteristics.length })}</span>
            )}
          </div>

          {characteristics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {characteristics.map((char) => (
                <div
                  key={char.id}
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-foreground/[0.04] border border-foreground/[0.06] hover:bg-foreground/[0.06] transition-all duration-200 cursor-default"
                >
                  <span className="text-[13px] text-foreground/60 group-hover:text-foreground/80 transition-colors">{char.name}</span>
                  <button
                    onClick={() => deleteCharacteristic(char.id)}
                    className="opacity-0 group-hover:opacity-100 text-foreground/25 hover:text-destructive transition-all duration-150 -mr-1"
                    aria-label={t('common.delete')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inline add */}
          {showInput ? (
            <div className="flex items-center gap-2 mt-2">
              <Input
                placeholder={t(config.placeholderKey)}
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
                {t('common.save')}
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
              className="mt-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_4px_16px_hsl(45_85%_55%/0.3)] hover:shadow-[0_6px_24px_hsl(45_85%_55%/0.45)] hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label={t('characteristics.addCharacteristic')}
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </button>
          )}
        </div>

        {/* AI Insights Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary/60" />
            <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide">
              {t('characteristics.aiSuggestions')}
            </h2>
          </div>

          {!aiLoaded && !aiLoading && (
            <div className="rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05] p-5">
              <p className="text-[13px] text-foreground/40 mb-4">
                {t('characteristics.analyzeCheckins')}
              </p>
              <button
                onClick={handleFetchAI}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.08] text-[13px] font-medium text-foreground/50 hover:text-foreground/70 transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('characteristics.analyze')}
              </button>
            </div>
          )}

          {aiLoading && (
            <div className="rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05] p-6 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-foreground/30" />
              <span className="text-[13px] text-foreground/30">{t('characteristics.analyzingCheckins')}</span>
            </div>
          )}

          {aiLoaded && aiError && (
            <div className="rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05] p-5">
              <p className="text-[13px] text-foreground/35">{aiError}</p>
            </div>
          )}

          {aiLoaded && aiSuggestions.length > 0 && (
            <div className="space-y-3">
              {/* Disclaimer */}
              <div className="flex items-start gap-2 px-1 mb-1">
                <Info className="w-3.5 h-3.5 text-foreground/20 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground/25 leading-relaxed">
                  {t('characteristics.aiDisclaimer')}
                </p>
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                {aiSuggestions.map((suggestion, i) => {
                  const isAdded = addedSuggestions.has(suggestion.name);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                        isAdded
                          ? "bg-foreground/[0.02]"
                          : "bg-foreground/[0.03] hover:bg-foreground/[0.05]"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[13px] font-medium",
                          isAdded ? "text-foreground/30 line-through" : "text-foreground/60"
                        )}>
                          {suggestion.name}
                        </p>
                        {suggestion.reason && (
                          <p className="text-[11px] text-foreground/20 mt-0.5 line-clamp-1">
                            {suggestion.reason}
                          </p>
                        )}
                      </div>
                      {isAdded ? (
                        <Check className="w-4 h-4 text-foreground/20 flex-shrink-0" />
                      ) : (
                        <button
                          onClick={() => handleAddSuggestion(suggestion)}
                          className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                          aria-label={t('characteristics.addCharacteristic')}
                        >
                          <Plus className="w-3.5 h-3.5 text-primary" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Re-analyze */}
              <button
                onClick={handleFetchAI}
                className="text-[11px] text-foreground/20 hover:text-foreground/40 transition-colors mt-2"
              >
                {t('characteristics.analyzeAgain')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacteristicDetail;

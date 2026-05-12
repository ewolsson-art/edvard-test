import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Brain, Moon, Utensils, Dumbbell, Pill, 
  ArrowRight, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TurtleLogo } from '@/components/TurtleLogo';
import { isDemoUser } from '@/lib/demoMode';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const CHECKIN_OPTIONS = [
  {
    id: 'include_mood',
    labelKey: 'onboarding.mood',
    descKey: 'onboarding.moodDesc',
    icon: Brain,
    recommended: true,
  },
  {
    id: 'include_medication',
    labelKey: 'onboarding.medication',
    descKey: 'onboarding.medicationDesc',
    icon: Pill,
  },
  {
    id: 'include_sleep',
    labelKey: 'onboarding.sleep',
    descKey: 'onboarding.sleepDesc',
    icon: Moon,
  },
  {
    id: 'include_eating',
    labelKey: 'onboarding.eating',
    descKey: 'onboarding.eatingDesc',
    icon: Utensils,
  },
  {
    id: 'include_exercise',
    labelKey: 'onboarding.exercise',
    descKey: 'onboarding.exerciseDesc',
    icon: Dumbbell,
  },
];


const TOTAL_STEPS = 2;

const Onboarding = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPreferences } = useUserPreferences();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDemo = isDemoUser(user);

  const DRAFT_KEY = user ? `toddy_onboarding_draft_${user.id}` : null;
  const loadDraft = () => {
    if (typeof window === 'undefined' || !DRAFT_KEY) return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const draft = loadDraft();

  const [step, setStep] = useState<number>(draft?.step ?? 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step data
  const [selections, setSelections] = useState(draft?.selections ?? {
    include_mood: true,
    include_sleep: false,
    include_eating: false,
    include_exercise: false,
    include_medication: false,
  });
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>(draft?.selectedDiagnoses ?? []);

  // Autosave draft on every change
  useEffect(() => {
    if (!DRAFT_KEY) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, selections, selectedDiagnoses }));
    } catch { /* ignore quota */ }
  }, [DRAFT_KEY, step, selections, selectedDiagnoses]);

  const handleToggle = (id: string) => {
    setSelections(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const hasAnySelection = Object.values(selections).some(Boolean);

  const handleNext = () => {
    // Step 2 (categories) is the last step → submit
    if (step === 2) {
      handleSubmit();
      return;
    }
    const next = step + 1;
    if (next <= TOTAL_STEPS) {
      setStep(next);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };


  const handleSubmit = async () => {
    // hasAnySelection no longer blocks – include_mood är förvalt, och om allt är av
    // så respekterar vi det. Användaren kan alltid ändra senare i inställningar.

    if (!user) return;

    setIsSubmitting(true);
    
    try {
      // 1. Save preferences
      const { error } = await createPreferences(selections);
      if (error) throw new Error(t('onboarding.couldNotSavePrefs'));

      // 2. Mark profile as completed so we skip the complete-profile step
      await supabase.auth.updateUser({
        data: { profile_completed: true },
      });

      // 2. Save diagnoses
      if (selectedDiagnoses.length > 0) {
        const diagnosesToInsert = selectedDiagnoses.map(name => ({
          user_id: user.id,
          name,
        }));
        await supabase.from('diagnoses').insert(diagnosesToInsert);
      }



      // Clear draft on successful completion
      if (DRAFT_KEY) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      }

      toast({
        title: t('onboarding.welcomeToToddy'),
        description: t('onboarding.diaryReady'),
      });
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Onboarding error:', err);
      toast({
        title: t('common.somethingWrong'),
        description: t('onboarding.couldNotSaveAll'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actualTotalSteps = TOTAL_STEPS;
  const actualStep = step;

  return (
    <DarkNightBackground>
      {/* Header with progress */}
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
            <span className="text-xs text-white/50 font-medium">
              {t('onboarding.step')} {actualStep} {t('onboarding.of')} {actualTotalSteps}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[hsl(45_85%_55%)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(actualStep / actualTotalSteps) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 pt-6 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Step 1: Welcome (demo-aware) */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col items-center text-center pt-4">
              <div className="mb-6 animate-scale-in">
                <TurtleLogo size="hero" animated className="w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_8px_32px_hsl(45_85%_55%/0.2)]" />
              </div>

              {isDemo ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[hsl(45_85%_55%)] bg-[hsl(45_85%_55%/0.1)] px-2.5 py-1 rounded-full mb-3">
                    Demo
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight leading-snug">
                    Välkommen in på en titt.
                  </h1>
                  <p className="mt-3 text-sm text-white/60 max-w-xs leading-relaxed">
                    Det här är en rundtur i Toddy. Du behöver inte skapa konto för att klicka runt – när du vill spara på riktigt, registrerar du dig efteråt.
                  </p>

                  <div className="mt-6 flex flex-col gap-2 w-full text-left">
                    {[
                      'All data du ser är slumpmässigt påhittad',
                      'Den är inte knuten till någon riktig person',
                      'Ingenting du gör här sparas permanent',
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-2.5 text-xs text-white/55">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(45_85%_55%)] shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-8"
                  >
                    Visa mig runt
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight leading-snug">
                    Hej. Vad fint att du är här.
                  </h1>
                  <p className="mt-3 text-sm text-white/60 max-w-xs leading-relaxed">
                    Toddy är en lugn liten plats för dig som lever med bipolär. Vi hjälper dig att se mönster i ditt mående – inget krav, inga rätt eller fel.
                  </p>

                  <div className="mt-6 flex flex-col gap-2 w-full text-left">
                    {[
                      'Tar ungefär 1 minut om dagen',
                      'Du delar bara det du själv vill',
                      'Byggt med människor som lever med bipolär'
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-2.5 text-xs text-white/55">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(45_85%_55%)] shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-8"
                  >
                    Då börjar vi
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Diagnosis & "How it works" steps removed — diagnosis is handled later via
              DiagnosisPromptBanner on Home; welcome already covers the essence. */}

          {/* Step 2: Choose categories */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-4 animate-scale-in">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-[hsl(45_85%_55%/0.08)] blur-xl" />
                  <TurtleLogo size="md" mood="somewhat_elevated" className="relative w-20 h-20 drop-shadow-[0_4px_16px_hsl(45_85%_55%/0.15)]" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight text-center">
                Vad känns viktigt för dig?
              </h1>
              <p className="mt-2 text-sm text-white/55 leading-relaxed text-center">
                Bocka i det du vill följa. Du kan ändra när som helst – inget är hugget i sten.
              </p>

              <div className="mt-6 space-y-2.5">
                {CHECKIN_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isChecked = selections[option.id as keyof typeof selections];
                  
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer",
                        isChecked 
                          ? 'bg-white/[0.06] ring-1 ring-[hsl(45_85%_55%/0.3)]' 
                          : 'bg-white/[0.04] ring-1 ring-white/[0.08] hover:ring-white/[0.15]'
                      )}
                      onClick={() => handleToggle(option.id)}
                    >
                      <Checkbox
                        id={option.id}
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(option.id)}
                        className="pointer-events-none border-white/20 data-[state=checked]:bg-[hsl(45_85%_55%)] data-[state=checked]:border-[hsl(45_85%_55%)]"
                      />
                      <div className={cn(
                        "p-1.5 rounded-xl transition-colors",
                        isChecked ? 'bg-[hsl(45_85%_55%/0.1)]' : 'bg-white/[0.04]'
                      )}>
                        <Icon className={cn(
                          "w-4 h-4 transition-colors",
                          isChecked ? 'text-[hsl(45_85%_55%)]' : 'text-white/30'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={option.id} 
                          className="text-sm font-medium cursor-pointer flex items-center gap-2 text-white"
                        >
                          {t(`${option.labelKey}`)}
                          {option.recommended && (
                            <span className="text-[10px] bg-[hsl(45_85%_55%/0.1)] text-[hsl(45_85%_55%)] px-1.5 py-0.5 rounded-full">
                              {t('onboarding.recommended')}
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-white/30 line-clamp-1">
                          {t(`${option.descKey}`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-white/40 text-center mt-4">
                Inget måste vara perfekt. Du kan justera allt i inställningar när som helst.
              </p>

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="h-12 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.06] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Sätt igång
                  {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </DarkNightBackground>
  );
};

export default Onboarding;

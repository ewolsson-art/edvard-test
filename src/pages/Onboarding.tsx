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
  ArrowRight, ArrowLeft, CheckCircle2, Heart, Stethoscope, User
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TurtleLogo } from '@/components/TurtleLogo';
import { isDemoUser, setDemoRole } from '@/lib/demoMode';
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


const TOTAL_STEPS = 1;

const Onboarding = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPreferences } = useUserPreferences();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDemo = isDemoUser(user);
  const [demoRoleLoading, setDemoRoleLoading] = useState<'patient' | 'relative' | 'doctor' | null>(null);

  const DRAFT_KEY = user ? `toddy_onboarding_draft_${user.id}` : null;
  const loadDraft = () => {
    if (typeof window === 'undefined' || !DRAFT_KEY) return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const draft = loadDraft();

  const [step, setStep] = useState<number>(1);
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
    handleSubmit();
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
      <header className="p-2">
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
      <main className="flex-1 flex flex-col items-center px-6 py-3 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Step 1: Welcome (demo-aware) */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col items-center text-center">
              {isDemo ? (
                <>
                  <div className="mb-3 animate-scale-in">
                    <TurtleLogo size="hero" animated className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_8px_32px_hsl(45_85%_55%/0.2)]" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(45_85%_55%)] bg-[hsl(45_85%_55%/0.1)] px-2 py-0.5 rounded-full mb-2">
                    Demo
                  </span>
                  <h1 className="text-xl md:text-2xl font-bold text-white font-display tracking-tight leading-snug">
                    Välkommen in på en titt.
                  </h1>
                  <p className="mt-2 text-[13px] text-white/60 max-w-xs leading-relaxed">
                    En rundtur i Toddy – inget konto behövs. När du vill spara på riktigt registrerar du dig efteråt.
                  </p>

                  <div className="mt-3 flex flex-col gap-1.5 w-full text-left">
                    {[
                      'All data är slumpmässigt påhittad',
                      'Inte knuten till någon riktig person',
                      'Inget du gör sparas permanent',
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-2 text-[11px] text-white/55">
                        <CheckCircle2 className="w-3 h-3 text-[hsl(45_85%_55%)] shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-white/40 mt-4 mb-2 uppercase tracking-wider font-medium">
                    Testa som
                  </p>
                  <div className="w-full space-y-1.5">
                    {([
                      { role: 'patient', label: 'Bipolär', desc: 'Följ mående och se mönster', icon: User },
                      { role: 'relative', label: 'Anhörig', desc: 'Stötta någon nära', icon: Heart },
                      { role: 'doctor', label: 'Läkare', desc: 'Översikt över patienter', icon: Stethoscope },
                    ] as const).map(({ role, label, desc, icon: Icon }) => (
                      <button
                        key={role}
                        disabled={demoRoleLoading !== null}
                        onClick={async () => {
                          setDemoRoleLoading(role);
                          try {
                            await setDemoRole(role);
                            queryClient.invalidateQueries();
                            navigate('/', { replace: true });
                          } catch {
                            setDemoRoleLoading(null);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] hover:ring-[hsl(45_85%_55%/0.4)] hover:bg-white/[0.06] transition-all text-left disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[hsl(45_85%_55%/0.12)] flex items-center justify-center shrink-0">
                          {demoRoleLoading === role ? (
                            <Loader2 className="w-3.5 h-3.5 text-[hsl(45_85%_55%)] animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5 text-[hsl(45_85%_55%)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white leading-tight">{label}</p>
                          <p className="text-[11px] text-white/50 mt-0.5 leading-tight">{desc}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                      </button>
                    ))}
                  </div>
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


        </div>
      </main>
    </DarkNightBackground>
  );
};

export default Onboarding;

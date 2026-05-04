import { useState } from 'react';
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
  ArrowRight, ArrowLeft, Sparkles, CheckCircle2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TurtleLogo } from '@/components/TurtleLogo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { MedicationStep, MedicationInput } from '@/components/onboarding/MedicationStep';
import { DiagnosisStep } from '@/components/onboarding/DiagnosisStep';
import { HowItWorksStep } from '@/components/onboarding/HowItWorksStep';
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


const TOTAL_STEPS = 5;

const Onboarding = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPreferences } = useUserPreferences();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step data
  const [selections, setSelections] = useState({
    include_mood: true,
    include_sleep: false,
    include_eating: false,
    include_exercise: false,
    include_medication: false,
  });
  const [selectedMedications, setSelectedMedications] = useState<MedicationInput[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelections(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const hasAnySelection = Object.values(selections).some(Boolean);

  const handleNext = () => {
    // Step 4 (categories) → if no medication chosen, submit instead of going to medication step
    if (step === 4 && !selections.include_medication) {
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
    if (!hasAnySelection) {
      toast({
        title: t('onboarding.chooseAtLeast'),
        description: t('onboarding.needOneCategory'),
      });
      return;
    }

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

      // 3. Save medications
      if (selectedMedications.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const timingToFrequency: Record<string, string> = {
          morning: 'daily',
          evening: 'daily',
          both: 'twice_daily',
          as_needed: 'as_needed',
        };
        const medicationsToInsert = selectedMedications.map(med => ({
          user_id: user.id,
          name: med.name,
          dosage: med.dosage || t('onboarding.notSpecified'),
          started_at: today,
          frequency: timingToFrequency[med.timing || 'morning'] || 'daily',
        }));
        await supabase.from('medications').insert(medicationsToInsert);
        await queryClient.invalidateQueries({ queryKey: ['medications'] });
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

  const actualTotalSteps = selections.include_medication ? TOTAL_STEPS : TOTAL_STEPS - 1;
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
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col items-center text-center pt-4">
              <div className="mb-6 animate-scale-in">
                <TurtleLogo size="hero" animated className="w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_8px_32px_hsl(45_85%_55%/0.2)]" />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight leading-snug">
                Välkommen. Vi är glada att du är här.
              </h1>
              <p className="mt-3 text-sm text-white/60 max-w-xs leading-relaxed">
                Toddy är en lugn plats för dig som lever med bipolär sjukdom. Vi hjälper dig att se mönster i ditt mående – så att både du och din vård kan agera tidigare.
              </p>

              <div className="mt-6 flex flex-col gap-2 w-full text-left">
                {[
                  'Tar 1 minut om dagen',
                  'Du delar bara det du vill dela',
                  'Designat tillsammans med människor med bipolär'
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
                Kom igång
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Diagnosis */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Berätta lite om dig
              </h1>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Toddy anpassar sig efter din diagnos – mood-skalan, frågorna och vad vi tittar efter blir mer relevant. Du kan hoppa över och lägga till senare.
              </p>

              <div className="mt-6 max-h-[50vh] overflow-y-auto [&_input]:bg-white/[0.06] [&_input]:border-white/[0.1] [&_input]:text-white [&_input]:placeholder:text-white/30 [&_button]:text-white/70 [&_.text-muted-foreground]:text-white/40 [&_.text-primary]:text-[hsl(45_85%_55%)] [&_.bg-popover]:bg-[hsl(230_30%_12%)] [&_.border-border]:border-white/10 [&_.hover\\:bg-muted]:hover:bg-white/[0.06] [&_.bg-card]:bg-white/[0.04] [&_.border-border]:border-white/10">
                <DiagnosisStep
                  selectedDiagnoses={selectedDiagnoses}
                  onDiagnosesChange={setSelectedDiagnoses}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="h-12 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.06] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300" 
                >
                  {selectedDiagnoses.length === 0 ? 'Hoppa över' : 'Fortsätt'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: How it works */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Så funkar Toddy
              </h1>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Inget krångel. Bara dig, dagen och en vänlig sköldpadda.
              </p>

              <div className="mt-6">
                <HowItWorksStep />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="h-12 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.06] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300" 
                >
                  Jag är med
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Choose categories */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Vad vill du följa?
              </h1>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Välj det som känns viktigt för dig. Sömn och aptit är ofta tidiga signaler vid bipolär – men du bestämmer.
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

              {!hasAnySelection && (
                <p className="text-xs text-red-400/80 text-center mt-3">
                  {t('onboarding.chooseAtLeastOne')}
                </p>
              )}

              <p className="text-xs text-white/30 text-center mt-3">
                Du kan ändra det här när du vill i inställningar.
              </p>

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="h-12 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.06] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300" 
                  disabled={!hasAnySelection || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  {selections.include_medication ? 'Fortsätt' : 'Starta min dagbok'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Medications */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Dina mediciner
              </h1>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Vi hjälper dig komma ihåg dem och se hur de påverkar ditt mående över tid. Lägg till nu eller senare.
              </p>

              <div className="mt-6 max-h-[50vh] overflow-y-auto">
                <MedicationStep 
                  selectedMedications={selectedMedications}
                  onMedicationsChange={setSelectedMedications}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="h-12 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.06] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  {selectedMedications.length === 0 ? 'Hoppa över och starta' : 'Starta min dagbok'}
                  <ArrowRight className="w-4 h-4 ml-1" />
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

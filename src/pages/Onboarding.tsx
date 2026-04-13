import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Brain, Moon, Utensils, Dumbbell, Pill, 
  ArrowRight, ArrowLeft, Sparkles, TrendingUp, 
  Share2, MessageSquare, CheckCircle2,
  Heart
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TurtleLogo } from '@/components/TurtleLogo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { MedicationStep, MedicationInput } from '@/components/onboarding/MedicationStep';
import { cn } from '@/lib/utils';

const CHECKIN_OPTIONS = [
  {
    id: 'include_mood',
    label: 'Mående',
    description: 'Registrera hur du mår varje dag',
    icon: Brain,
    recommended: true,
  },
  {
    id: 'include_medication',
    label: 'Medicin',
    description: 'Loggning för dina mediciner',
    icon: Pill,
  },
  {
    id: 'include_sleep',
    label: 'Sömn',
    description: 'Håll koll på din sömnkvalitet',
    icon: Moon,
  },
  {
    id: 'include_eating',
    label: 'Kost',
    description: 'Följ dina matvanor',
    icon: Utensils,
  },
  {
    id: 'include_exercise',
    label: 'Träning',
    description: 'Logga din fysiska aktivitet',
    icon: Dumbbell,
  },
];


const TOTAL_STEPS = 4;

const Onboarding = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPreferences } = useUserPreferences();
  const navigate = useNavigate();
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

  const handleToggle = (id: string) => {
    setSelections(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const hasAnySelection = Object.values(selections).some(Boolean);

  const handleNext = () => {
    let next = step + 1;
    // Skip medication step (3) if user didn't select medication tracking
    if (next === 3 && !selections.include_medication) {
      next = 4;
    }
    if (next <= TOTAL_STEPS) {
      setStep(next);
    }
  };

  const handleBack = () => {
    let prev = step - 1;
    // Skip medication step (3) going back if user didn't select medication tracking
    if (prev === 3 && !selections.include_medication) {
      prev = 2;
    }
    if (prev >= 1) {
      setStep(prev);
    }
  };

  const getSkipText = () => {
    if (step === 3) return selectedMedications.length === 0 ? 'Hoppa över' : 'Fortsätt';
    return 'Fortsätt';
  };

  const handleSubmit = async () => {
    if (!hasAnySelection) {
      toast({
        title: 'Välj minst ett alternativ',
        description: 'Du behöver välja minst en kategori för din dagliga incheckning.',
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    
    try {
      // 1. Save preferences
      const { error } = await createPreferences(selections);
      if (error) throw new Error('Kunde inte spara preferenser');

      // 2. Save medications
      if (selectedMedications.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const medicationsToInsert = selectedMedications.map(med => ({
          user_id: user.id,
          name: med.name,
          dosage: med.dosage || 'Ej angiven',
          started_at: today,
          frequency: 'daily' as const,
        }));
        await supabase.from('medications').insert(medicationsToInsert);
      }


      // 3. Create doctor connection requests
      for (const doctorEmail of invites.doctors) {
        const { data: doctorId } = await supabase.rpc('get_doctor_id_by_email', { doctor_email: doctorEmail });
        if (doctorId) {
          await supabase.from('patient_doctor_connections').insert({
            patient_id: user.id,
            doctor_id: doctorId,
            initiated_by: 'patient',
            status: 'pending',
          });
        }
      }

      // 7. Create relative connection requests
      for (const relativeEmail of invites.relatives) {
        const { data: relativeId } = await supabase.rpc('get_relative_id_by_email', { relative_email: relativeEmail });
        if (relativeId) {
          await supabase.from('patient_relative_connections').insert({
            patient_id: user.id,
            relative_id: relativeId,
            initiated_by: 'patient',
            status: 'pending',
          });
        }
      }

      toast({
        title: 'Välkommen till Friendly!',
        description: 'Din dagbok är nu redo att använda.',
      });
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Onboarding error:', err);
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte spara alla inställningar. Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actualTotalSteps = selections.include_medication ? TOTAL_STEPS : TOTAL_STEPS - 1;
  const actualStep = step <= 2 ? step : (selections.include_medication ? step : step - 1);

  return (
    <DarkNightBackground>
      {/* Header with progress */}
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
            <span className="text-xs text-white/50 font-medium">
              Steg {actualStep} av {actualTotalSteps}
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
                Första steget till bättre insikt börjar här
              </h1>
              <p className="mt-3 text-sm text-white/50 max-w-xs">
                Toddy hjälper dig förstå ditt mående — dag för dag, i din egen takt 🐢
              </p>

              <Button 
                onClick={handleNext} 
                className="w-full h-14 rounded-2xl text-base font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-8"
              >
                Sätt igång
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="mt-6 text-[11px] text-white/25">
                Skapad för personer med bipolär sjukdom · i samråd med läkare
              </p>
            </div>
          )}

          {/* Step 2: Choose categories */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Skapa din incheckning
              </h1>
              <p className="mt-2 text-sm text-white/40">
                Välj vad du vill ha med i din dagliga incheckning
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
                          {option.label}
                          {option.recommended && (
                            <span className="text-[10px] bg-[hsl(45_85%_55%/0.1)] text-[hsl(45_85%_55%)] px-1.5 py-0.5 rounded-full">
                              Rekommenderas
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-white/30 line-clamp-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasAnySelection && (
                <p className="text-xs text-red-400/80 text-center mt-3">
                  Välj minst en kategori för att fortsätta
                </p>
              )}

              <p className="text-xs text-white/20 text-center mt-3">
                Du kan ändra detta senare i inställningarna
              </p>

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="h-12 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.06] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300" 
                  disabled={!hasAnySelection}
                >
                  Fortsätt
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Medications */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Dina mediciner
              </h1>
              <p className="mt-2 text-sm text-white/40">
                Lägg till dina aktuella mediciner (valfritt)
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
                  onClick={handleNext} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300"
                >
                  {getSkipText()}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}


          {/* Step 4: Confirm & Start */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Allt är redo!
              </h1>
              <p className="mt-2 text-sm text-white/40">
                Här är en sammanfattning
              </p>

              <div className="mt-6 space-y-3">
                {/* Checkin categories */}
                <div className="p-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]">
                  <h2 className="font-semibold text-[11px] mb-2 text-white/30 uppercase tracking-wide">Din incheckning</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {CHECKIN_OPTIONS.filter(opt => selections[opt.id as keyof typeof selections]).map((option) => {
                      const Icon = option.icon;
                      return (
                        <div key={option.id} className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[hsl(45_85%_55%/0.08)] ring-1 ring-[hsl(45_85%_55%/0.15)]">
                          <Icon className="w-3 h-3 text-[hsl(45_85%_55%)]" />
                          <span className="text-xs font-medium text-white/80">{option.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Medications */}
                {selectedMedications.length > 0 && (
                  <div className="p-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]">
                    <h2 className="font-semibold text-[11px] mb-2 text-white/30 uppercase tracking-wide">Mediciner</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMedications.map((med) => (
                        <span key={med.name} className="px-2 py-1 text-xs rounded-xl bg-white/[0.06] text-white/70 ring-1 ring-white/[0.08]">
                          {med.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}


              </div>

              <p className="mt-4 text-xs text-white/20 text-center">
                Checka in varje dag, gärna vid samma tid • Din data är privat och säker
              </p>

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="h-12 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.06] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1 h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  Starta min dagbok
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

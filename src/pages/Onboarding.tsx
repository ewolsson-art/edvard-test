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
  Share2, MessageSquare, CheckCircle2, Stethoscope
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DiagnosisStep } from '@/components/onboarding/DiagnosisStep';
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
  {
    id: 'include_medication',
    label: 'Medicin',
    description: 'Loggning för dina mediciner',
    icon: Pill,
  },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Statistik & insikter',
    description: 'Se trender i ditt mående med tydliga grafer',
  },
  {
    icon: Share2,
    title: 'Dela med din läkare',
    description: 'Bjud in din läkare för att dela din data',
  },
  {
    icon: MessageSquare,
    title: 'AI-assistent',
    description: 'Chatta med vår AI för att reflektera',
  },
];

const TOTAL_STEPS = 4;

const Onboarding = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPreferences, refetch } = useUserPreferences();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [selections, setSelections] = useState({
    include_mood: true,
    include_sleep: true,
    include_eating: true,
    include_exercise: true,
    include_medication: true,
  });

  const handleToggle = (id: string) => {
    setSelections(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const hasAnySelection = Object.values(selections).some(Boolean);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
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
        title: 'Välj minst ett alternativ',
        description: 'Du behöver välja minst en kategori för din dagliga incheckning.',
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    
    // Save preferences
    const { error } = await createPreferences(selections);
    
    if (error) {
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte spara dina inställningar. Försök igen.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Save diagnoses if any
    if (selectedDiagnoses.length > 0) {
      const diagnosesToInsert = selectedDiagnoses.map(name => ({
        user_id: user.id,
        name: name.trim(),
      }));

      const { error: diagnosisError } = await supabase
        .from('diagnoses')
        .insert(diagnosesToInsert);

      if (diagnosisError) {
        console.error('Error saving diagnoses:', diagnosisError);
        // Don't block onboarding for diagnosis errors
      }
    }

    toast({
      title: 'Välkommen till Friendly!',
      description: 'Din dagbok är nu redo att använda.',
    });
    
    // createPreferences already updates the preferences state with onboarding_completed: true
    // Navigate immediately - the state is already updated
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header with progress */}
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Logo />
            <span className="text-xs text-muted-foreground font-medium">
              Steg {step} av {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-3">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Välkommen till Friendly
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Din personliga stämningsdagbok för att förstå och följa ditt mående
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <h2 className="font-semibold text-sm mb-3">Vad du kan göra:</h2>
                <div className="space-y-2.5">
                  {FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{feature.title}</h3>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-center mb-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Skapad av och för personer med bipolär sjukdom</span>
                  {' '}i samråd med läkare och experter
                </p>
              </div>

              <Button onClick={handleNext} className="w-full" size="default">
                Kom igång
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Diagnosis */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Dina diagnoser
                </h1>
                <p className="text-sm text-muted-foreground">
                  Lägg till dina diagnoser (valfritt)
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <DiagnosisStep 
                  selectedDiagnoses={selectedDiagnoses}
                  onDiagnosesChange={setSelectedDiagnoses}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  size="default"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1"
                  size="default"
                >
                  {selectedDiagnoses.length === 0 ? 'Hoppa över' : 'Fortsätt'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Choose categories */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Skapa din incheckning
                </h1>
                <p className="text-sm text-muted-foreground">
                  Välj vad du vill ha med i din dagliga incheckning
                </p>
              </div>

              <div className="space-y-2 mb-3">
                {CHECKIN_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isChecked = selections[option.id as keyof typeof selections];
                  
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all cursor-pointer",
                        isChecked 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-card hover:border-primary/30'
                      )}
                      onClick={() => handleToggle(option.id)}
                    >
                      <Checkbox
                        id={option.id}
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(option.id)}
                        className="pointer-events-none"
                      />
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isChecked ? 'bg-primary/10' : 'bg-muted'
                      )}>
                        <Icon className={cn(
                          "w-4 h-4 transition-colors",
                          isChecked ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={option.id} 
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          {option.label}
                          {option.recommended && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              Rekommenderas
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasAnySelection && (
                <p className="text-xs text-destructive text-center mb-2">
                  Välj minst en kategori för att fortsätta
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center mb-3">
                Du kan ändra detta senare i inställningarna
              </p>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  size="default"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1"
                  size="default"
                  disabled={!hasAnySelection}
                >
                  Fortsätt
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm & Start */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Allt är redo!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Här är en sammanfattning
                </p>
              </div>

              <div className="glass-card p-4 mb-3">
                <h2 className="font-semibold text-sm mb-2">Din incheckning:</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {CHECKIN_OPTIONS.filter(opt => selections[opt.id as keyof typeof selections]).map((option) => {
                    const Icon = option.icon;
                    return (
                      <div 
                        key={option.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-primary/5 border border-primary/10"
                      >
                        <Icon className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedDiagnoses.length > 0 && (
                <div className="glass-card p-4 mb-3">
                  <h2 className="font-semibold text-sm mb-2">Dina diagnoser:</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDiagnoses.map((diagnosis) => (
                      <span 
                        key={diagnosis}
                        className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                      >
                        {diagnosis}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <h3 className="font-medium text-xs mb-1">Tips:</h3>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Checka in varje dag, gärna vid samma tid</li>
                  <li>• Din data är privat och säker</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  size="default"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  size="default"
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
    </div>
  );
};

export default Onboarding;

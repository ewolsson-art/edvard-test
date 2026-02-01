import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Brain, Moon, Utensils, Dumbbell, Pill, 
  ArrowRight, ArrowLeft, Sparkles, TrendingUp, 
  Share2, MessageSquare, CheckCircle2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

const CHECKIN_OPTIONS = [
  {
    id: 'include_mood',
    label: 'Mående',
    description: 'Registrera hur du mår varje dag – uppvarvad, stabil eller nedstämd',
    icon: Brain,
    recommended: true,
  },
  {
    id: 'include_sleep',
    label: 'Sömn',
    description: 'Håll koll på din sömnkvalitet och se mönster över tid',
    icon: Moon,
  },
  {
    id: 'include_eating',
    label: 'Kost',
    description: 'Följ dina matvanor och hur de påverkar ditt mående',
    icon: Utensils,
  },
  {
    id: 'include_exercise',
    label: 'Träning',
    description: 'Logga din fysiska aktivitet och se sambanden med hur du mår',
    icon: Dumbbell,
  },
  {
    id: 'include_medication',
    label: 'Medicin',
    description: 'Påminnelser och loggning för dina mediciner',
    icon: Pill,
  },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Statistik & insikter',
    description: 'Se trender i ditt mående med tydliga grafer och kalendervyer',
  },
  {
    icon: Share2,
    title: 'Dela med din läkare',
    description: 'Bjud in din läkare för att dela din data säkert',
  },
  {
    icon: MessageSquare,
    title: 'AI-assistent',
    description: 'Chatta med vår AI för att reflektera över ditt mående',
  },
];

const TOTAL_STEPS = 3;

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPreferences } = useUserPreferences();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setIsSubmitting(true);
    
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

    toast({
      title: 'Välkommen till Between Clouds!',
      description: 'Din dagbok är nu redo att använda.',
    });
    
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header with progress */}
      <header className="p-4 md:p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Logo />
            <span className="text-sm text-muted-foreground font-medium">
              Steg {step} av {TOTAL_STEPS}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
                  Välkommen till Between Clouds
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Din personliga stämningsdagbok för att förstå och följa ditt mående över tid
                </p>
              </div>

              <div className="glass-card p-6 mb-8">
                <h2 className="font-semibold text-lg mb-4">Vad du kan göra:</h2>
                <div className="space-y-4">
                  {FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-start gap-4"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-center mb-8">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Skapad av och för personer med bipolär sjukdom</span>
                  <br />i samråd med läkare och experter
                </p>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Kom igång
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Choose categories */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Skapa din incheckning
                </h1>
                <p className="text-muted-foreground">
                  Välj vad du vill ha med i din dagliga incheckning
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {CHECKIN_OPTIONS.map((option, index) => {
                  const Icon = option.icon;
                  const isChecked = selections[option.id as keyof typeof selections];
                  
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                        isChecked 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border bg-card hover:border-primary/30'
                      )}
                      onClick={() => handleToggle(option.id)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Checkbox
                        id={option.id}
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(option.id)}
                        className="pointer-events-none"
                      />
                      <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        isChecked ? 'bg-primary/10' : 'bg-muted'
                      )}>
                        <Icon className={cn(
                          "w-5 h-5 transition-colors",
                          isChecked ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={option.id} 
                          className="font-medium cursor-pointer flex items-center gap-2 flex-wrap"
                        >
                          {option.label}
                          {option.recommended && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                              Rekommenderas
                            </span>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasAnySelection && (
                <p className="text-sm text-destructive text-center mb-4">
                  Välj minst en kategori för att fortsätta
                </p>
              )}

              <p className="text-sm text-muted-foreground text-center mb-6">
                Du kan ändra detta senare i inställningarna
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1"
                  size="lg"
                  disabled={!hasAnySelection}
                >
                  Fortsätt
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm & Start */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Allt är redo!
                </h1>
                <p className="text-muted-foreground">
                  Här är en sammanfattning av din incheckning
                </p>
              </div>

              <div className="glass-card p-6 mb-6">
                <h2 className="font-semibold mb-4">Din incheckning innehåller:</h2>
                <div className="grid grid-cols-2 gap-3">
                  {CHECKIN_OPTIONS.filter(opt => selections[opt.id as keyof typeof selections]).map((option) => {
                    const Icon = option.icon;
                    return (
                      <div 
                        key={option.id}
                        className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
                      >
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-8">
                <h3 className="font-medium text-sm mb-2">Tips för att komma igång:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Försök checka in varje dag, gärna vid samma tid</li>
                  <li>• Var ärlig – din data är privat och säker</li>
                  <li>• Titta på statistiken efter någon vecka för insikter</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
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

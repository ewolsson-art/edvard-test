import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Eye, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';

const FEATURES = [
  {
    icon: Eye,
    title: 'Se din närståendes mående',
    description: 'Följ hur din närstående mår dag för dag',
  },
  {
    icon: Users,
    title: 'Begär åtkomst',
    description: 'Skicka förfrågan till din närstående',
  },
];

const TOTAL_STEPS = 2;

const RelativeOnboarding = () => {
  const { toast } = useToast();
  const { createPreferences } = useUserPreferences();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Create preferences with minimal settings (relatives don't do check-ins)
    const { error } = await createPreferences({
      include_mood: false,
      include_sleep: false,
      include_eating: false,
      include_exercise: false,
      include_medication: false,
    });
    
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
      title: 'Välkommen!',
      description: 'Du kan nu börja följa dina närstående.',
    });
    
    // Use window.location for a full page reload to ensure all hooks refetch fresh data
    window.location.href = '/anhorig';
  };

  return (
    <DarkNightBackground>
      {/* Header with progress */}
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
            <span className="text-xs text-white/50 font-medium">
              Steg {step} av {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[hsl(260 60% 72%)] rounded-full transition-all duration-500 ease-out"
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
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Välkommen som anhörig
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Med Friendly kan du följa hur dina närstående mår
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <h2 className="font-semibold text-sm mb-3">Som anhörig kan du:</h2>
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
                  <span className="font-medium text-foreground">Endast läsåtkomst</span>
                  {' '}– du kan endast se data som din närstående väljer att dela med dig
                </p>
              </div>

              <Button onClick={handleNext} className="w-full" size="default">
                Fortsätt
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Redo att börja!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Nu kan du begära åtkomst till dina närståendes data
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <h3 className="font-medium text-xs mb-1">Nästa steg:</h3>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Klicka på "Begär åtkomst" för att skicka en förfrågan</li>
                  <li>• Din närstående väljer vilken data du får se</li>
                </ul>
              </div>

              <Button 
                onClick={handleSubmit}
                className="w-full"
                size="default"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1" />
                )}
                Kom igång
              </Button>
            </div>
          )}
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default RelativeOnboarding;

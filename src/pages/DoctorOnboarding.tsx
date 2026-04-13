import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Users, Eye, Bell, Shield, ArrowRight, ArrowLeft, 
  Stethoscope, MessageSquare, TrendingUp, CheckCircle2 
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const DOCTOR_FEATURES = [
  {
    icon: Users,
    title: 'Hantera användare',
    description: 'Ta emot kopplingsförfrågningar och hantera dina kontakter',
  },
  {
    icon: TrendingUp,
    title: 'Realtidsöversikt',
    description: 'Se mående, sömn, kost och träning visualiserat',
  },
  {
    icon: MessageSquare,
    title: 'Säker kommunikation',
    description: 'Chatta direkt med dina användare i en säker miljö',
  },
  {
    icon: Shield,
    title: 'Användarkontroll',
    description: 'Användare bestämmer själva vilken data de delar med dig',
  },
];

const WORKFLOW_STEPS = [
  {
    number: '1',
    title: 'Användaren bjuder in dig',
    description: 'Användaren anger din e-postadress i sin app',
  },
  {
    number: '2',
    title: 'Du godkänner kopplingen',
    description: 'Förfrågan visas på din dashboard',
  },
  {
    number: '3',
    title: 'Följ användarens mående',
    description: 'Se statistik och trender i realtid',
  },
];

const TOTAL_STEPS = 3;

const DoctorOnboarding = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleGetStarted = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        onboarding_completed: true,
        include_mood: false,
        include_sleep: false,
        include_eating: false,
        include_exercise: false,
        include_medication: false,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte slutföra. Försök igen.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Välkommen till Toddy!',
      description: 'Din läkardashboard är nu redo.',
    });
    
    // Use window.location to force a full page reload
    // This ensures all hooks re-initialize with the updated preferences
    window.location.href = '/lakare';
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
              className="h-full bg-[hsl(45_85%_55%)] rounded-full transition-all duration-500 ease-out"
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
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Välkommen, vårdgivare!
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Toddy hjälper dig följa dina användares mående mellan besöken
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <h2 className="font-semibold text-sm mb-3">Vad du kan göra:</h2>
                <div className="space-y-2.5">
                  {DOCTOR_FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-start gap-3"
                      >
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

              <Button onClick={handleNext} className="w-full" size="default">
                Fortsätt
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: How it works */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Så fungerar det
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enkelt att komma igång med dina användare
                </p>
              </div>

              <div className="space-y-2.5 mb-4">
                {WORKFLOW_STEPS.map((wfStep, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {wfStep.number}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{wfStep.title}</h3>
                      <p className="text-xs text-muted-foreground">{wfStep.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Dina användare hittar dig via e-post</p>
                    <p className="text-xs text-muted-foreground">
                      De anger samma e-postadress som du registrerade dig med
                    </p>
                  </div>
                </div>
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
                  Fortsätt
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Ready to start */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Du är redo!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Din läkardashboard väntar på dig
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <h2 className="font-semibold text-sm mb-3">Nästa steg:</h2>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">1</span>
                    </div>
                    <p className="text-xs">Ge din e-postadress till användare som vill koppla sig</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">2</span>
                    </div>
                    <p className="text-xs">Godkänn kopplingsförfrågningar på din dashboard</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">3</span>
                    </div>
                    <p className="text-xs">Aktivera chatt för att kommunicera direkt med användaren</p>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Integritet i fokus:</span> Du kan bara se data som användaren aktivt valt att dela med dig.
                  </p>
                </div>
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
                  onClick={handleGetStarted}
                  className="flex-1"
                  size="default"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Stethoscope className="w-4 h-4 mr-1" />
                  )}
                  Öppna min dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default DoctorOnboarding;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Users, Eye, Bell, Shield, ArrowRight, ArrowLeft, 
  Stethoscope, MessageSquare, TrendingUp, CheckCircle2 
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const DOCTOR_FEATURES = [
  {
    icon: Users,
    title: 'Hantera patienter',
    description: 'Ta emot kopplingsförfrågningar och hantera dina patientkontakter',
  },
  {
    icon: TrendingUp,
    title: 'Realtidsöversikt',
    description: 'Se patienternas mående, sömn, kost och träning visualiserat',
  },
  {
    icon: MessageSquare,
    title: 'Säker kommunikation',
    description: 'Chatta direkt med dina patienter i en säker miljö',
  },
  {
    icon: Shield,
    title: 'Patientkontroll',
    description: 'Patienter bestämmer själva vilken data de delar med dig',
  },
];

const WORKFLOW_STEPS = [
  {
    number: '1',
    title: 'Patient bjuder in dig',
    description: 'Patienten anger din e-postadress i sin app',
  },
  {
    number: '2',
    title: 'Du godkänner kopplingen',
    description: 'Förfrågan visas på din dashboard',
  },
  {
    number: '3',
    title: 'Följ patientens mående',
    description: 'Se statistik och trender i realtid',
  },
];

const TOTAL_STEPS = 3;

const DoctorOnboarding = () => {
  const navigate = useNavigate();
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
      title: 'Välkommen till Between Clouds!',
      description: 'Din läkardashboard är nu redo.',
    });
    
    navigate('/lakare');
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
                  <Stethoscope className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
                  Välkommen, vårdgivare!
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Between Clouds hjälper dig följa dina patienters mående mellan besöken
                </p>
              </div>

              <div className="glass-card p-6 mb-8">
                <h2 className="font-semibold text-lg mb-4">Vad du kan göra:</h2>
                <div className="space-y-4">
                  {DOCTOR_FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-start gap-4"
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

              <Button onClick={handleNext} className="w-full" size="lg">
                Fortsätt
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: How it works */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Så fungerar det
                </h1>
                <p className="text-muted-foreground">
                  Enkelt att komma igång med dina patienter
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {WORKFLOW_STEPS.map((wfStep, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                      {wfStep.number}
                    </div>
                    <div>
                      <h3 className="font-medium">{wfStep.title}</h3>
                      <p className="text-sm text-muted-foreground">{wfStep.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Dina patienter hittar dig via e-post</p>
                    <p className="text-sm text-muted-foreground">
                      De anger samma e-postadress som du registrerade dig med
                    </p>
                  </div>
                </div>
              </div>

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
                >
                  Fortsätt
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Ready to start */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Du är redo!
                </h1>
                <p className="text-muted-foreground">
                  Din läkardashboard väntar på dig
                </p>
              </div>

              <div className="glass-card p-6 mb-6">
                <h2 className="font-semibold mb-4">Nästa steg:</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <p className="text-sm">Ge din e-postadress till patienter som vill koppla sig</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <p className="text-sm">Godkänn kopplingsförfrågningar på din dashboard</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <p className="text-sm">Aktivera chatt för att kommunicera direkt med patienten</p>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Integritet i fokus:</span> Du kan bara se data som patienten aktivt valt att dela med dig.
                  </p>
                </div>
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
                  onClick={handleGetStarted}
                  className="flex-1"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Stethoscope className="w-4 h-4 mr-2" />
                  )}
                  Öppna min dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorOnboarding;

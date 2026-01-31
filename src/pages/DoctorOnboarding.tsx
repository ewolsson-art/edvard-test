import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Eye, Bell, Shield, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DOCTOR_FEATURES = [
  {
    icon: Users,
    title: 'Hantera patienter',
    description: 'Ta emot kopplingsförfrågningar från dina patienter',
  },
  {
    icon: Eye,
    title: 'Realtidsöversikt',
    description: 'Se patienternas mående, sömn och träning i realtid',
  },
  {
    icon: Bell,
    title: 'Håll koll',
    description: 'Följ dina patienters utveckling över tid',
  },
  {
    icon: Shield,
    title: 'Säker delning',
    description: 'Patienter kontrollerar vilken data de delar med dig',
  },
];

const DoctorOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetStarted = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    // Create a minimal user_preferences record to mark onboarding as complete
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
      title: 'Välkommen!',
      description: 'Din läkardashboard är nu redo.',
    });
    
    navigate('/lakare');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated cloud */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none animate-float">
        <svg 
          viewBox="0 0 200 120" 
          className="w-[400px] md:w-[600px] lg:w-[800px] h-auto fill-primary"
        >
          <path d="M170 80c16.569 0 30-13.431 30-30 0-13.807-9.33-25.44-22.024-28.935C175.333 9.048 163.644 0 150 0c-10.493 0-19.83 5.088-25.623 12.934C120.628 5.088 108.493 0 98 0 80.327 0 65.644 12.536 62.024 29.065 49.33 32.56 40 44.193 40 58c0 16.569 13.431 30 30 30h100zM30 90c-16.569 0-30 13.431-30 30h60c0-16.569-13.431-30-30-30z"/>
        </svg>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="glass-card p-8 fade-in">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logo} alt="Between Clouds" className="w-12 h-12 object-contain" />
              <h1 className="font-display text-2xl font-bold">Between Clouds</h1>
            </div>
            <h2 className="text-xl font-semibold mb-2">Välkommen, vårdgivare!</h2>
            <p className="text-muted-foreground">
              Här är vad du kan göra i Between Clouds
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {DOCTOR_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30"
                >
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
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

          <p className="text-sm text-muted-foreground text-center mb-6">
            Dina patienter kan bjuda in dig genom att ange din e-postadress
          </p>

          <Button
            onClick={handleGetStarted}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Kom igång
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorOnboarding;

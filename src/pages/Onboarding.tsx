import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, Moon, Utensils, Dumbbell, Pill, Sparkles } from 'lucide-react';
import logo from '@/assets/logo.png';

const CHECKIN_OPTIONS = [
  {
    id: 'include_mood',
    label: 'Mående',
    description: 'Hur du mår idag',
    icon: Brain,
    recommended: true,
  },
  {
    id: 'include_sleep',
    label: 'Sömn',
    description: 'Hur du har sovit',
    icon: Moon,
  },
  {
    id: 'include_eating',
    label: 'Mat',
    description: 'Hur du har ätit',
    icon: Utensils,
  },
  {
    id: 'include_exercise',
    label: 'Träning',
    description: 'Om du har tränat',
    icon: Dumbbell,
  },
  {
    id: 'include_medication',
    label: 'Medicin',
    description: 'Om du tagit din medicin',
    icon: Pill,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPreferences } = useUserPreferences();
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

  const handleSubmit = async () => {
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
      title: 'Välkommen!',
      description: 'Din check-in är nu redo att använda.',
    });
    
    navigate('/');
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
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Skapa din check-in</h2>
            </div>
            <p className="text-muted-foreground">
              Välj vad du vill ha med i din dagliga incheckning
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {CHECKIN_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isChecked = selections[option.id as keyof typeof selections];
              
              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isChecked 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                  }`}
                  onClick={() => handleToggle(option.id)}
                >
                  <Checkbox
                    id={option.id}
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(option.id)}
                    className="pointer-events-none"
                  />
                  <div className={`p-2 rounded-lg ${isChecked ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor={option.id} 
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      {option.label}
                      {option.recommended && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Rekommenderas
                        </span>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Du kan ändra detta senare i inställningarna
          </p>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Kom igång
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

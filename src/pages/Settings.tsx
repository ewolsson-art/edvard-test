import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, Moon, Utensils, Dumbbell, Pill, Settings as SettingsIcon, Save } from 'lucide-react';

const CHECKIN_OPTIONS = [
  {
    id: 'include_mood',
    label: 'Mående',
    description: 'Hur du mår idag',
    icon: Brain,
    required: true,
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

const Settings = () => {
  const { toast } = useToast();
  const { preferences, loading, updatePreferences } = useUserPreferences();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selections, setSelections] = useState({
    include_mood: true,
    include_sleep: true,
    include_eating: true,
    include_exercise: true,
    include_medication: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load current preferences
  useEffect(() => {
    if (preferences) {
      setSelections({
        include_mood: preferences.include_mood,
        include_sleep: preferences.include_sleep,
        include_eating: preferences.include_eating,
        include_exercise: preferences.include_exercise,
        include_medication: preferences.include_medication,
      });
    }
  }, [preferences]);

  // Check for changes
  useEffect(() => {
    if (preferences) {
      const changed = 
        selections.include_mood !== preferences.include_mood ||
        selections.include_sleep !== preferences.include_sleep ||
        selections.include_eating !== preferences.include_eating ||
        selections.include_exercise !== preferences.include_exercise ||
        selections.include_medication !== preferences.include_medication;
      setHasChanges(changed);
    }
  }, [selections, preferences]);

  const handleToggle = (id: string) => {
    // Don't allow disabling mood (it's required)
    if (id === 'include_mood') return;
    
    setSelections(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const { error } = await updatePreferences(selections);
    
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
      title: 'Sparat!',
      description: 'Dina inställningar har uppdaterats.',
    });
    
    setIsSubmitting(false);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="glass-card p-8 fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <SettingsIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Inställningar</h1>
            <p className="text-muted-foreground">
              Anpassa din dagliga incheckning
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {CHECKIN_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isChecked = selections[option.id as keyof typeof selections];
              const isDisabled = option.required;
              
              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                  } ${
                    isChecked 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                  }`}
                  onClick={() => !isDisabled && handleToggle(option.id)}
                >
                  <Checkbox
                    id={option.id}
                    checked={isChecked}
                    onCheckedChange={() => !isDisabled && handleToggle(option.id)}
                    disabled={isDisabled}
                    className="pointer-events-none"
                  />
                  <div className={`p-2 rounded-lg ${isChecked ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor={option.id} 
                      className={`font-medium flex items-center gap-2 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {option.label}
                      {option.required && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Obligatorisk
                        </span>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full gap-2"
            disabled={isSubmitting || !hasChanges}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {hasChanges ? 'Spara ändringar' : 'Inga ändringar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

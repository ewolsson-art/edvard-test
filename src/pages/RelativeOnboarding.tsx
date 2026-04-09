import { useState } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';

const RelativeOnboarding = () => {
  const { toast } = useToast();
  const { createPreferences } = useUserPreferences();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
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
    
    window.location.href = '/anhorig';
  };

  return (
    <DarkNightBackground>
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-lg animate-fade-in text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Välkommen som anhörig
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Följ hur dina närstående mår – med deras samtycke
          </p>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Utforska
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default RelativeOnboarding;

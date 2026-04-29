import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Stethoscope, Send, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDoctorConnections } from '@/hooks/useDoctorConnections';
import { z } from 'zod';

const emailSchema = z.string().email();

const DoctorOnboarding = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { requestPatientAccess } = useDoctorConnections();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeOnboarding = async () => {
    if (!user) return false;
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          onboarding_completed: true,
          include_mood: false,
          include_sleep: false,
          include_eating: false,
          include_exercise: false,
          include_medication: false,
        },
        { onConflict: 'user_id' },
      );
    if (error) {
      toast({ title: 'Något gick fel', description: 'Kunde inte slutföra. Försök igen.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleInvite = async () => {
    if (!emailSchema.safeParse(email).success) {
      toast({ title: 'Ogiltig e-postadress', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { success, error } = await requestPatientAccess(email);
    if (!success) {
      setIsSubmitting(false);
      toast({ title: 'Kunde inte skicka', description: error, variant: 'destructive' });
      return;
    }
    const ok = await completeOnboarding();
    if (ok) {
      toast({ title: 'Förfrågan skickad', description: 'Användaren godkänner från sin app.' });
      window.location.href = '/lakare';
    } else {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    const ok = await completeOnboarding();
    if (ok) window.location.href = '/lakare';
    else setIsSubmitting(false);
  };

  return (
    <DarkNightBackground>
      <header className="p-4">
        <div className="max-w-md mx-auto">
          <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(45_85%_55%/0.15)] mb-5">
              <Stethoscope className="w-7 h-7 text-[hsl(45_85%_55%)]" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Välkommen</h1>
            <p className="text-base text-white/60 leading-relaxed">
              Bjud in din första användare för att komma igång.
            </p>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 mb-4 backdrop-blur-sm">
            <label htmlFor="patient-email" className="block text-sm font-medium text-white/80 mb-2">
              E-postadress
            </label>
            <Input
              id="patient-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="namn@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                  handleInvite();
                }
              }}
              className="text-base bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
            />
            <p className="text-xs text-white/40 mt-2 leading-relaxed">
              Använd samma e-post som personen är registrerad med i Toddy. Hen får en
              förfrågan att godkänna i sin app.
            </p>
          </div>

          <Button
            onClick={handleInvite}
            disabled={isSubmitting || !email}
            className="w-full h-12 rounded-full bg-[hsl(45_85%_55%)] hover:bg-[hsl(45_85%_55%)]/90 text-black font-semibold text-base gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Skicka förfrågan
                <Send className="w-4 h-4" />
              </>
            )}
          </Button>

          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full mt-3 h-11 text-sm text-white/50 hover:text-white/80 transition-colors flex items-center justify-center gap-1.5"
          >
            Hoppa över — jag inväntar inbjudan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default DoctorOnboarding;

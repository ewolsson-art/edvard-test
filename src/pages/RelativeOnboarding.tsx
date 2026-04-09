import { useState } from 'react';
import { z } from 'zod';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useRelativeConnections } from '@/hooks/useRelativeConnections';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, ArrowRight, UserPlus, Send } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { Input } from '@/components/ui/input';

const emailSchema = z.string().email({ message: "Ogiltig e-postadress" });

const RelativeOnboarding = () => {
  const { toast } = useToast();
  const { createPreferences } = useUserPreferences();
  const { requestPatientAccess } = useRelativeConnections();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const finishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await createPreferences({
        include_mood: false,
        include_sleep: false,
        include_eating: false,
        include_exercise: false,
        include_medication: false,
      });

      if (error) {
        console.error('Onboarding preferences error:', error);
        toast({
          title: 'Något gick fel',
          description: 'Kunde inte spara dina inställningar. Försök igen.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      window.location.href = '/anhorig';
    } catch (err) {
      console.error('Onboarding error:', err);
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte spara dina inställningar. Försök igen.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleSendRequest = async () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({ title: "Ange en giltig e-postadress", variant: "destructive" });
      return;
    }

    setIsSending(true);
    const { success, error } = await requestPatientAccess(email);
    setIsSending(false);

    if (success) {
      setSent(true);
      toast({
        title: 'Förfrågan skickad!',
        description: 'En inbjudan har skickats. Du kan lägga till fler personer senare.',
      });
    } else {
      toast({
        title: 'Något gick fel',
        description: error || 'Kunde inte skicka förfrågan.',
        variant: 'destructive',
      });
    }
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
            Stötta någon du bryr dig om genom att följa deras mående
          </p>

          {/* Invite section */}
          <div className="text-left mb-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Följ din första person</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Ange personens e-postadress"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sent}
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30"
                onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
              />
              <button
                onClick={handleSendRequest}
                disabled={isSending || sent || !email}
                className="shrink-0 h-10 px-4 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-40 flex items-center gap-1.5 text-sm font-medium"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Skicka
                  </>
                )}
              </button>
            </div>
            {sent && (
              <p className="text-xs text-primary/70 mt-2">
                ✓ Förfrågan skickad – du kan lägga till fler senare
              </p>
            )}
          </div>

          {/* Divider & Skip - hidden when typing, show Utforska after sent */}
          {(!email || sent) && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30">{sent ? '' : 'eller'}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={finishOnboarding}
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : sent ? (
                  <>
                    Utforska
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    Hoppa över – gör det sen
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default RelativeOnboarding;

import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AuthNavbar } from "@/components/AuthNavbar";

const emailSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectUrl = `${window.location.origin}/aterstall-losenord`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        toast({
          title: "Kunde inte skicka återställningslänk",
          description: resetError.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <AuthNavbar />

      <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="auth-card bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <Logo size="md" />
            </div>

            {isSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">Kolla din e-post</h2>
                  <p className="text-muted-foreground">
                    Vi har skickat en återställningslänk till <strong className="text-foreground">{email}</strong>. 
                    Klicka på länken i mailet för att välja ett nytt lösenord.
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail("");
                    }}
                  >
                    Försök med annan e-post
                  </Button>
                  <Link to="/logga-in" className="block">
                    <Button className="w-full">
                      Tillbaka till inloggning
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                    Glömt lösenord?
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Ange din e-postadress så skickar vi en återställningslänk
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      E-postadress
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="din@email.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 h-12 bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all ${error ? 'border-destructive' : ''}`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Skicka återställningslänk"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/logga-in"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Tillbaka till inloggning
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

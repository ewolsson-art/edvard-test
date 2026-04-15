import { useState } from "react";
import { useTranslation } from 'react-i18next';
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
import { DarkNightBackground } from "@/components/DarkNightBackground";

const emailSchema = z.object({
  email: z.string().email(),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

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
          title: t("auth.couldNotSendReset"),
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
    <DarkNightBackground>
      <AuthNavbar />

      <div className="flex flex-1 items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <Logo size="md" className="[&_span]:!bg-none [&_span]:!text-white" />
            </div>

            {isSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[hsl(260_60%_72%/0.15)] flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[hsl(45_85%_55%)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">{t("auth.emailSentTitle")}</h2>
                  <p className="text-white/60">
                    {t("auth.emailSentDesc")} <strong className="text-white">{email}</strong>. 
                    
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail("");
                    }}
                  >
                    {t("auth.sendAgain")}
                  </Button>
                  <Link to="/logga-in" className="block">
                    <Button className="w-full bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)]">
                      {t("common.back")}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-white font-display">
                    Glömt lösenord?
                  </h1>
                  <p className="mt-2 text-white/60">
                    {t("auth.forgotPasswordDesc")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white/80">
                      E-postadress
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 h-12 bg-white/5 border-white/15 rounded-xl text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all ${error ? 'border-red-400/60' : ''}`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-lg shadow-[hsl(260_60%_72%/0.2)] transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      t("auth.sendResetLink")
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/logga-in"
                    className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
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
    </DarkNightBackground>
  );
};

export default ForgotPassword;

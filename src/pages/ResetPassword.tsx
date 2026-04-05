import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { DarkNightBackground } from "@/components/DarkNightBackground";

const passwordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Lösenordet måste vara minst 6 tecken" })
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Ogiltig eller utgången länk",
          description: "Begär en ny återställningslänk.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };
    checkSession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "confirmPassword") fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          title: "Kunde inte uppdatera lösenord",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Lösenord uppdaterat!",
          description: "Du kan nu logga in med ditt nya lösenord.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DarkNightBackground>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size="lg" className="[&_span]:!bg-none [&_span]:!text-white" />
              </div>
            </div>

            {isSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[hsl(260_60%_72%/0.15)] flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[hsl(45_85%_55%)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">Lösenord uppdaterat!</h2>
                  <p className="text-white/60">
                    Ditt lösenord har ändrats. Du kan nu logga in med ditt nya lösenord.
                  </p>
                </div>
                <Button
                  className="w-full bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)]"
                  onClick={() => navigate("/auth")}
                >
                  Gå till inloggning
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2 text-white">Välj nytt lösenord</h2>
                  <p className="text-sm text-white/60">
                    Ange ditt nya lösenord nedan
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-white/80">
                      Nytt lösenord
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[hsl(260_60%_72%/0.5)]"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                      Bekräfta lösenord
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[hsl(260_60%_72%/0.5)]"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-medium bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Uppdatera lösenord
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Tillbaka till inloggning
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DarkNightBackground>
  );
};

export default ResetPassword;

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
import { useTranslation } from 'react-i18next';

const passwordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const { t } = useTranslation();
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
          title: t("auth.invalidOrExpiredLink"),
          description: t("auth.requestNewLink"),
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
          title: t("auth.couldNotUpdatePassword"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: t("auth.passwordUpdated"),
          description: t("auth.passwordUpdatedDesc"),
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
                  <h2 className="text-xl font-semibold text-white">{t("auth.passwordUpdated")}</h2>
                  <p className="text-white/60">
                    {t("auth.passwordUpdatedDesc")}
                  </p>
                </div>
                <Button
                  className="w-full bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)]"
                  onClick={() => navigate("/auth")}
                >
                  {t("auth.logIn")}
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2 text-white">{t("auth.resetPasswordTitle")}</h2>
                  <p className="text-sm text-white/60">
                    {t("auth.resetPasswordDesc")}
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
                    {t("auth.updatePassword")}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    {t("common.back")}
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

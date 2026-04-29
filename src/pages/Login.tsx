import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import { DarkNightBackground } from "@/components/DarkNightBackground";
import { Eye, EyeOff, Loader2, Mail, CheckCircle2, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { TurtleLogo } from "@/components/TurtleLogo";
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [searchParams] = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";

  const { user, loading, signIn } = useAuth();
  const { t } = useTranslation();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !profileLoading && user) {
      const profileCompleted = user.user_metadata?.profile_completed;
      const hasProfileInDb = profile?.first_name;
      if (!profileCompleted && !user.user_metadata?.first_name && !hasProfileInDb) {
        navigate("/slutfor-profil");
      } else {
        navigate("/");
      }
    }
  }, [user, loading, profileLoading, profile, navigate]);

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") errors.email = err.message;
          if (err.path[0] === "password") errors.password = err.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      let errorMessage = t("auth.loginError");
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = t("auth.wrongCredentials");
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = t("auth.confirmEmailFirst");
      }
      toast({
        title: t("auth.loginFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(230_30%_5%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(45_85%_55%)]" />
      </div>
    );
  }

  return (
    <DarkNightBackground>
      <div className="flex flex-1 items-center justify-center px-6 pt-12 pb-12 min-h-screen">
        <div className="w-full max-w-sm">

          {/* Back / cancel */}
          <div className="mb-6 animate-fade-in">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 -ml-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.cancel")}
            </Link>
          </div>

          {/* Mascot + heading */}
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="mb-4 opacity-90">
              <TurtleLogo size="md" animated={false} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
              {t("auth.welcomeBack")}
            </h1>
          </div>

          {isVerified && (
            <div className="mt-5 p-4 rounded-2xl bg-[hsl(45_85%_55%/0.08)] ring-1 ring-[hsl(45_85%_55%/0.2)] flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-[hsl(45_85%_55%)] flex-shrink-0" />
              <p className="text-sm text-white/70">
                {t("auth.emailVerified")}
              </p>
            </div>
          )}

          {/* Social login FIRST */}
          <div className="mt-7 space-y-3 animate-fade-in">
            <button
              type="button"
              onClick={async () => {
                const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                if (result.error) toast({ title: t("common.somethingWrong"), variant: "destructive" });
              }}
              className="w-full h-14 rounded-2xl bg-white/[0.10] ring-1 ring-white/[0.12] hover:ring-white/[0.24] hover:bg-white/[0.14] hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.08)] text-white text-[15px] font-semibold flex items-center justify-center gap-3 transition-all duration-300"
            >
              <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("auth.continueWithGoogle")}
            </button>
            <button
              type="button"
              onClick={async () => {
                const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
                if (result.error) toast({ title: t("common.somethingWrong"), variant: "destructive" });
              }}
              className="w-full h-14 rounded-2xl bg-white/[0.10] ring-1 ring-white/[0.12] hover:ring-white/[0.24] hover:bg-white/[0.14] hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.08)] text-white text-[15px] font-semibold flex items-center justify-center gap-3 transition-all duration-300"
            >
              <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {t("auth.continueWithApple")}
            </button>
          </div>

          {/* Narrow divider — Apple/Stripe style */}
          <div className="flex items-center justify-center gap-3 my-7 animate-fade-in">
            <div className="w-12 h-px bg-white/[0.08]" />
            <span className="text-[11px] text-white/25 uppercase tracking-[0.14em] font-medium">{t("common.or")}</span>
            <div className="w-12 h-px bg-white/[0.08]" />
          </div>

          {/* Email form with proper labels */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-white/55 pl-1">
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-12 h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] transition-all text-base ${validationErrors.email ? 'ring-red-400/40' : ''}`}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              {validationErrors.email && (
                <p className="text-xs text-red-400/80 pl-1">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between pl-1">
                <label htmlFor="password" className="block text-xs font-medium text-white/55">
                  {t("auth.passwordLabel")}
                </label>
                <Link
                  to="/glomt-losenord"
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl pr-12 pl-12 text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] transition-all text-base ${validationErrors.password ? 'ring-red-400/40' : ''}`}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                  aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-red-400/80 pl-1">{validationErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t("auth.logIn")
              )}
            </Button>
          </form>

          {/* Security signal */}
          <div className="mt-6 flex items-center justify-center gap-1.5 animate-fade-in">
            <ShieldCheck className="h-3.5 w-3.5 text-white/30" />
            <span className="text-[11px] text-white/30">
              {t("auth.secureLogin")}
            </span>
          </div>

          <div className="mt-4 text-center animate-fade-in">
            <Link
              to="/skapa-konto"
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              {t("auth.noAccount")} <span className="text-[hsl(45_85%_55%)] font-medium">{t("auth.createOne")}</span>
            </Link>
          </div>
        </div>
      </div>
    </DarkNightBackground>
  );
};

export default Login;

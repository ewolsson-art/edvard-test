import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { TurtleLogo } from "@/components/TurtleLogo";
import { Input } from "@/components/ui/input";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Native app landing screen — shown only inside the iOS/Android app shell.
 * Inline login (Google/Apple/email) directly on landing so users can sign in
 * without an extra navigation step. Signup remains a secondary action.
 */
export function NativeAuthLanding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tap } = useHaptics();
  const { toast } = useToast();
  const { user, loading, signIn } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // If already signed in, route onward
  useEffect(() => {
    if (!loading && !profileLoading && user) {
      const profileCompleted = user.user_metadata?.profile_completed;
      const hasProfileInDb = profile?.first_name;
      if (!profileCompleted && !user.user_metadata?.first_name && !hasProfileInDb) {
        navigate("/slutfor-profil", { replace: true });
      } else {
        navigate("/oversikt", { replace: true });
      }
    }
  }, [user, loading, profileLoading, profile, navigate]);

  const handleSignup = () => {
    tap();
    navigate("/skapa-konto");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = t("auth.invalidEmail") || "Ogiltig e-post";
        if (err.path[0] === "password") fieldErrors.password = t("auth.passwordTooShort") || "Minst 6 tecken";
      });
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    tap();
    const { error } = await signIn(email, password);
    if (error) {
      setIsSubmitting(false);
      let msg = t("auth.loginError");
      if (error.message.includes("Invalid login credentials")) msg = t("auth.wrongCredentials");
      else if (error.message.includes("Email not confirmed")) msg = t("auth.confirmEmailFirst");
      toast({ title: t("auth.loginFailed"), description: msg, variant: "destructive" });
      return;
    }
    setIsSubmitting(false);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    tap();
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: t("common.somethingWrong"), variant: "destructive" });
    }
    if (!result.redirected && !result.error) navigate("/oversikt", { replace: true });
  };

  return (
    <div className="min-h-dvh-safe flex flex-col bg-[hsl(225_30%_5%)] relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 25%, hsl(45 85% 55% / 0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col px-6 pt-safe pb-safe overflow-y-auto">
        {/* Hero — compact */}
        <div className="flex flex-col items-center pt-10 pb-6 animate-fade-in">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -m-6 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(45 85% 55% / 0.25), transparent 70%)",
              }}
            />
            <TurtleLogo size="md" animated className="relative w-24 h-24" />
          </div>
          <h1 className="mt-5 text-[2rem] font-display font-bold text-white tracking-tight leading-none">
            Toddy
          </h1>
          <p className="mt-2 text-sm text-white/55 text-center max-w-[18rem]">
            {t("landing.heroSubtitle")}
          </p>
        </div>

        {/* Social login */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            className="w-full h-14 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] active:bg-white/[0.08] text-white text-[15px] font-semibold flex items-center justify-center gap-3 transition-all"
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
            onClick={() => handleOAuth("apple")}
            className="w-full h-14 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] active:bg-white/[0.08] text-white text-[15px] font-semibold flex items-center justify-center gap-3 transition-all"
          >
            <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {t("auth.continueWithApple")}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3 my-5 animate-fade-in">
          <div className="w-12 h-px bg-white/[0.08]" />
          <span className="text-[11px] text-white/30 uppercase tracking-[0.14em] font-medium">{t("common.or")}</span>
          <div className="w-12 h-px bg-white/[0.08]" />
        </div>

        {/* Email login form */}
        <form onSubmit={handleEmailLogin} className="space-y-3 animate-fade-in">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
            <Input
              type="email"
              inputMode="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-12 h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/25 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] text-base ${errors.email ? 'ring-red-400/40' : ''}`}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400/80 pl-1">{errors.email}</p>}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-12 pr-12 h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/25 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] text-base ${errors.password ? 'ring-red-400/40' : ''}`}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 active:text-white/60"
              aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400/80 pl-1">{errors.password}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[56px] rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-[17px] tracking-wide shadow-[0_8px_24px_hsl(45_85%_55%/0.3)] active:scale-[0.97] transition-transform duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.logIn")}
          </button>

          <div className="flex items-center justify-between pt-1 px-1">
            <button
              type="button"
              onClick={() => { tap(); navigate("/glomt-losenord"); }}
              className="text-xs text-white/40 active:text-white/70"
            >
              {t("auth.forgotPassword")}
            </button>
            <button
              type="button"
              onClick={handleSignup}
              className="text-xs text-white/40 active:text-white/70"
            >
              {t("auth.noAccount")} <span className="text-[hsl(45_85%_55%)] font-semibold">{t("auth.createOne")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

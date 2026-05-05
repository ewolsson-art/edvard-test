import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DarkNightBackground } from "@/components/DarkNightBackground";
import { TurtleLogo } from "@/components/TurtleLogo";
import {
  ArrowRight, ArrowLeft, Loader2, Mail, User, Users, Stethoscope,
  CheckCircle2, Phone, Smartphone, Brain, Pill, Moon, Utensils, Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

type AccountRole = "patient" | "relative" | "doctor";
type Step = "role" | "checkin" | "contact" | "verify-phone" | "email-sent";

const roleInfo = {
  patient: {
    icon: User,
    prefix: "auth.iAm",
    title: "auth.bipolar",
    description: "auth.followYourMood",
  },
  relative: {
    icon: Users,
    prefix: "auth.iAm",
    title: "auth.relative",
    description: "auth.supportCloseOnes",
  },
  doctor: {
    icon: Stethoscope,
    prefix: "auth.iAm",
    title: "auth.doctor",
    description: "auth.followPatients",
  },
};

type CheckinSelections = {
  include_mood: boolean;
  include_medication: boolean;
  include_sleep: boolean;
  include_eating: boolean;
  include_exercise: boolean;
};

const CHECKIN_OPTIONS: Array<{
  id: keyof CheckinSelections;
  labelKey: string;
  descKey: string;
  icon: typeof Brain;
  recommended?: boolean;
}> = [
  { id: "include_mood", labelKey: "onboarding.mood", descKey: "onboarding.moodDesc", icon: Brain, recommended: true },
  { id: "include_medication", labelKey: "onboarding.medication", descKey: "onboarding.medicationDesc", icon: Pill },
  { id: "include_sleep", labelKey: "onboarding.sleep", descKey: "onboarding.sleepDesc", icon: Moon },
  { id: "include_eating", labelKey: "onboarding.eating", descKey: "onboarding.eatingDesc", icon: Utensils },
  { id: "include_exercise", labelKey: "onboarding.exercise", descKey: "onboarding.exerciseDesc", icon: Dumbbell },
];

const Signup = () => {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<AccountRole | null>("patient");
  const [checkinSelections, setCheckinSelections] = useState<CheckinSelections>({
    include_mood: true,
    include_medication: false,
    include_sleep: false,
    include_eating: false,
    include_exercise: false,
  });
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, loading, signInWithOtp, verifyOtp } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleToggleCheckin = (id: keyof CheckinSelections) => {
    setCheckinSelections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const hasAnyCheckin = Object.values(checkinSelections).some(Boolean);

  const persistPreSignupData = () => {
    if (role) localStorage.setItem("signup_role", role);
    localStorage.setItem("signup_checkin_prefs", JSON.stringify(checkinSelections));
  };

  const handleSendOtp = async () => {
    const value = contactMethod === "email" ? email.trim() : phone.trim();
    if (!value) {
      toast({
        title: t("auth.fillField"),
        description: contactMethod === "email" ? t("auth.enterEmail") : t("auth.enterPhone"),
        variant: "destructive",
      });
      return;
    }

    if (contactMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast({ title: t("auth.invalidEmail"), variant: "destructive" });
      return;
    }

    if (contactMethod === "phone" && !value.startsWith("+")) {
      toast({
        title: t("auth.enterCountryCode"),
        description: t("auth.phoneCountryCodeHint"),
        variant: "destructive",
      });
      return;
    }

    persistPreSignupData();

    setIsSubmitting(true);
    const { error } = await signInWithOtp(value, role!);

    if (error) {
      toast({
        title: t("common.somethingWrong"),
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (contactMethod === "email") {
      setStep("email-sent");
    } else {
      setStep("verify-phone");
    }
    setIsSubmitting(false);
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    persistPreSignupData();
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/slutfor-profil",
    });
    if (result.error) {
      toast({
        title: t("common.somethingWrong"),
        description: result.error.message || t("auth.loginError"),
        variant: "destructive",
      });
    }
  };

  const handleVerifyPhone = async () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      toast({ title: t("auth.enterCode"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await verifyOtp(phone.trim(), otpCode.trim());
    if (error) {
      toast({
        title: t("auth.wrongCode"),
        description: t("auth.checkCodeRetry"),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(230_30%_5%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(45_85%_55%)]" />
      </div>
    );
  }

  // Progress: role → checkin → contact (3 visible steps)
  const isDoctor = role === "doctor";
  const progressWidth = step === "role" ? (isDoctor ? "50%" : "33%") : step === "checkin" ? "66%" : "100%";
  const showProgress = step === "role" || step === "checkin" || step === "contact";

  return (
    <DarkNightBackground>
      <div className={`flex flex-1 justify-center px-6 pb-5 ${step === "email-sent" ? "items-center pt-5" : "items-start pt-5 md:pt-6"}`} role="main">
        <div className="w-full max-w-sm">

          {/* Subtle progress bar */}
          {showProgress && (
            <div className="mb-5 animate-fade-in">
              <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(45_85%_55%)] rounded-full transition-all duration-700 ease-out"
                  style={{ width: progressWidth }}
                />
              </div>
            </div>
          )}

          {/* Step 1: Role */}
          {step === "role" && (
            <div className="animate-fade-in">
              <Link to="/auth" className="inline-flex items-center gap-2 px-4 py-2 -ml-2 mb-4 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all">
                <ArrowLeft className="h-4 w-4" />
                {t("common.cancel")}
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                {t("auth.whoAreYou")}
              </h1>

              {/* Sköldpaddan kör bil från vänster till höger */}
              <div className="turtle-car-track relative mt-3 h-14 w-full" aria-hidden="true">
                {/* Mark / väg-linje */}
                <div className="absolute left-0 right-0 bottom-2 h-px bg-white/[0.06]" />

                {/* Rörlig scen */}
                <div className="turtle-car-scene absolute left-0 bottom-0 w-[112px] h-[70px] md:w-[132px] md:h-[78px]">
                  <div className="turtle-car-bounce relative w-full h-full">
                    {/* Bilbas bakom föraren */}
                    <svg viewBox="0 0 120 70" className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-visible">
                      <path
                        d="M5 50 C8 41 19 38 36 37 L49 29 C55 25 65 25 73 31 L84 38 C102 38 114 43 117 54 C118 58 115 61 110 61 L9 61 C3 61 1 56 5 50 Z"
                        fill="hsl(var(--primary) / 0.92)"
                      />
                      <g>
                        <circle cx="27" cy="61" r="8" fill="hsl(var(--background))" />
                        <circle cx="27" cy="61" r="3.5" fill="hsl(var(--muted-foreground))" className="turtle-car-wheel" />
                      </g>
                      <g>
                        <circle cx="94" cy="61" r="8" fill="hsl(var(--background))" />
                        <circle cx="94" cy="61" r="3.5" fill="hsl(var(--muted-foreground))" className="turtle-car-wheel" />
                      </g>
                    </svg>

                    {/* Sköldpadda-förare — lutar framåt mot ratten i köriktningen */}
                    <div className="absolute left-[35%] bottom-[13%] w-[52px] h-[52px] md:w-[58px] md:h-[58px] z-10 overflow-hidden">
                      <TurtleLogo
                        size="sm"
                        animated={false}
                        className="absolute left-1/2 top-2 w-[72px] h-[78px] md:w-[80px] md:h-[86px] translate-x-[calc(-50%+3px)] rotate-[14deg]"
                      />
                    </div>

                    {/* Dörr, sarg, ratt och front ovanpå föraren för sittande effekt */}
                    <svg viewBox="0 0 120 70" className="absolute inset-0 w-full h-full z-20 pointer-events-none overflow-visible">
                      <path d="M50 31 C56 28 64 29 70 36 L49 37 Z" fill="hsl(var(--background) / 0.36)" />
                      <path
                        d="M7 49 C13 43 25 41 38 41 L84 41 C101 41 111 45 116 54 C117 58 114 61 109 61 L9 61 C3 61 1 55 7 49 Z"
                        fill="hsl(var(--primary))"
                      />
                      <path d="M40 41 L48 31 C55 26 66 27 74 38" stroke="hsl(var(--primary-foreground) / 0.28)" strokeWidth="2" strokeLinecap="round" fill="none" />
                      {/* Armar som sträcker sig ut mot ratten — visar att hen kör */}
                      <path d="M56 46 C58 47 60 48 62 49" stroke="hsl(120 30% 28%)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                      <path d="M58 44 C60 45 62 46 63 47" stroke="hsl(120 30% 28%)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                      {/* Ratt nära föraren */}
                      <path d="M66 38 L62 47" stroke="hsl(var(--background))" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="62" cy="48" r="4" fill="none" stroke="hsl(var(--background))" strokeWidth="2" />
                      {/* Små händer som greppar ratten */}
                      <circle cx="60.5" cy="48.5" r="1.6" fill="hsl(120 35% 35%)" />
                      <circle cx="63.5" cy="47.5" r="1.6" fill="hsl(120 35% 35%)" />
                      {/* Strålkastare riktade framåt åt höger */}
                      <path d="M116 49 L132 45 L132 53 Z" fill="hsl(50 100% 88% / 0.16)" />
                      <ellipse cx="114" cy="49" rx="3" ry="2.3" fill="hsl(50 100% 88%)" />
                      <path d="M18 43 C27 39 37 38 47 39" stroke="hsl(var(--primary-foreground) / 0.22)" strokeWidth="2" strokeLinecap="round" />
                    </svg>

                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-white/40">
                {t("auth.chooseHowToUse")}
              </p>

              <div className="mt-4 space-y-2" role="radiogroup">
                {(Object.keys(roleInfo) as AccountRole[]).map((roleKey) => {
                  const info = roleInfo[roleKey];
                  const Icon = info.icon;
                  const isSelected = role === roleKey;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setRole(roleKey)}
                      role="radio"
                      aria-checked={isSelected}
                      className={cn(
                        "w-full p-3 rounded-2xl text-left transition-all duration-300 group",
                        isSelected
                          ? "bg-white/[0.08] ring-2 ring-[hsl(45_85%_55%)] shadow-[0_0_24px_-6px_hsl(45_85%_55%/0.2)]"
                          : "bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                           "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300",
                          isSelected ? "bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)]" : "bg-white/[0.06] text-white/40"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{t(info.prefix)}</span>
                          <h3 className={cn(
                            "text-base font-semibold capitalize -mt-0.5 transition-colors",
                            isSelected ? "text-white" : "text-white/70"
                          )}>
                             {t(info.title)}
                          </h3>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0",
                          isSelected ? "border-[hsl(45_85%_55%)] bg-[hsl(45_85%_55%)]" : "border-white/20"
                        )}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-[hsl(230_30%_5%)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="mt-1.5 ml-15 text-xs text-white/30 pl-[60px]">{t(info.description)}</p>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => role && setStep(role === "doctor" ? "contact" : "checkin")}
                disabled={!role}
                className="w-full h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 mt-5 group disabled:opacity-30 disabled:shadow-none"
              >
                {t("common.continue")}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {/* Step 2: Choose check-in categories (BEFORE account creation) */}
          {step === "checkin" && (
            <div className="animate-fade-in">
              <button
                onClick={() => setStep("role")}
                className="inline-flex items-center gap-2 px-4 py-2 -ml-2 mb-8 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </button>

              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                {t("signup.checkinTitle")}
              </h1>
              <p className="mt-2 text-sm text-white/40">
                {t("signup.checkinSubtitle")}
              </p>

              <div className="mt-6 space-y-2.5">
                {CHECKIN_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isChecked = checkinSelections[option.id as keyof CheckinSelections];

                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer",
                        isChecked
                          ? "bg-white/[0.06] ring-1 ring-[hsl(45_85%_55%/0.3)]"
                          : "bg-white/[0.04] ring-1 ring-white/[0.08] hover:ring-white/[0.15]"
                      )}
                      onClick={() => handleToggleCheckin(option.id as keyof CheckinSelections)}
                    >
                      <Checkbox
                        id={option.id}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleCheckin(option.id as keyof CheckinSelections)}
                        className="pointer-events-none border-white/20 data-[state=checked]:bg-[hsl(45_85%_55%)] data-[state=checked]:border-[hsl(45_85%_55%)]"
                      />
                      <div className={cn(
                        "p-1.5 rounded-xl transition-colors",
                        isChecked ? "bg-[hsl(45_85%_55%/0.1)]" : "bg-white/[0.04]"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4 transition-colors",
                          isChecked ? "text-[hsl(45_85%_55%)]" : "text-white/30"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={option.id}
                          className="text-sm font-medium cursor-pointer flex items-center gap-2 text-white"
                        >
                          {t(option.labelKey)}
                          {option.recommended && (
                            <span className="text-[10px] bg-[hsl(45_85%_55%/0.1)] text-[hsl(45_85%_55%)] px-1.5 py-0.5 rounded-full">
                              {t("onboarding.recommended")}
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-white/30 line-clamp-1">{t(option.descKey)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasAnyCheckin && (
                <p className="text-xs text-red-400/80 text-center mt-3">
                  {t("onboarding.chooseAtLeastOne")}
                </p>
              )}

              <p className="text-xs text-white/20 text-center mt-3">
                {t("onboarding.canChangeLater")}
              </p>

              <Button
                onClick={() => setStep("contact")}
                disabled={!hasAnyCheckin}
                className="w-full h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 mt-6 group disabled:opacity-30 disabled:shadow-none"
              >
                {t("common.continue")}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {/* Step 3: Contact (account creation) */}
          {step === "contact" && (
            <div className="animate-fade-in">
              <button onClick={() => setStep(role === "doctor" ? "role" : "checkin")} className="inline-flex items-center gap-2 px-4 py-2 -ml-2 mb-8 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all">
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </button>

              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                {t(
                  role === "doctor"
                    ? "signup.saveYourSetupTitleDoctor"
                    : role === "relative"
                    ? "signup.saveYourSetupTitleRelative"
                    : "signup.saveYourSetupTitle"
                )}
              </h1>
              <p className="mt-2 text-sm text-white/40">
                {t(
                  role === "doctor"
                    ? "signup.saveYourSetupSubtitleDoctor"
                    : role === "relative"
                    ? "signup.saveYourSetupSubtitleRelative"
                    : "signup.saveYourSetupSubtitle"
                )}
              </p>

              {/* Social login FIRST */}
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
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
                  onClick={() => handleSocialLogin("apple")}
                  className="w-full h-14 rounded-2xl bg-white/[0.10] ring-1 ring-white/[0.12] hover:ring-white/[0.24] hover:bg-white/[0.14] hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.08)] text-white text-[15px] font-semibold flex items-center justify-center gap-3 transition-all duration-300"
                >
                  <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {t("auth.continueWithApple")}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-white/20 uppercase tracking-wider font-medium">{t("common.or")}</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Email/phone form */}
              <div>
                {contactMethod === "email" ? (
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@email.se"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] transition-all text-base"
                      disabled={isSubmitting}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+46701234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-12 h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] transition-all text-base"
                      disabled={isSubmitting}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 mt-6 group"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {t("auth.sendCode")}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Phone OTP verification */}
          {step === "verify-phone" && (
            <div className="animate-fade-in">
              <button onClick={() => setStep("contact")} className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </button>

              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-[hsl(45_85%_55%/0.1)] flex items-center justify-center mb-6">
                  <Smartphone className="h-7 w-7 text-[hsl(45_85%_55%)]" />
                </div>
                <h1 className="text-2xl font-bold text-white font-display tracking-tight">{t("auth.enterTheCode")}</h1>
                <p className="mt-2 text-sm text-white/40 text-center">
                  {t("auth.weSentCodeTo")} <span className="text-white/70">{phone}</span>
                </p>
              </div>

              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="mt-8 h-16 text-center text-2xl tracking-[0.5em] bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/15 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] transition-all"
                disabled={isSubmitting}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPhone()}
                autoFocus
              />

              <Button
                onClick={handleVerifyPhone}
                disabled={isSubmitting || otpCode.length < 6}
                className="w-full h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300 mt-6 disabled:opacity-30 disabled:shadow-none"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.verify")}
              </Button>
            </div>
          )}

          {/* Email sent confirmation */}
          {step === "email-sent" && (
            <div className="animate-fade-in text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-2xl bg-[hsl(45_85%_55%/0.1)] flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[hsl(45_85%_55%)] animate-scale-in" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white font-display tracking-tight">{t("auth.checkYourEmail")}</h2>
              <p className="mt-3 text-sm text-white/40 leading-relaxed">
                {t("auth.weSentVerificationTo")}<br />
                <span className="text-white/70">{email}</span>
              </p>
              <p className="mt-2 text-xs text-white/20">
                {t("auth.checkSpam")}
              </p>

              <Link to="/logga-in" className="block mt-8">
                <Button variant="outline" className="w-full h-12 rounded-2xl border-0 ring-1 ring-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all">
                   {t("auth.backToLogin")}
                </Button>
              </Link>
            </div>
          )}

          {/* Footer */}
          {showProgress && (
            <div className="mt-5 text-center">
              <Link to="/logga-in" className="text-sm text-white/30 hover:text-white/60 transition-colors">
                {t("auth.hasAccount")} <span className="text-[hsl(45_85%_55%)] font-medium">{t("auth.logIn")}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DarkNightBackground>
  );
};

export default Signup;

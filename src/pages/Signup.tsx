import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthNavbar } from "@/components/AuthNavbar";
import { DarkNightBackground } from "@/components/DarkNightBackground";
import { ArrowRight, ArrowLeft, Loader2, Mail, User, Users, CheckCircle2, Phone, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountRole = "patient" | "relative";
type Step = "role" | "contact" | "verify-phone" | "email-sent";

const roleInfo = {
  patient: {
    icon: User,
    prefix: "Jag är",
    title: "bipolär",
    description: "Följ ditt mående och få bättre insikt",
  },
  relative: {
    icon: Users,
    prefix: "Jag är",
    title: "anhörig",
    description: "Stötta dina nära genom att följa deras resa",
  },
};

const Signup = () => {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<AccountRole | null>(null);
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, loading, signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSendOtp = async () => {
    const value = contactMethod === "email" ? email.trim() : phone.trim();
    if (!value) {
      toast({
        title: "Fyll i fältet",
        description: contactMethod === "email" ? "Ange din e-postadress" : "Ange ditt telefonnummer",
        variant: "destructive",
      });
      return;
    }

    if (contactMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast({ title: "Ogiltig e-postadress", variant: "destructive" });
      return;
    }

    if (contactMethod === "phone" && !value.startsWith("+")) {
      toast({
        title: "Ange landskod",
        description: "Telefonnumret måste börja med + (t.ex. +46701234567)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signInWithOtp(value, role!);

    if (error) {
      toast({
        title: "Något gick fel",
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
    if (role) {
      localStorage.setItem("signup_role", role);
    }
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/slutfor-profil",
    });
    if (result.error) {
      toast({
        title: "Något gick fel",
        description: result.error.message || "Kunde inte logga in",
        variant: "destructive",
      });
    }
  };

  const handleVerifyPhone = async () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      toast({ title: "Ange den 6-siffriga koden", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await verifyOtp(phone.trim(), otpCode.trim());
    if (error) {
      toast({
        title: "Felaktig kod",
        description: "Kontrollera koden och försök igen",
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

  const progressWidth = step === "role" ? "50%" : "100%";

  return (
    <DarkNightBackground>
      

      <div className="flex flex-1 items-center justify-center px-6 pt-16 pb-8" role="main">
        <div className="w-full max-w-sm">

          {/* Subtle progress bar */}
          {(step === "role" || step === "contact") && (
            <div className="mb-10 animate-fade-in">
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
              <Link to="/" className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Tillbaka
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Vem är du?
              </h1>
              <p className="mt-2 text-sm text-white/40">
                Välj hur du vill använda Toddy
              </p>

              <div className="mt-8 space-y-3" role="radiogroup">
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
                        "w-full p-4 rounded-2xl text-left transition-all duration-300 group",
                        isSelected
                          ? "bg-white/[0.08] ring-2 ring-[hsl(45_85%_55%)] shadow-[0_0_24px_-6px_hsl(45_85%_55%/0.2)]"
                          : "bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300",
                          isSelected ? "bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)]" : "bg-white/[0.06] text-white/40"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{info.prefix}</span>
                          <h3 className={cn(
                            "text-lg font-semibold capitalize -mt-0.5 transition-colors",
                            isSelected ? "text-white" : "text-white/70"
                          )}>
                            {info.title}
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
                      <p className="mt-1.5 ml-15 text-xs text-white/30 pl-[60px]">{info.description}</p>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => role && setStep("contact")}
                disabled={!role}
                className="w-full h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 mt-8 group disabled:opacity-30 disabled:shadow-none"
              >
                Fortsätt
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {/* Step 2: Contact */}
          {step === "contact" && (
            <div className="animate-fade-in">
              <button onClick={() => setStep("role")} className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Tillbaka
              </button>

              <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Skapa konto
              </h1>
              <p className="mt-2 text-sm text-white/40">
                Välj hur du vill komma igång
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
                  Fortsätt med Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin("apple")}
                  className="w-full h-14 rounded-2xl bg-white/[0.10] ring-1 ring-white/[0.12] hover:ring-white/[0.24] hover:bg-white/[0.14] hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.08)] text-white text-[15px] font-semibold flex items-center justify-center gap-3 transition-all duration-300"
                >
                  <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Fortsätt med Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-white/20 uppercase tracking-wider font-medium">eller</span>
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
                    Skicka kod
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
                Tillbaka
              </button>

              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-[hsl(45_85%_55%/0.1)] flex items-center justify-center mb-6">
                  <Smartphone className="h-7 w-7 text-[hsl(45_85%_55%)]" />
                </div>
                <h1 className="text-2xl font-bold text-white font-display tracking-tight">Ange koden</h1>
                <p className="mt-2 text-sm text-white/40 text-center">
                  Vi skickade en kod till <span className="text-white/70">{phone}</span>
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
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verifiera"}
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

              <h2 className="text-2xl font-bold text-white font-display tracking-tight">Kolla din e-post</h2>
              <p className="mt-3 text-sm text-white/40 leading-relaxed">
                Vi har skickat en verifieringslänk till<br />
                <span className="text-white/70">{email}</span>
              </p>
              <p className="mt-2 text-xs text-white/20">
                Kolla även skräpposten
              </p>

              <Link to="/logga-in" className="block mt-8">
                <Button variant="outline" className="w-full h-12 rounded-2xl border-0 ring-1 ring-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all">
                  Tillbaka till inloggning
                </Button>
              </Link>
            </div>
          )}

          {/* Footer */}
          {(step === "role" || step === "contact") && (
            <div className="mt-8 text-center">
              <Link to="/logga-in" className="text-sm text-white/30 hover:text-white/60 transition-colors">
                Har du redan ett konto? <span className="text-[hsl(45_85%_55%)] font-medium">Logga in</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DarkNightBackground>
  );
};

export default Signup;

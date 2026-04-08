import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthNavbar } from "@/components/AuthNavbar";
import { Logo } from "@/components/Logo";
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
    description: "Följ ditt mående och dela med din vårdgivare",
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
    // Store selected role in localStorage so we can use it after redirect
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
    // Successfully verified — auth state change will redirect
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(230_30%_5%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(45_85%_55%)]" />
      </div>
    );
  }

  const totalSteps = 2;
  const currentStepIndex = step === "role" ? 0 : 1;

  return (
    <DarkNightBackground>
      <AuthNavbar />

      <div className="flex flex-1 items-start justify-center px-4 pt-20 pb-8" role="main">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex justify-center mb-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/50 font-medium mr-2">Steg {currentStepIndex + 1}/{totalSteps}</div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                step === "role" ? "bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] shadow-md" : "bg-white/10 text-white/60"
              )}>1</div>
              <div className={cn(
                "w-12 h-1 rounded-full transition-all duration-500",
                step !== "role" ? "bg-[hsl(45_85%_55%)]" : "bg-white/15"
              )} />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                step !== "role" ? "bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] shadow-md" : "bg-white/10 text-white/30"
              )}>2</div>
            </div>
          </div>

          <div className="bg-[hsl(225_25%_14%)] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.06] p-5 md:p-6 animate-fade-in">
            {/* Step 1: Role */}
            {step === "role" && (
              <div className="animate-fade-in">
                <div className="flex flex-col items-center mb-5">
                  <Logo size="sm" className="[&_span]:!bg-none [&_span]:!text-white" />
                  <h1 className="mt-3 text-xl md:text-2xl font-bold text-white font-display">Skapa konto</h1>
                  <p className="mt-1 text-sm text-white/60 text-center">Vilket typ av konto vill du skapa?</p>
                </div>

                <div className="space-y-2" role="radiogroup">
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
                          "w-full p-3 rounded-xl border-2 text-left transition-all duration-300 group",
                          isSelected
                            ? "border-[hsl(45_85%_55%)] bg-[hsl(45_85%_55%/0.08)] shadow-md shadow-[hsl(45_85%_55%/0.15)]"
                            : "border-white/20 bg-white/[0.06] hover:border-white/35 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-all",
                            isSelected ? "bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)]" : "bg-white/10 text-white/60"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={cn("font-semibold text-sm transition-colors", isSelected ? "text-[hsl(45_85%_55%)]" : "text-white")}>
                                <span className="text-xs font-normal text-white/50 block leading-tight">{info.prefix}</span>
                                <span className="capitalize">{info.title}</span>
                              </h3>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-[hsl(45_85%_55%)] animate-scale-in" />}
                            </div>
                            <p className="text-xs text-white/50">{info.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => role && setStep("contact")}
                  disabled={!role}
                  className="w-full h-11 rounded-xl text-sm font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-lg transition-all mt-5 group"
                >
                  Fortsätt
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}

            {/* Step 2: Email or Phone */}
            {step === "contact" && (
              <div className="animate-fade-in">
                <button onClick={() => setStep("role")} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Tillbaka
                </button>

                <div className="flex flex-col items-center mb-5">
                  <h1 className="text-xl md:text-2xl font-bold text-white font-display">Ange din kontaktinfo</h1>
                  <p className="mt-1 text-xs text-white/50 text-center">Vi skickar en verifieringskod</p>
                </div>

                {/* Method toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setContactMethod("email")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                      contactMethod === "email"
                        ? "bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)]"
                        : "bg-white/[0.06] text-white/50 hover:bg-white/10"
                    )}
                  >
                    <Mail className="h-4 w-4" />
                    E-post
                  </button>
                  <button
                    onClick={() => setContactMethod("phone")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                      contactMethod === "phone"
                        ? "bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)]"
                        : "bg-white/[0.06] text-white/50 hover:bg-white/10"
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                    Telefon
                  </button>
                </div>

                {contactMethod === "email" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-white/80">E-postadress</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="din@email.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all text-base"
                        disabled={isSubmitting}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium text-white/80">Telefonnummer</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+46701234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-12 bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all text-base"
                        disabled={isSubmitting}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl text-sm font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-lg transition-all mt-5 group"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Skicka verifiering
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Phone OTP verification */}
            {step === "verify-phone" && (
              <div className="animate-fade-in">
                <button onClick={() => setStep("contact")} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Tillbaka
                </button>

                <div className="flex flex-col items-center mb-5">
                  <div className="h-14 w-14 rounded-full bg-[hsl(260_60%_72%/0.15)] flex items-center justify-center mb-3">
                    <Smartphone className="h-7 w-7 text-[hsl(45_85%_55%)]" />
                  </div>
                  <h1 className="text-xl font-bold text-white font-display">Ange koden</h1>
                  <p className="mt-1 text-xs text-white/50 text-center">
                    Vi skickade en kod till <strong className="text-white">{phone}</strong>
                  </p>
                </div>

                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="h-14 text-center text-2xl tracking-[0.5em] bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all"
                  disabled={isSubmitting}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPhone()}
                  autoFocus
                />

                <Button
                  onClick={handleVerifyPhone}
                  disabled={isSubmitting || otpCode.length < 6}
                  className="w-full h-11 rounded-xl text-sm font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-lg transition-all mt-5"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verifiera"}
                </Button>
              </div>
            )}

            {/* Email sent confirmation */}
            {step === "email-sent" && (
              <div className="animate-fade-in text-center">
                <div className="flex justify-center mb-4 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-[hsl(260_60%_72%/0.15)] rounded-full blur-xl animate-pulse" />
                  </div>
                  <div className="h-14 w-14 rounded-full bg-[hsl(260_60%_72%/0.15)] flex items-center justify-center relative">
                    <CheckCircle2 className="h-7 w-7 text-[hsl(45_85%_55%)] animate-scale-in" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-3 font-display">Kolla din e-post</h2>
                <p className="text-white/60 text-sm mb-4">
                  Vi har skickat en verifieringslänk till <strong className="text-white">{email}</strong>.
                  Klicka på länken för att fortsätta.
                </p>
                <p className="text-xs text-white/40 mb-6">
                  Det kan ta någon minut. Kolla även din skräppost.
                </p>

                <Link to="/logga-in">
                  <Button variant="outline" className="w-full h-11 rounded-xl border-white/20 text-white hover:bg-white/10 transition-all">
                    Tillbaka till inloggning
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          {(step === "role" || step === "contact") && (
            <div className="mt-6 text-center">
              <Link to="/logga-in" className="text-sm text-white/60 hover:text-white transition-colors font-semibold">
                Har du redan ett konto? <span className="text-[hsl(45_85%_55%)]">Logga in</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DarkNightBackground>
  );
};

export default Signup;

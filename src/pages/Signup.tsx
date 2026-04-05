import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthNavbar } from "@/components/AuthNavbar";
import { Logo } from "@/components/Logo";
import { DarkNightBackground } from "@/components/DarkNightBackground";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Mail, User, Stethoscope, Users, CheckCircle2, AlertCircle, Sparkles, Heart, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
});

type AccountRole = "patient" | "doctor" | "relative";
type Step = "role" | "details" | "submitting";

const roleInfo = {
  patient: {
    icon: User,
    title: "Patient",
    description: "Följ ditt mående och dela med din vårdgivare",
    benefits: ["Dagliga incheckningar", "AI-insikter", "Dela med läkare"],
  },
  doctor: {
    icon: Stethoscope,
    title: "Vårdgivare",
    description: "Följ dina patienters mående och välbefinnande",
    benefits: ["Patientöversikt", "Meddelandefunktion", "Trendanalyser"],
  },
  relative: {
    icon: Users,
    title: "Anhörig",
    description: "Stötta dina nära genom att följa deras resa",
    benefits: ["Följ patienters mående", "Lämna kommentarer", "Få notiser"],
  },
};

const Signup = () => {
  const [step, setStep] = useState<Step>("role");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<AccountRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    firstName?: string; 
    lastName?: string;
  }>({});

  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    try {
      signupSchema.parse({ email, password, confirmPassword, firstName, lastName });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { email?: string; password?: string; confirmPassword?: string; firstName?: string; lastName?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") errors.email = err.message;
          if (err.path[0] === "password") errors.password = err.message;
          if (err.path[0] === "confirmPassword") errors.confirmPassword = err.message;
          if (err.path[0] === "firstName") errors.firstName = err.message;
          if (err.path[0] === "lastName") errors.lastName = err.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!role) return;
    
    setIsSubmitting(true);
    setStep("submitting");

    const { error, data } = await signUp(email, password, { 
      role,
      first_name: firstName,
      last_name: lastName
    });

    if (error) {
      let errorMessage = "Ett fel uppstod vid registrering";
      if (error.message.includes("User already registered")) {
        setShowAlreadyRegistered(true);
        setStep("details");
        setIsSubmitting(false);
        return;
      }
      toast({
        title: "Registrering misslyckades",
        description: errorMessage,
        variant: "destructive",
      });
      setStep("details");
    } else {
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setShowAlreadyRegistered(true);
        setStep("details");
        setIsSubmitting(false);
        return;
      }
      setShowConfirmation(true);
    }

    setIsSubmitting(false);
  };

  const handleRoleSelect = (selectedRole: AccountRole) => {
    setRole(selectedRole);
  };

  const handleContinue = () => {
    if (step === "role" && role) {
      setStep("details");
    } else if (step === "details") {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("role");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(230_30%_5%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(260_60%_72%)]" />
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <DarkNightBackground>
        <AuthNavbar />
        <div className="flex flex-1 items-center justify-center px-4 pt-20 pb-12">
          <div className="w-full max-w-md">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 text-center animate-fade-in">
              <div className="flex justify-center mb-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-[hsl(260_60%_72%/0.15)] rounded-full blur-xl animate-pulse" />
                </div>
                <div className="h-16 w-16 rounded-full bg-[hsl(260_60%_72%/0.15)] flex items-center justify-center relative">
                  <CheckCircle2 className="h-8 w-8 text-[hsl(260_60%_72%)] animate-scale-in" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 font-display">Bekräfta din e-post</h2>
              <p className="text-white/60 mb-6">
                Vi har skickat ett bekräftelsemail till <strong className="text-white">{email}</strong>. 
                Klicka på länken i mailet för att aktivera ditt konto.
              </p>
              <p className="text-sm text-white/50 mb-6">
                Det kan ta någon minut innan mailet kommer fram. Kolla även din skräppost.
              </p>
              <Link to="/logga-in">
                <Button variant="outline" className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white/10 transition-all duration-300">
                  Tillbaka till inloggning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DarkNightBackground>
    );
  }

  const currentStepIndex = step === "role" ? 0 : 1;

  return (
    <DarkNightBackground>
      <AuthNavbar />
      
      <div className="flex flex-1 items-start justify-center px-4 pt-20 pb-8" role="main" aria-label="Skapa konto">
        <div className="w-full max-w-lg">
          {/* Progress bar */}
          <div className="flex justify-center mb-4 animate-fade-in" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={2} aria-label={`Steg ${currentStepIndex + 1} av 2`}>
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/50 font-medium mr-2">Steg {currentStepIndex + 1}/2</div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                step === "role" ? "bg-[hsl(260_60%_72%)] text-[hsl(230_30%_5%)] shadow-md shadow-[hsl(260_60%_72%/0.3)]" : "bg-white/10 text-white/60"
              )} aria-hidden="true">
                1
              </div>
              <div className={cn(
                "w-12 h-1 rounded-full transition-all duration-500",
                step === "details" || step === "submitting" ? "bg-[hsl(260_60%_72%)]" : "bg-white/15"
              )} aria-hidden="true" />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                step === "details" || step === "submitting" ? "bg-[hsl(260_60%_72%)] text-[hsl(230_30%_5%)] shadow-md shadow-[hsl(260_60%_72%/0.3)]" : "bg-white/10 text-white/30"
              )} aria-hidden="true">
                2
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-5 md:p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Step 1: Role Selection */}
            {step === "role" && (
              <div className="animate-fade-in" role="group" aria-labelledby="role-heading">
                <div className="flex flex-col items-center mb-5">
                  <Logo size="sm" className="[&_span]:!bg-none [&_span]:!text-white" />
                  <h1 id="role-heading" className="mt-3 text-xl md:text-2xl font-bold text-white font-display">
                    Välkommen! 👋
                  </h1>
                  <p className="mt-1 text-sm text-white/60 text-center">
                    Vilket typ av konto vill du skapa?
                  </p>
                </div>

                <div className="space-y-2" role="radiogroup" aria-label="Välj kontotyp">
                  {(Object.keys(roleInfo) as AccountRole[]).map((roleKey) => {
                    const info = roleInfo[roleKey];
                    const Icon = info.icon;
                    const isSelected = role === roleKey;
                    
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handleRoleSelect(roleKey)}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${info.title}: ${info.description}`}
                        className={cn(
                          "w-full p-3 rounded-xl border-2 text-left transition-all duration-300 group",
                          isSelected 
                            ? "border-[hsl(260_60%_72%)] bg-[hsl(260_60%_72%/0.1)] shadow-md shadow-[hsl(260_60%_72%/0.1)]" 
                            : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-300",
                            isSelected ? "bg-[hsl(260_60%_72%)] text-[hsl(230_30%_5%)]" : "bg-white/10 text-white/60 group-hover:bg-white/15"
                          )} aria-hidden="true">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={cn(
                                "font-semibold text-sm transition-colors",
                                isSelected ? "text-[hsl(260_60%_72%)]" : "text-white"
                              )}>
                                {info.title}
                              </h3>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-[hsl(260_60%_72%)] animate-scale-in" aria-hidden="true" />
                              )}
                            </div>
                            <p className="text-xs text-white/50">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={!role}
                  className="w-full h-11 rounded-xl text-sm font-semibold bg-[hsl(260_60%_72%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(260_60%_80%)] shadow-lg shadow-[hsl(260_60%_72%/0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group mt-5"
                >
                  Fortsätt
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}

            {/* Step 2: Account Details */}
            {(step === "details" || step === "submitting") && (
              <div className="animate-fade-in" role="group" aria-labelledby="details-heading">
                <div className="flex flex-col items-center mb-4">
                  {role && (
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-[hsl(260_60%_72%)] text-[hsl(230_30%_5%)]"
                    )} aria-hidden="true">
                      {(() => {
                        const Icon = roleInfo[role].icon;
                        return <Icon className="h-5 w-5" aria-hidden="true" />;
                      })()}
                    </div>
                  )}
                  <h1 id="details-heading" className="text-xl md:text-2xl font-bold text-white font-display">
                    Skapa ditt konto
                  </h1>
                  <p className="mt-1 text-xs text-white/50 text-center">
                    {role && `Du registrerar dig som ${roleInfo[role].title.toLowerCase()}`}
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3" aria-label="Registreringsformulär">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs font-medium text-white/80">
                        Förnamn
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Anna"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={cn(
                          "h-10 bg-white/5 border-white/15 rounded-lg text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all duration-300",
                          validationErrors.firstName && "border-red-400/60"
                        )}
                        disabled={isSubmitting}
                        aria-invalid={!!validationErrors.firstName}
                        aria-describedby={validationErrors.firstName ? "firstName-error" : undefined}
                        autoComplete="given-name"
                      />
                      {validationErrors.firstName && (
                        <p id="firstName-error" className="text-xs text-red-400" role="alert">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs font-medium text-white/80">
                        Efternamn
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Andersson"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={cn(
                          "h-10 bg-white/5 border-white/15 rounded-lg text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all duration-300",
                          validationErrors.lastName && "border-red-400/60"
                        )}
                        disabled={isSubmitting}
                        aria-invalid={!!validationErrors.lastName}
                        aria-describedby={validationErrors.lastName ? "lastName-error" : undefined}
                        autoComplete="family-name"
                      />
                      {validationErrors.lastName && (
                        <p id="lastName-error" className="text-xs text-red-400" role="alert">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-white/80">
                      E-postadress
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="din@email.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                          "pl-10 h-10 bg-white/5 border-white/15 rounded-lg text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all duration-300",
                          validationErrors.email && "border-red-400/60"
                        )}
                        disabled={isSubmitting}
                        aria-invalid={!!validationErrors.email}
                        aria-describedby={validationErrors.email ? "email-error" : undefined}
                        autoComplete="email"
                      />
                    </div>
                    {validationErrors.email && (
                      <p id="email-error" className="text-xs text-red-400" role="alert">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-white/80" id="password-label">
                      Lösenord (minst 6 tecken)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(
                          "pl-10 h-10 bg-white/5 border-white/15 rounded-lg pr-10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all duration-300",
                          validationErrors.password && "border-red-400/60"
                        )}
                        disabled={isSubmitting}
                        aria-invalid={!!validationErrors.password}
                        aria-describedby={validationErrors.password ? "password-error" : "password-label"}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p id="password-error" className="text-xs text-red-400" role="alert">{validationErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium text-white/80">
                      Bekräfta lösenord
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                          "pl-10 h-10 bg-white/5 border-white/15 rounded-lg pr-10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] transition-all duration-300",
                          validationErrors.confirmPassword && "border-red-400/60"
                        )}
                        disabled={isSubmitting}
                        aria-invalid={!!validationErrors.confirmPassword}
                        aria-describedby={validationErrors.confirmPassword ? "confirmPassword-error" : undefined}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        aria-label={showConfirmPassword ? "Dölj lösenord" : "Visa lösenord"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p id="confirmPassword-error" className="text-xs text-red-400" role="alert">{validationErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="h-10 rounded-lg px-3 border-white/20 text-white hover:bg-white/10"
                      aria-label="Gå tillbaka till steg 1"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[hsl(260_60%_72%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(260_60%_80%)] shadow-lg shadow-[hsl(260_60%_72%/0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Skapa konto
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Login link */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-white/40 bg-transparent">eller</span>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/logga-in"
                className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors duration-200"
              >
                Har du redan ett konto? <span className="text-[hsl(260_60%_72%)] font-semibold">Logga in</span>
              </Link>
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-white/40 animate-fade-in" style={{ animationDelay: '0.2s' }} aria-label="Förtroendeindikatorer">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(260_60%_72%/0.5)]" aria-hidden="true" /> Säker data</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-[hsl(260_60%_72%/0.5)]" aria-hidden="true" /> Gratis att börja</span>
          </div>
        </div>
      </div>

      {/* Already Registered Dialog */}
      <AlertDialog open={showAlreadyRegistered} onOpenChange={setShowAlreadyRegistered}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center animate-scale-in">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-display">
              Kontot finns redan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Det finns redan ett konto registrerat med e-postadressen <strong className="text-foreground">{email}</strong>. 
              Vänligen logga in istället eller använd en annan e-postadress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl"
              onClick={() => setShowAlreadyRegistered(false)}
            >
              Försök med annan e-post
            </Button>
            <Button
              className="w-full sm:w-auto rounded-xl"
              onClick={() => navigate('/logga-in')}
            >
              Gå till inloggning
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DarkNightBackground>
  );
};

export default Signup;

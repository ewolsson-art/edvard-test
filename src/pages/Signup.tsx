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
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<AccountRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ 
    email?: string; 
    password?: string; 
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
      signupSchema.parse({ email, password, firstName, lastName });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { email?: string; password?: string; firstName?: string; lastName?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") errors.email = err.message;
          if (err.path[0] === "password") errors.password = err.message;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <AuthNavbar />
        <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8 md:p-10 text-center animate-fade-in">
              <div className="flex justify-center mb-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative">
                  <CheckCircle2 className="h-8 w-8 text-primary animate-scale-in" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4 font-display">Bekräfta din e-post</h2>
              <p className="text-muted-foreground mb-6">
                Vi har skickat ett bekräftelsemail till <strong className="text-foreground">{email}</strong>. 
                Klicka på länken i mailet för att aktivera ditt konto.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Det kan ta någon minut innan mailet kommer fram. Kolla även din skräppost.
              </p>
              <Link to="/logga-in">
                <Button variant="outline" className="w-full h-12 rounded-xl hover:bg-primary/5 transition-all duration-300">
                  Tillbaka till inloggning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = step === "role" ? 0 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-[10%] w-64 h-64 bg-primary/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-[5%] w-48 h-48 bg-primary/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-[20%] w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <Sparkles className="absolute top-32 right-[15%] w-6 h-6 text-primary/20 animate-pulse" style={{ animationDuration: '3s' }} />
        <Heart className="absolute bottom-40 right-[25%] w-5 h-5 text-primary/15 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <Sparkles className="absolute top-1/2 left-[8%] w-4 h-4 text-primary/15 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
      </div>
      
      <AuthNavbar />
      
      <div className="flex min-h-screen items-start justify-center px-4 pt-20 pb-8 relative z-10">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          <div className="flex justify-center mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Steg {currentStepIndex + 1} av 2</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                step === "role" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-primary/20 text-primary"
              )}>
                1
              </div>
              <div className={cn(
                "w-16 h-1 rounded-full transition-all duration-500",
                step === "details" || step === "submitting" ? "bg-primary" : "bg-primary/20"
              )} />
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                step === "details" || step === "submitting" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-primary/20 text-primary/50"
              )}>
                2
              </div>
            </div>
          </div>
          
          <div className="auth-card bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-6 md:p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Step 1: Role Selection */}
            {step === "role" && (
              <div className="animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                  <Logo size="sm" />
                  <h1 className="mt-5 text-2xl md:text-3xl font-bold text-foreground font-display">
                    Välkommen! 👋
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
                    Vilket typ av konto vill du skapa?
                  </p>
                </div>

                <div className="space-y-3">
                  {(Object.keys(roleInfo) as AccountRole[]).map((roleKey) => {
                    const info = roleInfo[roleKey];
                    const Icon = info.icon;
                    const isSelected = role === roleKey;
                    
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handleRoleSelect(roleKey)}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 text-left transition-all duration-300 group",
                          isSelected 
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" 
                            : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={cn(
                                "font-semibold text-base transition-colors",
                                isSelected ? "text-primary" : "text-foreground"
                              )}>
                                {info.title}
                              </h3>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-primary animate-scale-in" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {info.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {info.benefits.map((benefit, i) => (
                                <span 
                                  key={i}
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full transition-colors",
                                    isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {benefit}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={!role}
                  className="w-full h-12 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group bg-gradient-to-r from-primary to-primary/90 mt-6"
                >
                  Fortsätt
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}

            {/* Step 2: Account Details */}
            {(step === "details" || step === "submitting") && (
              <div className="animate-fade-in">
                <div className="flex flex-col items-center mb-6">
                  {role && (
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary text-primary-foreground"
                    )}>
                      {(() => {
                        const Icon = roleInfo[role].icon;
                        return <Icon className="h-7 w-7" />;
                      })()}
                    </div>
                  )}
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                    Skapa ditt konto
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    {role && `Du registrerar dig som ${roleInfo[role].title.toLowerCase()}`}
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                        Förnamn
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Anna"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={cn(
                          "h-11 bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300",
                          validationErrors.firstName && "border-destructive"
                        )}
                        disabled={isSubmitting}
                      />
                      {validationErrors.firstName && (
                        <p className="text-xs text-destructive">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                        Efternamn
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Andersson"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={cn(
                          "h-11 bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300",
                          validationErrors.lastName && "border-destructive"
                        )}
                        disabled={isSubmitting}
                      />
                      {validationErrors.lastName && (
                        <p className="text-xs text-destructive">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      E-postadress
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="din@email.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                          "pl-11 h-11 bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300",
                          validationErrors.email && "border-destructive"
                        )}
                        disabled={isSubmitting}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-destructive">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Lösenord
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(
                          "pl-11 h-11 bg-background/50 border-border/50 rounded-xl pr-11 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300",
                          validationErrors.password && "border-destructive"
                        )}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-destructive">{validationErrors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Minst 6 tecken</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl px-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Tillbaka
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group bg-gradient-to-r from-primary to-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 opacity-70" />
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
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">eller</span>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/logga-in"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Har du redan ett konto? <span className="text-primary font-semibold">Logga in</span>
                <ArrowRight className="h-3 w-3 text-primary" />
              </Link>
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
              </div>
              <span>Säker data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-2.5 w-2.5 text-primary" />
              </div>
              <span>Gratis att börja</span>
            </div>
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
    </div>
  );
};

export default Signup;

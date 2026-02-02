import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { AuthNavbar } from "@/components/AuthNavbar";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, User, Stethoscope, Users, CheckCircle2 } from "lucide-react";

const signupSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
});

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"patient" | "doctor" | "relative">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    const { error } = await signUp(email, password, { 
      role,
      first_name: firstName,
      last_name: lastName
    });

    if (error) {
      let errorMessage = "Ett fel uppstod vid registrering";
      if (error.message.includes("User already registered")) {
        errorMessage = "Det finns redan ett konto med denna e-postadress";
      }
      toast({
        title: "Registrering misslyckades",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      setShowConfirmation(true);
    }

    setIsSubmitting(false);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <AuthNavbar />
        <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
          <div className="w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8 md:p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Bekräfta din e-post</h2>
              <p className="text-muted-foreground mb-6">
                Vi har skickat ett bekräftelsemail till <strong className="text-foreground">{email}</strong>. 
                Klicka på länken i mailet för att aktivera ditt konto.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Det kan ta någon minut innan mailet kommer fram. Kolla även din skräppost.
              </p>
              <Link to="/logga-in">
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  Tillbaka till inloggning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <AuthNavbar />
      
      <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="auth-card bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <Logo size="md" />
              <h1 className="mt-6 text-2xl md:text-3xl font-bold text-foreground font-display">
                Skapa konto
              </h1>
              <p className="mt-2 text-muted-foreground text-center">
                Kom igång med din hälsoresa
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Jag är</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value: "patient" | "doctor" | "relative") => setRole(value)}
                  className="grid grid-cols-3 gap-3"
                >
                  <div>
                    <RadioGroupItem value="patient" id="patient" className="peer sr-only" />
                    <Label
                      htmlFor="patient"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-border/50 bg-background/50 p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <User className="h-5 w-5 mb-1 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-xs font-medium">Patient</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="doctor" id="doctor" className="peer sr-only" />
                    <Label
                      htmlFor="doctor"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-border/50 bg-background/50 p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <Stethoscope className="h-5 w-5 mb-1 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-xs font-medium">Läkare</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="relative" id="relative" className="peer sr-only" />
                    <Label
                      htmlFor="relative"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-border/50 bg-background/50 p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <Users className="h-5 w-5 mb-1 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-xs font-medium">Anhörig</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    Förnamn
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Anna"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`h-12 bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all ${validationErrors.firstName ? 'border-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.firstName && (
                    <p className="text-xs text-destructive">{validationErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Efternamn
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Andersson"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`h-12 bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all ${validationErrors.lastName ? 'border-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.lastName && (
                    <p className="text-xs text-destructive">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  E-postadress
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@email.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 h-12 bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all ${validationErrors.email ? 'border-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-destructive">{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Lösenord
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 bg-background/50 border-border/50 rounded-xl pr-10 focus:ring-2 focus:ring-primary/20 transition-all ${validationErrors.password ? 'border-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-destructive">{validationErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Skapa konto
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/logga-in"
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-semibold"
              >
                Har du redan ett konto? <span className="text-primary">Logga in</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

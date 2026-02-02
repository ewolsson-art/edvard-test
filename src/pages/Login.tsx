import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthNavbar } from "@/components/AuthNavbar";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, CheckCircle2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

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
      let errorMessage = "Ett fel uppstod vid inloggning";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Fel e-postadress eller lösenord";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Vänligen bekräfta din e-postadress innan du loggar in";
      }
      toast({
        title: "Inloggning misslyckades",
        description: errorMessage,
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <AuthNavbar />
      
      <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="auth-card bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <Logo size="md" />
              <h1 className="mt-6 text-2xl md:text-3xl font-bold text-foreground font-display">
                Välkommen tillbaka
              </h1>
              <p className="mt-2 text-muted-foreground text-center">
                Logga in på ditt konto
              </p>
            </div>

            {isVerified && (
              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Din e-post är nu verifierad! Logga in för att fortsätta.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Lösenord
                  </Label>
                  <Link
                    to="/aterstall-losenord"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Glömt lösenord?
                  </Link>
                </div>
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
                    Logga in
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/skapa-konto"
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-semibold"
              >
                Har du inget konto? <span className="text-primary">Skapa ett</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

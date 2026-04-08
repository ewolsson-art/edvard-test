import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthNavbar } from "@/components/AuthNavbar";
import { Logo } from "@/components/Logo";
import { DarkNightBackground } from "@/components/DarkNightBackground";
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
      <div className="min-h-screen flex items-center justify-center bg-[hsl(230_30%_5%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(45_85%_55%)]" />
      </div>
    );
  }

  return (
    <DarkNightBackground>
      <AuthNavbar />
      
      <div className="flex flex-1 items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-[hsl(225_25%_14%)] backdrop-blur-xl rounded-3xl shadow-2xl border border-white/[0.06] p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <Logo size="md" className="[&_span]:!bg-none [&_span]:!text-white" />
              <h1 className="mt-6 text-2xl md:text-3xl font-bold text-white font-display">
                Välkommen tillbaka
              </h1>
            </div>

            {isVerified && (
              <div className="mb-6 p-4 rounded-xl bg-[hsl(260_60%_72%/0.15)] border border-[hsl(260_60%_72%/0.3)] flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[hsl(45_85%_55%)] flex-shrink-0" />
                <p className="text-sm text-white">
                  Din e-post är nu verifierad! Logga in för att fortsätta.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white/80">
                  E-postadress
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@email.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 h-12 bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] focus:border-[hsl(260_60%_72%/0.5)] transition-all ${validationErrors.email ? 'border-red-400/60' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-red-400">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-white/80">
                    Lösenord
                  </Label>
                   <Link
                    to="/glomt-losenord"
                    className="text-sm py-1 px-1 text-[hsl(45_85%_55%)] hover:text-[hsl(45_85%_65%)] transition-colors"
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
                    className={`h-12 bg-white/[0.08] border-white/20 rounded-xl pr-10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(260_60%_72%/0.3)] focus:border-[hsl(260_60%_72%/0.5)] transition-all ${validationErrors.password ? 'border-red-400/60' : ''}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-400">{validationErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-lg shadow-[hsl(260_60%_72%/0.2)] hover:shadow-xl transition-all duration-300 group"
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

            {/* Divider */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30">eller</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social login */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={async () => {
                  const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                  if (result.error) toast({ title: "Något gick fel", variant: "destructive" });
                }}
                className="flex-1 h-11 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={async () => {
                  const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
                  if (result.error) toast({ title: "Något gick fel", variant: "destructive" });
                }}
                className="flex-1 h-11 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/skapa-konto"
                className="text-sm text-white/60 hover:text-white transition-colors font-semibold"
              >
                Har du inget konto? <span className="text-[hsl(45_85%_55%)]">Skapa ett</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DarkNightBackground>
  );
};

export default Login;

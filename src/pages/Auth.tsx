import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, CheckCircle, Stethoscope, HeartPulse, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
type UserRole = "patient" | "doctor" | "relative";
const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({
      message: "Ogiltig e-postadress",
    })
    .max(255),
  password: z
    .string()
    .min(6, {
      message: "Lösenordet måste vara minst 6 tecken",
    })
    .max(100),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
});

// Animated Cloud Component
const Cloud = ({ className, delay = 0, duration = 20 }: { className?: string; delay?: number; duration?: number }) => (
  <div
    className={cn("absolute opacity-20", className)}
    style={{
      animation: `cloud-float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    <svg viewBox="0 0 100 50" className="w-full h-full fill-primary/30">
      <ellipse cx="30" cy="35" rx="20" ry="15" />
      <ellipse cx="50" cy="30" rx="25" ry="18" />
      <ellipse cx="70" cy="35" rx="18" ry="13" />
      <ellipse cx="45" cy="38" rx="22" ry="12" />
    </svg>
  </div>
);
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }>({});
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);
  const validateForm = () => {
    const dataToValidate = isLogin
      ? {
          email,
          password,
        }
      : {
          email,
          password,
          firstName,
          lastName,
        };
    const result = authSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
      } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "firstName") fieldErrors.firstName = err.message;
        if (err.path[0] === "lastName") fieldErrors.lastName = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrors({ email: "Ange din e-postadress" });
      return;
    }

    const emailResult = z.string().email().safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: "Ogiltig e-postadress" });
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/aterstall-losenord`,
      });

      if (error) {
        toast({
          title: "Kunde inte skicka återställningslänk",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResetEmailSent(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Fel inloggningsuppgifter",
              description: "Kontrollera e-post och lösenord och försök igen.",
              variant: "destructive",
            });
          } else if (error.message.includes("Email not confirmed")) {
            toast({
              title: "E-post ej bekräftad",
              description: "Kolla din inkorg och bekräfta din e-postadress.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Inloggning misslyckades",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      } else {
        // Pass selected role as metadata for the database trigger
        const { error, data } = await signUp(email, password, { role: selectedRole });
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Användare finns redan",
              description: "Denna e-postadress är redan registrerad. Försök logga in istället.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Registrering misslyckades",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          // Check if user already exists (Supabase returns user without identities for existing emails)
          if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
            toast({
              title: "E-postadressen är redan registrerad",
              description: "Ett konto med denna e-postadress finns redan. Försök logga in istället.",
              variant: "destructive",
            });
          } else if (data?.user) {
            await supabase.from("profiles").insert({
              user_id: data.user.id,
              first_name: firstName.trim() || null,
              last_name: lastName.trim() || null,
            });
            setShowEmailConfirmation(true);
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Cloud className="w-48 h-24 top-[10%] left-[5%]" delay={0} duration={25} />
        <Cloud className="w-64 h-32 top-[20%] right-[10%]" delay={3} duration={30} />
        <Cloud className="w-40 h-20 top-[60%] left-[15%]" delay={5} duration={22} />
        <Cloud className="w-56 h-28 bottom-[15%] right-[5%]" delay={8} duration={28} />
        <Cloud className="w-36 h-18 top-[40%] left-[60%]" delay={2} duration={20} />
        <Cloud className="w-52 h-26 bottom-[30%] left-[40%]" delay={6} duration={24} />

        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{
            animationDelay: "1s",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 md:gap-20 relative z-10">
        {/* Hero text */}
        <div className="flex-1 text-center md:text-left space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
              Följ ditt mående med bättre insikt <br />
              <span className="text-primary"></span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående och delar valfri data
              med din läkare
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm">
              <HeartPulse className="w-4 h-4 text-primary" /> Skapad av och för människor med bipolär sjukdom - i samråd
              med läkare och experter <br />
            </div>
          </div>
        </div>

        {/* Login card */}
        <div
          className="w-full md:w-auto md:min-w-[400px] animate-fade-in"
          style={{
            animationDelay: "0.1s",
          }}
        >
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-[28px] blur-xl opacity-50" />

            <div className="relative bg-card/90 backdrop-blur-xl border border-border/40 rounded-[24px] p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <Logo size="lg" />
                </div>
                {!showEmailConfirmation && (
                  <p className="text-muted-foreground text-sm font-medium">
                    {isLogin ? "Välkommen tillbaka" : "Skapa konto"}
                  </p>
                )}
              </div>

              {showEmailConfirmation ? (
                <div className="text-center space-y-6 py-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Verifiera din e-post</h2>
                    <p className="text-muted-foreground">Vi har skickat ett bekräftelsemail till:</p>
                    <p className="font-medium text-foreground">{email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Klicka på länken i mailet för att aktivera ditt konto. Det kan ta någon minut innan mailet kommer.
                    Kolla även skräpposten om du inte hittar det.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setIsLogin(true);
                      setPassword("");
                    }}
                  >
                    Tillbaka till inloggning
                  </Button>
                </div>
              ) : showForgotPassword ? (
                resetEmailSent ? (
                  <div className="text-center space-y-6 py-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">Kolla din e-post</h2>
                      <p className="text-muted-foreground">Vi har skickat en återställningslänk till:</p>
                      <p className="font-medium text-foreground">{email}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Klicka på länken i mailet för att välja ett nytt lösenord. Kolla även skräpposten.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                        setPassword("");
                      }}
                    >
                      Tillbaka till inloggning
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-semibold mb-2">Glömt lösenord?</h2>
                      <p className="text-sm text-muted-foreground">
                        Ange din e-postadress så skickar vi en återställningslänk
                      </p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          E-post
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="din@epost.se"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 rounded-xl font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Skicka återställningslänk
                      </Button>
                    </form>

                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setErrors({});
                        }}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Tillbaka till inloggning
                      </button>
                    </div>
                  </>
                )
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role selection for signup */}
                    {!isLogin && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Jag är</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRole("patient")}
                            disabled={isSubmitting}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                              selectedRole === "patient"
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                            )}
                          >
                            <HeartPulse
                              className={cn(
                                "w-5 h-5 transition-colors",
                                selectedRole === "patient" ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <span
                              className={cn(
                                "font-medium text-xs transition-colors",
                                selectedRole === "patient" ? "text-primary" : "text-foreground",
                              )}
                            >
                              Patient
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRole("relative")}
                            disabled={isSubmitting}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                              selectedRole === "relative"
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                            )}
                          >
                            <Users
                              className={cn(
                                "w-5 h-5 transition-colors",
                                selectedRole === "relative" ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <span
                              className={cn(
                                "font-medium text-xs transition-colors",
                                selectedRole === "relative" ? "text-primary" : "text-foreground",
                              )}
                            >
                              Anhörig
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRole("doctor")}
                            disabled={isSubmitting}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                              selectedRole === "doctor"
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                            )}
                          >
                            <Stethoscope
                              className={cn(
                                "w-5 h-5 transition-colors",
                                selectedRole === "doctor" ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <span
                              className={cn(
                                "font-medium text-xs transition-colors",
                                selectedRole === "doctor" ? "text-primary" : "text-foreground",
                              )}
                            >
                              Läkare
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {!isLogin && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium">
                            Förnamn
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="Anna"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                              disabled={isSubmitting}
                            />
                          </div>
                          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium">
                            Efternamn
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Svensson"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                              disabled={isSubmitting}
                            />
                          </div>
                          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        E-post
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="din@epost.se"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Lösenord
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl font-medium text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isLogin ? "Logga in" : "Skapa konto"}
                    </Button>

                    {isLogin && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          disabled={isSubmitting}
                        >
                          Glömt lösenord?
                        </button>
                      </div>
                    )}
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans font-semibold"
                      disabled={isSubmitting}
                    >
                      {isLogin ? "Har du inget konto? Skapa ett" : "Har du redan ett konto? Logga in"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Auth;

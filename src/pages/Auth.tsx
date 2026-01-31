import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, CheckCircle, Stethoscope, HeartPulse } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

type UserRole = 'patient' | 'doctor';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }).max(255),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }).max(100),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; firstName?: string; lastName?: string }>({});
  
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const dataToValidate = isLogin 
      ? { email, password } 
      : { email, password, firstName, lastName };
    const result = authSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; firstName?: string; lastName?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'firstName') fieldErrors.firstName = err.message;
        if (err.path[0] === 'lastName') fieldErrors.lastName = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Fel inloggningsuppgifter",
              description: "Kontrollera e-post och lösenord och försök igen.",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
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
        // Pass role as metadata so the database trigger can create the role
        const { error, data } = await signUp(email, password, { role: selectedRole });
        if (error) {
          if (error.message.includes('User already registered')) {
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
          // Save profile data if user was created (role is handled by database trigger)
          if (data?.user) {
            await supabase.from('profiles').insert({
              user_id: data.user.id,
              first_name: firstName.trim() || null,
              last_name: lastName.trim() || null,
            });
          }
          // Show email confirmation screen
          setShowEmailConfirmation(true);
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 md:gap-20 relative z-10">
        <div className="flex-1 text-center md:text-left fade-in space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <HeartPulse className="w-4 h-4" />
            <span>Din digitala hälsodagbok</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight tracking-tight">
            Håll bättre koll på ditt mående
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
            Följ din hälsa, identifiera mönster och dela insikter med din vårdgivare – allt på ett ställe.
          </p>
        </div>
        
        <div className="w-full md:w-auto md:min-w-[420px] fade-in">
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl shadow-primary/5">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo size="lg" />
              </div>
              {!showEmailConfirmation && (
                <p className="text-muted-foreground text-sm">
                  {isLogin ? 'Välkommen tillbaka' : 'Skapa ditt konto'}
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
                <p className="text-muted-foreground">
                  Vi har skickat ett bekräftelsemail till:
                </p>
                <p className="font-medium text-foreground">{email}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Klicka på länken i mailet för att aktivera ditt konto. Det kan ta någon minut innan mailet kommer. Kolla även skräpposten om du inte hittar det.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setIsLogin(true);
                  setPassword('');
                }}
              >
                Tillbaka till inloggning
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role selection for signup */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label>Jag är</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('patient')}
                        disabled={isSubmitting}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                          selectedRole === 'patient'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <HeartPulse className={cn(
                          "w-6 h-6",
                          selectedRole === 'patient' ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "font-medium text-sm",
                          selectedRole === 'patient' ? "text-primary" : "text-foreground"
                        )}>Patient</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('doctor')}
                        disabled={isSubmitting}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                          selectedRole === 'doctor'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Stethoscope className={cn(
                          "w-6 h-6",
                          selectedRole === 'doctor' ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "font-medium text-sm",
                          selectedRole === 'doctor' ? "text-primary" : "text-foreground"
                        )}>Läkare</span>
                      </button>
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Förnamn</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Förnamn"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Efternamn</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Efternamn"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@epost.se"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Lösenord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isLogin ? 'Logga in' : 'Skapa konto'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={isSubmitting}
                >
                  {isLogin ? 'Har du inget konto? Skapa ett' : 'Har du redan ett konto? Logga in'}
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

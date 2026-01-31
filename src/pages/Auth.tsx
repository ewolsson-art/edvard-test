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
import logo from '@/assets/logo.png';
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated cloud */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none animate-float">
        <svg 
          viewBox="0 0 200 120" 
          className="w-[400px] md:w-[600px] lg:w-[800px] h-auto fill-primary"
        >
          <path d="M170 80c16.569 0 30-13.431 30-30 0-13.807-9.33-25.44-22.024-28.935C175.333 9.048 163.644 0 150 0c-10.493 0-19.83 5.088-25.623 12.934C120.628 5.088 108.493 0 98 0 80.327 0 65.644 12.536 62.024 29.065 49.33 32.56 40 44.193 40 58c0 16.569 13.431 30 30 30h100zM30 90c-16.569 0-30 13.431-30 30h60c0-16.569-13.431-30-30-30z"/>
        </svg>
      </div>
      
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
        <div className="flex-1 text-center md:text-left fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight">
            Håll bättre koll på ditt mående
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4">
            Ge både dig och din läkare bättre överblick över ditt mående med vår interaktiva och personliga dagbok
          </p>
        </div>
        <div className="w-full md:w-auto md:min-w-[400px] glass-card p-8 fade-in">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logo} alt="Between Clouds" className="w-12 h-12 object-contain" />
              <h1 className="font-display text-2xl font-bold">Between Clouds</h1>
            </div>
            {!showEmailConfirmation && (
              <p className="text-muted-foreground">
                {isLogin ? 'Logga in för att fortsätta' : 'Skapa ett konto för att börja'}
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
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
  );
};

export default Auth;

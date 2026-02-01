import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, CheckCircle, Stethoscope, HeartPulse, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
type UserRole = 'patient' | 'doctor';
const authSchema = z.object({
  email: z.string().trim().email({
    message: "Ogiltig e-postadress"
  }).max(255),
  password: z.string().min(6, {
    message: "Lösenordet måste vara minst 6 tecken"
  }).max(100),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional()
});

// Animated Cloud Component
const Cloud = ({
  className,
  delay = 0,
  duration = 20
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) => <div className={cn("absolute opacity-20", className)} style={{
  animation: `cloud-float ${duration}s ease-in-out infinite`,
  animationDelay: `${delay}s`
}}>
    <svg viewBox="0 0 100 50" className="w-full h-full fill-primary/30">
      <ellipse cx="30" cy="35" rx="20" ry="15" />
      <ellipse cx="50" cy="30" rx="25" ry="18" />
      <ellipse cx="70" cy="35" rx="18" ry="13" />
      <ellipse cx="45" cy="38" rx="22" ry="12" />
    </svg>
  </div>;
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }>({});
  const {
    user,
    loading,
    signIn,
    signUp
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  const validateForm = () => {
    const dataToValidate = isLogin ? {
      email,
      password
    } : {
      email,
      password,
      firstName,
      lastName
    };
    const result = authSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
      } = {};
      result.error.errors.forEach(err => {
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
        const {
          error
        } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Fel inloggningsuppgifter",
              description: "Kontrollera e-post och lösenord och försök igen.",
              variant: "destructive"
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "E-post ej bekräftad",
              description: "Kolla din inkorg och bekräfta din e-postadress.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Inloggning misslyckades",
              description: error.message,
              variant: "destructive"
            });
          }
        }
      } else {
        const {
          error,
          data
        } = await signUp(email, password, {
          role: selectedRole
        });
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Användare finns redan",
              description: "Denna e-postadress är redan registrerad. Försök logga in istället.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Registrering misslyckades",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          if (data?.user) {
            await supabase.from('profiles').insert({
              user_id: data.user.id,
              first_name: firstName.trim() || null,
              last_name: lastName.trim() || null
            });
          }
          setShowEmailConfirmation(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
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
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>
      
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 md:gap-20 relative z-10">
        {/* Hero text */}
        <div className="flex-1 text-center md:text-left space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>Stämningsdagbok för personer med bipolär sjukdom</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
              Tydligare översikt 
              <br />
              <span className="text-primary">Bättre insikt </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Håll bättre koll på ditt mående      
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm">
              <HeartPulse className="w-4 h-4 text-primary" />
              <span>Skapad av och för personer med bipolär sjukdom - i samråd med läkare och experter</span>
            </div>
          </div>
        </div>
        
        {/* Login card */}
        <div className="w-full md:w-auto md:min-w-[400px] animate-fade-in" style={{
        animationDelay: '0.1s'
      }}>
          
        </div>
      </div>
    </div>;
};
export default Auth;
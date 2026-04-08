import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DarkNightBackground } from "@/components/DarkNightBackground";
import { Loader2, Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  username: z.string().min(1, "Namn krävs").max(50, "Max 50 tecken"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
});

const CompleteProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user?.user_metadata?.profile_completed) {
      navigate("/");
    }
    // Give auth session time to establish after magic link redirect
    if (!loading && !user) {
      const timeout = setTimeout(() => {
        navigate("/logga-in");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      profileSchema.parse({ username, password, confirmPassword });
      setValidationErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0] as string] = err.message;
        });
        setValidationErrors(errors);
      }
      return;
    }

    setIsSubmitting(true);

    const storedRole = localStorage.getItem("signup_role");

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        first_name: username,
        last_name: '',
        profile_completed: true,
        ...(storedRole && !user?.user_metadata?.role ? { role: storedRole } : {}),
      },
    });

    if (updateError) {
      toast({
        title: "Något gick fel",
        description: updateError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: user!.id,
        first_name: username,
        last_name: '',
      }, { onConflict: "user_id" });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    if (storedRole && storedRole !== 'patient' && !user?.user_metadata?.role) {
      await supabase.rpc('assign_initial_role', { _role: storedRole as "patient" | "relative" });
    }

    localStorage.removeItem("signup_role");

    toast({
      title: "Profil sparad!",
      description: "Välkommen till Toddy",
    });

    // Redirect based on role
    const effectiveRole = storedRole || user?.user_metadata?.role;
    if (effectiveRole === 'relative') {
      window.location.href = "/anhorig-onboarding";
    } else if (effectiveRole === 'doctor') {
      window.location.href = "/lakare-onboarding";
    } else {
      window.location.href = "/";
    }
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
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <h1 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight animate-fade-in">
            Slutför din profil
          </h1>
          <p className="mt-2 text-sm text-white/40 animate-fade-in">
            Välj ett användarnamn och lösenord
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <Input
                id="username"
                placeholder="Ditt namn eller valfritt användarnamn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] transition-all text-base px-4 ${validationErrors.username ? 'ring-red-400/40' : ''}`}
                disabled={isSubmitting}
                autoComplete="username"
              />
              {validationErrors.username && <p className="text-xs text-red-400/80 pl-1">{validationErrors.username}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Lösenord (minst 6 tecken)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-12 pr-12 h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] transition-all text-base ${validationErrors.password ? 'ring-red-400/40' : ''}`}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {validationErrors.password && <p className="text-xs text-red-400/80 pl-1">{validationErrors.password}</p>}
            </div>

            {password.length > 0 && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/25" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Bekräfta lösenord"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-12 pr-12 h-14 bg-white/[0.04] border-0 ring-1 ring-white/[0.08] rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[hsl(45_85%_55%/0.5)] focus:bg-white/[0.06] transition-all text-base ${validationErrors.confirmPassword ? 'ring-red-400/40' : ''}`}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && <p className="text-xs text-red-400/80 pl-1">{validationErrors.confirmPassword}</p>}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Spara och fortsätt
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </DarkNightBackground>
  );
};

export default CompleteProfile;

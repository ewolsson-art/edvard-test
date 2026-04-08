import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DarkNightBackground } from "@/components/DarkNightBackground";
import { Logo } from "@/components/Logo";
import { Loader2, Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/logga-in");
    }
    // If profile already complete, redirect
    if (!loading && user?.user_metadata?.profile_completed) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      profileSchema.parse({ firstName, lastName, password, confirmPassword });
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

    // Check if there's a stored role from social signup
    const storedRole = localStorage.getItem("signup_role");

    // Update user password and metadata
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        first_name: firstName,
        last_name: lastName,
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

    // Create/update profile in the profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: user!.id,
        first_name: firstName,
        last_name: lastName,
      }, { onConflict: "user_id" });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // If social login user with stored role, assign it
    if (storedRole && !user?.user_metadata?.role) {
      await supabase.from("user_roles").upsert({
        user_id: user!.id,
        role: storedRole as "patient" | "relative",
      }, { onConflict: "user_id" });
    }

    // Clean up stored role
    localStorage.removeItem("signup_role");

    toast({
      title: "Profil sparad!",
      description: "Välkommen till Toddy",
    });

    // Full reload to pick up new metadata/role
    window.location.href = "/";
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
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[hsl(225_25%_14%)] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.06] p-6 md:p-8 animate-fade-in">
            <div className="flex flex-col items-center mb-6">
              <Logo size="sm" className="[&_span]:!bg-none [&_span]:!text-white" />
              <h1 className="mt-4 text-xl md:text-2xl font-bold text-white font-display">
                Slutför din profil
              </h1>
              <p className="mt-1 text-xs text-white/50 text-center">
                Välj ett namn och lösenord för ditt konto
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-medium text-white/80">Förnamn</Label>
                  <Input
                    id="firstName"
                    placeholder="Anna"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`h-11 bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/30 transition-all text-base ${validationErrors.firstName ? 'border-red-400/60' : ''}`}
                    disabled={isSubmitting}
                    autoComplete="given-name"
                  />
                  {validationErrors.firstName && <p className="text-xs text-red-400">{validationErrors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-medium text-white/80">Efternamn</Label>
                  <Input
                    id="lastName"
                    placeholder="Andersson"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`h-11 bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/30 transition-all text-base ${validationErrors.lastName ? 'border-red-400/60' : ''}`}
                    disabled={isSubmitting}
                    autoComplete="family-name"
                  />
                  {validationErrors.lastName && <p className="text-xs text-red-400">{validationErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-white/80">Lösenord (minst 6 tecken)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 h-11 bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/30 transition-all text-base ${validationErrors.password ? 'border-red-400/60' : ''}`}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && <p className="text-xs text-red-400">{validationErrors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-white/80">Bekräfta lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-10 h-11 bg-white/[0.08] border-white/20 rounded-xl text-white placeholder:text-white/30 transition-all text-base ${validationErrors.confirmPassword ? 'border-red-400/60' : ''}`}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && <p className="text-xs text-red-400">{validationErrors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl text-sm font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-lg transition-all mt-2"
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
      </div>
    </DarkNightBackground>
  );
};

export default CompleteProfile;

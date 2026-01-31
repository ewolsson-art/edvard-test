import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Save } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
  lastName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
});

const Profile = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = profileSchema.safeParse({ firstName, lastName });
    if (!result.success) {
      const fieldErrors: { firstName?: string; lastName?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'firstName') fieldErrors.firstName = err.message;
        if (err.path[0] === 'lastName') fieldErrors.lastName = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        toast({
          title: "Kunde inte spara",
          description: "Försök igen.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profil uppdaterad!",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Min profil
          </h1>
          <p className="text-muted-foreground">
            Hantera dina kontouppgifter
          </p>
        </header>

        <div className="glass-card p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">E-post</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              E-postadressen kan inte ändras här.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Förnamn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Ditt förnamn"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10"
                    disabled={isSaving}
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
                    placeholder="Ditt efternamn"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10"
                    disabled={isSaving}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Spara ändringar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Save, Stethoscope, HeartPulse, Building2, Hospital, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiagnosesSection } from '@/components/DiagnosesSection';
import { MedicationsSection } from '@/components/MedicationsSection';
import { DoctorConnectionsSection } from '@/components/DoctorConnectionsSection';
import { RelativeConnectionsSection } from '@/components/RelativeConnectionsSection';
import { DelegatesSection } from '@/components/DelegatesSection';
import { RelativePatientConnectionsSection } from '@/components/RelativePatientConnectionsSection';
import { AvatarUpload } from '@/components/AvatarUpload';

const profileSchema = z.object({
  firstName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
  lastName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
});

const Profile = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, avatarUrl, updateAvatarUrl } = useProfile();
  const { isDoctor, isRelative, isPatient, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setClinicName((profile as any).clinic_name || '');
      setHospitalName((profile as any).hospital_name || '');
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
      const profileData: any = {
        user_id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      };
      if (isDoctor) {
        profileData.clinic_name = clinicName.trim() || null;
        profileData.hospital_name = hospitalName.trim() || null;
      }
      const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });
      if (error) {
        toast({ title: "Kunde inte spara", description: "Försök igen.", variant: "destructive" });
      } else {
        toast({ title: "Profil uppdaterad!" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading || roleLoading) {
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
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Min profil</h1>
          <p className="text-muted-foreground">Hantera dina kontouppgifter</p>
        </header>

        <div className="glass-card p-6 space-y-6">
          <div className="flex justify-center pb-6 border-b border-border">
            <AvatarUpload currentAvatarUrl={avatarUrl} onAvatarChange={updateAvatarUrl} firstName={firstName} lastName={lastName} />
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground">Kontotyp</Label>
            <div className={cn("flex items-center gap-3 p-4 rounded-lg border-2 border-primary bg-primary/5")}>
              {isDoctor ? <Stethoscope className="w-5 h-5 text-primary" /> : isRelative ? <Users className="w-5 h-5 text-primary" /> : <HeartPulse className="w-5 h-5 text-primary" />}
              <div className="flex-1">
                <span className="font-medium text-foreground">
                  {isDoctor ? 'Läkarkonto' : isRelative ? 'Anhörigkonto' : 'Patientkonto'}
                </span>
                <p className="text-sm text-muted-foreground">
                  {isDoctor ? 'Du kan se dina patienters data.' : isRelative ? 'Du kan följa dina närståendes mående.' : 'Du kan göra dagliga incheckningar.'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-2">
            <Label className="text-muted-foreground">E-post</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user?.email}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Förnamn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="firstName" type="text" placeholder="Ditt förnamn" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" disabled={isSaving} />
                </div>
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Efternamn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="lastName" type="text" placeholder="Ditt efternamn" value={lastName} onChange={(e) => setLastName(e.target.value)} className="pl-10" disabled={isSaving} />
                </div>
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            {isDoctor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Mottagning</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="clinicName" type="text" placeholder="Namn på mottagning" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="pl-10" disabled={isSaving} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Sjukhus</Label>
                  <div className="relative">
                    <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="hospitalName" type="text" placeholder="Namn på sjukhus" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className="pl-10" disabled={isSaving} />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Spara ändringar
            </Button>
          </form>
        </div>

        {isDoctor && <div className="glass-card p-6"><DelegatesSection /></div>}
        {isRelative && <div className="glass-card p-6"><RelativePatientConnectionsSection /></div>}
        {isPatient && <div className="glass-card p-6"><MedicationsSection /></div>}
        {isPatient && <div className="glass-card p-6"><DoctorConnectionsSection /></div>}
        {isPatient && <div className="glass-card p-6"><RelativeConnectionsSection /></div>}
        {isPatient && <div className="glass-card p-6"><DiagnosesSection /></div>}
      </div>
    </div>
  );
};

export default Profile;

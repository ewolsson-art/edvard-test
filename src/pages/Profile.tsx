import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, User, Mail, Save, Trash2, AlertTriangle, Stethoscope, HeartPulse, Building2, Hospital, Brain, Moon, Utensils, Dumbbell, Pill, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiagnosesSection } from '@/components/DiagnosesSection';
import { MedicationsSection } from '@/components/MedicationsSection';
import { DoctorConnectionsSection } from '@/components/DoctorConnectionsSection';

const CHECKIN_OPTIONS = [
  {
    id: 'include_mood',
    label: 'Mående',
    description: 'Hur du mår idag',
    icon: Brain,
    required: true,
  },
  {
    id: 'include_sleep',
    label: 'Sömn',
    description: 'Hur du har sovit',
    icon: Moon,
  },
  {
    id: 'include_eating',
    label: 'Mat',
    description: 'Hur du har ätit',
    icon: Utensils,
  },
  {
    id: 'include_exercise',
    label: 'Träning',
    description: 'Om du har tränat',
    icon: Dumbbell,
  },
  {
    id: 'include_medication',
    label: 'Medicin',
    description: 'Om du tagit din medicin',
    icon: Pill,
  },
];

const profileSchema = z.object({
  firstName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
  lastName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
});

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  
  // Check-in preferences state
  const [checkinSelections, setCheckinSelections] = useState({
    include_mood: true,
    include_sleep: true,
    include_eating: true,
    include_exercise: true,
    include_medication: true,
  });
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);
  const [hasCheckinChanges, setHasCheckinChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setClinicName((profile as any).clinic_name || '');
      setHospitalName((profile as any).hospital_name || '');
    }
  }, [profile]);

  // Load check-in preferences
  useEffect(() => {
    if (preferences) {
      setCheckinSelections({
        include_mood: preferences.include_mood,
        include_sleep: preferences.include_sleep,
        include_eating: preferences.include_eating,
        include_exercise: preferences.include_exercise,
        include_medication: preferences.include_medication,
      });
    }
  }, [preferences]);

  // Check for check-in changes
  useEffect(() => {
    if (preferences) {
      const changed = 
        checkinSelections.include_mood !== preferences.include_mood ||
        checkinSelections.include_sleep !== preferences.include_sleep ||
        checkinSelections.include_eating !== preferences.include_eating ||
        checkinSelections.include_exercise !== preferences.include_exercise ||
        checkinSelections.include_medication !== preferences.include_medication;
      setHasCheckinChanges(changed);
    }
  }, [checkinSelections, preferences]);

  const handleCheckinToggle = (id: string) => {
    // Don't allow disabling mood (it's required)
    if (id === 'include_mood') return;
    
    setCheckinSelections(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const handleSaveCheckin = async () => {
    setIsSavingCheckin(true);
    
    const { error } = await updatePreferences(checkinSelections);
    
    if (error) {
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte spara dina inställningar. Försök igen.',
        variant: 'destructive',
      });
      setIsSavingCheckin(false);
      return;
    }

    toast({
      title: 'Sparat!',
      description: 'Dina inställningar har uppdaterats.',
    });
    
    setIsSavingCheckin(false);
    setHasCheckinChanges(false);
  };

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

      // Add doctor-specific fields only for doctors
      if (isDoctor) {
        profileData.clinic_name = clinicName.trim() || null;
        profileData.hospital_name = hospitalName.trim() || null;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, {
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'RADERA') return;
    
    setIsDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Ej inloggad",
          description: "Du måste vara inloggad för att radera ditt konto.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Konto raderat",
        description: "Ditt konto och all data har raderats.",
      });

      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Kunde inte radera konto",
        description: "Något gick fel. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (profileLoading || roleLoading || preferencesLoading) {
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
          {/* Account Type Section */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">Kontotyp</Label>
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2",
              "border-primary bg-primary/5"
            )}>
              {isDoctor ? (
                <Stethoscope className="w-5 h-5 text-primary" />
              ) : (
                <HeartPulse className="w-5 h-5 text-primary" />
              )}
              <div className="flex-1">
                <span className="font-medium text-foreground">
                  {isDoctor ? 'Läkarkonto' : 'Patientkonto'}
                </span>
                <p className="text-sm text-muted-foreground">
                  {isDoctor 
                    ? 'Du kan se dina patienters data men gör inga egna incheckningar.'
                    : 'Du kan göra dagliga incheckningar och se dina egna översikter.'}
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

            {/* Doctor-specific fields */}
            {isDoctor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Mottagning</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="clinicName"
                      type="text"
                      placeholder="Namn på mottagning"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Sjukhus</Label>
                  <div className="relative">
                    <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="hospitalName"
                      type="text"
                      placeholder="Namn på sjukhus"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            )}

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

        {/* Medications Section - Only for patients */}
        {!isDoctor && (
          <div className="glass-card p-6">
            <MedicationsSection />
          </div>
        )}

        {/* Doctor Connections Section - Only for patients */}
        {!isDoctor && (
          <div className="glass-card p-6">
            <DoctorConnectionsSection />
          </div>
        )}

        {/* Diagnoses Section - Only for patients */}
        {!isDoctor && (
          <div className="glass-card p-6">
            <DiagnosesSection />
          </div>
        )}

        {/* Check-in Preferences - Only for patients */}
        {!isDoctor && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Anpassa din check-in</h2>
                <p className="text-sm text-muted-foreground">
                  Välj vilka kategorier du vill inkludera i din dagliga incheckning
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {CHECKIN_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isChecked = checkinSelections[option.id as keyof typeof checkinSelections];
                const isDisabled = option.required;
                
                return (
                  <div
                    key={option.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                    } ${
                      isChecked 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                    }`}
                    onClick={() => !isDisabled && handleCheckinToggle(option.id)}
                  >
                    <Checkbox
                      id={option.id}
                      checked={isChecked}
                      onCheckedChange={() => !isDisabled && handleCheckinToggle(option.id)}
                      disabled={isDisabled}
                      className="pointer-events-none"
                    />
                    <div className={`p-2 rounded-lg ${isChecked ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor={option.id} 
                        className={`font-medium flex items-center gap-2 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {option.label}
                        {option.required && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Obligatorisk
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleSaveCheckin}
              className="w-full gap-2"
              disabled={isSavingCheckin || !hasCheckinChanges}
            >
              {isSavingCheckin ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {hasCheckinChanges ? 'Spara ändringar' : 'Inga ändringar'}
            </Button>
          </div>
        )}

        {/* Delete Account */}
        <div className="glass-card p-4 border-destructive/30">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Radera ditt konto och all data permanent.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Radera konto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Radera konto permanent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      Är du säker på att du vill radera ditt konto? All din data kommer att tas bort permanent:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Alla mående-registreringar</li>
                      <li>Alla mediciner och medicinloggar</li>
                      <li>Alla delade rapporter</li>
                      <li>Alla läkarkopplingar</li>
                      <li>Din profil och inställningar</li>
                    </ul>
                    <p className="font-medium">
                      Skriv <span className="text-destructive font-bold">RADERA</span> för att bekräfta:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="RADERA"
                      className="mt-2"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                    Avbryt
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'RADERA' || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Radera permanent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

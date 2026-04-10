import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Save, Stethoscope, HeartPulse, Building2, Hospital, Users, ChevronRight, Pill, UserPlus, Heart, ClipboardList, Sparkles, Zap, Sun, Cloud, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiagnosesSection } from '@/components/DiagnosesSection';
import { MedicationsSection } from '@/components/MedicationsSection';
import { DoctorConnectionsSection } from '@/components/DoctorConnectionsSection';
import { RelativeConnectionsSection } from '@/components/RelativeConnectionsSection';
import { DelegatesSection } from '@/components/DelegatesSection';
import { RelativePatientConnectionsSection } from '@/components/RelativePatientConnectionsSection';
import { AvatarUpload } from '@/components/AvatarUpload';
import { CharacteristicsSharingSection } from '@/components/CharacteristicsSharingSection';
import { useCharacteristics } from '@/hooks/useCharacteristics';

const profileSchema = z.object({
  firstName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
  lastName: z.string().trim().max(50, { message: "Max 50 tecken" }).optional(),
});

type ProfileView = 'main' | 'edit' | 'medications' | 'doctors' | 'relatives' | 'diagnoses' | 'delegates' | 'relative-patients' | 'characteristics' | 'reports';

const Profile = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, avatarUrl, updateAvatarUrl } = useProfile();
  const { isDoctor, isRelative, isPatient, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [view, setView] = useState<ProfileView>('main');
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Sub-views
  if (view === 'edit') {
    return (
      <SubPage title="Redigera profil" onBack={() => setView('main')}>
        <div className="flex justify-center pb-6">
          <AvatarUpload currentAvatarUrl={avatarUrl} onAvatarChange={updateAvatarUrl} firstName={firstName} lastName={lastName} />
        </div>
        <form onSubmit={handleSave} className="space-y-4">
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
          {isDoctor && (
            <>
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
            </>
          )}
          <Button type="submit" disabled={isSaving} className="w-full gap-2 mt-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Spara ändringar
          </Button>
        </form>
      </SubPage>
    );
  }

  if (view === 'medications') {
    return <SubPage title="Mediciner" onBack={() => setView('main')}><MedicationsSection /></SubPage>;
  }
  if (view === 'doctors') {
    return <SubPage title="Vårdgivare" onBack={() => setView('main')}><DoctorConnectionsSection /></SubPage>;
  }
  if (view === 'relatives') {
    return <SubPage title="Anhöriga" onBack={() => setView('main')}><RelativeConnectionsSection /></SubPage>;
  }
  if (view === 'diagnoses') {
    return <SubPage title="Diagnoser" onBack={() => setView('main')}><DiagnosesSection /></SubPage>;
  }
  if (view === 'delegates') {
    return <SubPage title="Delegater" onBack={() => setView('main')}><DelegatesSection /></SubPage>;
  }
  if (view === 'relative-patients') {
    return <SubPage title="Personer du följer" onBack={() => setView('main')}><RelativePatientConnectionsSection /></SubPage>;
  }
  if (view === 'characteristics') {
    return (
      <SubPage title="Kännetecken" onBack={() => setView('main')}>
        <CharacteristicsInlineView />
        <div className="mt-8">
          <CharacteristicsSharingSection />
        </div>
      </SubPage>
    );
  }
  if (view === 'reports') {
    const Reports = require('./Reports').default;
    return <SubPage title="Rapporter" onBack={() => setView('main')}><Reports /></SubPage>;
  }

  // Main profile view
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Användare';
  const roleLabel = isDoctor ? 'Läkare' : isRelative ? 'Anhörig' : 'Patient';

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto md:mx-0">
        <h1 className="font-display text-3xl font-bold mb-2">Min profil</h1>
        <p className="text-sm text-muted-foreground mb-8">Hantera din profil och medicinsk information.</p>

        {/* Profile header card */}
        <button
          onClick={() => setView('edit')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 mb-6 text-left hover:bg-muted/50 active:bg-muted transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{roleLabel}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
        </button>

        {/* Patient sections */}
        {isPatient && (
          <SettingsGroup label="Medicinsk information">
            <SettingsRow icon={Pill} label="Mediciner" description="Hantera dina mediciner" onClick={() => setView('medications')} />
            <SettingsRow icon={ClipboardList} label="Diagnoser" description="Dina registrerade diagnoser" onClick={() => setView('diagnoses')} />
            <SettingsRow icon={FileText} label="Rapporter" description="Skapa och dela rapporter" onClick={() => setView('reports')} />
          </SettingsGroup>
        )}

        {isPatient && (
          <SettingsGroup label="Kopplingar">
            <SettingsRow icon={Stethoscope} label="Vårdgivare" description="Kopplade läkare" onClick={() => setView('doctors')} />
            <SettingsRow icon={Heart} label="Anhöriga" description="Kopplade närstående" onClick={() => setView('relatives')} />
          </SettingsGroup>
        )}

        {/* Doctor sections */}
        {isDoctor && (
          <SettingsGroup label="Hantera">
            <SettingsRow icon={UserPlus} label="Delegater" description="Hantera dina delegater" onClick={() => setView('delegates')} />
          </SettingsGroup>
        )}

        {/* Relative sections */}
        {isRelative && (
          <SettingsGroup label="Kopplingar">
            <SettingsRow icon={Heart} label="Personer du följer" description="Hantera dina kopplingar" onClick={() => setView('relative-patients')} />
          </SettingsGroup>
        )}
      </div>
    </div>
  );
};

/* ── Characteristics inline view ── */

function CharacteristicsInlineView() {
  const navigate = useNavigate();
  const { elevatedCharacteristics, depressedCharacteristics, stableCharacteristics, isLoading } = useCharacteristics();

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const sections = [
    { type: 'elevated', title: 'Uppvarvad', chars: elevatedCharacteristics, icon: Zap, badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', slug: 'uppvarvad' },
    { type: 'stable', title: 'Stabil', chars: stableCharacteristics, icon: Sun, badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', slug: 'stabil' },
    { type: 'depressed', title: 'Nedstämd', chars: depressedCharacteristics, icon: Cloud, badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20', iconBg: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400', slug: 'nedstamd' },
  ];

  return (
    <div className="space-y-3">
      {sections.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.type}
            onClick={() => navigate(`/kannetecken/${s.slug}`)}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 text-left hover:bg-muted/50 active:bg-muted transition-colors"
          >
            <div className={cn("p-2.5 rounded-xl", s.iconBg)}>
              <Icon className={cn("w-5 h-5", s.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-foreground">{s.title}</p>
              {s.chars.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {s.chars.slice(0, 3).map((c) => (
                    <span key={c.id} className={cn("text-xs py-0.5 px-2 rounded-full font-medium", s.badgeClass)}>{c.name}</span>
                  ))}
                  {s.chars.length > 3 && <span className="text-xs text-muted-foreground self-center">+{s.chars.length - 3}</span>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Inga tillagda ännu</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

/* ── Reusable sub-components ── */

function SubPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="p-5 md:p-8 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto md:mx-0">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors" aria-label="Tillbaka">
            <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{label}</p>
      <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden divide-y divide-border/50">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, description, onClick }: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/50 active:bg-muted transition-colors"
    >
      <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-medium text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
    </button>
  );
}

export default Profile;

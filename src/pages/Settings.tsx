import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useUserRole } from '@/hooks/useUserRole';
import { useCustomCheckinQuestions } from '@/hooks/useCustomCheckinQuestions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
import { Loader2, Save, Trash2, AlertTriangle, Brain, Moon, Utensils, Dumbbell, Pill, ChevronRight, Bell, Lock, MessageSquarePlus, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ChangePasswordSection } from '@/components/ChangePasswordSection';
import { CustomQuestionsSection } from '@/components/CustomQuestionsSection';

const CHECKIN_OPTIONS = [
  { id: 'include_mood', label: 'Mående', description: 'Hur du mår idag', icon: Brain, required: true },
  { id: 'include_sleep', label: 'Sömn', description: 'Hur du har sovit', icon: Moon },
  { id: 'include_eating', label: 'Mat', description: 'Hur du har ätit', icon: Utensils },
  { id: 'include_exercise', label: 'Träning', description: 'Om du har tränat', icon: Dumbbell },
  { id: 'include_medication', label: 'Medicin', description: 'Om du tagit din medicin', icon: Pill },
];

type SettingsView = 'main' | 'checkin' | 'custom-questions' | 'notifications' | 'password' | 'delete';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { isPatient, isLoading: roleLoading } = useUserRole();
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  const { questions: customQuestions, addQuestion, removeQuestion } = useCustomCheckinQuestions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [view, setView] = useState<SettingsView>('main');
  const [checkinSelections, setCheckinSelections] = useState({
    include_mood: true, include_sleep: true, include_eating: true,
    include_exercise: true, include_medication: true,
  });
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);
  const [hasCheckinChanges, setHasCheckinChanges] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
    if (id === 'include_mood') return;
    setCheckinSelections(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  const handleSaveCheckin = async () => {
    setIsSavingCheckin(true);
    const { error } = await updatePreferences(checkinSelections);
    if (error) {
      toast({ title: 'Något gick fel', description: 'Kunde inte spara. Försök igen.', variant: 'destructive' });
    } else {
      toast({ title: 'Sparat!', description: 'Dina inställningar har uppdaterats.' });
      setHasCheckinChanges(false);
    }
    setIsSavingCheckin(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'RADERA') return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Ej inloggad', description: 'Du måste vara inloggad.', variant: 'destructive' });
        return;
      }
      const response = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.error) throw new Error(response.error.message);
      toast({ title: 'Konto raderat', description: 'Ditt konto och all data har raderats.' });
      await signOut();
      navigate('/auth');
    } catch {
      toast({ title: 'Kunde inte radera konto', description: 'Försök igen senare.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (roleLoading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sub-view: Check-in preferences
  if (view === 'checkin') {
    return (
      <SubPage title="Anpassa check-in" onBack={() => setView('main')}>
        <div className="space-y-3 mb-6">
          {CHECKIN_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isChecked = checkinSelections[option.id as keyof typeof checkinSelections];
            const isDisabled = option.required;
            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                  isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
                  isChecked ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                )}
                onClick={() => !isDisabled && handleCheckinToggle(option.id)}
              >
                <Checkbox id={option.id} checked={isChecked} onCheckedChange={() => !isDisabled && handleCheckinToggle(option.id)} disabled={isDisabled} className="pointer-events-none" />
                <div className={cn("p-2 rounded-lg", isChecked ? 'bg-primary/10' : 'bg-muted')}>
                  <Icon className={cn("w-5 h-5", isChecked ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <Label htmlFor={option.id} className={cn("font-medium flex items-center gap-2", isDisabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
                    {option.label}
                    {option.required && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Obligatorisk</span>}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={handleSaveCheckin} className="w-full gap-2" disabled={isSavingCheckin || !hasCheckinChanges}>
          {isSavingCheckin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {hasCheckinChanges ? 'Spara ändringar' : 'Inga ändringar'}
        </Button>
      </SubPage>
    );
  }

  if (view === 'custom-questions') {
    return (
      <SubPage title="Egna frågor" onBack={() => setView('main')}>
        <CustomQuestionsSection questions={customQuestions} onAdd={addQuestion} onRemove={removeQuestion} />
      </SubPage>
    );
  }

  if (view === 'notifications') {
    return (
      <SubPage title="Notiser" onBack={() => setView('main')}>
        <NotificationSettings />
      </SubPage>
    );
  }

  if (view === 'password') {
    return (
      <SubPage title="Byt lösenord" onBack={() => setView('main')}>
        <ChangePasswordSection />
      </SubPage>
    );
  }

  if (view === 'delete') {
    return (
      <SubPage title="Radera konto" onBack={() => setView('main')}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">All din data kommer att tas bort permanent och kan inte återställas.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Skriv <span className="text-destructive font-bold">RADERA</span> för att bekräfta:
            </Label>
            <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="RADERA" />
          </div>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'RADERA' || isDeleting} className="w-full gap-2">
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Trash2 className="w-4 h-4" />
            Radera konto permanent
          </Button>
        </div>
      </SubPage>
    );
  }

  // Main settings list
  return (
    <div className="py-6 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl font-bold mb-6 text-center md:text-left">Inställningar</h1>

        {/* Check-in section */}
        {isPatient && (
          <SettingsGroup label="Din check-in">
            <SettingsRow icon={SettingsIcon} label="Anpassa check-in" description="Välj kategorier" onClick={() => setView('checkin')} />
            <SettingsRow icon={MessageSquarePlus} label="Egna frågor" description="Lägg till egna frågor" onClick={() => setView('custom-questions')} />
            <SettingsRow icon={Bell} label="Notiser" description="Påminnelser och push" onClick={() => setView('notifications')} />
          </SettingsGroup>
        )}

        {/* Account section */}
        <SettingsGroup label="Konto och säkerhet">
          <SettingsRow icon={Lock} label="Byt lösenord" onClick={() => setView('password')} />
          <SettingsRow icon={Trash2} label="Radera konto" destructive onClick={() => setView('delete')} />
        </SettingsGroup>
      </div>
    </div>
  );
};

/* ── Reusable sub-components ── */

function SubPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="py-6 px-4 md:px-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
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
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, description, destructive, onClick }: {
  icon: React.ElementType;
  label: string;
  description?: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/50 active:bg-muted transition-colors"
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", destructive ? "text-destructive" : "text-muted-foreground")} />
      <div className="flex-1 min-w-0">
        <span className={cn("text-[15px] font-medium", destructive ? "text-destructive" : "text-foreground")}>{label}</span>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
    </button>
  );
}

export default Settings;

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
import { Loader2, Save, Trash2, AlertTriangle, Brain, Moon, Utensils, Dumbbell, Pill, Settings as SettingsIcon } from 'lucide-react';
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

const Settings = () => {
  const { user, signOut } = useAuth();
  const { isPatient, isLoading: roleLoading } = useUserRole();
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  const { questions: customQuestions, addQuestion, removeQuestion } = useCustomCheckinQuestions();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Inställningar</h1>
          <p className="text-muted-foreground">Anpassa din upplevelse</p>
        </header>

        {/* Check-in Preferences */}
        {isPatient && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Anpassa din check-in</h2>
                <p className="text-sm text-muted-foreground">Välj vilka kategorier du vill inkludera</p>
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
          </div>
        )}

        {/* Custom Questions */}
        {isPatient && (
          <div className="glass-card p-6">
            <CustomQuestionsSection questions={customQuestions} onAdd={addQuestion} onRemove={removeQuestion} />
          </div>
        )}

        {/* Notifications */}
        {isPatient && <NotificationSettings />}

        {/* Change Password */}
        <ChangePasswordSection />

        {/* Delete Account */}
        <div className="glass-card p-4 border-destructive/30">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Radera ditt konto och all data permanent.</p>
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
                    <p>Är du säker? All din data kommer att tas bort permanent.</p>
                    <p className="font-medium">Skriv <span className="text-destructive font-bold">RADERA</span> för att bekräfta:</p>
                    <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="RADERA" className="mt-2" />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'RADERA' || isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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

export default Settings;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useUserRole } from '@/hooks/useUserRole';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, Trash2, AlertTriangle, Brain, Moon, Utensils, Dumbbell, Pill, ChevronRight, Bell, Lock, Settings as SettingsIcon, Download, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ChangePasswordSection } from '@/components/ChangePasswordSection';
import { GDPRExport } from '@/components/GDPRExport';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type SettingsView = 'main' | 'checkin' | 'custom-questions' | 'notifications' | 'password' | 'delete' | 'export' | 'language';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { isPatient, isLoading: roleLoading } = useUserRole();
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  const { t } = useTranslation();
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

  const CHECKIN_OPTIONS = [
    { id: 'include_mood', label: t('settings.checkinMood'), description: t('settings.checkinMoodDesc'), icon: Brain, required: true },
    { id: 'include_sleep', label: t('settings.checkinSleep'), description: t('settings.checkinSleepDesc'), icon: Moon },
    { id: 'include_eating', label: t('settings.checkinEating'), description: t('settings.checkinEatingDesc'), icon: Utensils },
    { id: 'include_exercise', label: t('settings.checkinExercise'), description: t('settings.checkinExerciseDesc'), icon: Dumbbell },
    { id: 'include_medication', label: t('settings.checkinMedication'), description: t('settings.checkinMedicationDesc'), icon: Pill },
  ];

  useEffect(() => {
    if (preferences) {
      setCheckinSelections({
        include_mood: preferences.include_mood, include_sleep: preferences.include_sleep,
        include_eating: preferences.include_eating, include_exercise: preferences.include_exercise,
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
      toast({ title: t('settings.somethingWrong'), description: t('settings.couldNotSave'), variant: 'destructive' });
    } else {
      toast({ title: t('settings.saved'), description: t('settings.settingsUpdated') });
      setHasCheckinChanges(false);
    }
    setIsSavingCheckin(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== t('settings.deleteConfirmWord')) return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('settings.notLoggedIn'), description: t('settings.mustBeLoggedIn'), variant: 'destructive' });
        return;
      }
      const response = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.error) throw new Error(response.error.message);
      toast({ title: t('settings.accountDeleted'), description: t('settings.accountDeletedDesc') });
      await signOut();
      navigate('/auth');
    } catch {
      toast({ title: t('settings.couldNotDelete'), description: t('settings.tryAgainLater'), variant: 'destructive' });
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

  if (view === 'checkin') {
    return (
      <SubPage title={t('settings.customizeCheckinTitle')} onBack={() => setView('main')}>
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
                    {option.required && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t('settings.required')}</span>}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={handleSaveCheckin} className="w-full gap-2 mb-8" disabled={isSavingCheckin || !hasCheckinChanges}>
          {isSavingCheckin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {hasCheckinChanges ? t('common.saveChanges') : t('common.noChanges')}
        </Button>
      </SubPage>
    );
  }

  if (view === 'notifications') {
    return (
      <SubPage title={t('settings.notificationsTitle')} onBack={() => setView('main')}>
        <NotificationSettings />
      </SubPage>
    );
  }

  if (view === 'password') {
    return (
      <SubPage title={t('settings.changePasswordTitle')} onBack={() => setView('main')}>
        <ChangePasswordSection />
      </SubPage>
    );
  }

  if (view === 'export') {
    return (
      <SubPage title={t('settings.exportDataTitle')} onBack={() => setView('main')}>
        <GDPRExport />
      </SubPage>
    );
  }

  if (view === 'language') {
    return (
      <SubPage title={t('settings.languageTitle', { defaultValue: 'Språk' })} onBack={() => setView('main')}>
        <LanguageSelectList />
      </SubPage>
    );
  }

  if (view === 'delete') {
    return (
      <SubPage title={t('settings.deleteAccountTitle')} onBack={() => setView('main')}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{t('settings.deleteWarning')}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {t('settings.deleteConfirmLabel', { bold: t('settings.deleteConfirmWord') }).split(t('settings.deleteConfirmWord')).map((part, i) => 
                i === 0 ? <span key={i}>{part}<span className="text-destructive font-bold">{t('settings.deleteConfirmWord')}</span></span> : <span key={i}>{part}</span>
              )}
            </Label>
            <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={t('settings.deleteConfirmWord')} />
          </div>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmText !== t('settings.deleteConfirmWord') || isDeleting} className="w-full gap-2">
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Trash2 className="w-4 h-4" />
            {t('settings.deleteAccountPermanent')}
          </Button>
        </div>
      </SubPage>
    );
  }

  return (
    <div className="p-5 md:p-8 pb-24">
        <div className="max-w-2xl mx-auto md:mx-0">
        <h1 className="font-display text-2xl font-bold mb-1">{t('settings.title')}</h1>
        <p className="text-[13px] text-foreground/30 mb-10">{t('settings.subtitle')}</p>

        <SettingsGroup label={t('settings.general')}>
          <LanguageRow onClick={() => setView('language')} />
        </SettingsGroup>

        {isPatient && (
          <SettingsGroup label={t('settings.yourCheckin')}>
            <SettingsRow icon={SettingsIcon} label={t('settings.customizeCheckin')} description={t('settings.chooseCategories')} onClick={() => setView('checkin')} />
            <SettingsRow icon={Bell} label={t('settings.notificationsLabel')} description={t('settings.notificationsDesc')} onClick={() => setView('notifications')} />
          </SettingsGroup>
        )}

        <SettingsGroup label={t('settings.accountSecurity')}>
          <SettingsRow icon={Lock} label={t('settings.changePassword')} onClick={() => setView('password')} />
          <SettingsRow icon={Download} label={t('settings.exportData')} description={t('settings.exportDesc')} onClick={() => setView('export')} />
          <SettingsRow icon={Trash2} label={t('settings.deleteAccount')} destructive onClick={() => setView('delete')} />
        </SettingsGroup>
      </div>
    </div>
  );
};

function SubPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="p-5 md:p-8 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto md:mx-0">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors" aria-label={t('common.back')}>
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
    <div className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/25 mb-3 px-1">{label}</p>
      <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden divide-y divide-border/20">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, description, destructive, onClick }: {
  icon: React.ElementType; label: string; description?: string; destructive?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150",
        destructive ? "hover:bg-destructive/5 active:bg-destructive/10" : "hover:bg-foreground/[0.04] active:bg-foreground/[0.06]"
      )}
    >
      <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", destructive ? "text-foreground/40 group-hover:text-destructive" : "text-foreground/30")} />
      <div className="flex-1 min-w-0">
        <span className={cn("text-[15px] font-medium", destructive ? "text-foreground/70 hover:text-destructive" : "text-foreground/80")}>{label}</span>
        {description && <p className="text-[12px] text-foreground/30 truncate mt-0.5">{description}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-foreground/15 flex-shrink-0" />
    </button>
  );
}

export default Settings;

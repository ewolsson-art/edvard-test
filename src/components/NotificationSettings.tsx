import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Brain, Pill } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function NotificationSettings() {
  const { t } = useTranslation();
  const {
    preferences,
    isLoading,
    permissionStatus,
    requestPermission,
    updatePreferences,
  } = useNotificationPreferences();

  const [checkinEnabled, setCheckinEnabled] = useState(false);
  const [checkinTime, setCheckinTime] = useState('09:00');
  const [medicationEnabled, setMedicationEnabled] = useState(false);
  const [medicationTime, setMedicationTime] = useState('08:00');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setCheckinEnabled(preferences.checkin_enabled);
      setCheckinTime(preferences.checkin_time?.slice(0, 5) || '09:00');
      setMedicationEnabled(preferences.medication_enabled);
      setMedicationTime(preferences.medication_time?.slice(0, 5) || '08:00');
    }
  }, [preferences]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      new Notification(t('notificationSettings.notificationsEnabled'), {
        body: t('notificationSettings.notificationsEnabledBody'),
        icon: '/favicon.ico',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    if ((checkinEnabled || medicationEnabled) && permissionStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) { setIsSaving(false); return; }
    }
    await updatePreferences({
      checkin_enabled: checkinEnabled,
      checkin_time: checkinTime + ':00',
      medication_enabled: medicationEnabled,
      medication_time: medicationTime + ':00',
    });
    setIsSaving(false);
  };

  const hasChanges = preferences ? (
    checkinEnabled !== preferences.checkin_enabled ||
    checkinTime !== preferences.checkin_time?.slice(0, 5) ||
    medicationEnabled !== preferences.medication_enabled ||
    medicationTime !== preferences.medication_time?.slice(0, 5)
  ) : (checkinEnabled || medicationEnabled);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const notificationsSupported = 'Notification' in window;
  const isDenied = permissionStatus === 'denied';

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-foreground/40 px-1 -mt-2">
        {t('notificationSettings.reminderDesc')}
      </p>

      {!notificationsSupported ? (
        <PermissionBanner
          icon={<BellOff className="h-[18px] w-[18px] text-foreground/40" />}
          text={t('notificationSettings.notSupported')}
        />
      ) : isDenied ? (
        <PermissionBanner
          icon={<BellOff className="h-[18px] w-[18px] text-destructive" />}
          text={t('notificationSettings.blocked')}
          tone="destructive"
        />
      ) : permissionStatus !== 'granted' ? (
        <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="w-[18px] h-[18px] flex-shrink-0 text-foreground/30" />
              <p className="text-[14px] text-foreground/80">{t('notificationSettings.enableNotifications')}</p>
            </div>
            <Button onClick={handleEnableNotifications} size="sm" className="rounded-full flex-shrink-0">
              {t('notificationSettings.enable')}
            </Button>
          </div>
        </div>
      ) : null}

      <SettingsGroup label={t('notificationSettings.reminders')}>
        <ToggleRow
          icon={Brain}
          label={t('notificationSettings.dailyCheckin')}
          description={t('notificationSettings.dailyCheckinDesc')}
          enabled={checkinEnabled}
          onToggle={setCheckinEnabled}
          disabled={isDenied}
          time={checkinTime}
          onTimeChange={setCheckinTime}
          timeId="checkin-time"
        />
        <ToggleRow
          icon={Pill}
          label={t('notificationSettings.medicationReminder')}
          description={t('notificationSettings.medicationReminderDesc')}
          enabled={medicationEnabled}
          onToggle={setMedicationEnabled}
          disabled={isDenied}
          time={medicationTime}
          onTimeChange={setMedicationTime}
          timeId="medication-time"
        />
      </SettingsGroup>

      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-full h-11"
        >
          {isSaving ? t('notificationSettings.saving') : t('notificationSettings.saveSettings')}
        </Button>
      )}
    </div>
  );
}

function PermissionBanner({
  icon, text, tone = 'muted',
}: { icon: React.ReactNode; text: string; tone?: 'muted' | 'destructive' }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3.5 backdrop-blur-sm',
        tone === 'destructive' ? 'bg-destructive/10' : 'bg-foreground/[0.03]'
      )}
    >
      {icon}
      <p className={cn('text-[13px]', tone === 'destructive' ? 'text-destructive' : 'text-foreground/60')}>
        {text}
      </p>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/25 mb-3 px-1">
        {label}
      </p>
      <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden divide-y divide-border/20">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon, label, description, enabled, onToggle, disabled, time, onTimeChange, timeId,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  time: string;
  onTimeChange: (v: string) => void;
  timeId: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        <Icon className="w-[18px] h-[18px] flex-shrink-0 text-foreground/30" />
        <div className="flex-1 min-w-0">
          <span className="text-[15px] font-medium text-foreground/80 block">{label}</span>
          <p className="text-[12px] text-foreground/30 mt-0.5">{description}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} disabled={disabled} />
      </div>
      {enabled && (
        <div className="flex items-center gap-3 px-4 pb-4 pt-1 pl-[42px] animate-fade-in">
          <Clock className="h-3.5 w-3.5 text-foreground/30 flex-shrink-0" />
          <span className="text-[12px] text-foreground/40">Tid</span>
          <Input
            id={timeId}
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-28 h-9 text-[13px] bg-foreground/[0.04] border-foreground/10 rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

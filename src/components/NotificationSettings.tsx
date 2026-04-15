import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useTranslation } from 'react-i18next';

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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const notificationsSupported = 'Notification' in window;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('notificationSettings.reminders')}
        </CardTitle>
        <CardDescription>{t('notificationSettings.reminderDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!notificationsSupported ? (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('notificationSettings.notSupported')}</p>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
            <BellOff className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{t('notificationSettings.blocked')}</p>
          </div>
        ) : permissionStatus !== 'granted' ? (
          <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm">{t('notificationSettings.enableNotifications')}</p>
            </div>
            <Button onClick={handleEnableNotifications} size="sm">{t('notificationSettings.enable')}</Button>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="checkin-enabled" className="text-base">{t('notificationSettings.dailyCheckin')}</Label>
              <p className="text-sm text-muted-foreground">{t('notificationSettings.dailyCheckinDesc')}</p>
            </div>
            <Switch id="checkin-enabled" checked={checkinEnabled} onCheckedChange={setCheckinEnabled} disabled={permissionStatus === 'denied'} />
          </div>
          {checkinEnabled && (
            <div className="flex items-center gap-3 pl-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="checkin-time" className="text-sm text-muted-foreground">{t('notificationSettings.time')}</Label>
              <Input id="checkin-time" type="time" value={checkinTime} onChange={(e) => setCheckinTime(e.target.value)} className="w-32" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="medication-enabled" className="text-base">{t('notificationSettings.medicationReminder')}</Label>
              <p className="text-sm text-muted-foreground">{t('notificationSettings.medicationReminderDesc')}</p>
            </div>
            <Switch id="medication-enabled" checked={medicationEnabled} onCheckedChange={setMedicationEnabled} disabled={permissionStatus === 'denied'} />
          </div>
          {medicationEnabled && (
            <div className="flex items-center gap-3 pl-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="medication-time" className="text-sm text-muted-foreground">{t('notificationSettings.time')}</Label>
              <Input id="medication-time" type="time" value={medicationTime} onChange={(e) => setMedicationTime(e.target.value)} className="w-32" />
            </div>
          )}
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? t('notificationSettings.saving') : t('notificationSettings.saveSettings')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

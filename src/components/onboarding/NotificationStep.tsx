import { useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface NotificationSettings {
  checkinEnabled: boolean;
  checkinTime: string;
  medicationEnabled: boolean;
  medicationTime: string;
}

interface NotificationStepProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
  includeMedication: boolean;
}

const TIME_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

export const NotificationStep = ({ settings, onSettingsChange, includeMedication }: NotificationStepProps) => {
  const { t } = useTranslation();
  const handleToggle = (field: 'checkinEnabled' | 'medicationEnabled') => {
    onSettingsChange({
      ...settings,
      [field]: !settings[field],
    });
  };

  const handleTimeChange = (field: 'checkinTime' | 'medicationTime', value: string) => {
    onSettingsChange({
      ...settings,
      [field]: value,
    });
  };

  const anyEnabled = settings.checkinEnabled || settings.medicationEnabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        {anyEnabled ? (
          <Bell className="w-5 h-5 text-primary" />
        ) : (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">
          {anyEnabled ? 'Påminnelser aktiverade' : 'Inga påminnelser aktiva'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Check-in reminder */}
        <div className={cn(
          "rounded-xl border p-4 transition-colors",
          settings.checkinEnabled 
            ? "bg-primary/5 border-primary/30" 
            : "bg-card border-border"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "w-4 h-4",
                settings.checkinEnabled ? "text-primary" : "text-muted-foreground"
              )} />
              <Label className="text-sm font-medium">Daglig incheckning</Label>
            </div>
            <Switch
              checked={settings.checkinEnabled}
              onCheckedChange={() => handleToggle('checkinEnabled')}
            />
          </div>
          
          {settings.checkinEnabled && (
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_OPTIONS.slice(0, 8).map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleTimeChange('checkinTime', time)}
                  className={cn(
                    "px-2 py-1.5 text-xs rounded-lg border transition-colors",
                    settings.checkinTime === time
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Medication reminder */}
        {includeMedication && (
          <div className={cn(
            "rounded-xl border p-4 transition-colors",
            settings.medicationEnabled 
              ? "bg-primary/5 border-primary/30" 
              : "bg-card border-border"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className={cn(
                  "w-4 h-4",
                  settings.medicationEnabled ? "text-primary" : "text-muted-foreground"
                )} />
                <Label className="text-sm font-medium">Medicinpåminnelse</Label>
              </div>
              <Switch
                checked={settings.medicationEnabled}
                onCheckedChange={() => handleToggle('medicationEnabled')}
              />
            </div>
            
            {settings.medicationEnabled && (
              <div className="grid grid-cols-4 gap-1.5">
                {TIME_OPTIONS.slice(0, 8).map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeChange('medicationTime', time)}
                    className={cn(
                      "px-2 py-1.5 text-xs rounded-lg border transition-colors",
                      settings.medicationTime === time
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Du kan ändra notis-inställningar senare i din profil
      </p>
    </div>
  );
};

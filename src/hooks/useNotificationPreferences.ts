import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  checkin_enabled: boolean;
  checkin_time: string;
  medication_enabled: boolean;
  medication_time: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  push_subscription: any;
  created_at: string;
  updated_at: string;
}

const isNative = Capacitor.isNativePlatform();

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { user } = useAuth();
  const { toast } = useToast();

  // Check notification permission (native + web)
  useEffect(() => {
    (async () => {
      if (isNative) {
        try {
          const res = await LocalNotifications.checkPermissions();
          setPermissionStatus(res.display === 'granted' ? 'granted' : res.display === 'denied' ? 'denied' : 'default');
        } catch (e) {
          console.error('LocalNotifications.checkPermissions failed', e);
        }
      } else if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    })();
  }, []);

  // Fetch preferences
  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
      } else {
        setPreferences(data);
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isNative) {
      try {
        const res = await LocalNotifications.requestPermissions();
        const granted = res.display === 'granted';
        setPermissionStatus(granted ? 'granted' : 'denied');
        if (!granted) {
          toast({
            title: 'Tillåtelse nekad',
            description: 'Aktivera notiser i iOS-inställningar för Toddy för att få påminnelser.',
            variant: 'destructive',
          });
        }
        return granted;
      } catch (e) {
        console.error('LocalNotifications.requestPermissions failed', e);
        return false;
      }
    }

    if (!('Notification' in window)) {
      toast({
        title: 'Notiser stöds inte',
        description: 'Din webbläsare stöder inte notiser.',
        variant: 'destructive',
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission !== 'granted') {
      toast({
        title: 'Tillåtelse nekad',
        description: 'Du behöver tillåta notiser i webbläsaren för att få påminnelser.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  }, [toast]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      if (preferences) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;

        setPreferences(prev => prev ? { ...prev, ...updates } : null);
      } else {
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();

        if (error) throw error;

        setPreferences(data);
      }

      toast({
        title: 'Inställningar sparade',
        description: 'Dina notisinställningar har uppdaterats.',
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte spara inställningarna.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, preferences, toast]);

  return {
    preferences,
    isLoading,
    permissionStatus,
    requestPermission,
    updatePreferences,
  };
}

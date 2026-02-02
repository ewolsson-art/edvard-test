import { useState, useEffect, useCallback } from 'react';
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
  push_subscription: any;
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { user } = useAuth();
  const { toast } = useToast();

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
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
    if (!('Notification' in window)) {
      toast({
        title: "Notiser stöds inte",
        description: "Din webbläsare stöder inte push-notiser.",
        variant: "destructive",
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission !== 'granted') {
      toast({
        title: "Tillåtelse nekad",
        description: "Du behöver tillåta notiser i webbläsaren för att få påminnelser.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [toast]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      if (preferences) {
        // Update existing
        const { error } = await supabase
          .from('notification_preferences')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;

        setPreferences(prev => prev ? { ...prev, ...updates } : null);
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();

        if (error) throw error;

        setPreferences(data);
      }

      toast({
        title: "Inställningar sparade",
        description: "Dina notifikationsinställningar har uppdaterats.",
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara inställningarna.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, preferences, toast]);

  const scheduleNotification = useCallback((title: string, body: string, delay: number) => {
    if (permissionStatus !== 'granted') return;

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: title, // Prevents duplicate notifications
      });
    }, delay);
  }, [permissionStatus]);

  return {
    preferences,
    isLoading,
    permissionStatus,
    requestPermission,
    updatePreferences,
    scheduleNotification,
  };
}

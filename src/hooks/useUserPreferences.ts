import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface UserPreferences {
  id: string;
  user_id: string;
  include_mood: boolean;
  include_sleep: boolean;
  include_eating: boolean;
  include_exercise: boolean;
  include_medication: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPreferences = async (prefs: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Use upsert to handle both create and update cases
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...prefs,
          onboarding_completed: true,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating preferences:', error);
      return { data: null, error };
    }
  };

  const updatePreferences = async (prefs: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user || !preferences) return { error: new Error('No preferences found') };

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(prefs)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { data: null, error };
    }
  };

  // Doctors don't need onboarding - they don't do check-ins
  const needsOnboarding = !loading && !roleLoading && user && !isDoctor && !preferences?.onboarding_completed;

  return {
    preferences,
    loading: loading || roleLoading,
    createPreferences,
    updatePreferences,
    refetch: fetchPreferences,
    needsOnboarding,
  };
};

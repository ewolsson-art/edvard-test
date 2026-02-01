import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateAvatarUrl = useCallback((url: string | null) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  }, []);

  const firstName = profile?.first_name || null;
  const fullName = profile 
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null
    : null;
  const avatarUrl = profile?.avatar_url || null;

  return {
    profile,
    firstName,
    fullName,
    avatarUrl,
    isLoading,
    updateAvatarUrl,
    refetch: fetchProfile,
  };
}

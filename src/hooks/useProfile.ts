import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const AVATAR_BUCKET = 'avatars';

const getAvatarStoragePath = (avatarUrl: string | null, userId?: string) => {
  if (!avatarUrl) return null;
  if (!avatarUrl.startsWith('http')) return avatarUrl;

  try {
    const url = new URL(avatarUrl);
    const publicMarker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    const signedMarker = `/storage/v1/object/sign/${AVATAR_BUCKET}/`;
    const marker = url.pathname.includes(publicMarker) ? publicMarker : signedMarker;
    const path = url.pathname.split(marker)[1];

    if (!path) return null;
    const decodedPath = decodeURIComponent(path);
    return !userId || decodedPath.startsWith(`${userId}/`) ? decodedPath : null;
  } catch {
    return null;
  }
};

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
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    const rawAvatarUrl = profile?.avatar_url || null;
    const storagePath = getAvatarStoragePath(rawAvatarUrl, user?.id);

    if (!rawAvatarUrl) {
      setSignedAvatarUrl(null);
      return;
    }

    if (!storagePath) {
      setSignedAvatarUrl(rawAvatarUrl);
      return;
    }

    supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(storagePath, 60 * 60)
      .then(({ data, error }) => {
        if (!cancelled) setSignedAvatarUrl(error ? null : data.signedUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.avatar_url, user?.id]);

  const updateAvatarUrl = useCallback((url: string | null) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  }, []);

  const firstName = profile?.first_name || null;
  const fullName = profile 
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null
    : null;
  const avatarUrl = signedAvatarUrl;

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

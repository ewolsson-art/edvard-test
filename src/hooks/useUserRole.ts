import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'patient' | 'doctor';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setRole(data.role as AppRole);
      }
      setIsLoading(false);
    };

    fetchRole();
  }, [user]);

  // SECURITY: Role changes are no longer allowed from the client
  // All new users are automatically assigned 'patient' role by the database trigger
  // Doctor roles must be granted through a separate admin/invitation process
  const setUserRole = useCallback(async (_newRole: AppRole) => {
    console.warn('Role changes are not allowed from the client for security reasons');
    return false;
  }, []);

  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient';

  return {
    role,
    isDoctor,
    isPatient,
    isLoading,
    setUserRole,
  };
}

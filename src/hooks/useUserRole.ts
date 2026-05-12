import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'patient' | 'doctor' | 'relative' | 'admin';

const isAppRole = (value: unknown): value is AppRole =>
  value === 'patient' || value === 'doctor' || value === 'relative' || value === 'admin';

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

    const metaRole = user.user_metadata?.role;
    const isDemo = Boolean(user.user_metadata?.is_demo);

    // Demo users can switch roles from the onboarding demo cards. Trust the
    // just-updated demo metadata immediately so routing does not read a stale
    // DB role and bounce/spin before navigation completes.
    if (isDemo && isAppRole(metaRole)) {
      setRole(metaRole);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setRole(data.role as AppRole);
      } else {
        setRole(null);
      }
      setIsLoading(false);
    };

    fetchRole();
  }, [user]);

  // SECURITY: Role changes are no longer allowed from the client
  // All new users are automatically assigned role by the database trigger
  // based on metadata passed during signup
  const setUserRole = useCallback(async (_newRole: AppRole) => {
    console.warn('Role changes are not allowed from the client for security reasons');
    return false;
  }, []);

  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient';
  const isRelative = role === 'relative';
  const isAdmin = role === 'admin';

  return {
    role,
    isDoctor,
    isPatient,
    isRelative,
    isAdmin,
    isLoading,
    setUserRole,
  };
}

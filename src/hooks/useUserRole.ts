import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'patient' | 'doctor' | 'relative';

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
        const dbRole = data.role as AppRole;
        // If metadata indicates a different role and it was recently assigned,
        // trust metadata (handles race where DB trigger set 'patient' but assign_initial_role updated to 'relative')
        const metaRole = user.user_metadata?.role as AppRole | undefined;
        if (metaRole && ['patient', 'doctor', 'relative'].includes(metaRole) && dbRole === 'patient' && metaRole !== 'patient') {
          // Re-fetch once more after a short delay to let the DB catch up
          const { data: retryData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          setRole((retryData?.role as AppRole) || metaRole);
        } else {
          setRole(dbRole);
        }
      } else {
        // Fallback to user metadata role if DB hasn't been updated yet
        const metaRole = user.user_metadata?.role as AppRole | undefined;
        if (metaRole && ['patient', 'doctor', 'relative'].includes(metaRole)) {
          setRole(metaRole);
        }
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

  return {
    role,
    isDoctor,
    isPatient,
    isRelative,
    isLoading,
    setUserRole,
  };
}

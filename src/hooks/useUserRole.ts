import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'patient' | 'doctor' | 'relative' | 'admin';

const isAppRole = (value: unknown): value is AppRole =>
  value === 'patient' || value === 'doctor' || value === 'relative' || value === 'admin';

const PRIORITY: AppRole[] = ['admin', 'doctor', 'relative', 'patient'];

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    const metaRole = user.user_metadata?.role;
    const isDemo = Boolean(user.user_metadata?.is_demo);

    if (isDemo && isAppRole(metaRole)) {
      setRoles([metaRole]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!error && data) {
        setRoles(data.map((r) => r.role as AppRole));
      } else {
        setRoles([]);
      }
      setIsLoading(false);
    };

    fetchRoles();
  }, [user]);

  const setUserRole = useCallback(async (_newRole: AppRole) => {
    console.warn('Role changes are not allowed from the client for security reasons');
    return false;
  }, []);

  const isDoctor = roles.includes('doctor');
  const isPatient = roles.includes('patient');
  const isRelative = roles.includes('relative');
  const isAdmin = roles.includes('admin');

  // För kod som fortfarande läser en enskild "role" — välj högst prioriterade.
  // Admin är dock vanligtvis också användare; behåll därför patient om båda finns
  // så att vanlig navigation (sidebar, ProtectedRoute) ej bryts.
  let primaryRole: AppRole | null = null;
  if (isPatient) primaryRole = 'patient';
  else primaryRole = PRIORITY.find((p) => roles.includes(p)) ?? null;

  return {
    role: primaryRole,
    roles,
    isDoctor,
    isPatient,
    isRelative,
    isAdmin,
    isLoading,
    setUserRole,
  };
}

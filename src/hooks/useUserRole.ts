import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'patient' | 'doctor' | 'relative' | 'admin';

const isAppRole = (value: unknown): value is AppRole =>
  value === 'patient' || value === 'doctor' || value === 'relative' || value === 'admin';

const PRIORITY: AppRole[] = ['admin', 'doctor', 'relative', 'patient'];

const USER_ROLES_KEY = 'user-roles';

async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map((r) => r.role as AppRole);
}

export function useUserRole() {
  const { user } = useAuth();

  const metaRole = user?.user_metadata?.role;
  const isDemo = Boolean(user?.user_metadata?.is_demo);
  const demoShortcut = isDemo && isAppRole(metaRole);

  // Single shared React Query cache — eliminates duplicate parallel fetches
  // when multiple components (sidebar, tab bar, ProtectedRoute, banners) all
  // call useUserRole on the same page.
  const { data: dbRoles = [], isLoading } = useQuery({
    queryKey: [USER_ROLES_KEY, user?.id],
    queryFn: () => fetchRoles(user!.id),
    enabled: !!user && !demoShortcut,
    staleTime: 5 * 60 * 1000,
  });

  const roles: AppRole[] = demoShortcut ? [metaRole as AppRole] : dbRoles;

  const setUserRole = useCallback(async (_newRole: AppRole) => {
    console.warn('Role changes are not allowed from the client for security reasons');
    return false;
  }, []);

  const isDoctor = roles.includes('doctor');
  const isPatient = roles.includes('patient');
  const isRelative = roles.includes('relative');
  const isAdmin = roles.includes('admin');

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
    isLoading: !!user && !demoShortcut && isLoading,
    setUserRole,
  };
}

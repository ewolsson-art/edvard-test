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

  const setUserRole = useCallback(async (newRole: AppRole) => {
    if (!user) return false;

    // Try to update existing role first, then insert if not exists
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', user.id);

    if (updateError) {
      // If update fails (no existing row), try insert
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: newRole,
        });

      if (insertError) {
        console.error('Error setting role:', insertError);
        return false;
      }
    }

    setRole(newRole);
    return true;
  }, [user]);

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

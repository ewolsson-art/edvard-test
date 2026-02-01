import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DoctorDelegate {
  id: string;
  doctor_id: string;
  delegate_email: string;
  delegate_id: string | null;
  delegate_name: string | null;
  can_read_messages: boolean;
  can_send_messages: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useDoctorDelegates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [delegates, setDelegates] = useState<DoctorDelegate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDelegates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('doctor_delegates')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDelegates((data as DoctorDelegate[]) || []);
    } catch (error) {
      console.error('Error fetching delegates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDelegates();
  }, [user]);

  const addDelegate = async (email: string, name: string, canRead: boolean, canSend: boolean) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('doctor_delegates')
        .insert({
          doctor_id: user.id,
          delegate_email: email.trim().toLowerCase(),
          delegate_name: name.trim() || null,
          can_read_messages: canRead,
          can_send_messages: canSend,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Ombud finns redan',
            description: 'Denna e-postadress är redan tillagd som ombud.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return { error };
      }

      setDelegates(prev => [data as DoctorDelegate, ...prev]);
      toast({
        title: 'Ombud tillagt',
        description: `${name || email} har lagts till som ombud.`,
      });
      return { data };
    } catch (error) {
      console.error('Error adding delegate:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till ombud.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateDelegate = async (id: string, updates: Partial<Pick<DoctorDelegate, 'can_read_messages' | 'can_send_messages' | 'delegate_name'>>) => {
    try {
      const { error } = await supabase
        .from('doctor_delegates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setDelegates(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
      toast({
        title: 'Uppdaterat',
        description: 'Ombudets behörigheter har uppdaterats.',
      });
    } catch (error) {
      console.error('Error updating delegate:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera ombud.',
        variant: 'destructive',
      });
    }
  };

  const removeDelegate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_delegates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDelegates(prev => prev.filter(d => d.id !== id));
      toast({
        title: 'Borttaget',
        description: 'Ombudet har tagits bort.',
      });
    } catch (error) {
      console.error('Error removing delegate:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort ombud.',
        variant: 'destructive',
      });
    }
  };

  return {
    delegates,
    isLoading,
    addDelegate,
    updateDelegate,
    removeDelegate,
    refetch: fetchDelegates,
  };
}

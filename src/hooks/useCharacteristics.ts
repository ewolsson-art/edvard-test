import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Characteristic {
  id: string;
  name: string;
  mood_type: 'elevated' | 'depressed';
  created_at: string;
}

export function useCharacteristics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCharacteristics();
    } else {
      setCharacteristics([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchCharacteristics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('characteristics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCharacteristics((data || []) as Characteristic[]);
    } catch (error) {
      console.error('Error fetching characteristics:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta kännetecken',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCharacteristic = async (name: string, moodType: 'elevated' | 'depressed') => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('characteristics')
        .insert({
          user_id: user.id,
          name: name.trim(),
          mood_type: moodType,
        })
        .select()
        .single();

      if (error) throw error;

      setCharacteristics(prev => [...prev, data as Characteristic]);
      toast({
        title: 'Tillagt',
        description: 'Kännetecken har lagts till',
      });
      return true;
    } catch (error) {
      console.error('Error adding characteristic:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till kännetecken',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCharacteristic = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('characteristics')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCharacteristics(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Borttaget',
        description: 'Kännetecken har tagits bort',
      });
      return true;
    } catch (error) {
      console.error('Error deleting characteristic:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort kännetecken',
        variant: 'destructive',
      });
      return false;
    }
  };

  const elevatedCharacteristics = characteristics.filter(c => c.mood_type === 'elevated');
  const depressedCharacteristics = characteristics.filter(c => c.mood_type === 'depressed');

  return {
    characteristics,
    elevatedCharacteristics,
    depressedCharacteristics,
    isLoading,
    addCharacteristic,
    deleteCharacteristic,
    refetch: fetchCharacteristics,
  };
}

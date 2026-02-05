import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CustomQuestion {
  id: string;
  question_text: string;
  answer_type: string;
  active: boolean;
  sort_order: number;
}

export interface CustomAnswer {
  question_id: string;
  answer_value: string;
}

export function useCustomCheckinQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setQuestions([]);
      setIsLoaded(true);
      return;
    }

    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('custom_checkin_questions')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching custom questions:', error);
      } else {
        setQuestions((data || []) as CustomQuestion[]);
      }
      setIsLoaded(true);
    };

    fetchQuestions();
  }, [user]);

  const addQuestion = useCallback(async (questionText: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('custom_checkin_questions')
      .insert({
        user_id: user.id,
        question_text: questionText,
        answer_type: 'yes_no',
        sort_order: questions.length,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding custom question:', error);
      toast({ title: 'Kunde inte lägga till fråga', variant: 'destructive' });
      return null;
    }

    const newQ = data as CustomQuestion;
    setQuestions(prev => [...prev, newQ]);
    toast({ title: 'Fråga tillagd!' });
    return newQ;
  }, [user, questions.length, toast]);

  const removeQuestion = useCallback(async (questionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('custom_checkin_questions')
      .delete()
      .eq('id', questionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing custom question:', error);
      toast({ title: 'Kunde inte ta bort fråga', variant: 'destructive' });
      return;
    }

    setQuestions(prev => prev.filter(q => q.id !== questionId));
    toast({ title: 'Fråga borttagen' });
  }, [user, toast]);

  const getAnswersForDate = useCallback(async (date: string): Promise<CustomAnswer[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('custom_checkin_answers')
      .select('question_id, answer_value')
      .eq('user_id', user.id)
      .eq('date', date);

    if (error) {
      console.error('Error fetching custom answers:', error);
      return [];
    }

    return (data || []) as CustomAnswer[];
  }, [user]);

  const saveAnswers = useCallback(async (date: string, answers: Record<string, string>) => {
    if (!user) return false;

    const upserts = Object.entries(answers).map(([questionId, answerValue]) => ({
      user_id: user.id,
      question_id: questionId,
      date,
      answer_value: answerValue,
    }));

    if (upserts.length === 0) return true;

    const { error } = await supabase
      .from('custom_checkin_answers')
      .upsert(upserts, { onConflict: 'user_id,question_id,date' });

    if (error) {
      console.error('Error saving custom answers:', error);
      return false;
    }

    return true;
  }, [user]);

  return {
    questions,
    isLoaded,
    addQuestion,
    removeQuestion,
    getAnswersForDate,
    saveAnswers,
  };
}

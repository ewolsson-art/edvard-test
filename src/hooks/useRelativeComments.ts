import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RelativeComment {
  id: string;
  relative_id: string;
  patient_id: string;
  date: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

interface UseRelativeCommentsProps {
  patientId: string | null;
}

export function useRelativeComments({ patientId }: UseRelativeCommentsProps) {
  const [comments, setComments] = useState<RelativeComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !patientId) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    const fetchComments = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('relative_comments')
        .select('*')
        .eq('relative_id', user.id)
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching relative comments:', error);
      } else {
        setComments(data || []);
      }
      setIsLoading(false);
    };

    fetchComments();
  }, [user, patientId]);

  const getCommentForDate = useCallback((date: string): RelativeComment | undefined => {
    return comments.find(c => c.date === date);
  }, [comments]);

  const getCommentsMap = useCallback((): Record<number, string> => {
    const result: Record<number, string> = {};
    comments.forEach(comment => {
      const day = new Date(comment.date).getDate();
      result[day] = comment.comment;
    });
    return result;
  }, [comments]);

  const saveComment = useCallback(async (date: string, comment: string): Promise<boolean> => {
    if (!user || !patientId) return false;

    const existingComment = getCommentForDate(date);

    if (existingComment) {
      // Update existing comment
      const { error } = await supabase
        .from('relative_comments')
        .update({ comment })
        .eq('id', existingComment.id);

      if (error) {
        console.error('Error updating comment:', error);
        toast({
          title: "Kunde inte spara",
          description: "Försök igen.",
          variant: "destructive",
        });
        return false;
      }

      setComments(prev => prev.map(c => 
        c.id === existingComment.id ? { ...c, comment, updated_at: new Date().toISOString() } : c
      ));
    } else {
      // Create new comment
      const { data, error } = await supabase
        .from('relative_comments')
        .insert({
          relative_id: user.id,
          patient_id: patientId,
          date,
          comment,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        toast({
          title: "Kunde inte spara",
          description: "Försök igen.",
          variant: "destructive",
        });
        return false;
      }

      setComments(prev => [data, ...prev]);
    }

    toast({
      title: "Kommentar sparad",
    });
    return true;
  }, [user, patientId, getCommentForDate, toast]);

  const deleteComment = useCallback(async (date: string): Promise<boolean> => {
    if (!user || !patientId) return false;

    const existingComment = getCommentForDate(date);
    if (!existingComment) return true;

    const { error } = await supabase
      .from('relative_comments')
      .delete()
      .eq('id', existingComment.id);

    if (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Kunde inte ta bort",
        description: "Försök igen.",
        variant: "destructive",
      });
      return false;
    }

    setComments(prev => prev.filter(c => c.id !== existingComment.id));
    toast({
      title: "Kommentar borttagen",
    });
    return true;
  }, [user, patientId, getCommentForDate, toast]);

  return {
    comments,
    isLoading,
    getCommentForDate,
    getCommentsMap,
    saveComment,
    deleteComment,
  };
}

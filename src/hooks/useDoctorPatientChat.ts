import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export function useDoctorPatientChat(connectionId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!connectionId || !user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages((data || []) as ChatMessage[]);
    }
    setIsLoading(false);
  }, [connectionId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!connectionId) return;

    const channel = supabase
      .channel(`chat-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!connectionId || !user || !content.trim()) return false;

    setIsSending(true);
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: content.trim(),
      });

    setIsSending(false);

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  }, [connectionId, user]);

  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .neq('sender_id', user.id);
  }, [user]);

  const unreadCount = messages.filter(
    m => m.sender_id !== user?.id && !m.read_at
  ).length;

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    markAsRead,
    unreadCount,
    refetch: fetchMessages,
  };
}

import { useState, useRef, useEffect } from 'react';
import { Send, User, Stethoscope, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDoctorPatientChat, ChatMessage } from '@/hooks/useDoctorPatientChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface DoctorPatientChatProps {
  connectionId: string;
  otherPartyName: string;
  isDoctor: boolean;
  chatEnabled: boolean;
}

export function DoctorPatientChat({ 
  connectionId, 
  otherPartyName, 
  isDoctor,
  chatEnabled 
}: DoctorPatientChatProps) {
  const { user } = useAuth();
  const { messages, isLoading, isSending, sendMessage, markAsRead } = useDoctorPatientChat(connectionId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    const unreadIds = messages
      .filter(m => m.sender_id !== user?.id && !m.read_at)
      .map(m => m.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }, [messages, user?.id, markAsRead]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const success = await sendMessage(input);
    if (success) {
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm');
    }
    return format(date, 'd MMM HH:mm', { locale: sv });
  };

  // Show disabled state for patients when chat is not enabled
  if (!isDoctor && !chatEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Chatt ej aktiverad</h3>
        <p className="text-muted-foreground text-sm">
          Din läkare har inte aktiverat chattfunktionen ännu.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          {isDoctor ? (
            <User className="w-5 h-5 text-primary" />
          ) : (
            <Stethoscope className="w-5 h-5 text-primary" />
          )}
        </div>
        <div>
          <h3 className="font-semibold">{otherPartyName}</h3>
          <p className="text-xs text-muted-foreground">
            {isDoctor ? 'Patient' : 'Läkare'}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Inga meddelanden än</h3>
            <p className="text-muted-foreground text-sm">
              Skriv ett meddelande för att starta konversationen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {isDoctor ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Stethoscope className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  )}
                  <div className="flex flex-col max-w-[75%]">
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2',
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className={cn(
                      'text-xs text-muted-foreground mt-1',
                      isOwn ? 'text-right' : 'text-left'
                    )}>
                      {formatMessageTime(message.created_at)}
                      {isOwn && message.read_at && (
                        <span className="ml-2">✓ Läst</span>
                      )}
                    </span>
                  </div>
                  {isOwn && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      {isDoctor ? (
                        <Stethoscope className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <User className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ett meddelande..."
            className="min-h-[48px] max-h-[120px] resize-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            size="icon"
            className="h-12 w-12 shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, Sparkles, RefreshCw, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMoodData } from '@/hooks/useMoodData';
import { usePatientConnections, DoctorConnection } from '@/hooks/usePatientConnections';
import { DoctorPatientChat } from '@/components/DoctorPatientChat';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatTarget = 'ai' | DoctorConnection;

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mood-chat`;

const Chat = () => {
  const [selectedTarget, setSelectedTarget] = useState<ChatTarget>('ai');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { session } = useAuth();
  const { firstName, avatarUrl } = useProfile();
  const { isLoaded: moodLoaded, getStatsForYear } = useMoodData();
  const { connections, isLoading: connectionsLoading } = usePatientConnections();

  // Get initials for avatar fallback
  const getInitials = () => {
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (session?.user?.email) return session.user.email.charAt(0).toUpperCase();
    return 'U';
  };

  // Filter approved connections with chat enabled
  const chatEnabledDoctors = connections.filter(c => c.status === 'approved' && c.chat_enabled);

  const currentYearStats = useMemo(() => {
    if (!moodLoaded) return null;
    return getStatsForYear(new Date().getFullYear());
  }, [moodLoaded, getStatsForYear]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getDoctorName = (connection: DoctorConnection) => {
    if (connection.doctor_profile?.first_name || connection.doctor_profile?.last_name) {
      return [connection.doctor_profile.first_name, connection.doctor_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    return connection.doctor_email || 'Läkare';
  };

  const handleSelectTarget = (target: ChatTarget) => {
    setSelectedTarget(target);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Du måste vara inloggad för att använda chatten');
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          moodStats: currentYearStats,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kunde inte ansluta till AI-tjänsten');
      }

      if (!response.body) throw new Error('Ingen respons från servern');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Ett fel uppstod');
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chatten har rensats');
  };

  if (!moodLoaded || connectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-72 md:w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-display text-xl font-bold">Chatt</h1>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* AI Chat option */}
            <button
              onClick={() => handleSelectTarget('ai')}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                selectedTarget === 'ai' 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                selectedTarget === 'ai' 
                  ? "bg-primary/20" 
                  : "bg-muted"
              )}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">Mående-chatt</p>
                <p className="text-xs text-muted-foreground truncate">AI-assistent</p>
              </div>
            </button>

            {/* Divider */}
            {chatEnabledDoctors.length > 0 && (
              <div className="py-2 px-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Läkare
                </p>
              </div>
            )}

            {/* Doctor chat options */}
            {chatEnabledDoctors.map((connection) => (
              <button
                key={connection.id}
                onClick={() => handleSelectTarget(connection)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  selectedTarget !== 'ai' && (selectedTarget as DoctorConnection).id === connection.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  selectedTarget !== 'ai' && (selectedTarget as DoctorConnection).id === connection.id
                    ? "bg-primary/20"
                    : "bg-muted"
                )}>
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{getDoctorName(connection)}</p>
                  {connection.doctor_profile?.clinic_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {connection.doctor_profile.clinic_name}
                    </p>
                  )}
                </div>
              </button>
            ))}

            {chatEnabledDoctors.length === 0 && (
              <div className="px-3 py-4 text-center">
                <Stethoscope className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  Inga läkare med chatt aktiverad
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* AI Chat */}
        {selectedTarget === 'ai' && (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Mående-chatt</h2>
                  <p className="text-xs text-muted-foreground">AI-assistent för ditt mående</p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearChat} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Rensa
                </Button>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Hej! Hur mår du idag?</h2>
                  <p className="text-muted-foreground max-w-md">
                    Jag är här för att hjälpa dig reflektera över ditt mående. 
                    Jag har tillgång till din statistik och kan hjälpa dig identifiera mönster.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {[
                      'Hur har jag mått den senaste månaden?',
                      'Ge mig tips för att må bättre',
                      'Hjälp mig analysera mina mönster',
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          textareaRef.current?.focus();
                        }}
                        className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-3',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={avatarUrl || undefined} alt="Din profilbild" />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Skriv ett meddelande..."
                  className="min-h-[48px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-12 w-12 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Doctor Chat */}
        {selectedTarget !== 'ai' && (
          <DoctorPatientChat
            connectionId={(selectedTarget as DoctorConnection).id}
            otherPartyName={getDoctorName(selectedTarget as DoctorConnection)}
            isDoctor={false}
            chatEnabled={(selectedTarget as DoctorConnection).chat_enabled}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Stethoscope, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMoodData } from '@/hooks/useMoodData';
import { usePatientConnections, DoctorConnection } from '@/hooks/usePatientConnections';
import { DoctorPatientChat } from '@/components/DoctorPatientChat';
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
  const [selectedTarget, setSelectedTarget] = useState<ChatTarget | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isLoaded: moodLoaded, getStatsForYear } = useMoodData();
  const { connections, isLoading: connectionsLoading } = usePatientConnections();

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
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

  const handleBack = () => {
    setSelectedTarget(null);
    setMessages([]);
  };

  if (!moodLoaded || connectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show AI chat
  if (selectedTarget === 'ai') {
    return (
      <div className="h-screen flex flex-col py-8 px-4 md:px-8">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <header className="mb-6">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-primary" />
                  Mående-chatt
                </h1>
                <p className="text-muted-foreground text-sm">
                  Diskutera ditt mående och få insikter baserat på din statistik
                </p>
              </div>
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearChat} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Rensa
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 glass-card p-4 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
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
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
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

            <div className="mt-4 flex gap-2">
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
        </div>
      </div>
    );
  }

  // Show doctor chat
  if (selectedTarget && typeof selectedTarget === 'object') {
    return (
      <div className="h-screen flex flex-col py-8 px-4 md:px-8">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <header className="mb-6">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </Button>
          </header>
          <div className="flex-1 glass-card flex flex-col min-h-0">
            <DoctorPatientChat
              connectionId={selectedTarget.id}
              otherPartyName={getDoctorName(selectedTarget)}
              isDoctor={false}
              chatEnabled={selectedTarget.chat_enabled}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show chat selection
  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Chatt</h1>
          <p className="text-muted-foreground">
            Välj vem du vill chatta med
          </p>
        </header>

        <div className="space-y-4">
          {/* AI Chat option */}
          <button
            onClick={() => setSelectedTarget('ai')}
            className="w-full glass-card p-6 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Mående-chatt</h3>
                <p className="text-muted-foreground text-sm">
                  AI-assistent som hjälper dig reflektera över ditt mående
                </p>
              </div>
            </div>
          </button>

          {/* Doctor chat options */}
          {chatEnabledDoctors.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">Dina läkare</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {chatEnabledDoctors.map((connection) => (
                <button
                  key={connection.id}
                  onClick={() => setSelectedTarget(connection)}
                  className="w-full glass-card p-6 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{getDoctorName(connection)}</h3>
                      {connection.doctor_profile?.clinic_name && (
                        <p className="text-muted-foreground text-sm">
                          {connection.doctor_profile.clinic_name}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {chatEnabledDoctors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Du har inga läkare med chatt aktiverad.
              </p>
              <p className="text-xs mt-1">
                Bjud in en läkare via "Mina läkare" för att chatta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Hur länge sen var jag uppåt senast?",
  "Vilken vecka mådde jag bäst senaste månaden?",
  "Hur har min sömn påverkat mitt mående?",
  "Vilka mönster ser du i mina deppigare perioder?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stats`;

export default function AskToddy() {
  const { firstName } = useProfile();
  const { session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    if (!session?.access_token) {
      toast({ title: "Du måste vara inloggad", variant: "destructive" });
      return;
    }

    const userMsg: Msg = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    let assistantBuffer = "";
    const upsertAssistant = (chunk: string) => {
      assistantBuffer += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantBuffer } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantBuffer }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!resp.ok) {
        let errMsg = "Något gick fel.";
        if (resp.status === 429) errMsg = "För många frågor — vänta lite och försök igen.";
        else if (resp.status === 402) errMsg = "AI-krediterna är slut just nu.";
        else {
          try {
            const j = await resp.json();
            if (j?.error) errMsg = j.error;
          } catch { /* ignore */ }
        }
        toast({ title: "Kunde inte få svar", description: errMsg, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!resp.body) {
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(delta);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const json = raw.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(delta);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("chat error", e);
      toast({ title: "Nätverksfel", description: "Kunde inte ansluta.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  // Mobile chat shell:
  // - Page itself fills the viewport (dvh) and is a flex column
  // - Header sticks to top, input docks to bottom (above the BottomTabBar via pb-tabbar offset)
  // - Only the message list scrolls
  // The parent <main> already adds pb-tabbar on mobile, so a normal flex column fills correctly.
  return (
    <AnimatedPage className="flex flex-col h-[100dvh] md:h-screen bg-background">
      <header className="sticky top-0 z-20 px-5 md:px-8 pt-[max(env(safe-area-inset-top),0.75rem)] md:pt-6 pb-3 md:pb-4 border-b border-border/30 bg-background/85 backdrop-blur-xl shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-[hsl(45_85%_55%/0.15)] border border-[hsl(45_85%_55%/0.25)] flex items-center justify-center shrink-0">
            <Sparkles className="w-[18px] h-[18px] md:w-5 md:h-5 text-[hsl(45_85%_55%)]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg md:text-2xl font-bold tracking-tight leading-tight truncate">Fråga Toddy</h1>
            <p className="text-[11px] md:text-[12px] text-muted-foreground/70 truncate">AI-assistent som kan din statistik</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-8 py-5 md:py-6">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-5">
          {isEmpty && (
            <div className="text-center py-8 md:py-12">
              <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-[hsl(45_85%_55%/0.1)] border border-[hsl(45_85%_55%/0.2)] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[hsl(45_85%_55%)]" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Hej{firstName ? ` ${firstName}` : ""}!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
                Jag har koll på dina incheckningar, mediciner och diagnoser.
                Fråga vad du vill om ditt mående över tid.
              </p>

              <div className="grid gap-2.5 max-w-md mx-auto">
                <p className="text-[11px] tracking-[0.12em] uppercase font-medium text-muted-foreground/50 text-left mb-1">
                  Förslag
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-4 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-border transition-all text-[14px] text-foreground/90 active:scale-[0.99]"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="max-w-md mx-auto mt-8 p-3.5 rounded-xl bg-muted/30 border border-border/30 flex items-start gap-2.5 text-left">
                <AlertTriangle className="w-4 h-4 text-muted-foreground/70 shrink-0 mt-0.5" />
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Toddy är inte en läkare. Vid akut psykisk ohälsa, ring 1177 eller 112.
                </p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[88%] md:max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                  m.role === "user"
                    ? "bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-medium"
                    : "bg-card border border-border/40 text-foreground",
                )}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="prose-toddy">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/40 rounded-2xl px-4 py-3 inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">Toddy tänker…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/30 bg-background/80 backdrop-blur px-5 md:px-8 py-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Fråga om ditt mående…"
            rows={1}
            disabled={isLoading}
            className="resize-none min-h-[48px] max-h-40 text-base rounded-2xl bg-card border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 rounded-2xl bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] hover:bg-[hsl(45_85%_62%)] shrink-0"
            aria-label="Skicka"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </AnimatedPage>
  );
}

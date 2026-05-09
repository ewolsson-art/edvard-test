import { useEffect, useRef, useState } from "react";
import { Send, Loader2, AlertTriangle, ArrowUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AnimatedPage } from "@/components/AnimatedPage";
import { TurtleLogo } from "@/components/TurtleLogo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Hur många dagar var jag nedstämd i år?",
  "Lägg till illamående som biverkning på min medicin",
  "Hur många dagar har jag tränat senaste 30 dagarna?",
  "Lägg till 'pratar mycket' som kännetecken när jag är uppvarvad",
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

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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
    // Refocus shortly after to keep typing flow
    requestAnimationFrame(() => textareaRef.current?.focus());

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
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;
  const showThinking = isLoading && messages[messages.length - 1]?.role === "user";

  return (
    <AnimatedPage
      className={cn(
        // Mobile: lock to viewport, sit above the BottomTabBar
        "fixed inset-x-0 top-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-10 flex flex-col bg-background",
        // Desktop: in-flow page filling its parent
        "md:static md:inset-auto md:bottom-auto md:h-screen md:z-auto",
      )}
    >
      {/* === Header === */}
      <header className="sticky top-0 z-20 px-5 md:px-8 pt-[max(env(safe-area-inset-top),0.875rem)] md:pt-5 pb-3 md:pb-4 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-foreground/[0.04] ring-1 ring-foreground/10 flex items-center justify-center shrink-0 overflow-hidden">
            <TurtleLogo size="sm" staticPose className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[17px] md:text-xl font-semibold tracking-tight leading-tight">
              Toddy
            </h1>
            <p className="text-[11.5px] md:text-[12px] text-muted-foreground/60 leading-tight">
              {showThinking ? "Skriver…" : "Din statistik, dina mönster"}
            </p>
          </div>
        </div>
      </header>

      {/* === Transcript === */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-8 pb-6"
      >
        <div className="max-w-2xl mx-auto">
          {isEmpty ? (
            // Empty state — generous, centered, friendly
            <div className="min-h-full flex flex-col items-center justify-center text-center pt-8 pb-4">
              <div className="mb-6">
                <TurtleLogo size="lg" staticPose className="w-24 h-24 md:w-28 md:h-28" />
              </div>
              <h2 className="font-display text-[26px] md:text-3xl font-bold tracking-tight mb-2">
                Hej{firstName ? ` ${firstName}` : ""}
              </h2>
              <p className="text-[15px] text-muted-foreground/80 max-w-sm leading-relaxed mb-8 px-4">
                Fråga mig om din statistik. Jag kan också registrera biverkningar och kännetecken åt dig.
              </p>

              <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-4 py-3 rounded-2xl bg-foreground/[0.03] ring-1 ring-foreground/[0.06] hover:bg-foreground/[0.06] hover:ring-foreground/10 active:scale-[0.985] transition-all text-[13.5px] text-foreground/85 leading-snug"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="max-w-md mt-8 px-4 flex items-start gap-2 text-left">
                <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-1" />
                <p className="text-[11.5px] text-muted-foreground/60 leading-relaxed">
                  Toddy ger inga medicinska råd. Vid akut psykisk ohälsa, ring 1177 eller 112.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6 pt-4">
              {messages.map((m, i) => (
                <div key={i}>
                  {m.role === "user" ? (
                    // User: golden pill, right-aligned
                    <div className="flex justify-end">
                      <div className="max-w-[85%] md:max-w-[75%] rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px] leading-relaxed bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-medium">
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ) : (
                    // Assistant: no bubble — text directly on page, with a small turtle avatar
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-foreground/[0.04] ring-1 ring-foreground/10 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                        <TurtleLogo size="sm" staticPose className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 prose-toddy text-[15px] leading-relaxed text-foreground/95">
                        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {showThinking && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-foreground/[0.04] ring-1 ring-foreground/10 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                    <TurtleLogo size="sm" staticPose className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 text-muted-foreground/70 text-[13.5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === Composer === */}
      <div className="shrink-0 px-3 md:px-8 pt-2 pb-3 md:pb-5 bg-gradient-to-t from-background via-background/95 to-background/0">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-end rounded-[28px] bg-foreground/[0.04] ring-1 ring-foreground/10 focus-within:ring-foreground/25 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Fråga Toddy…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent border-0 outline-none text-base leading-6 px-5 py-3.5 pr-14 max-h-40 placeholder:text-muted-foreground/50 disabled:opacity-60"
              style={{ minHeight: "52px" }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              aria-label="Skicka"
              className={cn(
                "absolute right-2 bottom-2 h-9 w-9 rounded-full flex items-center justify-center transition-all",
                input.trim() && !isLoading
                  ? "bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] hover:bg-[hsl(45_85%_62%)] active:scale-95 shadow-[0_2px_12px_hsl(45_85%_55%/0.35)]"
                  : "bg-foreground/10 text-foreground/30 cursor-not-allowed",
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />}
            </button>
          </div>
          <p className="text-center text-[10.5px] text-muted-foreground/40 mt-2 px-4">
            Toddy kan göra fel. Verifiera viktig information.
          </p>
        </div>
      </div>
    </AnimatedPage>
  );
}

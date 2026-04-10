import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Mic, MicOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FullscreenCommentProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function FullscreenComment({ title, placeholder, value, onChange, onClose }: FullscreenCommentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const toggleVoiceRecording = () => {
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      setRecognition(null);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'sv-SE';
    rec.continuous = true;
    rec.interimResults = true;

    let finalTranscript = value || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
          onChange(finalTranscript);
        } else {
          interim += transcript;
        }
      }
      // Show interim results
      if (interim) {
        onChange(finalTranscript + (finalTranscript ? ' ' : '') + interim);
      }
    };

    rec.onerror = () => {
      setIsRecording(false);
      setRecognition(null);
    };

    rec.onend = () => {
      setIsRecording(false);
      setRecognition(null);
    };

    rec.start();
    setIsRecording(true);
    setRecognition(rec);
  };

  const hasSpeechRecognition = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-muted-foreground">
          <ChevronLeft className="w-4 h-4" />
          Tillbaka
        </Button>
        <span className="text-sm font-medium">{title}</span>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-primary font-semibold">
          Klar
        </Button>
      </div>

      {/* Textarea area - takes up all available space */}
      <div className="flex-1 p-5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          className="w-full h-full bg-transparent text-foreground text-base leading-relaxed placeholder:text-muted-foreground/40 resize-none focus:outline-none"
        />
      </div>

      {/* Bottom bar with voice + character count */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border/50">
        {hasSpeechRecognition ? (
          <button
            onClick={toggleVoiceRecording}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all",
              isRecording 
                ? "bg-destructive/10 text-destructive" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                <span className="text-sm font-medium">Stoppa inspelning</span>
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span className="text-sm font-medium">Röstmemo</span>
              </>
            )}
          </button>
        ) : (
          <div />
        )}
        <span className="text-xs text-muted-foreground/50">
          {(value || '').length}/500
        </span>
      </div>
    </div>
  );
}

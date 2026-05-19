import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, MessageCircleHeart, X } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';

interface WelcomeBackDialogProps {
  /** Antal dagar sedan senaste check-in (>= 2 för att visas) */
  daysSinceLastCheckin: number;
  currentStreak: number;
  potentialStreak: number;
  firstName?: string | null;
  /** Stabil nyckel för "denna frånvaroperiod" — t.ex. senaste check-in datum eller userId */
  absenceKey: string;
  onRestoreStreak: () => void;
  onStartFresh: () => void;
  onClose: () => void;
}

const STORAGE_PREFIX = 'toddy_welcome_back_v1:';

export function WelcomeBackDialog({
  daysSinceLastCheckin,
  currentStreak,
  potentialStreak,
  firstName,
  absenceKey,
  onRestoreStreak,
  onStartFresh,
  onClose,
}: WelcomeBackDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (daysSinceLastCheckin < 2) return;
    try {
      const seen = localStorage.getItem(STORAGE_PREFIX + absenceKey);
      if (!seen) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [daysSinceLastCheckin, absenceKey]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_PREFIX + absenceKey, '1'); } catch { /* ignore */ }
    setVisible(false);
    onClose();
  };

  const handleRestore = () => { dismiss(); onRestoreStreak(); };
  const handleFresh = () => { dismiss(); onStartFresh(); };

  if (!visible) return null;

  const numberWords = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio'];
  const daysWord = daysSinceLastCheckin <= 10 ? numberWords[daysSinceLastCheckin] : String(daysSinceLastCheckin);

  const name = firstName ? `, ${firstName}` : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-background/70 backdrop-blur-md px-4 pb-6 md:pb-0"
        onClick={dismiss}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)] overflow-hidden"
        >
          {/* Subtle ambient glow */}
          <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full bg-[hsl(45_85%_55%/0.18)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-[hsl(200_70%_50%/0.12)] blur-3xl" />

          <button
            onClick={dismiss}
            aria-label="Stäng"
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative px-7 pt-9 pb-7 flex flex-col items-center text-center">
            {/* Turtle med liten "ny vänlig viftning" */}
            <motion.div
              initial={{ rotate: -8, scale: 0.9 }}
              animate={{ rotate: [0, -6, 6, -3, 3, 0], scale: 1 }}
              transition={{ delay: 0.15, duration: 1.2, ease: 'easeOut' }}
              className="w-24 h-24 mb-5 flex items-center justify-center"
            >
              <TurtleLogo size="lg" animated={false} mood="content" className="scale-[2]" />
            </motion.div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(45_85%_55%/0.14)] border border-[hsl(45_85%_55%/0.25)] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(45_85%_55%)]" />
              <span className="text-[11px] tracking-[0.1em] uppercase font-bold text-[hsl(45_85%_55%)]">
                Välkommen tillbaka
              </span>
            </div>

            <h1 className="font-display text-[26px] sm:text-[28px] font-bold tracking-tight leading-tight mb-3">
              Hej igen{name} 👋
            </h1>

            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[340px] mb-2">
              Jag ser att du inte har checkat in på {daysWord} {daysSinceLastCheckin === 1 ? 'dag' : 'dagar'} — jag hoppas att du mår bra.
            </p>
            <p className="text-[14px] text-muted-foreground/80 leading-relaxed max-w-[340px]">
              Det finns fortfarande chans att ta igen din streak, eller helt enkelt börja en ny. Inga måsten.
            </p>

            {potentialStreak > 0 && currentStreak > 0 && (
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(45_85%_55%/0.10)] border border-[hsl(45_85%_55%/0.22)]">
                <Flame className="w-4 h-4 text-[hsl(45_85%_55%)]" />
                <span className="text-[13px] font-semibold text-[hsl(45_85%_55%)] tabular-nums">
                  {currentStreak} {currentStreak === 1 ? 'dag' : 'dagar'} att rädda
                </span>
              </div>
            )}

            <div className="w-full mt-6 space-y-2.5">
              {potentialStreak > 0 && currentStreak > 0 ? (
                <button
                  onClick={handleRestore}
                  className="w-full px-6 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-[15px] tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:bg-[hsl(45_85%_62%)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Rädda min streak
                </button>
              ) : (
                <button
                  onClick={handleFresh}
                  className="w-full px-6 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-[15px] tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:bg-[hsl(45_85%_62%)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Börja en ny streak
                </button>
              )}

              {potentialStreak > 0 && currentStreak > 0 && (
                <button
                  onClick={handleFresh}
                  className="w-full px-6 py-3 rounded-full border border-border/60 bg-card/40 hover:bg-card/70 active:scale-[0.98] transition-all duration-200 text-foreground/85 font-semibold text-[14px]"
                >
                  Börja en ny istället
                </button>
              )}

              <a
                href="mailto:hej@toddy.se?subject=Feedback%20till%20Toddy"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full hover:bg-foreground/5 active:scale-[0.98] transition-all duration-200 text-muted-foreground hover:text-foreground text-[13px] font-medium"
              >
                <MessageCircleHeart className="w-4 h-4" />
                Skicka feedback eller önska en funktion
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

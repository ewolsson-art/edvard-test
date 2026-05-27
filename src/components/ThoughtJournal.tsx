import { useMemo, useState } from 'react';
import { useMoodData } from '@/hooks/useMoodData';
import { useThoughtAnalysis } from '@/hooks/useThoughtAnalysis';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { BookOpen, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayDetailDialog } from '@/components/DayDetailDialog';
import type { MoodEntry } from '@/types/mood';

const moodColor = (mood: string): string => {
  if (['severe_elevated', 'elevated', 'somewhat_elevated'].includes(mood)) return 'bg-orange-400';
  if (['severe_depressed', 'depressed', 'somewhat_depressed'].includes(mood)) return 'bg-blue-400';
  return 'bg-green-400';
};

function BookIllustration({ open }: { open: boolean }) {
  return (
    <div className="relative h-32 w-full flex items-center justify-center" style={{ perspective: 800 }}>
      {/* Book base / pages */}
      <div className="relative" style={{ width: 140, height: 100 }}>
        {/* Back cover */}
        <div className="absolute inset-0 rounded-r-sm rounded-l-md bg-gradient-to-br from-amber-700 to-amber-900 shadow-xl" />

        {/* Inner pages (visible when open) */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="pages"
              initial={{ opacity: 0, scaleY: 0.8 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0.8 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="absolute inset-1 flex"
            >
              <div className="flex-1 bg-[hsl(45_30%_92%)] rounded-l-sm border-r border-amber-200/40 p-1.5 space-y-1">
                <div className="h-0.5 w-3/4 bg-amber-900/30 rounded" />
                <div className="h-0.5 w-2/3 bg-amber-900/20 rounded" />
                <div className="h-0.5 w-4/5 bg-amber-900/20 rounded" />
                <div className="h-0.5 w-1/2 bg-amber-900/20 rounded" />
              </div>
              <div className="flex-1 bg-[hsl(45_30%_94%)] rounded-r-sm p-1.5 space-y-1">
                <div className="h-0.5 w-2/3 bg-amber-900/30 rounded" />
                <div className="h-0.5 w-3/4 bg-amber-900/20 rounded" />
                <div className="h-0.5 w-1/2 bg-amber-900/20 rounded" />
                <div className="h-0.5 w-4/5 bg-amber-900/20 rounded" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Front cover - flips open */}
        <motion.div
          animate={{ rotateY: open ? -155 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
          className="absolute inset-0 rounded-l-md rounded-r-sm bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg border border-amber-900/40 flex items-center justify-center"
        >
          <BookOpen className="w-8 h-8 text-amber-100/90" style={{ backfaceVisibility: 'hidden' }} />
          {/* Spine accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-950/60 rounded-l-md" />
        </motion.div>
      </div>
    </div>
  );
}

export function ThoughtJournal() {
  const { entries } = useMoodData();
  const { rows: analyses } = useThoughtAnalysis();
  const [selected, setSelected] = useState<MoodEntry | null>(null);
  const [open, setOpen] = useState(false);

  const themesByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    analyses.forEach((a) => { map[a.date] = a.themes ?? []; });
    return map;
  }, [analyses]);

  const withComments = useMemo(
    () => entries
      .filter((e) => e.comment && e.comment.trim().length > 0)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  if (withComments.length === 0) return null;

  return (
    <section className="space-y-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors p-5 flex flex-col items-start gap-3"
      >
        <BookIllustration open={open} />
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold">Din tankedagbok</h2>
          <span className="text-xs text-muted-foreground">({withComments.length})</span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {open ? 'Klicka för att stänga boken' : 'Klicka för att öppna boken'}
        </p>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="entries"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-foreground/[0.03] divide-y divide-foreground/5">
              {withComments.slice(0, 30).map((e, i) => {
                const themes = themesByDate[e.date] ?? [];
                return (
                  <motion.button
                    key={e.date}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.03, duration: 0.25 }}
                    onClick={() => setSelected(e)}
                    className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-foreground/[0.04] transition-colors"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${moodColor(e.mood)}`} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-[13px] font-medium text-foreground/70">
                          {format(parseISO(e.date), 'EEEE d MMM yyyy', { locale: sv })}
                        </span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-foreground/85 line-clamp-3">{e.comment}</p>
                      {themes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {themes.slice(0, 4).map((t) => (
                            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30 flex-shrink-0 mt-1.5" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <DayDetailDialog
          entry={selected}
          date={parseISO(selected.date)}
          open={!!selected}
          onOpenChange={(o) => { if (!o) setSelected(null); }}
        />
      )}
    </section>
  );
}

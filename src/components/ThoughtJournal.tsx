import { useMemo, useState } from 'react';
import { useMoodData } from '@/hooks/useMoodData';
import { useThoughtAnalysis } from '@/hooks/useThoughtAnalysis';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { BookOpen, ChevronRight } from 'lucide-react';
import { DayDetailDialog } from '@/components/DayDetailDialog';
import type { MoodEntry } from '@/types/mood';

const moodColor = (mood: string): string => {
  if (['severe_elevated', 'elevated', 'somewhat_elevated'].includes(mood)) return 'bg-orange-400';
  if (['severe_depressed', 'depressed', 'somewhat_depressed'].includes(mood)) return 'bg-blue-400';
  return 'bg-green-400';
};

export function ThoughtJournal() {
  const { entries } = useMoodData();
  const { rows: analyses } = useThoughtAnalysis();
  const [selected, setSelected] = useState<MoodEntry | null>(null);

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
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Din tankedagbok</h2>
        <span className="text-xs text-muted-foreground">({withComments.length})</span>
      </div>

      <div className="rounded-2xl bg-foreground/[0.03] divide-y divide-foreground/5">
        {withComments.slice(0, 30).map((e) => {
          const themes = themesByDate[e.date] ?? [];
          return (
            <button
              key={e.date}
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
            </button>
          );
        })}
      </div>

      {selected && (
        <DayDetailDialog
          entry={selected}
          open={!!selected}
          onOpenChange={(o) => { if (!o) setSelected(null); }}
        />
      )}
    </section>
  );
}

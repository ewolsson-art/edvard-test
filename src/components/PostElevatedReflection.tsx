import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { X } from 'lucide-react';
import { MoodEntry } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostElevatedReflectionProps {
  entries: MoodEntry[];
  userId: string | null;
  onSaved?: () => void;
}

const REFLECTION_TAG = 'post_elevated_reflected';
const ELEVATED_MOODS = new Set(['somewhat_elevated', 'elevated', 'severe_elevated']);

/**
 * Mjuk reflektionsprompt som visas EFTER att en uppvarvad period passerat.
 * Triggar när:
 *  - användaren haft ≥3 uppvarvade dagar senaste 14 dagarna
 *  - dagens registrering finns OCH är INTE uppvarvad (perioden har lagt sig)
 *  - användaren inte redan reflekterat över den senaste perioden
 *
 * Bygger insikt över tid utan att moralisera i stunden.
 */
export function PostElevatedReflection({ entries, userId, onSaved }: PostElevatedReflectionProps) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const trigger = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayEntry = entries.find(e => e.date === todayStr);
    // Bara visa när det finns en check-in idag som INTE är uppvarvad
    if (!todayEntry || ELEVATED_MOODS.has(todayEntry.mood)) return null;

    const window = entries.filter(e => {
      const d = parseISO(e.date);
      return differenceInDays(today, d) <= 14 && differenceInDays(today, d) >= 0;
    });

    const elevated = window.filter(e => ELEVATED_MOODS.has(e.mood));
    if (elevated.length < 3) return null;

    // Mest nyliga uppvarvade dag — perioden den tillhör
    const sorted = elevated.map(e => parseISO(e.date)).sort((a, b) => b.getTime() - a.getTime());
    const latestElev = sorted[0];
    const daysSince = differenceInDays(today, latestElev);
    if (daysSince < 1 || daysSince > 7) return null; // bara visa 1–7 dagar efteråt

    // Hoppa över om reflektion redan gjord under perioden
    const reflectedAlready = window.some(e =>
      e.tags?.includes(REFLECTION_TAG) && parseISO(e.date) >= subDays(today, 10),
    );
    if (reflectedAlready) return null;

    return {
      elevatedCount: elevated.length,
      latestElev,
    };
  }, [entries]);

  if (!trigger || dismissed || !userId) return null;

  const handleSave = async (withText: boolean) => {
    setSaving(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const existing = entries.find(e => e.date === todayStr);
    const newTags = Array.from(new Set([...(existing?.tags ?? []), REFLECTION_TAG]));

    const reflectionNote = withText && text.trim() ? text.trim() : null;
    const mergedComment = [existing?.comment, reflectionNote && `Reflektion efter uppvarvad period: ${reflectionNote}`]
      .filter(Boolean)
      .join('\n\n');

    const { error } = await supabase
      .from('mood_entries')
      .upsert({
        user_id: userId,
        date: todayStr,
        mood: existing?.mood ?? 'stable',
        tags: newTags,
        comment: mergedComment || null,
      }, { onConflict: 'user_id,date' });

    setSaving(false);
    if (error) {
      toast({ title: 'Kunde inte spara', description: error.message, variant: 'destructive' });
      return;
    }
    setDismissed(true);
    toast({ title: withText ? 'Sparat' : 'Tack' });
    onSaved?.();
  };

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-3xl bg-card/60 border border-border/50 p-5 backdrop-blur-sm"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          aria-label="Stäng"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-display text-lg font-semibold text-foreground mb-1.5 pr-8">
          Hur ser det ut nu?
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Du hade några uppvarvade dagar nyligen. När det lugnat sig kan det vara värdefullt
          att fundera över hur det känns idag — utan press, bara för dig.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Något du ångrar? Något du lärde dig? (frivilligt)"
          rows={3}
          className="w-full text-base bg-background/50 border border-border/40 rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 resize-none"
        />

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-medium text-base hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Spara reflektion
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="h-11 px-5 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Hoppa över
          </button>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

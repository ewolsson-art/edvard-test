import { parseISO, isYesterday } from 'date-fns';
import { Flame, ArrowRight } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';

interface MissedDayPromptProps {
  missedDays: string[];
  currentStreak: number;
  potentialStreak?: number;
  onPickMissedDay: (date: Date) => void;
  onCheckInToday: () => void;
}

export function MissedDayPrompt({
  missedDays,
  potentialStreak = 0,
  onPickMissedDay,
  onCheckInToday,
}: MissedDayPromptProps) {
  const count = missedDays.length;
  const onlyYesterday = count === 1 && isYesterday(parseISO(missedDays[0]));
  const primaryDay = missedDays[0];

  const headline = onlyYesterday
    ? 'Igår missad'
    : count === 1
      ? '1 dag missad'
      : `${count} dagar missade`;

  return (
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-5 pt-8 pb-6 md:pt-6 md:glass-card md:p-10 md:max-h-[calc(100vh-4rem)] md:rounded-3xl md:shadow-sm md:bg-card/60 md:backdrop-blur-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-28 h-28 mb-5 flex items-center justify-center">
          <TurtleLogo size="lg" animated={false} mood="depressed" className="scale-[2.2]" />
        </div>

        <h1 className="font-display text-2xl sm:text-[26px] font-semibold tracking-tight">
          {headline}
        </h1>

        {potentialStreak > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-primary tabular-nums">
              {potentialStreak}
            </span>
          </div>
        )}
      </div>

      <div className="max-w-sm w-full mx-auto space-y-2.5">
        <button
          onClick={() => onPickMissedDay(parseISO(primaryDay))}
          className="w-full px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-2"
        >
          Fyll i
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onCheckInToday}
          className="w-full px-6 py-3.5 rounded-full border border-border/50 bg-transparent hover:bg-muted/40 active:scale-[0.98] transition-all duration-200 text-[15px] font-medium text-muted-foreground"
        >
          Hoppa över
        </button>
      </div>
    </div>
  );
}

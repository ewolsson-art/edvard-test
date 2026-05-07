import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Pill, X } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { TurtleLogo } from '@/components/TurtleLogo';
import { getTurtleMoodForMood } from '@/lib/moodTurtle';

interface WeekCalendarProps {
  weekDays: Date[];
  weekLabel: string;
  getEntryForDate: (dateStr: string) => MoodEntry | undefined;
  getMedicationsTakenOnDate: (dateStr: string) => { name: string }[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
}

const weekDayHeaders = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

export function WeekCalendar({
  weekDays,
  weekLabel,
  getEntryForDate,
  getMedicationsTakenOnDate,
  onPrevWeek,
  onNextWeek,
  onDayClick,
  onDayDoubleClick,
}: WeekCalendarProps) {
  const { t } = useTranslation();
  const { moodLabels } = useDiagnosisConfig();
  return (
    <div className="fade-in">
      {/* Header matching month view style */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onPrevWeek}
          className="text-primary hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Föregående vecka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-lg sm:text-2xl font-semibold text-foreground/80 truncate">
          {weekLabel}
        </h2>
        <button
          onClick={onNextWeek}
          className="text-primary hover:opacity-70 transition-opacity rotate-180 flex-shrink-0"
          aria-label="Nästa vecka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDayHeaders.map((day, i) => (
          <div key={i} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entry = getEntryForDate(dateStr);
          const medicationsTaken = getMedicationsTakenOnDate(dateStr);
          const isTodayDate = isToday(day);
          const hasMeds = medicationsTaken.length > 0;
          const isPastDay = !isTodayDate && isBefore(day, startOfDay(new Date()));
          const showMissed = isPastDay && !entry;
          const mood = entry?.mood as MoodType | undefined;
          const turtleMood = getTurtleMoodForMood(mood);
          const isElevated = turtleMood === 'elevated' || turtleMood === 'somewhat_elevated' || turtleMood === 'severe_elevated';
          const isDepressed = turtleMood === 'depressed' || turtleMood === 'somewhat_depressed' || turtleMood === 'severe_depressed';
          const moodBg = isElevated
            ? 'bg-[hsl(45_85%_55%/0.22)] ring-1 ring-[hsl(45_85%_55%/0.55)]'
            : isDepressed
              ? 'bg-[hsl(0_70%_55%/0.22)] ring-1 ring-[hsl(0_70%_55%/0.55)]'
              : turtleMood === 'stable'
                ? 'bg-[hsl(142_55%_45%/0.22)] ring-1 ring-[hsl(142_55%_45%/0.55)]'
                : '';

          const tooltipText = mood
            ? `${format(day, 'd MMMM', { locale: sv })} — ${moodLabels[mood]}`
            : showMissed
              ? `${format(day, 'd MMMM', { locale: sv })} — Ej registrerad`
              : undefined;

          const dayButton = (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              onDoubleClick={() => onDayDoubleClick?.(day)}
              className={cn(
                "relative flex min-h-20 flex-col items-center justify-center rounded-md py-2 transition-all duration-150",
                "hover:scale-105 hover:z-10",
                moodBg,
                showMissed && "bg-muted-foreground/10",
                isTodayDate && "ring-1 ring-foreground/30",
              )}
            >
              {mood ? (
                <>
                  <TurtleLogo size="lg" animated={false} mood={getTurtleMoodForMood(mood)} className="h-14 w-14" />
                  <span className="absolute top-2 right-3 text-sm font-bold leading-none text-foreground drop-shadow-[0_1px_2px_hsl(var(--background))]">
                    {format(day, 'd')}
                  </span>
                </>
              ) : (
                <span className={cn(
                  "flex items-center justify-center text-base font-semibold leading-none",
                  isTodayDate && "text-foreground font-bold text-lg",
                  !isTodayDate && "text-foreground/60",
                )}>
                  {format(day, 'd')}
                </span>
              )}

              {showMissed && (
                <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground opacity-25" strokeWidth={1.5} />
              )}

              {/* Indicators */}
              <div className="flex gap-1 mt-1 h-3">
                {hasMeds && (
                  <Pill className="h-3 w-3 text-primary/60" />
                )}
              </div>
            </button>
          );

          if (tooltipText) {
            return (
              <Tooltip key={day.toISOString()} delayDuration={300}>
                <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{tooltipText}</TooltipContent>
              </Tooltip>
            );
          }

          return dayButton;
        })}
      </div>
    </div>
  );
}

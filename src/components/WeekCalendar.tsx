import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { useDateLocale } from '@/lib/dateLocale';
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
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
  hideNavigation?: boolean;
  hideWeekdayHeaders?: boolean;
}



export function WeekCalendar({
  weekDays,
  weekLabel,
  getEntryForDate,
  getMedicationsTakenOnDate,
  onPrevWeek,
  onNextWeek,
  onDayClick,
  onDayDoubleClick,
  hideNavigation,
  hideWeekdayHeaders,
}: WeekCalendarProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const weekDayHeaders = t('overview.weekDayHeaders', { returnObjects: true }) as string[];
  const { moodLabels } = useDiagnosisConfig();
  return (
    <div className="fade-in">
      {/* Header matching month view style */}
      {hideNavigation ? (
        <div className="mb-2">
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground/70">
            {weekLabel}
          </h2>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onPrevWeek}
            className="text-primary hover:opacity-70 transition-opacity flex-shrink-0"
            aria-label={t('overview.prevWeek')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-lg sm:text-2xl font-semibold text-foreground/80 truncate">
            {weekLabel}
          </h2>
          <button
            onClick={onNextWeek}
            className="text-primary hover:opacity-70 transition-opacity rotate-180 flex-shrink-0"
            aria-label={t('overview.nextWeek')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Weekday headers */}
      {!hideWeekdayHeaders && (
        <div className="grid grid-cols-7 mb-1">
          {weekDayHeaders.map((day, i) => {
            const headerIsToday = weekDays[i] && isToday(weekDays[i]);
            return (
              <div
                key={i}
                className={cn(
                  "text-center text-sm py-2 transition-colors",
                  headerIsToday
                    ? "font-bold text-[hsl(45_85%_55%)]"
                    : "font-semibold text-muted-foreground",
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
      )}


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
            ? `${format(day, 'd MMMM', { locale: dateLocale })} — ${moodLabels[mood]}`
            : showMissed
              ? `${format(day, 'd MMMM', { locale: dateLocale })} — ${t('overview.notRegistered')}`
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
                isTodayDate && !mood && "bg-[hsl(45_85%_55%/0.10)] ring-1 ring-[hsl(45_85%_55%/0.55)] shadow-[0_0_18px_-4px_hsl(45_85%_55%/0.45)]",
                isTodayDate && mood && "ring-2 ring-[hsl(45_85%_55%/0.75)] shadow-[0_0_18px_-4px_hsl(45_85%_55%/0.55)]",
              )}
            >
              {mood ? (
                <>
                  <TurtleLogo size="lg" animated={false} mood={getTurtleMoodForMood(mood)} framing="face" className="h-14 w-14 drop-shadow-[0_2px_3px_hsl(0_0%_0%/0.45)]" />
                  <span className={cn(
                    "absolute top-2 right-3 text-sm font-bold leading-none drop-shadow-[0_1px_2px_hsl(var(--background))]",
                    isTodayDate ? "text-[hsl(45_85%_55%)]" : "text-foreground",
                  )}>
                    {format(day, 'd')}
                  </span>
                </>
              ) : (
                <span className={cn(
                  "flex items-center justify-center leading-none",
                  isTodayDate
                    ? "text-[hsl(45_85%_55%)] font-bold text-lg"
                    : "text-base font-semibold text-foreground/60",
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

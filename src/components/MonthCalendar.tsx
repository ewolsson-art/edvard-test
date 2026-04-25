import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Pill, MessageCircle, X } from 'lucide-react';
import { MoodType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface MonthCalendarProps {
  currentDate: Date;
  moodData: Record<number, MoodType>;
  medicationData?: Record<number, number>;
  relativeCommentsData?: Record<number, string>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
  hideNavigation?: boolean;
}

const weekDays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

export function MonthCalendar({ 
  currentDate, 
  moodData,
  medicationData = {},
  relativeCommentsData = {},
  onPrevMonth, 
  onNextMonth,
  onDayClick,
  onDayDoubleClick,
  hideNavigation = false,
}: MonthCalendarProps) {
  const { moodLabels } = useDiagnosisConfig();
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthName = format(currentDate, 'MMMM', { locale: sv });

  // Build weeks for cleaner rendering
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Get week number
  const getWeekNumber = (date: Date) => {
  const { t } = useTranslation();
    const start = startOfYear(date);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil((diff / oneWeek) + 1);
  };

  // Mood distribution stats for this month — grouped into 3 buckets
  type MoodGroup = 'elevated' | 'stable' | 'depressed';
  const moodStats = useMemo(() => {
    const buckets: Record<MoodGroup, number> = { elevated: 0, stable: 0, depressed: 0 };
    Object.values(moodData).forEach((m) => {
      if (m === 'severe_elevated' || m === 'elevated' || m === 'somewhat_elevated') {
        buckets.elevated += 1;
      } else if (m === 'stable') {
        buckets.stable += 1;
      } else if (m === 'somewhat_depressed' || m === 'depressed' || m === 'severe_depressed') {
        buckets.depressed += 1;
      }
    });
    const total = buckets.elevated + buckets.stable + buckets.depressed;
    const order: MoodGroup[] = ['elevated', 'stable', 'depressed'];
    return order
      .filter((g) => buckets[g] > 0)
      .map((g) => ({
        group: g,
        count: buckets[g],
        percent: total > 0 ? Math.round((buckets[g] / total) * 100) : 0,
      }));
  }, [moodData]);

  const groupColorClass: Record<MoodGroup, string> = {
    elevated: 'bg-mood-elevated',
    stable: 'bg-mood-stable',
    depressed: 'bg-mood-depressed',
  };

  const groupLabel: Record<MoodGroup, string> = {
    elevated: 'uppvarvad',
    stable: moodLabels.stable.toLowerCase(),
    depressed: 'nedstämd',
  };

  return (
    <div className="fade-in">
      {/* Navigation */}
      {/* Month title with navigation */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {!hideNavigation && (
          <button
            onClick={onPrevMonth}
            className="text-primary hover:opacity-70 transition-opacity"
            aria-label="Föregående månad"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="font-display text-2xl font-semibold capitalize text-foreground/80">
          {monthName}
        </h2>
        {!hideNavigation && (
          <button
            onClick={onNextMonth}
            className="text-primary hover:opacity-70 transition-opacity rotate-180"
            aria-label="Nästa månad"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mood stats per month */}
      {moodStats.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
          {moodStats.map(({ group, percent }) => (
            <div key={group} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', groupColorClass[group])} aria-hidden="true" />
              <span className="text-[12px] text-foreground/70">
                <span className="font-semibold text-foreground/85">{percent}%</span>{' '}
                <span className="text-foreground/55">{groupLabel[group]}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7">
            {week.map(day => {
              const dayOfMonth = day.getDate();
              const mood = isSameMonth(day, currentDate) ? moodData[dayOfMonth] : undefined;
              const medCount = isSameMonth(day, currentDate) ? medicationData[dayOfMonth] : undefined;
              const hasRelativeComment = isSameMonth(day, currentDate) && relativeCommentsData[dayOfMonth];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isPastDay = isCurrentMonth && !isTodayDate && isBefore(day, startOfDay(new Date()));
              const showMissed = isPastDay && !mood;

              const tooltipText = mood
                ? `${format(day, 'd MMMM', { locale: sv })} — ${moodLabels[mood]}`
                : showMissed
                  ? `${format(day, 'd MMMM', { locale: sv })} — Ej registrerad`
                  : undefined;

              const dayButton = (
                <button
                  key={day.toISOString()}
                  onClick={() => onDayClick?.(day)}
                  onDoubleClick={() => isCurrentMonth && onDayDoubleClick?.(day)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-4 rounded-md transition-all duration-150",
                    !isCurrentMonth && "opacity-15",
                    isCurrentMonth && "hover:scale-105 hover:z-10",
                    !isTodayDate && mood === 'severe_elevated' && "bg-[hsl(var(--mood-severe-elevated)/0.35)]",
                    !isTodayDate && mood === 'elevated' && "bg-[hsl(var(--mood-elevated)/0.32)]",
                    !isTodayDate && mood === 'somewhat_elevated' && "bg-[hsl(var(--mood-somewhat-elevated)/0.28)]",
                    !isTodayDate && mood === 'stable' && "bg-[hsl(var(--mood-stable)/0.28)]",
                    !isTodayDate && mood === 'somewhat_depressed' && "bg-[hsl(var(--mood-somewhat-depressed)/0.28)]",
                    !isTodayDate && mood === 'depressed' && "bg-[hsl(var(--mood-depressed)/0.32)]",
                    !isTodayDate && mood === 'severe_depressed' && "bg-[hsl(var(--mood-severe-depressed)/0.35)]",
                    showMissed && "bg-muted-foreground/10",
                    isTodayDate && "bg-foreground/15 ring-1 ring-foreground/30",
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center text-base font-semibold leading-none",
                    isTodayDate && "text-foreground font-bold text-lg",
                    !isTodayDate && mood && "text-white",
                    !isTodayDate && !mood && isCurrentMonth && "text-foreground/60",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {dayOfMonth}
                  </span>

                  {showMissed && (
                    <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground opacity-25" strokeWidth={1.5} />
                  )}

                  {/* Indicators */}
                  <div className="flex gap-1 mt-1 h-3">
                    {medCount && medCount > 0 && (
                      <Pill className={cn("h-3 w-3", mood ? "text-white/80" : "text-primary/50")} />
                    )}
                    {hasRelativeComment && (
                      <MessageCircle className={cn("h-3 w-3", mood ? "text-white/80 fill-white/30" : "text-accent-foreground/50 fill-accent/50")} />
                    )}
                  </div>
                </button>
              );

              if (tooltipText && isCurrentMonth) {
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
        ))}
      </div>
    </div>
  );
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

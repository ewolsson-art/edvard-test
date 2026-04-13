import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Pill, MessageCircle, X } from 'lucide-react';
import { MoodType, MOOD_LABELS } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    const start = startOfYear(date);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil((diff / oneWeek) + 1);
  };

  return (
    <div className="fade-in">
      {/* Navigation */}
      {/* Month title with navigation */}
      <div className="flex items-center gap-3 mb-3">
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

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1.5">
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
                ? `${format(day, 'd MMMM', { locale: sv })} — ${MOOD_LABELS[mood]}`
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
                    "relative flex flex-col items-center justify-center py-2.5 transition-all duration-150",
                    !isCurrentMonth && "opacity-15",
                    isCurrentMonth && "hover:bg-muted/30 hover:scale-110 hover:z-10 hover:rounded-md",
                    !isTodayDate && mood === 'elevated' && "bg-mood-elevated/8",
                    !isTodayDate && mood === 'somewhat_elevated' && "bg-mood-somewhat-elevated/8",
                    !isTodayDate && mood === 'stable' && "bg-mood-stable/8",
                    !isTodayDate && mood === 'somewhat_depressed' && "bg-mood-somewhat-depressed/8",
                    !isTodayDate && mood === 'depressed' && "bg-mood-depressed/8",
                    isTodayDate && "bg-foreground/10 rounded-md",
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center text-sm font-medium leading-none",
                    isTodayDate && "text-foreground font-semibold",
                    !isTodayDate && mood === 'elevated' && "text-mood-elevated/70",
                    !isTodayDate && mood === 'somewhat_elevated' && "text-mood-somewhat-elevated/70",
                    !isTodayDate && mood === 'stable' && "text-mood-stable/70",
                    !isTodayDate && mood === 'somewhat_depressed' && "text-mood-somewhat-depressed/70",
                    !isTodayDate && mood === 'depressed' && "text-mood-depressed/70",
                    !isTodayDate && !mood && isCurrentMonth && "text-foreground/60",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {dayOfMonth}
                  </span>

                  {showMissed && (
                    <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-destructive opacity-15" strokeWidth={1.5} />
                  )}

                  {/* Indicators */}
                  <div className="flex gap-0.5 mt-0.5 h-2">
                    {medCount && medCount > 0 && (
                      <Pill className="h-2 w-2 text-primary/50" />
                    )}
                    {hasRelativeComment && (
                      <MessageCircle className="h-2 w-2 text-accent-foreground/50 fill-accent/50" />
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

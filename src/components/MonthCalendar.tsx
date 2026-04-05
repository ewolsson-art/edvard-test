import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Pill, MessageCircle, X } from 'lucide-react';
import { MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';

interface MonthCalendarProps {
  currentDate: Date;
  moodData: Record<number, MoodType>;
  medicationData?: Record<number, number>;
  relativeCommentsData?: Record<number, string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
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
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onPrevMonth}
          className="flex items-center gap-1 text-primary hover:opacity-70 transition-opacity"
          aria-label="Föregående månad"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNextMonth}
          className="text-primary hover:opacity-70 transition-opacity rotate-180"
          aria-label="Nästa månad"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Month title - Apple style large text */}
      <h2 className="font-display text-3xl font-bold capitalize mb-4">
        {monthName}
      </h2>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-0">
        {weeks.map((week, wIdx) => (
          <div key={wIdx}>
            {/* Week separator line */}
            {wIdx > 0 && (
              <div className="border-t border-border/20 my-0" />
            )}
            
            <div className="grid grid-cols-7">
              {week.map(day => {
                const dayOfMonth = day.getDate();
                const mood = isSameMonth(day, currentDate) ? moodData[dayOfMonth] : undefined;
                const medCount = isSameMonth(day, currentDate) ? medicationData[dayOfMonth] : undefined;
                const hasRelativeComment = isSameMonth(day, currentDate) && relativeCommentsData[dayOfMonth];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const isPastDay = isCurrentMonth && !isTodayDate && isBefore(day, startOfDay(new Date()));
                const showMissed = isPastDay && !mood;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDayClick?.(day)}
                    onDoubleClick={() => isCurrentMonth && onDayDoubleClick?.(day)}
                    disabled={!isCurrentMonth}
                    title={hasRelativeComment ? relativeCommentsData[dayOfMonth] : undefined}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-2 transition-colors rounded-lg",
                      !isCurrentMonth && "opacity-20",
                      isCurrentMonth && "hover:bg-muted/30",
                      !isTodayDate && mood === 'elevated' && "bg-mood-elevated/15",
                      !isTodayDate && mood === 'stable' && "bg-mood-stable/15",
                      !isTodayDate && mood === 'depressed' && "bg-mood-depressed/15",
                      isTodayDate && "bg-primary",
                    )}
                  >
                    <span className={cn(
                      "flex items-center justify-center text-lg font-medium leading-none",
                      isTodayDate && "text-primary-foreground font-bold",
                      !isTodayDate && mood === 'elevated' && "text-mood-elevated",
                      !isTodayDate && mood === 'stable' && "text-mood-stable",
                      !isTodayDate && mood === 'depressed' && "text-mood-depressed",
                      !isTodayDate && !mood && isCurrentMonth && "text-foreground",
                      !isCurrentMonth && "text-muted-foreground"
                    )}>
                      {dayOfMonth}
                    </span>

                    {showMissed && (
                      <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-destructive opacity-30" strokeWidth={2} />
                    )}

                    {/* Indicators */}
                    <div className="flex gap-0.5 mt-0.5 h-2">
                      {medCount && medCount > 0 && (
                        <Pill className="h-2 w-2 text-primary" />
                      )}
                      {hasRelativeComment && (
                        <MessageCircle className="h-2 w-2 text-accent-foreground fill-accent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

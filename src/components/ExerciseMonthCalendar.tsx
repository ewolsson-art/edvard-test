import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseMonthCalendarProps {
  currentDate: Date;
  exerciseData: Record<number, boolean>; // day -> exercised (true/false)
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick?: (date: Date) => void;
}

const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export function ExerciseMonthCalendar({ 
  currentDate, 
  exerciseData,
  onPrevMonth, 
  onNextMonth,
  onDayClick 
}: ExerciseMonthCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthYear = format(currentDate, 'MMMM yyyy', { locale: sv });

  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Föregående månad"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="font-display text-xl font-semibold capitalize">
          {monthYear}
        </h3>
        
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Nästa månad"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayOfMonth = day.getDate();
          const exercised = isSameMonth(day, currentDate) ? exerciseData[dayOfMonth] : undefined;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const hasData = exercised !== undefined;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              disabled={!isCurrentMonth}
              className={cn(
                "calendar-day relative flex items-center justify-center",
                !isCurrentMonth && "opacity-30 cursor-not-allowed",
                isCurrentMonth && !hasData && "calendar-day-empty cursor-pointer",
                exercised === true && "calendar-day-stable",
                exercised === false && "calendar-day-depressed",
                isTodayDate && "calendar-day-today"
              )}
            >
              <span className="text-xs">{dayOfMonth}</span>
              {hasData && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                  {exercised ? (
                    <Check className="h-2.5 w-2.5 text-mood-stable" />
                  ) : (
                    <X className="h-2.5 w-2.5 text-mood-depressed" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

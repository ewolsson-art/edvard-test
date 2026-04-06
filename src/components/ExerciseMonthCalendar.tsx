import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseType, EXERCISE_TYPE_LABELS, EXERCISE_TYPE_EMOJIS } from '@/types/mood';
import { CalendarHeader } from './CalendarHeader';

interface ExerciseMonthCalendarProps {
  currentDate: Date;
  exerciseData: Record<number, { exercised: boolean; types?: ExerciseType[] }>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onDayClick?: (date: Date) => void;
  hideNavigation?: boolean;
}

const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export function ExerciseMonthCalendar({ 
  currentDate, 
  exerciseData,
  onPrevMonth, 
  onNextMonth,
  onDayClick,
  hideNavigation = false,
}: ExerciseMonthCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthYear = format(currentDate, 'MMMM yyyy', { locale: sv });

  return (
    <div className="glass-card p-6 fade-in">
      {!hideNavigation && (
        <CalendarHeader
          title={monthYear}
          onPrev={onPrevMonth!}
          onNext={onNextMonth!}
        />
      )}
      {hideNavigation && (
        <h3 className="font-display text-xl font-semibold capitalize mb-4">{monthYear}</h3>
      )}

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
          const dayData = isSameMonth(day, currentDate) ? exerciseData[dayOfMonth] : undefined;
          const exercised = dayData?.exercised;
          const types = dayData?.types;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const hasData = dayData !== undefined;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              disabled={!isCurrentMonth}
              title={types && types.length > 0 ? types.map(t => EXERCISE_TYPE_LABELS[t]).join(', ') : undefined}
              className={cn(
                "calendar-day relative flex flex-col items-center justify-center min-h-[44px]",
                !isCurrentMonth && "opacity-30 cursor-not-allowed",
                isCurrentMonth && !hasData && "calendar-day-empty cursor-pointer",
                exercised === true && "calendar-day-stable cursor-pointer",
                exercised === false && "calendar-day-depressed",
                isTodayDate && "calendar-day-today"
              )}
            >
              <span className="text-xs">{dayOfMonth}</span>
              {hasData && exercised && types && types.length > 0 ? (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {types.slice(0, 3).map((type, idx) => (
                    <span key={idx} className="text-[10px] leading-none" title={EXERCISE_TYPE_LABELS[type]}>
                      {EXERCISE_TYPE_EMOJIS[type]}
                    </span>
                  ))}
                  {types.length > 3 && (
                    <span className="text-[8px] font-medium text-primary">+{types.length - 3}</span>
                  )}
                </div>
              ) : hasData ? (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                  {exercised ? (
                    <Check className="h-2.5 w-2.5 text-mood-stable" />
                  ) : (
                    <X className="h-2.5 w-2.5 text-mood-depressed" />
                  )}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Moon, MoonStar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarHeader } from './CalendarHeader';
import { QualityType } from '@/types/mood';

interface SleepMonthCalendarProps {
  currentDate: Date;
  sleepData: Record<number, QualityType>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onDayClick?: (date: Date) => void;
  hideNavigation?: boolean;
}

const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export function SleepMonthCalendar({ 
  currentDate, 
  sleepData,
  onPrevMonth, 
  onNextMonth,
  onDayClick,
  hideNavigation = false,
}: SleepMonthCalendarProps) {
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
          const quality = isSameMonth(day, currentDate) ? sleepData[dayOfMonth] : undefined;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const hasData = quality !== undefined;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              disabled={!isCurrentMonth}
              className={cn(
                "calendar-day relative flex flex-col items-center justify-center",
                !isCurrentMonth && "opacity-30 cursor-not-allowed",
                isCurrentMonth && !hasData && "calendar-day-empty cursor-pointer",
                quality === 'good' && "calendar-day-stable cursor-pointer",
                quality === 'bad' && "calendar-day-depressed cursor-pointer",
                isTodayDate && "calendar-day-today"
              )}
            >
              <span className="text-xs">{dayOfMonth}</span>
              {hasData && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                  {quality === 'good' ? (
                    <MoonStar className="h-2.5 w-2.5 text-mood-stable" />
                  ) : (
                    <Moon className="h-2.5 w-2.5 text-mood-depressed" />
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

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Pill, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarHeader } from './CalendarHeader';

interface MedicationMonthCalendarProps {
  currentDate: Date;
  medicationData: Record<number, { taken: number; total: number }>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick?: (date: Date) => void;
}

const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export function MedicationMonthCalendar({ 
  currentDate, 
  medicationData,
  onPrevMonth, 
  onNextMonth,
  onDayClick 
}: MedicationMonthCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthYear = format(currentDate, 'MMMM yyyy', { locale: sv });

  return (
    <div className="glass-card p-6 fade-in">
      <CalendarHeader
        title={monthYear}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
      />

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
          const medData = isSameMonth(day, currentDate) ? medicationData[dayOfMonth] : undefined;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const hasData = medData !== undefined;
          const allTaken = medData && medData.taken >= medData.total;
          const partiallyTaken = medData && medData.taken > 0 && medData.taken < medData.total;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              disabled={!isCurrentMonth}
              title={medData ? `${medData.taken} av ${medData.total} tagna` : undefined}
              className={cn(
                "calendar-day relative flex flex-col items-center justify-center",
                !isCurrentMonth && "opacity-30 cursor-not-allowed",
                isCurrentMonth && !hasData && "calendar-day-empty cursor-pointer",
                allTaken && "calendar-day-stable cursor-pointer",
                partiallyTaken && "calendar-day-elevated cursor-pointer",
                hasData && !allTaken && !partiallyTaken && "calendar-day-depressed cursor-pointer",
                isTodayDate && "calendar-day-today"
              )}
            >
              <span className="text-xs">{dayOfMonth}</span>
              {hasData && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                  {allTaken ? (
                    <Check className="h-2.5 w-2.5 text-mood-stable" />
                  ) : partiallyTaken ? (
                    <Pill className="h-2.5 w-2.5 text-mood-elevated" />
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

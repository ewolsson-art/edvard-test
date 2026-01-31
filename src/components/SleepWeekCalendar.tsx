import { format, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Moon, MoonStar } from 'lucide-react';
import { QualityType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { CalendarHeader } from './CalendarHeader';

interface SleepWeekCalendarProps {
  weekDays: Date[];
  weekLabel: string;
  getSleepForDate: (dateStr: string) => QualityType | undefined;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onDayClick?: (date: Date) => void;
}

export function SleepWeekCalendar({
  weekDays,
  weekLabel,
  getSleepForDate,
  onPrevWeek,
  onNextWeek,
  onDayClick,
}: SleepWeekCalendarProps) {
  return (
    <div className="glass-card p-6 fade-in">
      <CalendarHeader
        title={weekLabel}
        onPrev={onPrevWeek}
        onNext={onNextWeek}
      />

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {format(day, 'EEE', { locale: sv })}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const quality = getSleepForDate(dateStr);
          const isTodayDate = isToday(day);
          const hasData = quality !== undefined;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={cn(
                "calendar-day relative flex flex-col items-center justify-center cursor-pointer",
                !hasData && "calendar-day-empty",
                quality === 'good' && "calendar-day-stable",
                quality === 'bad' && "calendar-day-depressed",
                isTodayDate && "calendar-day-today"
              )}
            >
              <span className="text-xs">{format(day, 'd')}</span>
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

      {/* Day details section */}
      <div className="mt-6 space-y-3">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const quality = getSleepForDate(dateStr);
          const isTodayDate = isToday(day);

          if (!quality) return null;

          return (
            <div
              key={`detail-${dateStr}`}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                isTodayDate && "ring-2 ring-primary/30",
                quality === 'good' && "bg-mood-stable/10 border-mood-stable/30",
                quality === 'bad' && "bg-mood-depressed/10 border-mood-depressed/30"
              )}
            >
              <span className="text-2xl">
                {quality === 'good' ? '😴' : '😵'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-primary"
                  )}>
                    {format(day, 'EEEE d MMMM', { locale: sv })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {quality === 'good' ? 'Sov bra' : 'Sov dåligt'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

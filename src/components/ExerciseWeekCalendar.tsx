import { format, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Check, X } from 'lucide-react';
import { ExerciseType, EXERCISE_TYPE_LABELS, EXERCISE_TYPE_EMOJIS } from '@/types/mood';
import { cn } from '@/lib/utils';
import { CalendarHeader } from './CalendarHeader';
import { useTranslation } from 'react-i18next';

interface ExerciseWeekCalendarProps {
  weekDays: Date[];
  weekLabel: string;
  getExerciseForDate: (dateStr: string) => { exercised: boolean; types?: ExerciseType[] } | undefined;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onDayClick?: (date: Date) => void;
}

export function ExerciseWeekCalendar({
  weekDays,
  weekLabel,
  getExerciseForDate,
  onPrevWeek,
  onNextWeek,
  onDayClick,
}: ExerciseWeekCalendarProps) {
  const { t } = useTranslation();
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
          const data = getExerciseForDate(dateStr);
          const isTodayDate = isToday(day);
          const hasData = data !== undefined;
          const exercised = data?.exercised;
          const types = data?.types;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              title={types && types.length > 0 ? types.map(t => EXERCISE_TYPE_LABELS[t]).join(', ') : undefined}
              className={cn(
                "calendar-day relative flex flex-col items-center justify-center min-h-[44px] cursor-pointer",
                !hasData && "calendar-day-empty",
                exercised === true && "calendar-day-stable",
                exercised === false && "calendar-day-depressed",
                isTodayDate && "calendar-day-today"
              )}
            >
              <span className="text-xs">{format(day, 'd')}</span>
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

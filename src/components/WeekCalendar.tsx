import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Pill, X } from 'lucide-react';
import { MoodEntry, MOOD_ICONS } from '@/types/mood';
import { cn } from '@/lib/utils';

interface WeekCalendarProps {
  weekDays: Date[];
  weekLabel: string;
  getEntryForDate: (dateStr: string) => MoodEntry | undefined;
  getMedicationsTakenOnDate: (dateStr: string) => { name: string }[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
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
}: WeekCalendarProps) {
  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevWeek}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Föregående vecka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl font-semibold">
          {weekLabel}
        </h3>

        <button
          onClick={onNextWeek}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Nästa vecka"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

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
          const entry = getEntryForDate(dateStr);
          const medicationsTaken = getMedicationsTakenOnDate(dateStr);
          const isTodayDate = isToday(day);
          const hasMeds = medicationsTaken.length > 0;
          const isPastDay = !isTodayDate && isBefore(day, startOfDay(new Date()));
          const showMissed = isPastDay && !entry;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              onDoubleClick={() => onDayDoubleClick?.(day)}
              className={cn(
                "calendar-day relative cursor-pointer",
                !entry && "calendar-day-empty",
                entry?.mood === 'elevated' && "calendar-day-elevated",
                entry?.mood === 'stable' && "calendar-day-stable",
                entry?.mood === 'depressed' && "calendar-day-depressed",
                isTodayDate && "calendar-day-today"
              )}
            >
              {format(day, 'd')}
              {showMissed && (
                <X className="absolute inset-0 m-auto h-full w-full p-1.5 text-destructive opacity-40" strokeWidth={2.5} />
              )}
              {hasMeds && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                  <Pill className="h-2.5 w-2.5 text-primary" />
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
          const entry = getEntryForDate(dateStr);
          const isTodayDate = isToday(day);

          if (!entry) return null;

          return (
            <div
              key={`detail-${dateStr}`}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                isTodayDate && "ring-2 ring-primary/30",
                entry.mood === 'elevated' && "bg-mood-elevated/10 border-mood-elevated/30",
                entry.mood === 'stable' && "bg-mood-stable/10 border-mood-stable/30",
                entry.mood === 'depressed' && "bg-mood-depressed/10 border-mood-depressed/30"
              )}
            >
              <span className="text-2xl">{MOOD_ICONS[entry.mood]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-primary"
                  )}>
                    {format(day, 'EEEE d MMMM', { locale: sv })}
                  </span>
                </div>
                {entry.comment && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {entry.comment}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

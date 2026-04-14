import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Pill, X } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

const weekDayHeaders = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

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
  const { moodLabels } = useDiagnosisConfig();
  return (
    <div className="fade-in">
      {/* Header matching month view style */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onPrevWeek}
          className="text-primary hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Föregående vecka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-lg sm:text-2xl font-semibold text-foreground/80 truncate">
          {weekLabel}
        </h2>
        <button
          onClick={onNextWeek}
          className="text-primary hover:opacity-70 transition-opacity rotate-180 flex-shrink-0"
          aria-label="Nästa vecka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDayHeaders.map((day, i) => (
          <div key={i} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entry = getEntryForDate(dateStr);
          const medicationsTaken = getMedicationsTakenOnDate(dateStr);
          const isTodayDate = isToday(day);
          const hasMeds = medicationsTaken.length > 0;
          const isPastDay = !isTodayDate && isBefore(day, startOfDay(new Date()));
          const showMissed = isPastDay && !entry;
          const mood = entry?.mood as MoodType | undefined;

          const tooltipText = mood
            ? `${format(day, 'd MMMM', { locale: sv })} — ${moodLabels[mood]}`
            : showMissed
              ? `${format(day, 'd MMMM', { locale: sv })} — Ej registrerad`
              : undefined;

          const dayButton = (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              onDoubleClick={() => onDayDoubleClick?.(day)}
              className={cn(
                "relative flex flex-col items-center justify-center py-4 transition-all duration-150",
                "hover:bg-muted/30 hover:scale-110 hover:z-10 hover:rounded-md",
                !isTodayDate && mood === 'severe_elevated' && "bg-[hsl(var(--mood-severe-elevated)/0.08)]",
                !isTodayDate && mood === 'elevated' && "bg-mood-elevated/8",
                !isTodayDate && mood === 'somewhat_elevated' && "bg-mood-somewhat-elevated/8",
                !isTodayDate && mood === 'stable' && "bg-mood-stable/8",
                !isTodayDate && mood === 'somewhat_depressed' && "bg-mood-somewhat-depressed/8",
                !isTodayDate && mood === 'depressed' && "bg-mood-depressed/8",
                !isTodayDate && mood === 'severe_depressed' && "bg-[hsl(var(--mood-severe-depressed)/0.08)]",
                showMissed && "bg-muted-foreground/10",
                isTodayDate && "bg-foreground/10 rounded-md",
              )}
            >
              <span className={cn(
                "flex items-center justify-center text-base font-medium leading-none",
                isTodayDate && "text-foreground font-bold text-lg",
                !isTodayDate && mood === 'severe_elevated' && "text-[hsl(var(--mood-severe-elevated))]",
                !isTodayDate && mood === 'elevated' && "text-mood-elevated",
                !isTodayDate && mood === 'somewhat_elevated' && "text-mood-somewhat-elevated",
                !isTodayDate && mood === 'stable' && "text-mood-stable",
                !isTodayDate && mood === 'somewhat_depressed' && "text-mood-somewhat-depressed",
                !isTodayDate && mood === 'depressed' && "text-mood-depressed",
                !isTodayDate && mood === 'severe_depressed' && "text-[hsl(var(--mood-severe-depressed))]",
                !isTodayDate && !mood && "text-foreground/60",
              )}>
                {format(day, 'd')}
              </span>

              {showMissed && (
                <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground opacity-25" strokeWidth={1.5} />
              )}

              {/* Indicators */}
              <div className="flex gap-1 mt-1 h-3">
                {hasMeds && (
                  <Pill className="h-3 w-3 text-primary/50" />
                )}
              </div>
            </button>
          );

          if (tooltipText) {
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
    </div>
  );
}

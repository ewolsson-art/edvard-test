import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Pill, X } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
                "relative flex flex-col items-center justify-center py-4 rounded-md transition-all duration-150",
                "hover:scale-105 hover:z-10",
                !isTodayDate && mood === 'severe_elevated' && "bg-[hsl(45_95%_55%/0.6)]",
                !isTodayDate && (mood === 'elevated' || mood === 'somewhat_elevated') && "bg-[hsl(45_95%_55%/0.3)]",
                !isTodayDate && mood === 'stable' && "bg-[hsl(142_70%_45%/0.3)]",
                !isTodayDate && (mood === 'depressed' || mood === 'somewhat_depressed') && "bg-[hsl(0_75%_55%/0.3)]",
                !isTodayDate && mood === 'severe_depressed' && "bg-[hsl(0_75%_55%/0.6)]",
                showMissed && "bg-muted-foreground/10",
                isTodayDate && "bg-foreground/15 ring-1 ring-foreground/30",
              )}
            >
              <span className={cn(
                "flex items-center justify-center text-base font-semibold leading-none",
                isTodayDate && "text-foreground font-bold text-lg",
                !isTodayDate && mood && "text-white",
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
                  <Pill className={cn("h-3 w-3", mood ? "text-white/80" : "text-primary/50")} />
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

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Pill, MessageCircle, X } from 'lucide-react';
import { MoodType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';

interface MonthCalendarProps {
  currentDate: Date;
  moodData: Record<number, MoodType>;
  medicationData?: Record<number, number>;
  relativeCommentsData?: Record<number, string>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
  hideNavigation?: boolean;
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
  hideNavigation = false,
}: MonthCalendarProps) {
  const { moodLabels } = useDiagnosisConfig();
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
  const { t } = useTranslation();
    const start = startOfYear(date);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil((diff / oneWeek) + 1);
  };

  // Mood distribution stats for this month — grouped into 3 buckets
  type MoodGroup = 'elevated' | 'stable' | 'depressed';
  const groupMembers: Record<MoodGroup, MoodType[]> = {
    elevated: ['severe_elevated', 'elevated', 'somewhat_elevated'],
    stable: ['stable'],
    depressed: ['somewhat_depressed', 'depressed', 'severe_depressed'],
  };

  const { moodStats, perMoodCounts } = useMemo(() => {
    const counts: Partial<Record<MoodType, number>> = {};
    Object.values(moodData).forEach((m) => {
      counts[m] = (counts[m] ?? 0) + 1;
    });
    const buckets: Record<MoodGroup, number> = { elevated: 0, stable: 0, depressed: 0 };
    (Object.keys(groupMembers) as MoodGroup[]).forEach((g) => {
      buckets[g] = groupMembers[g].reduce((sum, m) => sum + (counts[m] ?? 0), 0);
    });
    const total = buckets.elevated + buckets.stable + buckets.depressed;
    const order: MoodGroup[] = ['elevated', 'stable', 'depressed'];
    const stats = order
      .filter((g) => buckets[g] > 0)
      .map((g) => ({
        group: g,
        count: buckets[g],
        percent: total > 0 ? Math.round((buckets[g] / total) * 100) : 0,
      }));
    return { moodStats: stats, perMoodCounts: counts };
  }, [moodData]);

  const groupColorClass: Record<MoodGroup, string> = {
    elevated: 'bg-mood-elevated',
    stable: 'bg-mood-stable',
    depressed: 'bg-mood-depressed',
  };

  const moodDotClass: Record<MoodType, string> = {
    severe_elevated: 'bg-[hsl(var(--mood-severe-elevated))]',
    elevated: 'bg-mood-elevated',
    somewhat_elevated: 'bg-mood-somewhat-elevated',
    stable: 'bg-mood-stable',
    somewhat_depressed: 'bg-mood-somewhat-depressed',
    depressed: 'bg-mood-depressed',
    severe_depressed: 'bg-[hsl(var(--mood-severe-depressed))]',
  };

  const groupLabel: Record<MoodGroup, string> = {
    elevated: 'uppvarvad',
    stable: moodLabels.stable.toLowerCase(),
    depressed: 'nedstämd',
  };

  return (
    <div className="fade-in">
      {/* Navigation */}
      {/* Month title with navigation */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {!hideNavigation && (
          <button
            onClick={onPrevMonth}
            className="text-primary hover:opacity-70 transition-opacity"
            aria-label="Föregående månad"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="font-display text-2xl font-semibold capitalize text-foreground/80">
          {monthName}
        </h2>
        {!hideNavigation && (
          <button
            onClick={onNextMonth}
            className="text-primary hover:opacity-70 transition-opacity rotate-180"
            aria-label="Nästa månad"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mood stats per month */}
      {moodStats.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
          {moodStats.map(({ group, count, percent }) => {
            const breakdown = groupMembers[group]
              .map((m) => ({ mood: m, count: perMoodCounts[m] ?? 0 }))
              .filter((b) => b.count > 0);
            const isGroup = group !== 'stable';
            const total = count;

            const trigger = (
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors',
                  isGroup && 'hover:bg-muted/40 cursor-pointer',
                  !isGroup && 'cursor-default',
                )}
                aria-label={`${percent}% ${groupLabel[group]}${isGroup ? ' — visa fördelning' : ''}`}
              >
                <span className={cn('h-2 w-2 rounded-full', groupColorClass[group])} aria-hidden="true" />
                <span className="text-[12px] text-foreground/70">
                  <span className="font-semibold text-foreground/85">{percent}%</span>{' '}
                  <span className="text-foreground/55">{groupLabel[group]}</span>
                </span>
              </button>
            );

            if (!isGroup || breakdown.length <= 1) {
              return <div key={group}>{trigger}</div>;
            }

            return (
              <Popover key={group}>
                <PopoverTrigger asChild>{trigger}</PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-56 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 capitalize">
                    {groupLabel[group]} — fördelning
                  </div>
                  <div className="space-y-1.5">
                    {breakdown.map(({ mood, count: c }) => {
                      const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                      return (
                        <div key={mood} className="flex items-center justify-between gap-3 text-[13px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn('h-2 w-2 rounded-full shrink-0', moodDotClass[mood])} aria-hidden="true" />
                            <span className="truncate text-foreground/80">{moodLabels[mood]}</span>
                          </div>
                          <span className="text-foreground/60 tabular-nums shrink-0">
                            {c} <span className="text-foreground/40">({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7">
            {week.map(day => {
              const dayOfMonth = day.getDate();
              const mood = isSameMonth(day, currentDate) ? moodData[dayOfMonth] : undefined;
              const medCount = isSameMonth(day, currentDate) ? medicationData[dayOfMonth] : undefined;
              const hasRelativeComment = isSameMonth(day, currentDate) && relativeCommentsData[dayOfMonth];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isPastDay = isCurrentMonth && !isTodayDate && isBefore(day, startOfDay(new Date()));
              const showMissed = isPastDay && !mood;

              const tooltipText = mood
                ? `${format(day, 'd MMMM', { locale: sv })} — ${moodLabels[mood]}`
                : showMissed
                  ? `${format(day, 'd MMMM', { locale: sv })} — Ej registrerad`
                  : undefined;

              const dayButton = (
                <button
                  key={day.toISOString()}
                  onClick={() => onDayClick?.(day)}
                  onDoubleClick={() => isCurrentMonth && onDayDoubleClick?.(day)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-4 rounded-md transition-all duration-150",
                    !isCurrentMonth && "opacity-15",
                    isCurrentMonth && "hover:scale-105 hover:z-10",
                    // Yellow = elevated (severe stronger)
                    !isTodayDate && mood === 'severe_elevated' && "bg-[hsl(45_95%_55%/0.6)]",
                    !isTodayDate && (mood === 'elevated' || mood === 'somewhat_elevated') && "bg-[hsl(45_95%_55%/0.3)]",
                    // Green = stable
                    !isTodayDate && mood === 'stable' && "bg-[hsl(142_70%_45%/0.3)]",
                    // Red = depressed (severe stronger)
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
                    !isTodayDate && !mood && isCurrentMonth && "text-foreground/60",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {dayOfMonth}
                  </span>

                  {showMissed && (
                    <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground opacity-25" strokeWidth={1.5} />
                  )}

                  {/* Indicators */}
                  <div className="flex gap-1 mt-1 h-3">
                    {medCount && medCount > 0 && (
                      <Pill className={cn("h-3 w-3", mood ? "text-white/80" : "text-primary/50")} />
                    )}
                    {hasRelativeComment && (
                      <MessageCircle className={cn("h-3 w-3", mood ? "text-white/80 fill-white/30" : "text-accent-foreground/50 fill-accent/50")} />
                    )}
                  </div>
                </button>
              );

              if (tooltipText && isCurrentMonth) {
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
        ))}
      </div>
    </div>
  );
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

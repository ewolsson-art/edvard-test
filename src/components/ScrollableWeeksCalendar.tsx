import { useMemo, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  startOfYear,
  endOfYear,
  isSameWeek,
  format,
  getISOWeek,
  isToday,
} from 'date-fns';
import { WeekCalendar } from './WeekCalendar';
import { useDateLocale } from '@/lib/dateLocale';
import { useTranslation } from 'react-i18next';
import { MoodEntry } from '@/types/mood';
import { cn } from '@/lib/utils';

interface ScrollableWeeksCalendarProps {
  year: number;
  getEntryForDate: (dateStr: string) => MoodEntry | undefined;
  getMedicationsTakenOnDate: (dateStr: string) => { name: string }[];
  onDayClick?: (date: Date) => void;
}

export interface ScrollableWeeksCalendarRef {
  scrollToToday: () => void;
}

export const ScrollableWeeksCalendar = forwardRef<
  ScrollableWeeksCalendarRef,
  ScrollableWeeksCalendarProps
>(({ year, getEntryForDate, getMedicationsTakenOnDate, onDayClick }, ref) => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const weekDayHeaders = t('overview.weekDayHeaders', { returnObjects: true }) as string[];

  const weeks = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const firstWeekStart = startOfWeek(yearStart, { weekStartsOn: 1 });
    const result: Date[] = [];
    let cursor = firstWeekStart;
    while (cursor <= yearEnd) {
      result.push(cursor);
      cursor = addWeeks(cursor, 1);
    }
    return result;
  }, [year]);

  const today = new Date();
  const weekRefs = useRef<Array<HTMLDivElement | null>>([]);
  const currentWeekIndex = useMemo(
    () => weeks.findIndex((w) => isSameWeek(w, today, { weekStartsOn: 1 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weeks],
  );

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = weekRefs.current[idx];
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: 'start', behavior });
      });
    }
  }, []);

  const scrollToToday = useCallback(() => {
    if (currentWeekIndex >= 0) scrollToIndex(currentWeekIndex, 'smooth');
  }, [currentWeekIndex, scrollToIndex]);

  useImperativeHandle(ref, () => ({ scrollToToday }), [scrollToToday]);

  useEffect(() => {
    if (currentWeekIndex >= 0) scrollToIndex(currentWeekIndex, 'auto');
  }, [currentWeekIndex, scrollToIndex]);

  return (
    <div className="space-y-6">
      {/* Sticky weekday headers so the user always sees mån–sön */}
      <div className="sticky top-[148px] sm:top-[156px] md:top-[112px] z-10 bg-background grid grid-cols-7 -mx-1 px-1 pb-1">
        {weekDayHeaders.map((day, i) => {
          const headerIsToday = i === ((today.getDay() + 6) % 7);
          return (
            <div
              key={i}
              className={cn(
                'text-center text-sm py-2',
                headerIsToday ? 'font-bold text-[hsl(45_85%_55%)]' : 'font-semibold text-muted-foreground',
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {weeks.map((weekStart, i) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const weekNum = getISOWeek(weekStart);
        const sameMonth = format(weekStart, 'LLLL', { locale: dateLocale }) === format(weekEnd, 'LLLL', { locale: dateLocale });
        const label = sameMonth
          ? `v.${weekNum} · ${format(weekStart, 'd', { locale: dateLocale })}–${format(weekEnd, 'd MMM', { locale: dateLocale })}`
          : `v.${weekNum} · ${format(weekStart, 'd MMM', { locale: dateLocale })}–${format(weekEnd, 'd MMM', { locale: dateLocale })}`;

        return (
          <div
            key={i}
            ref={(el) => { weekRefs.current[i] = el; }}
            className="scroll-mt-[220px] sm:scroll-mt-[230px] md:scroll-mt-[180px]"
          >
            <WeekCalendar
              weekDays={weekDays}
              weekLabel={label}
              getEntryForDate={getEntryForDate}
              getMedicationsTakenOnDate={getMedicationsTakenOnDate}
              onDayClick={onDayClick}
              hideNavigation
              hideWeekdayHeaders
            />
          </div>
        );
      })}
    </div>
  );
});

ScrollableWeeksCalendar.displayName = 'ScrollableWeeksCalendar';

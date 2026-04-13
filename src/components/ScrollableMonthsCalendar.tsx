import { useMemo, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { MonthCalendar } from './MonthCalendar';
import { SleepMonthCalendar } from './SleepMonthCalendar';
import { EatingMonthCalendar } from './EatingMonthCalendar';
import { ExerciseMonthCalendar } from './ExerciseMonthCalendar';
import { MoodType, MoodEntry, ExerciseType, QualityType } from '@/types/mood';

interface ScrollableMonthsCalendarProps {
  year: number;
  type: 'mood' | 'sleep' | 'eating' | 'exercise';
  getEntryForDate: (dateStr: string) => MoodEntry | undefined;
  getMedicationsTakenOnDate?: (dateStr: string) => unknown[];
  getEntriesForMonth?: (year: number, month: number) => Record<number, MoodType>;
  onDayClick?: (date: Date) => void;
}

export interface ScrollableMonthsCalendarRef {
  scrollToToday: () => void;
}

export const ScrollableMonthsCalendar = forwardRef<ScrollableMonthsCalendarRef, ScrollableMonthsCalendarProps>(({
  year,
  type,
  getEntryForDate,
  getMedicationsTakenOnDate,
  getEntriesForMonth,
  onDayClick,
}, ref) => {
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const scrollToCurrentMonth = useCallback(() => {
    if (year === currentYear && currentMonthRef.current) {
      requestAnimationFrame(() => {
        currentMonthRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  }, [year, currentYear]);

  useImperativeHandle(ref, () => ({
    scrollToToday: scrollToCurrentMonth,
  }), [scrollToCurrentMonth]);

  // Scroll on mount
  useEffect(() => {
    if (year === currentYear && currentMonthRef.current) {
      requestAnimationFrame(() => {
        currentMonthRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
    }
  }, [year, currentYear]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(year, i, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const days = eachDayOfInterval({ start, end });

      if (type === 'mood' && getEntriesForMonth) {
        const moodData = getEntriesForMonth(year, i);
        const medicationData: Record<number, number> = {};
        if (getMedicationsTakenOnDate) {
          days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const meds = getMedicationsTakenOnDate(dateStr);
            if (meds.length > 0) medicationData[day.getDate()] = meds.length;
          });
        }
        return { monthDate, moodData, medicationData };
      }

      if (type === 'sleep') {
        const sleepData: Record<number, QualityType> = {};
        days.forEach(day => {
          const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
          if (entry?.sleepQuality) sleepData[day.getDate()] = entry.sleepQuality;
        });
        return { monthDate, sleepData };
      }

      if (type === 'eating') {
        const eatingData: Record<number, QualityType> = {};
        days.forEach(day => {
          const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
          if (entry?.eatingQuality) eatingData[day.getDate()] = entry.eatingQuality;
        });
        return { monthDate, eatingData };
      }

      // exercise
      const exerciseData: Record<number, { exercised: boolean; types?: ExerciseType[] }> = {};
      days.forEach(day => {
        const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
        if (entry?.exercised !== undefined) {
          exerciseData[day.getDate()] = { exercised: entry.exercised, types: entry.exerciseTypes };
        }
      });
      return { monthDate, exerciseData };
    });
  }, [year, type, getEntryForDate, getMedicationsTakenOnDate, getEntriesForMonth]);

  return (
    <div className="space-y-10">
      {months.map((data, i) => {
        const isCurrentMonth = year === currentYear && i === currentMonth;
        return (
          <div key={i} ref={isCurrentMonth ? currentMonthRef : undefined}>
            {type === 'mood' && 'moodData' in data && (
              <MonthCalendar
                currentDate={data.monthDate}
                moodData={data.moodData}
                medicationData={'medicationData' in data ? data.medicationData : {}}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
            {type === 'sleep' && 'sleepData' in data && (
              <SleepMonthCalendar
                currentDate={data.monthDate}
                sleepData={data.sleepData}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
            {type === 'eating' && 'eatingData' in data && (
              <EatingMonthCalendar
                currentDate={data.monthDate}
                eatingData={data.eatingData}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
            {type === 'exercise' && 'exerciseData' in data && (
              <ExerciseMonthCalendar
                currentDate={data.monthDate}
                exerciseData={data.exerciseData}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

ScrollableMonthsCalendar.displayName = 'ScrollableMonthsCalendar';

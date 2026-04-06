import { useMemo, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { MonthCalendar } from './MonthCalendar';
import { SleepMonthCalendar } from './SleepMonthCalendar';
import { EatingMonthCalendar } from './EatingMonthCalendar';
import { ExerciseMonthCalendar } from './ExerciseMonthCalendar';
import { MoodType, ExerciseType, QualityType } from '@/types/mood';

interface ScrollableMonthsCalendarProps {
  year: number;
  type: 'mood' | 'sleep' | 'eating' | 'exercise';
  getEntryForDate: (dateStr: string) => any;
  getMedicationsTakenOnDate?: (dateStr: string) => any[];
  getEntriesForMonth?: (year: number, month: number) => Record<number, MoodType>;
  onDayClick?: (date: Date) => void;
}

export function ScrollableMonthsCalendar({
  year,
  type,
  getEntryForDate,
  getMedicationsTakenOnDate,
  getEntriesForMonth,
  onDayClick,
}: ScrollableMonthsCalendarProps) {
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (year === currentYear && currentMonthRef.current) {
      currentMonthRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
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
    <div className="space-y-8">
      {months.map((data, i) => {
        const isCurrentMonth = year === currentYear && i === currentMonth;
        return (
          <div key={i} ref={isCurrentMonth ? currentMonthRef : undefined}>
            {type === 'mood' && (
              <MonthCalendar
                currentDate={data.monthDate}
                moodData={(data as any).moodData || {}}
                medicationData={(data as any).medicationData || {}}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
            {type === 'sleep' && (
              <SleepMonthCalendar
                currentDate={data.monthDate}
                sleepData={(data as any).sleepData || {}}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
            {type === 'eating' && (
              <EatingMonthCalendar
                currentDate={data.monthDate}
                eatingData={(data as any).eatingData || {}}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
            {type === 'exercise' && (
              <ExerciseMonthCalendar
                currentDate={data.monthDate}
                exerciseData={(data as any).exerciseData || {}}
                hideNavigation
                onDayClick={onDayClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

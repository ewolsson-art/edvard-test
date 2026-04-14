import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { CalendarDays, BarChart3 } from 'lucide-react';
import { AnimatedPage } from '@/components/AnimatedPage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, addMonths, subMonths, startOfMonth, endOfMonth, isBefore, startOfDay, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { MoodStats } from '@/components/MoodStats';
import { ExerciseStats, ExerciseStatsType } from '@/components/ExerciseStats';
import { SleepStats, SleepStatsType } from '@/components/SleepStats';
import { EatingStats, EatingStatsType } from '@/components/EatingStats';
import { MedicationStatsType } from '@/components/MedicationStats';
import { WeekCalendar } from '@/components/WeekCalendar';
import { MonthCalendar } from '@/components/MonthCalendar';
import { ExerciseMonthCalendar } from '@/components/ExerciseMonthCalendar';
import { SleepMonthCalendar } from '@/components/SleepMonthCalendar';
import { EatingMonthCalendar } from '@/components/EatingMonthCalendar';
import { ScrollableMonthsCalendar, ScrollableMonthsCalendarRef } from '@/components/ScrollableMonthsCalendar';

import { SleepWeekCalendar } from '@/components/SleepWeekCalendar';
import { EatingWeekCalendar } from '@/components/EatingWeekCalendar';
import { ExerciseWeekCalendar } from '@/components/ExerciseWeekCalendar';

import { YearHeatmap } from '@/components/YearHeatmap';
import { SleepYearHeatmap } from '@/components/SleepYearHeatmap';
import { EatingYearHeatmap } from '@/components/EatingYearHeatmap';
import { ExerciseYearHeatmap } from '@/components/ExerciseYearHeatmap';

import { DayDetailDialog } from '@/components/DayDetailDialog';
import { ExerciseTypeDialog } from '@/components/ExerciseTypeDialog';
import { AIInsights } from '@/components/AIInsights';
import { OverviewSummary } from '@/components/OverviewSummary';
import { LessonsFromPast } from '@/components/LessonsFromPast';
import { useCharacteristics } from '@/hooks/useCharacteristics';

import { MoodStats as MoodStatsType, ExerciseType, QualityType } from '@/types/mood';
import { Last30DaysOverview } from '@/components/Last30DaysOverview';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, Moon, Utensils } from 'lucide-react';
type ViewType = 'week' | 'month' | 'year';

const Overview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse period parameter (format: "2026-01" for month, "2026" for year)
  const periodParam = searchParams.get('period');
  const viewParam = searchParams.get('view') as ViewType | null;
  
  const getInitialState = () => {
    if (periodParam && viewParam === 'month' && periodParam.includes('-')) {
      const [year, month] = periodParam.split('-').map(Number);
      return {
        view: 'month' as ViewType,
        month: new Date(year, month - 1, 1),
        year: year,
      };
    } else if (periodParam && viewParam === 'year' && !periodParam.includes('-')) {
      return {
        view: 'year' as ViewType,
        month: new Date(),
        year: parseInt(periodParam),
      };
    }
    return {
      view: (viewParam || 'week') as ViewType,
      month: new Date(),
      year: new Date().getFullYear(),
    };
  };
  
  const initialState = getInitialState();
  
  const [view, setView] = useState<ViewType>(initialState.view);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(initialState.month);
  const [currentYear, setCurrentYear] = useState(initialState.year);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [exerciseDialogDate, setExerciseDialogDate] = useState<Date | null>(null);
  const [sectionView, setSectionView] = useState<'calendar' | 'stats'>('calendar');
  const scrollableCalendarRef = useRef<ScrollableMonthsCalendarRef>(null);
  const navigate = useNavigate();

  const { entries, isLoaded, getEntryForDate, getEntriesForMonth, getEntriesForYear, getStatsForYear, updateExerciseTypes } = useMoodData();
  const { isLoaded: medsLoaded, getMedicationsTakenOnDate, logs, activeMedications } = useMedications();
  const { preferences, loading: prefsLoading } = useUserPreferences();
  const { characteristics } = useCharacteristics();

  // Scroll to today when year view is loaded initially
  useEffect(() => {
    if (view === 'year' && isLoaded) {
      setTimeout(() => {
        const todayEl = document.querySelector('[data-today="true"]');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [view, isLoaded]);

  // Week data
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const weekStats = useMemo((): MoodStatsType => {
    let severe_elevated = 0, elevated = 0, somewhat_elevated = 0, stable = 0, somewhat_depressed = 0, depressed = 0, severe_depressed = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.mood === 'severe_elevated') severe_elevated++;
      else if (entry?.mood === 'elevated') elevated++;
      else if (entry?.mood === 'somewhat_elevated') somewhat_elevated++;
      else if (entry?.mood === 'stable') stable++;
      else if (entry?.mood === 'somewhat_depressed') somewhat_depressed++;
      else if (entry?.mood === 'depressed') depressed++;
      else if (entry?.mood === 'severe_depressed') severe_depressed++;
    });
    const total = severe_elevated + elevated + somewhat_elevated + stable + somewhat_depressed + depressed + severe_depressed;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { severe_elevated, elevated, somewhat_elevated, stable, somewhat_depressed, depressed, severe_depressed, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  const weekExerciseStats = useMemo((): ExerciseStatsType => {
    let exercised = 0, notExercised = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.exercised === true) exercised++;
      else if (entry?.exercised === false) notExercised++;
    });
    const total = exercised + notExercised;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { exercised, notExercised, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  const weekSleepStats = useMemo((): SleepStatsType => {
    let good = 0, bad = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.sleepQuality === 'good') good++;
      else if (entry?.sleepQuality === 'bad') bad++;
    });
    const total = good + bad;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  const weekEatingStats = useMemo((): EatingStatsType => {
    let good = 0, bad = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.eatingQuality === 'good') good++;
      else if (entry?.eatingQuality === 'bad') bad++;
    });
    const total = good + bad;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  const weekMedicationStats = useMemo((): MedicationStatsType => {
    let taken = 0, notTaken = 0;
    const medCount = activeMedications.length;
    if (medCount === 0) {
      return { taken: 0, notTaken: 0, unregistered: 0, total: 0, totalDays: 0 };
    }
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const medsTaken = getMedicationsTakenOnDate(dateStr);
      if (medsTaken.length >= medCount) taken++;
      else if (medsTaken.length > 0) taken++; // At least some taken
      // Count as not taken only if we know they logged but didn't take
    });
    const total = taken + notTaken;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { taken, notTaken, unregistered, total, totalDays };
  }, [weekDays, getMedicationsTakenOnDate, activeMedications]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'd MMM', { locale: sv })} – ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;

  // Month data
  const monthMoodData = useMemo(() => {
    return getEntriesForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, getEntriesForMonth]);

  const monthMedicationData = useMemo(() => {
    const result: Record<number, number> = {};
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const meds = getMedicationsTakenOnDate(dateStr);
      if (meds.length > 0) {
        result[day.getDate()] = meds.length;
      }
    });
    
    return result;
  }, [currentMonth, getMedicationsTakenOnDate]);

  const monthStats = useMemo((): MoodStatsType => {
    let severe_elevated = 0, elevated = 0, somewhat_elevated = 0, stable = 0, somewhat_depressed = 0, depressed = 0, severe_depressed = 0;
    Object.values(monthMoodData).forEach(mood => {
      if (mood === 'severe_elevated') severe_elevated++;
      else if (mood === 'elevated') elevated++;
      else if (mood === 'somewhat_elevated') somewhat_elevated++;
      else if (mood === 'stable') stable++;
      else if (mood === 'somewhat_depressed') somewhat_depressed++;
      else if (mood === 'depressed') depressed++;
      else if (mood === 'severe_depressed') severe_depressed++;
    });
    const total = severe_elevated + elevated + somewhat_elevated + stable + somewhat_depressed + depressed + severe_depressed;
    const end = endOfMonth(currentMonth);
    const totalDays = end.getDate();
    const unregistered = totalDays - total;
    return { severe_elevated, elevated, somewhat_elevated, stable, somewhat_depressed, depressed, severe_depressed, unregistered, total, totalDays };
  }, [monthMoodData, currentMonth]);

  const monthExerciseStats = useMemo((): ExerciseStatsType => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    let exercised = 0, notExercised = 0;
    days.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.exercised === true) exercised++;
      else if (entry?.exercised === false) notExercised++;
    });
    const total = exercised + notExercised;
    const totalDays = end.getDate();
    const unregistered = totalDays - total;
    return { exercised, notExercised, unregistered, total, totalDays };
  }, [currentMonth, getEntryForDate]);

  const monthSleepStats = useMemo((): SleepStatsType => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    let good = 0, bad = 0;
    days.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.sleepQuality === 'good') good++;
      else if (entry?.sleepQuality === 'bad') bad++;
    });
    const total = good + bad;
    const totalDays = end.getDate();
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [currentMonth, getEntryForDate]);

  const monthEatingStats = useMemo((): EatingStatsType => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    let good = 0, bad = 0;
    days.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.eatingQuality === 'good') good++;
      else if (entry?.eatingQuality === 'bad') bad++;
    });
    const total = good + bad;
    const totalDays = end.getDate();
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [currentMonth, getEntryForDate]);

  const monthMedicationStats = useMemo((): MedicationStatsType => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const medCount = activeMedications.length;
    if (medCount === 0) {
      return { taken: 0, notTaken: 0, unregistered: 0, total: 0, totalDays: 0 };
    }
    let taken = 0;
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const medsTaken = getMedicationsTakenOnDate(dateStr);
      if (medsTaken.length > 0) taken++;
    });
    const totalDays = end.getDate();
    const unregistered = totalDays - taken;
    return { taken, notTaken: 0, unregistered, total: taken, totalDays };
  }, [currentMonth, getMedicationsTakenOnDate, activeMedications]);

  const monthExerciseData = useMemo(() => {
    const result: Record<number, { exercised: boolean; types?: ExerciseType[] }> = {};
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.exercised !== undefined) {
        result[day.getDate()] = {
          exercised: entry.exercised,
          types: entry.exerciseTypes,
        };
      }
    });
    
    return result;
  }, [currentMonth, getEntryForDate]);

  const monthSleepData = useMemo(() => {
    const result: Record<number, QualityType> = {};
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.sleepQuality) {
        result[day.getDate()] = entry.sleepQuality;
      }
    });
    
    return result;
  }, [currentMonth, getEntryForDate]);

  const monthEatingData = useMemo(() => {
    const result: Record<number, QualityType> = {};
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.eatingQuality) {
        result[day.getDate()] = entry.eatingQuality;
      }
    });
    
    return result;
  }, [currentMonth, getEntryForDate]);

  const monthMedicationCalendarData = useMemo(() => {
    const result: Record<number, { taken: number; total: number; medicationNames: string[] }> = {};
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const medCount = activeMedications.length;
    
    if (medCount === 0) return result;
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const meds = getMedicationsTakenOnDate(dateStr);
      if (meds.length > 0 || logs.some(log => log.date === dateStr)) {
        result[day.getDate()] = { 
          taken: meds.length, 
          total: medCount,
          medicationNames: meds.map(m => m.name),
        };
      }
    });
    
    return result;
  }, [currentMonth, getMedicationsTakenOnDate, activeMedications, logs]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: sv });

  // Year data
  const yearEntries = useMemo(() => {
    return getEntriesForYear(currentYear);
  }, [currentYear, getEntriesForYear]);

  const yearStats = useMemo(() => {
    return getStatsForYear(currentYear);
  }, [currentYear, getStatsForYear]);

  const yearExerciseStats = useMemo((): ExerciseStatsType => {
    let exercised = 0, notExercised = 0;
    yearEntries.forEach(entry => {
      if (entry.exercised === true) exercised++;
      else if (entry.exercised === false) notExercised++;
    });
    const total = exercised + notExercised;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { exercised, notExercised, unregistered, total, totalDays };
  }, [yearEntries, currentYear]);

  const yearSleepStats = useMemo((): SleepStatsType => {
    let good = 0, bad = 0;
    yearEntries.forEach(entry => {
      if (entry.sleepQuality === 'good') good++;
      else if (entry.sleepQuality === 'bad') bad++;
    });
    const total = good + bad;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [yearEntries, currentYear]);

  const yearEatingStats = useMemo((): EatingStatsType => {
    let good = 0, bad = 0;
    yearEntries.forEach(entry => {
      if (entry.eatingQuality === 'good') good++;
      else if (entry.eatingQuality === 'bad') bad++;
    });
    const total = good + bad;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [yearEntries, currentYear]);

  const yearMedicationStats = useMemo((): MedicationStatsType => {
    const medCount = activeMedications.length;
    if (medCount === 0) {
      return { taken: 0, notTaken: 0, unregistered: 0, total: 0, totalDays: 0 };
    }
    const uniqueDates = new Set(logs
      .filter(log => log.date.startsWith(currentYear.toString()) && log.taken)
      .map(log => log.date));
    const taken = uniqueDates.size;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - taken;
    return { taken, notTaken: 0, unregistered, total: taken, totalDays };
  }, [logs, currentYear, activeMedications]);

  const yearMedicationDates = useMemo(() => {
    return logs
      .filter(log => log.date.startsWith(currentYear.toString()))
      .map(log => log.date);
  }, [logs, currentYear]);

  const handleDayClick = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = getEntryForDate(dateStr);
    const isPast = isBefore(date, startOfDay(new Date()));
    const isTodayDate = isToday(date);
    // Missed day → navigate to retroactive check-in
    if (!entry && (isPast || isTodayDate)) {
      navigate(`/?date=${dateStr}`);
      return;
    }
    // Otherwise open detail dialog
    setSelectedDate(date);
    setDialogOpen(true);
  }, [getEntryForDate, navigate]);

  const handleExerciseDayClick = (date: Date) => {
    const entry = getEntryForDate(format(date, 'yyyy-MM-dd'));
    // Only allow editing if the day has been marked as exercised
    if (entry?.exercised === true) {
      setExerciseDialogDate(date);
      setExerciseDialogOpen(true);
    }
  };

  const handleSaveExerciseTypes = async (types: ExerciseType[]) => {
    if (!exerciseDialogDate) return false;
    const dateStr = format(exerciseDialogDate, 'yyyy-MM-dd');
    return await updateExerciseTypes(dateStr, types);
  };

  const handleMonthClick = (month: number) => {
    setCurrentMonth(new Date(currentYear, month, 1));
    setView('month');
  };

  const handleViewChange = (newView: string) => {
    setView(newView as ViewType);
    setSearchParams({ view: newView });
    if (newView === 'year') {
      // Scroll to today's date after render
      setTimeout(() => {
        const todayEl = document.querySelector('[data-today="true"]');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const selectedEntry = selectedDate 
    ? getEntryForDate(format(selectedDate, 'yyyy-MM-dd'))
    : undefined;

  const selectedMedications = selectedDate
    ? getMedicationsTakenOnDate(format(selectedDate, 'yyyy-MM-dd'))
    : [];

  // Calculate sleep bad days for summary
  const sleepBadDays = useMemo(() => {
     if (view === 'week') return weekSleepStats.bad;
     if (view === 'month') return monthSleepStats.bad;
     if (view === 'year') return yearSleepStats.bad;
     return 0;
  }, [view, weekSleepStats, monthSleepStats, yearSleepStats]);

  const medPercentage = useMemo(() => {
     const ms = view === 'week' ? weekMedicationStats
       : view === 'month' ? monthMedicationStats 
       : view === 'year' ? yearMedicationStats : null;
    if (!ms || ms.totalDays === 0) return 0;
    return Math.round((ms.taken / ms.totalDays) * 100);
  }, [view, weekMedicationStats, monthMedicationStats, yearMedicationStats]);

  if (!isLoaded || !medsLoaded || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatsForView = () => {
    const emptyStats = {
      stats: { severe_elevated: 0, elevated: 0, somewhat_elevated: 0, stable: 0, somewhat_depressed: 0, depressed: 0, severe_depressed: 0, unregistered: 0, total: 0, totalDays: 0 },
      exerciseStats: { exercised: 0, notExercised: 0, unregistered: 0, total: 0, totalDays: 0 },
      sleepStats: { good: 0, bad: 0, unregistered: 0, total: 0, totalDays: 0 },
      eatingStats: { good: 0, bad: 0, unregistered: 0, total: 0, totalDays: 0 },
      medicationStats: { taken: 0, notTaken: 0, unregistered: 0, total: 0, totalDays: 0 },
      label: 'Senaste 30 dagarna'
    };
    switch (view) {
       case 'week': return { stats: weekStats, exerciseStats: weekExerciseStats, sleepStats: weekSleepStats, eatingStats: weekEatingStats, medicationStats: weekMedicationStats, label: weekLabel };
       case 'month': return { stats: monthStats, exerciseStats: monthExerciseStats, sleepStats: monthSleepStats, eatingStats: monthEatingStats, medicationStats: monthMedicationStats, label: monthLabel };
       case 'year': return { stats: yearStats, exerciseStats: yearExerciseStats, sleepStats: yearSleepStats, eatingStats: yearEatingStats, medicationStats: yearMedicationStats, label: `${currentYear}` };
      default: return emptyStats;
    }
  };

  const { stats, exerciseStats, sleepStats, eatingStats, medicationStats, label } = getStatsForView();
  
  const showMood = preferences?.include_mood !== false;
  const showSleep = preferences?.include_sleep !== false;
  const showEating = preferences?.include_eating !== false;
  const showExercise = preferences?.include_exercise !== false;
  const showMedication = preferences?.include_medication !== false && activeMedications.length > 0;

   return (
    <AnimatedPage>
    <div className="p-5 md:p-8 pb-24" style={{ overflowX: 'clip' }}>
      <div className="max-w-2xl lg:max-w-5xl mx-auto md:mx-0 space-y-6">
        <header className="sticky top-12 sm:top-14 md:top-0 z-20 bg-background pb-4 -mt-5 pt-5 md:-mt-8 md:pt-8 -mx-5 px-5 md:-mx-8 md:px-8 after:content-[''] after:absolute after:inset-x-0 after:-bottom-1 after:h-2 after:bg-gradient-to-b after:from-background after:to-transparent">
          <div className="mb-2">
            <div className="flex items-baseline justify-between mb-1">
              <h1 className="font-display text-2xl font-bold text-foreground">Översikt</h1>
              <div className="flex items-center gap-4">
                {sectionView === 'calendar' && (
                  <button
                    onClick={() => {
                      const now = new Date();
                      setCurrentYear(now.getFullYear());
                      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                      setTimeout(() => {
                        scrollableCalendarRef.current?.scrollToToday();
                      }, 50);
                    }}
                    className="text-sm font-semibold text-primary px-3 py-1 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    Idag
                  </button>
                )}
                <span className="text-xl font-semibold text-muted-foreground">{currentYear}</span>
              </div>
            </div>
            <p className="text-[13px] text-foreground/30">Se dina mönster och trender över tid.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {sectionView === 'calendar' && (
              <Tabs value={view} onValueChange={handleViewChange} className="flex-1">
                <TabsList className="inline-flex w-full h-9 bg-muted/80 p-0.5 rounded-full gap-0">
                  <TabsTrigger value="week" className="flex-1 text-xs font-semibold px-2 py-1 rounded-full data-[state=active]:bg-muted-foreground/30 data-[state=active]:text-foreground data-[state=active]:shadow-none">V</TabsTrigger>
                  <TabsTrigger value="month" className="flex-1 text-xs font-semibold px-2 py-1 rounded-full data-[state=active]:bg-muted-foreground/30 data-[state=active]:text-foreground data-[state=active]:shadow-none">M</TabsTrigger>
                  <TabsTrigger value="year" className="flex-1 text-xs font-semibold px-2 py-1 rounded-full data-[state=active]:bg-muted-foreground/30 data-[state=active]:text-foreground data-[state=active]:shadow-none">ÅR</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <div className="flex items-center gap-0.5 p-1 bg-muted/50 rounded-lg ml-auto">
                <button
                  onClick={() => {
                    setSectionView('calendar');
                    if (view === 'year') {
                      setTimeout(() => {
                        const todayEl = document.querySelector('[data-today="true"]');
                        if (todayEl) {
                          todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                    }
                  }}
                  className={`p-2 rounded-md transition-all ${
                    sectionView === 'calendar'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label="Kalender"
                >
                  <CalendarDays className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSectionView('stats');
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      // Fallback: also try scrolling the main content container
                      const mainEl = document.querySelector('main');
                      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 50);
                  }}
                  className={`p-2 rounded-md transition-all ${
                    sectionView === 'stats'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label="Statistik"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
          </div>
        </header>

        <div className="lg:flex lg:gap-8">
          {/* Main calendar area */}
          <div className="flex-1 min-w-0 space-y-6">
            {showMood && sectionView === 'calendar' && (
              <section>
                     {view === 'week' && (
                       <WeekCalendar
                         weekDays={weekDays}
                         getEntryForDate={getEntryForDate}
                         getMedicationsTakenOnDate={getMedicationsTakenOnDate}
                         onPrevWeek={() => setCurrentWeek(prev => subWeeks(prev, 1))}
                         onNextWeek={() => setCurrentWeek(prev => addWeeks(prev, 1))}
                         weekLabel={weekLabel}
                         onDayClick={handleDayClick}
                       />
                     )}
                     {view === 'month' && (
                      <ScrollableMonthsCalendar
                        ref={scrollableCalendarRef}
                        year={currentYear}
                        type="mood"
                        getEntryForDate={getEntryForDate}
                        getMedicationsTakenOnDate={getMedicationsTakenOnDate}
                        getEntriesForMonth={getEntriesForMonth}
                        onDayClick={handleDayClick}
                      />
                    )}
                    {view === 'year' && (
                      <YearHeatmap year={currentYear} entries={yearEntries}
                        medicationDates={yearMedicationDates}
                        onPrevYear={() => setCurrentYear(prev => prev - 1)}
                        onNextYear={() => setCurrentYear(prev => prev + 1)}
                        onMonthClick={handleMonthClick} />
                    )}
              </section>
            )}

            {/* Summary Card - only in stats view */}
            {sectionView === 'stats' && (
              <OverviewSummary
                stats={stats}
                entries={entries}
                periodLabel={label}
                sleepBadDays={0}
                showSleep={false}
              />
            )}

            {sectionView === 'stats' && (
              <LessonsFromPast entries={entries} characteristics={characteristics} />
            )}
          </div>



        <DayDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedDate}
          entry={selectedEntry}
          medicationsTaken={selectedMedications}
        />

        <ExerciseTypeDialog
          open={exerciseDialogOpen}
          onOpenChange={setExerciseDialogOpen}
          date={exerciseDialogDate}
          currentTypes={exerciseDialogDate ? (getEntryForDate(format(exerciseDialogDate, 'yyyy-MM-dd'))?.exerciseTypes || []) : []}
          onSave={handleSaveExerciseTypes}
        />
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default Overview;

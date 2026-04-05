import { useState, useMemo, useCallback } from 'react';
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
import { MedicationStats, MedicationStatsType } from '@/components/MedicationStats';
import { WeekCalendar } from '@/components/WeekCalendar';
import { MonthCalendar } from '@/components/MonthCalendar';
import { ExerciseMonthCalendar } from '@/components/ExerciseMonthCalendar';
import { SleepMonthCalendar } from '@/components/SleepMonthCalendar';
import { EatingMonthCalendar } from '@/components/EatingMonthCalendar';
import { MedicationMonthCalendar } from '@/components/MedicationMonthCalendar';
import { SleepWeekCalendar } from '@/components/SleepWeekCalendar';
import { EatingWeekCalendar } from '@/components/EatingWeekCalendar';
import { ExerciseWeekCalendar } from '@/components/ExerciseWeekCalendar';
import { MedicationWeekCalendar } from '@/components/MedicationWeekCalendar';
import { YearHeatmap } from '@/components/YearHeatmap';
import { SleepYearHeatmap } from '@/components/SleepYearHeatmap';
import { EatingYearHeatmap } from '@/components/EatingYearHeatmap';
import { ExerciseYearHeatmap } from '@/components/ExerciseYearHeatmap';
import { MedicationYearHeatmap } from '@/components/MedicationYearHeatmap';
import { DayDetailDialog } from '@/components/DayDetailDialog';
import { ExerciseTypeDialog } from '@/components/ExerciseTypeDialog';
import { AIInsights } from '@/components/AIInsights';
import { MoodStats as MoodStatsType, ExerciseType, QualityType } from '@/types/mood';
import { Last30DaysOverview } from '@/components/Last30DaysOverview';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, Moon, Utensils, Pill } from 'lucide-react';
import Reports from './Reports';

type ViewType = 'week' | 'month' | 'year' | '30days';

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
      view: (viewParam || 'month') as ViewType,
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
  const navigate = useNavigate();

  const { entries, isLoaded, getEntryForDate, getEntriesForMonth, getEntriesForYear, getStatsForYear, updateExerciseTypes } = useMoodData();
  const { isLoaded: medsLoaded, getMedicationsTakenOnDate, logs, activeMedications } = useMedications();
  const { preferences, loading: prefsLoading } = useUserPreferences();

  // Week data
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const weekStats = useMemo((): MoodStatsType => {
    let elevated = 0, stable = 0, depressed = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.mood === 'elevated') elevated++;
      if (entry?.mood === 'stable') stable++;
      if (entry?.mood === 'depressed') depressed++;
    });
    const total = elevated + stable + depressed;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { elevated, stable, depressed, unregistered, total, totalDays };
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
    let elevated = 0, stable = 0, depressed = 0;
    Object.values(monthMoodData).forEach(mood => {
      if (mood === 'elevated') elevated++;
      if (mood === 'stable') stable++;
      if (mood === 'depressed') depressed++;
    });
    const total = elevated + stable + depressed;
    const end = endOfMonth(currentMonth);
    const totalDays = end.getDate();
    const unregistered = totalDays - total;
    return { elevated, stable, depressed, unregistered, total, totalDays };
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
  };

  const selectedEntry = selectedDate 
    ? getEntryForDate(format(selectedDate, 'yyyy-MM-dd'))
    : undefined;

  const selectedMedications = selectedDate
    ? getMedicationsTakenOnDate(format(selectedDate, 'yyyy-MM-dd'))
    : [];

  if (!isLoaded || !medsLoaded || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatsForView = () => {
    // Default empty stats for 30days view (handled separately)
    const emptyStats = {
      stats: { elevated: 0, stable: 0, depressed: 0, unregistered: 0, total: 0, totalDays: 0 },
      exerciseStats: { exercised: 0, notExercised: 0, unregistered: 0, total: 0, totalDays: 0 },
      sleepStats: { good: 0, bad: 0, unregistered: 0, total: 0, totalDays: 0 },
      eatingStats: { good: 0, bad: 0, unregistered: 0, total: 0, totalDays: 0 },
      medicationStats: { taken: 0, notTaken: 0, unregistered: 0, total: 0, totalDays: 0 },
      label: 'Senaste 30 dagarna'
    };
    
    switch (view) {
      case 'week': return { 
        stats: weekStats, 
        exerciseStats: weekExerciseStats, 
        sleepStats: weekSleepStats,
        eatingStats: weekEatingStats,
        medicationStats: weekMedicationStats,
        label: weekLabel 
      };
      case 'month': return { 
        stats: monthStats, 
        exerciseStats: monthExerciseStats, 
        sleepStats: monthSleepStats,
        eatingStats: monthEatingStats,
        medicationStats: monthMedicationStats,
        label: monthLabel 
      };
      case 'year': return { 
        stats: yearStats, 
        exerciseStats: yearExerciseStats, 
        sleepStats: yearSleepStats,
        eatingStats: yearEatingStats,
        medicationStats: yearMedicationStats,
        label: `${currentYear}` 
      };
      case '30days':
      default:
        return emptyStats;
    }
  };

  const { stats, exerciseStats, sleepStats, eatingStats, medicationStats, label } = getStatsForView();
  
  // Check which sections to show based on preferences
  const showMood = preferences?.include_mood !== false;
  const showSleep = preferences?.include_sleep !== false;
  const showEating = preferences?.include_eating !== false;
  const showExercise = preferences?.include_exercise !== false;
  const showMedication = preferences?.include_medication !== false && activeMedications.length > 0;

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Översikt
          </h1>
          
          <Tabs value={view} onValueChange={handleViewChange} className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="30days">30 dagar</TabsTrigger>
              <TabsTrigger value="week">Vecka</TabsTrigger>
              <TabsTrigger value="month">Månad</TabsTrigger>
              <TabsTrigger value="year">År</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {/* Last 30 Days View */}
        {view === '30days' && (
          <Last30DaysOverview
            entries={entries}
            getEntryForDate={getEntryForDate}
            getMedicationsTakenOnDate={getMedicationsTakenOnDate}
            activeMedicationsCount={activeMedications.length}
            preferences={preferences}
            onDayClick={handleDayClick}
          />
        )}

        {/* Mående Section - only show for week/month/year views */}
        {showMood && view !== '30days' && (
          <section>
            <h2 className="font-display text-2xl font-semibold mb-6">Mående</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar/View */}
              {view === 'week' && (
                <WeekCalendar
                  weekDays={weekDays}
                  weekLabel={weekLabel}
                  getEntryForDate={getEntryForDate}
                  getMedicationsTakenOnDate={getMedicationsTakenOnDate}
                  onPrevWeek={() => setCurrentWeek(prev => subWeeks(prev, 1))}
                  onNextWeek={() => setCurrentWeek(prev => addWeeks(prev, 1))}
                  onDayClick={handleDayClick}
                />
              )}

              {view === 'month' && (
                <MonthCalendar
                  currentDate={currentMonth}
                  moodData={monthMoodData}
                  medicationData={monthMedicationData}
                  onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
                  onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  onDayClick={handleDayClick}
                  
                />
              )}

              {view === 'year' && (
                <YearHeatmap 
                  year={currentYear} 
                  entries={yearEntries} 
                  medicationDates={yearMedicationDates}
                  onPrevYear={() => setCurrentYear(prev => prev - 1)}
                  onNextYear={() => setCurrentYear(prev => prev + 1)}
                  onMonthClick={handleMonthClick}
                />
              )}
              
              {/* Mood Stats */}
              <div className="lg:self-start">
                <MoodStats stats={stats} periodLabel={label} />
              </div>
            </div>
          </section>
        )}

        {/* Sömn Section */}
        {showSleep && view !== '30days' && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Moon className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Sömn</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {view === 'week' && (
              <SleepWeekCalendar
                weekDays={weekDays}
                weekLabel={weekLabel}
                getSleepForDate={(dateStr) => getEntryForDate(dateStr)?.sleepQuality}
                onPrevWeek={() => setCurrentWeek(prev => subWeeks(prev, 1))}
                onNextWeek={() => setCurrentWeek(prev => addWeeks(prev, 1))}
                onDayClick={handleDayClick}
              />
            )}

            {view === 'month' && (
              <SleepMonthCalendar
                currentDate={currentMonth}
                sleepData={monthSleepData}
                onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
                onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
                onDayClick={handleDayClick}
              />
            )}

            {view === 'year' && (
              <SleepYearHeatmap
                year={currentYear}
                entries={yearEntries}
                onPrevYear={() => setCurrentYear(prev => prev - 1)}
                onNextYear={() => setCurrentYear(prev => prev + 1)}
                onMonthClick={handleMonthClick}
              />
            )}
            
            <div className="lg:self-start">
              <SleepStats stats={sleepStats} periodLabel={label} />
            </div>
          </div>
        </section>
        )}

        {/* Kost Section */}
        {showEating && view !== '30days' && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Utensils className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Kost</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {view === 'week' && (
              <EatingWeekCalendar
                weekDays={weekDays}
                weekLabel={weekLabel}
                getEatingForDate={(dateStr) => getEntryForDate(dateStr)?.eatingQuality}
                onPrevWeek={() => setCurrentWeek(prev => subWeeks(prev, 1))}
                onNextWeek={() => setCurrentWeek(prev => addWeeks(prev, 1))}
                onDayClick={handleDayClick}
              />
            )}

            {view === 'month' && (
              <EatingMonthCalendar
                currentDate={currentMonth}
                eatingData={monthEatingData}
                onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
                onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
                onDayClick={handleDayClick}
              />
            )}

            {view === 'year' && (
              <EatingYearHeatmap
                year={currentYear}
                entries={yearEntries}
                onPrevYear={() => setCurrentYear(prev => prev - 1)}
                onNextYear={() => setCurrentYear(prev => prev + 1)}
                onMonthClick={handleMonthClick}
              />
            )}
            
            <div className="lg:self-start">
              <EatingStats stats={eatingStats} periodLabel={label} />
            </div>
          </div>
        </section>
        )}

        {/* Träning Section */}
        {showExercise && view !== '30days' && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Dumbbell className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Träning</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {view === 'week' && (
              <ExerciseWeekCalendar
                weekDays={weekDays}
                weekLabel={weekLabel}
                getExerciseForDate={(dateStr) => {
                  const entry = getEntryForDate(dateStr);
                  if (entry?.exercised === undefined) return undefined;
                  return { exercised: entry.exercised, types: entry.exerciseTypes };
                }}
                onPrevWeek={() => setCurrentWeek(prev => subWeeks(prev, 1))}
                onNextWeek={() => setCurrentWeek(prev => addWeeks(prev, 1))}
                onDayClick={handleExerciseDayClick}
              />
            )}

            {view === 'month' && (
              <ExerciseMonthCalendar
                currentDate={currentMonth}
                exerciseData={monthExerciseData}
                onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
                onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
                onDayClick={handleExerciseDayClick}
              />
            )}

            {view === 'year' && (
              <ExerciseYearHeatmap
                year={currentYear}
                entries={yearEntries}
                onPrevYear={() => setCurrentYear(prev => prev - 1)}
                onNextYear={() => setCurrentYear(prev => prev + 1)}
                onMonthClick={handleMonthClick}
              />
            )}
            
            <div className="lg:self-start">
              <ExerciseStats stats={exerciseStats} periodLabel={label} />
            </div>
          </div>
        </section>
        )}

        {/* Medicin Section */}
        {showMedication && view !== '30days' && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Pill className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Medicin</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {view === 'week' && (
              <MedicationWeekCalendar
                weekDays={weekDays}
                weekLabel={weekLabel}
                getMedicationForDate={(dateStr) => {
                  const meds = getMedicationsTakenOnDate(dateStr);
                  if (meds.length === 0 && !logs.some(log => log.date === dateStr)) return undefined;
                  return {
                    taken: meds.length,
                    total: activeMedications.length,
                    medicationNames: meds.map(m => m.name),
                  };
                }}
                onPrevWeek={() => setCurrentWeek(prev => subWeeks(prev, 1))}
                onNextWeek={() => setCurrentWeek(prev => addWeeks(prev, 1))}
                onDayClick={handleDayClick}
              />
            )}

            {view === 'month' && (
              <MedicationMonthCalendar
                currentDate={currentMonth}
                medicationData={monthMedicationCalendarData}
                onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
                onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
                onDayClick={handleDayClick}
              />
            )}

            {view === 'year' && (
              <MedicationYearHeatmap
                year={currentYear}
                medicationDates={yearMedicationDates}
                onPrevYear={() => setCurrentYear(prev => prev - 1)}
                onNextYear={() => setCurrentYear(prev => prev + 1)}
                onMonthClick={handleMonthClick}
              />
            )}
            
            <div className="lg:self-start">
              <MedicationStats stats={medicationStats} periodLabel={label} />
            </div>
          </div>
        </section>
        )}

        {/* AI Insights Section */}
        {view !== '30days' && (
          <AIInsights
            entries={entries}
            stats={stats}
            periodLabel={label}
            view={view}
          />
        )}

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
  );
};

export default Overview;

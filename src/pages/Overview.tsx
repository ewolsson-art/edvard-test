import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { MoodStats } from '@/components/MoodStats';
import { WeekCalendar } from '@/components/WeekCalendar';
import { MonthCalendar } from '@/components/MonthCalendar';
import { YearHeatmap } from '@/components/YearHeatmap';
import { DayDetailDialog } from '@/components/DayDetailDialog';
import { MoodStats as MoodStatsType } from '@/types/mood';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewType = 'week' | 'month' | 'year';

const Overview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as ViewType) || 'month';
  
  const [view, setView] = useState<ViewType>(initialView);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    if (yearParam && monthParam) {
      return new Date(parseInt(yearParam), parseInt(monthParam), 1);
    }
    return new Date();
  });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { isLoaded, getEntryForDate, getEntriesForMonth, getEntriesForYear, getStatsForYear } = useMoodData();
  const { isLoaded: medsLoaded, getMedicationsTakenOnDate, logs } = useMedications();

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

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: sv });

  // Year data
  const yearEntries = useMemo(() => {
    return getEntriesForYear(currentYear);
  }, [currentYear, getEntriesForYear]);

  const yearStats = useMemo(() => {
    return getStatsForYear(currentYear);
  }, [currentYear, getStatsForYear]);

  const yearMedicationDates = useMemo(() => {
    return logs
      .filter(log => log.date.startsWith(currentYear.toString()))
      .map(log => log.date);
  }, [logs, currentYear]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
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

  if (!isLoaded || !medsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatsForView = () => {
    switch (view) {
      case 'week': return { stats: weekStats, label: weekLabel };
      case 'month': return { stats: monthStats, label: monthLabel };
      case 'year': return { stats: yearStats, label: `${currentYear}` };
    }
  };

  const { stats, label } = getStatsForView();

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Översikt
          </h1>
          
          <Tabs value={view} onValueChange={handleViewChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="week">Vecka</TabsTrigger>
              <TabsTrigger value="month">Månad</TabsTrigger>
              <TabsTrigger value="year">År</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

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
          
          {/* Stats card */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <MoodStats stats={stats} periodLabel={label} />
          </div>
        </div>

        <DayDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedDate}
          entry={selectedEntry}
          medicationsTaken={selectedMedications}
        />
      </div>
    </div>
  );
};

export default Overview;

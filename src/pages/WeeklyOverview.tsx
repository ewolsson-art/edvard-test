import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { MoodStats } from '@/components/MoodStats';
import { WeekCalendar } from '@/components/WeekCalendar';
import { MoodStats as MoodStatsType } from '@/types/mood';

const WeeklyOverview = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { isLoaded, getEntryForDate } = useMoodData();
  const { isLoaded: medsLoaded, getMedicationsTakenOnDate } = useMedications();

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

  const handleDayClick = (date: Date) => {
    console.log('Clicked day:', format(date, 'yyyy-MM-dd'));
  };

  if (!isLoaded || !medsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Veckoöversikt
          </h1>
          <p className="text-muted-foreground">
            Se hur du mått under veckan
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar card */}
          <WeekCalendar
            weekDays={weekDays}
            weekLabel={weekLabel}
            getEntryForDate={getEntryForDate}
            getMedicationsTakenOnDate={getMedicationsTakenOnDate}
            onPrevWeek={() => setCurrentWeek(prev => subWeeks(prev, 1))}
            onNextWeek={() => setCurrentWeek(prev => addWeeks(prev, 1))}
            onDayClick={handleDayClick}
          />

          {/* Stats card */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <MoodStats stats={weekStats} periodLabel={weekLabel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOverview;

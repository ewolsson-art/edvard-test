import { useState, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { MonthCalendar } from '@/components/MonthCalendar';
import { MoodStats } from '@/components/MoodStats';
import { useMoodData } from '@/hooks/useMoodData';
import { MoodStats as MoodStatsType } from '@/types/mood';

const MonthlyOverview = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { isLoaded, getEntriesForMonth } = useMoodData();

  const monthMoodData = useMemo(() => {
    return getEntriesForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, getEntriesForMonth]);

  const monthStats = useMemo((): MoodStatsType => {
    let elevated = 0, stable = 0, depressed = 0;
    Object.values(monthMoodData).forEach(mood => {
      if (mood === 'elevated') elevated++;
      if (mood === 'stable') stable++;
      if (mood === 'depressed') depressed++;
    });
    return { elevated, stable, depressed, total: elevated + stable + depressed };
  }, [monthMoodData]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: sv });

  const handleDayClick = (date: Date) => {
    console.log('Clicked day:', format(date, 'yyyy-MM-dd'));
  };

  if (!isLoaded) {
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
            Månadsöversikt
          </h1>
          <p className="text-muted-foreground">
            Se hur du mått under månaden
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar card */}
          <MonthCalendar
            currentDate={currentMonth}
            moodData={monthMoodData}
            onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
            onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
            onDayClick={handleDayClick}
          />
          
          {/* Stats card */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <MoodStats stats={monthStats} periodLabel={monthLabel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyOverview;

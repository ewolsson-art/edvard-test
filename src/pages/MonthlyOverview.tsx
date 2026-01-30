import { useState, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { MonthCalendar } from '@/components/MonthCalendar';
import { useMoodData } from '@/hooks/useMoodData';

const MonthlyOverview = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { isLoaded, getEntriesForMonth } = useMoodData();

  const monthMoodData = useMemo(() => {
    return getEntriesForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, getEntriesForMonth]);

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
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Månadsöversikt
          </h1>
          <p className="text-muted-foreground">
            Se hur du mått under månaden
          </p>
        </header>

        <MonthCalendar
          currentDate={currentMonth}
          moodData={monthMoodData}
          onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
          onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
          onDayClick={handleDayClick}
        />
      </div>
    </div>
  );
};

export default MonthlyOverview;

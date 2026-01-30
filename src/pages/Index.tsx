import { useState, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { TodayCheckin } from '@/components/TodayCheckin';
import { MonthCalendar } from '@/components/MonthCalendar';
import { YearHeatmap } from '@/components/YearHeatmap';
import { MoodStats } from '@/components/MoodStats';
import { useMoodData } from '@/hooks/useMoodData';
import { MoodType } from '@/types/mood';

const Index = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currentYear = new Date().getFullYear();
  
  const {
    entries,
    isLoaded,
    addEntry,
    updateComment,
    getEntryForDate,
    getEntriesForMonth,
    getEntriesForYear,
    getStatsForYear,
  } = useMoodData();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = getEntryForDate(todayStr);

  const monthMoodData = useMemo(() => {
    return getEntriesForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, getEntriesForMonth]);

  const yearEntries = useMemo(() => {
    return getEntriesForYear(currentYear);
  }, [currentYear, getEntriesForYear]);

  const yearStats = useMemo(() => {
    return getStatsForYear(currentYear);
  }, [currentYear, getStatsForYear]);

  const handleCheckin = (mood: MoodType, comment?: string) => {
    addEntry(todayStr, mood, comment);
  };

  const handleUpdateComment = (comment: string) => {
    updateComment(todayStr, comment);
  };

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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Today Check-in - Full Width at Top */}
        <div className="mb-8">
          <TodayCheckin 
            todayEntry={todayEntry} 
            onCheckin={handleCheckin}
            onUpdateComment={handleUpdateComment}
          />
        </div>

        {/* Calendar and Stats Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <MonthCalendar
              currentDate={currentMonth}
              moodData={monthMoodData}
              onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
              onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
              onDayClick={handleDayClick}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <MoodStats stats={yearStats} year={currentYear} />
          </div>
        </div>

        {/* Year Heatmap - Full Width */}
        <div className="mt-8">
          <YearHeatmap year={currentYear} entries={yearEntries} />
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-sm text-muted-foreground">
          <p>Din data sparas lokalt i webbläsaren</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

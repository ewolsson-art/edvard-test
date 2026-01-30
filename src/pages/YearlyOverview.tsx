import { useState, useMemo } from 'react';
import { addYears, subYears } from 'date-fns';
import { YearHeatmap } from '@/components/YearHeatmap';
import { MoodStats } from '@/components/MoodStats';
import { CalendarHeader } from '@/components/CalendarHeader';
import { useMoodData } from '@/hooks/useMoodData';

const YearlyOverview = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const { isLoaded, getEntriesForYear, getStatsForYear } = useMoodData();

  const yearEntries = useMemo(() => {
    return getEntriesForYear(currentYear);
  }, [currentYear, getEntriesForYear]);

  const yearStats = useMemo(() => {
    return getStatsForYear(currentYear);
  }, [currentYear, getStatsForYear]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Årsöversikt
          </h1>
          <p className="text-muted-foreground">
            Se ditt mående över hela året
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">
          {/* Calendar/Heatmap card */}
          <div className="glass-card p-6 fade-in overflow-x-auto">
            <CalendarHeader
              title={`${currentYear}`}
              onPrev={() => setCurrentYear(prev => prev - 1)}
              onNext={() => setCurrentYear(prev => prev + 1)}
            />
            <YearHeatmap year={currentYear} entries={yearEntries} showHeader={false} />
          </div>
          
          {/* Stats card */}
          <div className="xl:sticky xl:top-8 xl:self-start">
            <MoodStats stats={yearStats} periodLabel={`${currentYear}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyOverview;

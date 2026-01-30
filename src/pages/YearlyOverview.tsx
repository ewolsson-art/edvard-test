import { useMemo } from 'react';
import { YearHeatmap } from '@/components/YearHeatmap';
import { MoodStats } from '@/components/MoodStats';
import { useMoodData } from '@/hooks/useMoodData';

const YearlyOverview = () => {
  const currentYear = new Date().getFullYear();
  
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

        <div className="space-y-8">
          <MoodStats stats={yearStats} periodLabel={`${currentYear}`} />
          <YearHeatmap year={currentYear} entries={yearEntries} />
        </div>
      </div>
    </div>
  );
};

export default YearlyOverview;

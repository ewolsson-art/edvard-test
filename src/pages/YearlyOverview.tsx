import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { YearHeatmap } from '@/components/YearHeatmap';
import { MoodStats } from '@/components/MoodStats';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';

const YearlyOverview = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();
  
  const { isLoaded, getEntriesForYear, getStatsForYear } = useMoodData();
  const { isLoaded: medsLoaded, logs } = useMedications();

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

  const handleMonthClick = (month: number) => {
    // Navigate to monthly overview with the selected month
    navigate(`/manad?year=${currentYear}&month=${month}`);
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
            Årsöversikt
          </h1>
          <p className="text-muted-foreground">
            Se ditt mående över hela året – klicka på en månad för detaljer
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar/Heatmap card */}
          <YearHeatmap 
            year={currentYear} 
            entries={yearEntries} 
            medicationDates={yearMedicationDates}
            onPrevYear={() => setCurrentYear(prev => prev - 1)}
            onNextYear={() => setCurrentYear(prev => prev + 1)}
            onMonthClick={handleMonthClick}
          />
          
          {/* Stats card */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <MoodStats stats={yearStats} periodLabel={`${currentYear}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyOverview;

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { usePatientMoodData } from '@/hooks/usePatientMoodData';
import { PatientConnection } from '@/hooks/useDoctorConnections';
import { MoodStats } from '@/components/MoodStats';
import { ExerciseStats, ExerciseStatsType } from '@/components/ExerciseStats';
import { SleepStats, SleepStatsType } from '@/components/SleepStats';
import { EatingStats, EatingStatsType } from '@/components/EatingStats';
import { MonthCalendar } from '@/components/MonthCalendar';
import { ExerciseMonthCalendar } from '@/components/ExerciseMonthCalendar';
import { SleepMonthCalendar } from '@/components/SleepMonthCalendar';
import { EatingMonthCalendar } from '@/components/EatingMonthCalendar';
import { MoodStats as MoodStatsType, ExerciseType } from '@/types/mood';
import { Loader2, ChevronLeft, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PatientOverviewProps {
  connection: PatientConnection;
  onBack: () => void;
}

export function PatientOverview({ connection, onBack }: PatientOverviewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { entries, isLoaded, getEntryForDate, getEntriesForMonth } = usePatientMoodData({
    patientId: connection.patient_id,
  });

  const patientName = useMemo(() => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    return connection.patient_email || 'Patient';
  }, [connection]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: sv });

  // Month data
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
    const result: Record<number, 'good' | 'bad'> = {};
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
    const result: Record<number, 'good' | 'bad'> = {};
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

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-semibold">{patientName}</h2>
          {connection.patient_email && connection.patient_profile?.first_name && (
            <p className="text-sm text-muted-foreground">{connection.patient_email}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-primary">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Stats and calendars based on what's shared */}
      <div className="space-y-8">
        {/* Mood */}
        {connection.share_mood && (
          <section className="space-y-4">
            <h3 className="font-medium text-lg">Mående</h3>
            <MoodStats stats={monthStats} periodLabel={monthLabel} />
            <MonthCalendar
              currentDate={currentMonth}
              moodData={monthMoodData}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </section>
        )}

        {/* Sleep */}
        {connection.share_sleep && (
          <section className="space-y-4">
            <h3 className="font-medium text-lg">Sömn</h3>
            <SleepStats stats={monthSleepStats} periodLabel={monthLabel} />
            <SleepMonthCalendar
              currentDate={currentMonth}
              sleepData={monthSleepData}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </section>
        )}

        {/* Eating */}
        {connection.share_eating && (
          <section className="space-y-4">
            <h3 className="font-medium text-lg">Kost</h3>
            <EatingStats stats={monthEatingStats} periodLabel={monthLabel} />
            <EatingMonthCalendar
              currentDate={currentMonth}
              eatingData={monthEatingData}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </section>
        )}

        {/* Exercise */}
        {connection.share_exercise && (
          <section className="space-y-4">
            <h3 className="font-medium text-lg">Träning</h3>
            <ExerciseStats stats={monthExerciseStats} periodLabel={monthLabel} />
            <ExerciseMonthCalendar
              currentDate={currentMonth}
              exerciseData={monthExerciseData}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </section>
        )}

        {/* No data shared message */}
        {!connection.share_mood && !connection.share_sleep && !connection.share_eating && !connection.share_exercise && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Patienten delar ingen data med dig.</p>
          </div>
        )}
      </div>
    </div>
  );
}

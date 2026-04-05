import { useState, useEffect } from 'react';
import { format, startOfDay, isToday, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { sv } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft } from 'lucide-react';
import { TodayCheckin } from '@/components/TodayCheckin';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useProfile } from '@/hooks/useProfile';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useStreak } from '@/hooks/useStreak';
import { useCustomCheckinQuestions } from '@/hooks/useCustomCheckinQuestions';
import { StreakBadge } from '@/components/StreakBadge';
import { CheckinData } from '@/types/mood';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const {
    entries,
    isLoaded,
    saveCheckin,
    getEntryForDate,
    getEntriesForYear,
  } = useMoodData();

  const {
    isLoaded: medsLoaded,
    activeMedications,
    logMedication,
    isMedicationTakenOnDate,
  } = useMedications();

  const { firstName, isLoading: profileLoading } = useProfile();
  const { preferences, loading: prefsLoading } = useUserPreferences();
  const { questions: customQuestions, isLoaded: customQLoaded, getAnswersForDate, saveAnswers } = useCustomCheckinQuestions();
  const streakData = useStreak(entries);

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (dateParam) {
      try { return parseISO(dateParam); } catch { return new Date(); }
    }
    return new Date();
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isSelectedToday = isToday(selectedDate);

  // Load custom answers for today
  useEffect(() => {
    if (customQLoaded && customQuestions.length > 0) {
      getAnswersForDate(selectedDateStr).then(answers => {
        const map: Record<string, string> = {};
        answers.forEach(a => { map[a.question_id] = a.answer_value; });
        setCustomAnswers(map);
      });
    }
  }, [customQLoaded, customQuestions.length, selectedDateStr, getAnswersForDate]);

  const selectedEntry = getEntryForDate(selectedDateStr);
  const currentYear = new Date().getFullYear();
  const yearEntries = getEntriesForYear(currentYear);

  const medicationsTakenForDate = activeMedications
    .filter(med => isMedicationTakenOnDate(med.id, selectedDateStr))
    .map(med => med.id);

  const handleSaveCheckin = async (data: CheckinData): Promise<boolean> => {
    const result = await saveCheckin(selectedDateStr, data);
    return result ?? false;
  };

  const handleToggleMedication = (medicationId: string, taken: boolean) => {
    logMedication(medicationId, selectedDateStr, taken);
  };

  if (!isLoaded || !medsLoaded || profileLoading || prefsLoading || !customQLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] md:h-screen flex items-center justify-center py-4 px-4 sm:px-5 overflow-hidden">
      <div className="w-full max-w-xl relative">
        {/* Date picker for retroactive check-in */}
        {!isSelectedToday && (
          <div className="mb-4 flex items-center justify-center">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedDate(new Date()); setSearchParams({}); }} className="gap-1 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka till idag
            </Button>
          </div>
        )}

        {/* Subtle streak badge in top right */}
        {streakData.currentStreak > 0 && (
          <div className="absolute -top-1 right-0 z-10">
            <StreakBadge 
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              hasCheckedInToday={streakData.hasCheckedInToday}
              variant="compact"
            />
          </div>
        )}
        <TodayCheckin 
          todayEntry={selectedEntry} 
          activeMedications={activeMedications}
          medicationsTakenToday={medicationsTakenForDate}
          yearEntries={yearEntries}
          firstName={firstName}
          onSaveCheckin={handleSaveCheckin}
          onToggleMedication={handleToggleMedication}
          preferences={preferences}
          streakData={streakData}
          customQuestions={customQuestions}
          customAnswers={customAnswers}
          onSaveCustomAnswers={async (answers) => saveAnswers(selectedDateStr, answers)}
          selectedDate={selectedDate}
          onSelectDate={(date) => { setSelectedDate(date); setSearchParams(isToday(date) ? {} : { date: format(date, 'yyyy-MM-dd') }); }}
        />
      </div>
    </div>
  );
};

export default Index;

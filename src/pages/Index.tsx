import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TodayCheckin } from '@/components/TodayCheckin';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useProfile } from '@/hooks/useProfile';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useStreak } from '@/hooks/useStreak';
import { useCustomCheckinQuestions } from '@/hooks/useCustomCheckinQuestions';
import { StreakBadge } from '@/components/StreakBadge';
import { CheckinData } from '@/types/mood';

const Index = () => {
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

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Load custom answers for today
  useEffect(() => {
    if (customQLoaded && customQuestions.length > 0) {
      getAnswersForDate(todayStr).then(answers => {
        const map: Record<string, string> = {};
        answers.forEach(a => { map[a.question_id] = a.answer_value; });
        setCustomAnswers(map);
      });
    }
  }, [customQLoaded, customQuestions.length, todayStr, getAnswersForDate]);

  const todayEntry = getEntryForDate(todayStr);
  const currentYear = new Date().getFullYear();
  const yearEntries = getEntriesForYear(currentYear);

  const medicationsTakenToday = activeMedications
    .filter(med => isMedicationTakenOnDate(med.id, todayStr))
    .map(med => med.id);

  const handleSaveCheckin = async (data: CheckinData): Promise<boolean> => {
    const result = await saveCheckin(todayStr, data);
    return result ?? false;
  };

  const handleToggleMedication = (medicationId: string, taken: boolean) => {
    logMedication(medicationId, todayStr, taken);
  };

  if (!isLoaded || !medsLoaded || profileLoading || prefsLoading || !customQLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl relative">
        {/* Subtle streak badge in top right */}
        {streakData.currentStreak > 0 && (
          <div className="absolute -top-2 right-0 z-10">
            <StreakBadge 
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              hasCheckedInToday={streakData.hasCheckedInToday}
              variant="compact"
            />
          </div>
        )}
        <TodayCheckin 
          todayEntry={todayEntry} 
          activeMedications={activeMedications}
          medicationsTakenToday={medicationsTakenToday}
          yearEntries={yearEntries}
          firstName={firstName}
          onSaveCheckin={handleSaveCheckin}
          onToggleMedication={handleToggleMedication}
          preferences={preferences}
          streakData={streakData}
          customQuestions={customQuestions}
          customAnswers={customAnswers}
          onSaveCustomAnswers={async (answers) => saveAnswers(todayStr, answers)}
        />
      </div>
    </div>
  );
};

export default Index;

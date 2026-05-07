import { useState, useEffect } from 'react';
import { AnimatedPage } from '@/components/AnimatedPage';
import { format, isToday, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useProfile } from '@/hooks/useProfile';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useStreak } from '@/hooks/useStreak';
import { useCustomCheckinQuestions } from '@/hooks/useCustomCheckinQuestions';
import { StreakBadge } from '@/components/StreakBadge';
import { CheckinData } from '@/types/mood';
import { TodayCheckin } from '@/components/TodayCheckin';
import { MissedDayPrompt } from '@/components/MissedDayPrompt';

import { FirstRunTour } from '@/components/FirstRunTour';

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
  const [missedPromptDismissed, setMissedPromptDismissed] = useState(false);
  // Batch over missed days the user has chosen to fill in.
  // dates is sorted oldest -> newest, current index points to date in flight.
  // baselineStreak is the streak the user is *trying to restore* (current + missed
  // count) — we keep displaying that during the whole batch so it feels continuous.
  const [retroBatch, setRetroBatch] = useState<{
    dates: string[];
    index: number;
    baselineStreak: number;
  } | null>(null);
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
    if (result && !isSelectedToday) {
      // We're inside a retroactive flow.
      setTimeout(() => {
        if (retroBatch && retroBatch.index < retroBatch.dates.length - 1) {
          // More missed days to fill in — jump to the next one.
          const nextIndex = retroBatch.index + 1;
          const nextDateStr = retroBatch.dates[nextIndex];
          const nextDate = parseISO(nextDateStr);
          setRetroBatch({ ...retroBatch, index: nextIndex });
          setSelectedDate(nextDate);
          setSearchParams({ date: nextDateStr });
        } else {
          // Batch complete (or single retro day) — return to today.
          setRetroBatch(null);
          setSelectedDate(new Date());
          setSearchParams({});
        }
      }, 3600);
    }
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

  // Show missed-day prompt only when:
  //  - User is viewing today
  //  - Today is not yet checked in
  //  - There are missed days
  //  - User hasn't dismissed the prompt this session
  const shouldShowMissedPrompt =
    !missedPromptDismissed &&
    isToday(selectedDate) &&
    !selectedEntry &&
    streakData.missedDays.length > 0;

  const handlePickMissedDay = (date: Date) => {
    // Build batch: oldest -> newest, so streak restores naturally as we go.
    const dates = [...streakData.missedDays].sort((a, b) => a.localeCompare(b));
    // Baseline streak = what the user is restoring to (potentialStreak captures
    // "if you fill in all missed days"). Falls back to current+missedCount.
    const baseline = streakData.potentialStreak || (streakData.currentStreak + dates.length);
    setRetroBatch({ dates, index: 0, baselineStreak: baseline });
    const firstDateStr = dates[0];
    setSelectedDate(parseISO(firstDateStr));
    setSearchParams({ date: firstDateStr });
    setMissedPromptDismissed(true);
  };

  const handleCheckInToday = () => {
    setMissedPromptDismissed(true);
  };

  // While in a retro batch, show baseline streak so the user feels their
  // original streak is being preserved, not restarted at 1.
  const effectiveStreakData = retroBatch
    ? { ...streakData, currentStreak: Math.max(streakData.currentStreak, retroBatch.baselineStreak) }
    : streakData;

  const retroProgress = retroBatch
    ? { current: retroBatch.index + 1, total: retroBatch.dates.length }
    : undefined;

  return (
    <AnimatedPage className="fixed inset-0 md:relative md:h-screen flex items-center justify-center md:py-4 md:px-5 overflow-hidden">
      <FirstRunTour />
      <div className="w-full h-full md:h-auto md:max-w-xl relative">
        {shouldShowMissedPrompt ? (
          <MissedDayPrompt
            missedDays={streakData.missedDays}
            currentStreak={streakData.currentStreak}
            potentialStreak={streakData.potentialStreak}
            onPickMissedDay={handlePickMissedDay}
            onCheckInToday={handleCheckInToday}
          />
        ) : (
          <TodayCheckin
            todayEntry={selectedEntry} 
            activeMedications={activeMedications}
            medicationsTakenToday={medicationsTakenForDate}
            yearEntries={yearEntries}
            firstName={firstName}
            onSaveCheckin={handleSaveCheckin}
            onToggleMedication={handleToggleMedication}
            preferences={preferences}
            streakData={effectiveStreakData}
            retroProgress={retroProgress}
            customQuestions={customQuestions}
            customAnswers={customAnswers}
            onSaveCustomAnswers={async (answers) => saveAnswers(selectedDateStr, answers)}
            selectedDate={selectedDate}
            onSelectDate={(date) => { setSelectedDate(date); setSearchParams(isToday(date) ? {} : { date: format(date, 'yyyy-MM-dd') }); }}
          />
        )}
      </div>
    </AnimatedPage>
  );
};

export default Index;

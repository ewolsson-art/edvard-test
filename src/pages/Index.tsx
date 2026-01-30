import { format } from 'date-fns';
import { TodayCheckin } from '@/components/TodayCheckin';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { MoodType } from '@/types/mood';

const Index = () => {
  const {
    isLoaded,
    addEntry,
    updateComment,
    getEntryForDate,
  } = useMoodData();

  const {
    isLoaded: medsLoaded,
    activeMedications,
    logMedication,
    isMedicationTakenOnDate,
  } = useMedications();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = getEntryForDate(todayStr);

  const medicationsTakenToday = activeMedications
    .filter(med => isMedicationTakenOnDate(med.id, todayStr))
    .map(med => med.id);

  const handleCheckin = (mood: MoodType, comment?: string) => {
    addEntry(todayStr, mood, comment);
  };

  const handleUpdateComment = (comment: string) => {
    updateComment(todayStr, comment);
  };

  const handleToggleMedication = (medicationId: string, taken: boolean) => {
    logMedication(medicationId, todayStr, taken);
  };

  if (!isLoaded || !medsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <TodayCheckin 
          todayEntry={todayEntry} 
          activeMedications={activeMedications}
          medicationsTakenToday={medicationsTakenToday}
          onCheckin={handleCheckin}
          onUpdateComment={handleUpdateComment}
          onToggleMedication={handleToggleMedication}
        />
      </div>
    </div>
  );
};

export default Index;

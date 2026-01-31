import { format } from 'date-fns';
import { TodayCheckin } from '@/components/TodayCheckin';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useProfile } from '@/hooks/useProfile';
import { CheckinData } from '@/types/mood';

const Index = () => {
  const {
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

  const todayStr = format(new Date(), 'yyyy-MM-dd');
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

  if (!isLoaded || !medsLoaded || profileLoading) {
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
          yearEntries={yearEntries}
          firstName={firstName}
          onSaveCheckin={handleSaveCheckin}
          onToggleMedication={handleToggleMedication}
        />
      </div>
    </div>
  );
};

export default Index;

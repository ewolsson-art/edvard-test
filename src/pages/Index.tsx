import { format } from 'date-fns';
import { TodayCheckin } from '@/components/TodayCheckin';
import { useMoodData } from '@/hooks/useMoodData';
import { MoodType } from '@/types/mood';

const Index = () => {
  const {
    isLoaded,
    addEntry,
    updateComment,
    getEntryForDate,
  } = useMoodData();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = getEntryForDate(todayStr);

  const handleCheckin = (mood: MoodType, comment?: string) => {
    addEntry(todayStr, mood, comment);
  };

  const handleUpdateComment = (comment: string) => {
    updateComment(todayStr, comment);
  };

  if (!isLoaded) {
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
          onCheckin={handleCheckin}
          onUpdateComment={handleUpdateComment}
        />
      </div>
    </div>
  );
};

export default Index;

import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, isToday, startOfDay, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { MoodEntry, MoodType, QualityType, MOOD_ICONS } from '@/types/mood';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Moon, Utensils, Dumbbell, Pill, Calendar, X } from 'lucide-react';

interface Last30DaysOverviewProps {
  entries: MoodEntry[];
  getEntryForDate: (dateStr: string) => MoodEntry | undefined;
  getMedicationsTakenOnDate: (dateStr: string) => { name: string }[];
  activeMedicationsCount: number;
  preferences?: {
    include_mood?: boolean;
    include_sleep?: boolean;
    include_eating?: boolean;
    include_exercise?: boolean;
    include_medication?: boolean;
  };
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
}

interface CategoryStats {
  total: number;
  positive: number;
  negative: number;
  neutral?: number;
  percentage: number;
}

export function Last30DaysOverview({
  entries,
  getEntryForDate,
  getMedicationsTakenOnDate,
  activeMedicationsCount,
  preferences,
  onDayClick,
  onDayDoubleClick,
}: Last30DaysOverviewProps) {
  const firstCheckinDate = useMemo(() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    return startOfDay(new Date(sorted[0].date));
  }, [entries]);

  const last30Days = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, 29);
    return eachDayOfInterval({ start, end: today });
  }, []);

  const stats = useMemo(() => {
    const moodStats: CategoryStats = { total: 0, positive: 0, negative: 0, neutral: 0, percentage: 0 };
    const sleepStats: CategoryStats = { total: 0, positive: 0, negative: 0, percentage: 0 };
    const eatingStats: CategoryStats = { total: 0, positive: 0, negative: 0, percentage: 0 };
    const exerciseStats: CategoryStats = { total: 0, positive: 0, negative: 0, percentage: 0 };
    const medicationStats: CategoryStats = { total: 0, positive: 0, negative: 0, percentage: 0 };

    last30Days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = getEntryForDate(dateStr);
      const meds = getMedicationsTakenOnDate(dateStr);

      // Mood
      if (entry?.mood) {
        moodStats.total++;
        if (entry.mood === 'stable') moodStats.neutral = (moodStats.neutral || 0) + 1;
        else if (entry.mood === 'elevated') moodStats.positive++;
        else if (entry.mood === 'depressed') moodStats.negative++;
      }

      // Sleep
      if (entry?.sleepQuality) {
        sleepStats.total++;
        if (entry.sleepQuality === 'good') sleepStats.positive++;
        else sleepStats.negative++;
      }

      // Eating
      if (entry?.eatingQuality) {
        eatingStats.total++;
        if (entry.eatingQuality === 'good') eatingStats.positive++;
        else eatingStats.negative++;
      }

      // Exercise
      if (entry?.exercised !== undefined) {
        exerciseStats.total++;
        if (entry.exercised) exerciseStats.positive++;
        else exerciseStats.negative++;
      }

      // Medication
      if (activeMedicationsCount > 0 && meds.length > 0) {
        medicationStats.total++;
        if (meds.length >= activeMedicationsCount) medicationStats.positive++;
        else medicationStats.negative++;
      }
    });

    // Calculate percentages
    moodStats.percentage = moodStats.total > 0 
      ? Math.round(((moodStats.positive + (moodStats.neutral || 0)) / moodStats.total) * 100) 
      : 0;
    sleepStats.percentage = sleepStats.total > 0 
      ? Math.round((sleepStats.positive / sleepStats.total) * 100) 
      : 0;
    eatingStats.percentage = eatingStats.total > 0 
      ? Math.round((eatingStats.positive / eatingStats.total) * 100) 
      : 0;
    exerciseStats.percentage = exerciseStats.total > 0 
      ? Math.round((exerciseStats.positive / exerciseStats.total) * 100) 
      : 0;
    medicationStats.percentage = medicationStats.total > 0 
      ? Math.round((medicationStats.positive / medicationStats.total) * 100) 
      : 0;

    return { moodStats, sleepStats, eatingStats, exerciseStats, medicationStats };
  }, [last30Days, getEntryForDate, getMedicationsTakenOnDate, activeMedicationsCount]);

  const showMood = preferences?.include_mood !== false;
  const showSleep = preferences?.include_sleep !== false;
  const showEating = preferences?.include_eating !== false;
  const showExercise = preferences?.include_exercise !== false;
  const showMedication = preferences?.include_medication !== false && activeMedicationsCount > 0;

  const getMoodColor = (mood: MoodType) => {
    switch (mood) {
      case 'elevated': return 'bg-mood-elevated';
      case 'stable': return 'bg-mood-stable';
      case 'depressed': return 'bg-mood-depressed';
      default: return 'bg-muted';
    }
  };

  const getQualityColor = (quality: QualityType | undefined, type: 'sleep' | 'eating') => {
    if (!quality) return 'bg-muted';
    return quality === 'good' ? 'bg-mood-stable' : 'bg-mood-depressed';
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 70) return <TrendingUp className="w-4 h-4 text-mood-stable" />;
    if (percentage <= 30) return <TrendingDown className="w-4 h-4 text-mood-depressed" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    stats: cardStats, 
    positiveLabel,
    negativeLabel,
    neutralLabel,
  }: { 
    icon: typeof Moon;
    label: string;
    stats: CategoryStats;
    positiveLabel: string;
    negativeLabel: string;
    neutralLabel?: string;
  }) => (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{cardStats.percentage}%</span>
          {getTrendIcon(cardStats.percentage)}
        </div>
      </div>
      <div className="flex gap-2 text-sm text-muted-foreground">
        <span className="text-mood-stable">{cardStats.positive} {positiveLabel}</span>
        {neutralLabel && cardStats.neutral !== undefined && (
          <>
            <span>·</span>
            <span className="text-primary">{cardStats.neutral} {neutralLabel}</span>
          </>
        )}
        <span>·</span>
        <span className="text-mood-depressed">{cardStats.negative} {negativeLabel}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {cardStats.total} av 30 dagar registrerade
      </div>
    </div>
  );

  // Don't show 30-day stats if user hasn't been using the service for 30 days
  const hasEnoughHistory = firstCheckinDate && differenceInDays(startOfDay(new Date()), firstCheckinDate) >= 29;

  if (!hasEnoughHistory) {
    return (
      <div className="glass-card p-6 space-y-4 fade-in">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="font-display text-xl font-semibold">Senaste 30 dagarna</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Det finns inte tillräckligt med data ännu. Statistiken visas när du har använt tjänsten i minst 30 dagar.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6 fade-in">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary" />
        <h2 className="font-display text-xl font-semibold">Senaste 30 dagarna</h2>
      </div>

      {/* Mini calendar grid */}
      <div>
        <div className="flex gap-1 flex-wrap">
          {last30Days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = getEntryForDate(dateStr);
            const isTodayDate = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => onDayClick?.(day)}
                onDoubleClick={() => onDayDoubleClick?.(day)}
                className={cn(
                  "w-7 h-7 rounded-md text-xs font-medium transition-all hover:scale-110 relative",
                  "flex items-center justify-center",
                  entry?.mood ? getMoodColor(entry.mood) : 'bg-muted',
                  isTodayDate && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                title={`${format(day, 'EEEE d MMMM', { locale: sv })}${entry?.mood ? ` - ${MOOD_ICONS[entry.mood]}` : ''}`}
              >
                {format(day, 'd')}
                {!isTodayDate && !entry?.mood && (
                  <X className="absolute inset-0 m-auto h-full w-full p-1 text-destructive opacity-40" strokeWidth={2.5} />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Klicka på en dag för att se detaljer
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {showMood && (
          <StatCard
            icon={Calendar}
            label="Mående"
            stats={stats.moodStats}
            positiveLabel="uppvarvade"
            neutralLabel="stabila"
            negativeLabel="nedstämda"
          />
        )}
        
        {showSleep && (
          <StatCard
            icon={Moon}
            label="Sömn"
            stats={stats.sleepStats}
            positiveLabel="bra"
            negativeLabel="dåliga"
          />
        )}
        
        {showEating && (
          <StatCard
            icon={Utensils}
            label="Kost"
            stats={stats.eatingStats}
            positiveLabel="bra"
            negativeLabel="dåliga"
          />
        )}
        
        {showExercise && (
          <StatCard
            icon={Dumbbell}
            label="Träning"
            stats={stats.exerciseStats}
            positiveLabel="tränade"
            negativeLabel="vilade"
          />
        )}
        
        {showMedication && (
          <StatCard
            icon={Pill}
            label="Medicin"
            stats={stats.medicationStats}
            positiveLabel="tagna"
            negativeLabel="missade"
          />
        )}
      </div>
    </div>
  );
}

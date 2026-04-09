import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOOD_LABELS, MOOD_ICONS, MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';
import { usePatientMoodData } from '@/hooks/usePatientMoodData';
import { usePatientMedications } from '@/hooks/usePatientMedications';
import { usePatientDiagnoses } from '@/hooks/usePatientDiagnoses';
import { useRelativeComments } from '@/hooks/useRelativeComments';
import { PatientConnection } from '@/hooks/useDoctorConnections';
import { MoodStats } from '@/components/MoodStats';
import { ExerciseStats, ExerciseStatsType } from '@/components/ExerciseStats';
import { SleepStats, SleepStatsType } from '@/components/SleepStats';
import { EatingStats, EatingStatsType } from '@/components/EatingStats';
import { WeekCalendar } from '@/components/WeekCalendar';
import { MonthCalendar } from '@/components/MonthCalendar';
import { ExerciseMonthCalendar } from '@/components/ExerciseMonthCalendar';
import { ExerciseWeekCalendar } from '@/components/ExerciseWeekCalendar';
import { ExerciseYearHeatmap } from '@/components/ExerciseYearHeatmap';
import { SleepMonthCalendar } from '@/components/SleepMonthCalendar';
import { SleepWeekCalendar } from '@/components/SleepWeekCalendar';
import { SleepYearHeatmap } from '@/components/SleepYearHeatmap';
import { EatingMonthCalendar } from '@/components/EatingMonthCalendar';
import { EatingWeekCalendar } from '@/components/EatingWeekCalendar';
import { EatingYearHeatmap } from '@/components/EatingYearHeatmap';
import { YearHeatmap } from '@/components/YearHeatmap';
import { RelativeCommentDialog } from '@/components/RelativeCommentDialog';
import { PatientAIInsights } from '@/components/PatientAIInsights';
import { PatientCharacteristics } from '@/components/PatientCharacteristics';
import { MoodStats as MoodStatsType, ExerciseType, QualityType } from '@/types/mood';
import { Loader2, ChevronLeft, Radio, Pill, Check, X, Moon, Utensils, Dumbbell, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PatientOverviewProps {
  connection: PatientConnection;
  onBack: () => void;
  hideExtras?: boolean;
}

type ViewType = 'week' | 'month' | 'year';

export function PatientOverview({ connection, onBack, hideExtras = false }: PatientOverviewProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  
  // State for relative comment dialog
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedDateForComment, setSelectedDateForComment] = useState<Date | null>(null);
  
  // Check if this is a relative viewing
  const isRelativeViewing = true; // simplified after chat removal

  const { entries, isLoaded: moodLoaded, getEntryForDate, getEntriesForMonth, getEntriesForYear, getStatsForYear } = usePatientMoodData({
    patientId: connection.patient_id,
  });
  const { activeMedications, inactiveMedications, isLoaded: medsLoaded } = usePatientMedications({
    patientId: connection.patient_id,
  });
  const { diagnoses, isLoading: diagnosesLoading } = usePatientDiagnoses({
    patientId: connection.patient_id,
  });
  
  // Relative comments - only fetch for relatives
  const { 
    getCommentForDate, 
    getCommentsMap, 
    saveComment, 
    deleteComment 
  } = useRelativeComments({
    patientId: isRelativeViewing ? connection.patient_id : null,
  });

  const isLoaded = moodLoaded && medsLoaded && !diagnosesLoading;

  // Get most recent mood entry
  const latestMoodEntry = useMemo(() => {
    if (entries.length === 0) return null;
    // Entries are sorted by date, get the most recent one
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0];
  }, [entries]);

  const patientName = useMemo(() => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    return connection.patient_email || 'Användare';
  }, [connection]);

  // Week data
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'd MMM', { locale: sv })} – ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: sv });

  // Week stats
  const weekStats = useMemo((): MoodStatsType => {
    let elevated = 0, somewhat_elevated = 0, stable = 0, somewhat_depressed = 0, depressed = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.mood === 'elevated') elevated++;
      else if (entry?.mood === 'somewhat_elevated') somewhat_elevated++;
      else if (entry?.mood === 'stable') stable++;
      else if (entry?.mood === 'somewhat_depressed') somewhat_depressed++;
      else if (entry?.mood === 'depressed') depressed++;
    });
    const total = elevated + somewhat_elevated + stable + somewhat_depressed + depressed;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { elevated, somewhat_elevated, stable, somewhat_depressed, depressed, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  const weekExerciseStats = useMemo((): ExerciseStatsType => {
    let exercised = 0, notExercised = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.exercised === true) exercised++;
      else if (entry?.exercised === false) notExercised++;
    });
    const total = exercised + notExercised;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { exercised, notExercised, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  const weekSleepStats = useMemo((): SleepStatsType => {
    let good = 0, bad = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.sleepQuality === 'good') good++;
      else if (entry?.sleepQuality === 'bad') bad++;
    });
    const total = good + bad;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  const weekEatingStats = useMemo((): EatingStatsType => {
    let good = 0, bad = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.eatingQuality === 'good') good++;
      else if (entry?.eatingQuality === 'bad') bad++;
    });
    const total = good + bad;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [weekDays, getEntryForDate]);

  // Month data
  const monthMoodData = useMemo(() => {
    return getEntriesForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, getEntriesForMonth]);

  const monthStats = useMemo((): MoodStatsType => {
    let elevated = 0, somewhat_elevated = 0, stable = 0, somewhat_depressed = 0, depressed = 0;
    Object.values(monthMoodData).forEach(mood => {
      if (mood === 'elevated') elevated++;
      else if (mood === 'somewhat_elevated') somewhat_elevated++;
      else if (mood === 'stable') stable++;
      else if (mood === 'somewhat_depressed') somewhat_depressed++;
      else if (mood === 'depressed') depressed++;
    });
    const total = elevated + somewhat_elevated + stable + somewhat_depressed + depressed;
    const end = endOfMonth(currentMonth);
    const totalDays = end.getDate();
    const unregistered = totalDays - total;
    return { elevated, somewhat_elevated, stable, somewhat_depressed, depressed, unregistered, total, totalDays };
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
    const result: Record<number, QualityType> = {};
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
    const result: Record<number, QualityType> = {};
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

  // Year data
  const yearEntries = useMemo(() => {
    return getEntriesForYear(currentYear);
  }, [currentYear, getEntriesForYear]);

  const yearStats = useMemo(() => {
    return getStatsForYear(currentYear);
  }, [currentYear, getStatsForYear]);

  const yearExerciseStats = useMemo((): ExerciseStatsType => {
    let exercised = 0, notExercised = 0;
    yearEntries.forEach(entry => {
      if (entry.exercised === true) exercised++;
      else if (entry.exercised === false) notExercised++;
    });
    const total = exercised + notExercised;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { exercised, notExercised, unregistered, total, totalDays };
  }, [yearEntries, currentYear]);

  const yearSleepStats = useMemo((): SleepStatsType => {
    let good = 0, bad = 0;
    yearEntries.forEach(entry => {
      if (entry.sleepQuality === 'good') good++;
      else if (entry.sleepQuality === 'bad') bad++;
    });
    const total = good + bad;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [yearEntries, currentYear]);

  const yearEatingStats = useMemo((): EatingStatsType => {
    let good = 0, bad = 0;
    yearEntries.forEach(entry => {
      if (entry.eatingQuality === 'good') good++;
      else if (entry.eatingQuality === 'bad') bad++;
    });
    const total = good + bad;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const unregistered = totalDays - total;
    return { good, bad, unregistered, total, totalDays };
  }, [yearEntries, currentYear]);

  // Helper to get stats for current view
  const getStatsForView = () => {
    switch (view) {
      case 'week': return {
        stats: weekStats,
        exerciseStats: weekExerciseStats,
        sleepStats: weekSleepStats,
        eatingStats: weekEatingStats,
        label: weekLabel
      };
      case 'month': return {
        stats: monthStats,
        exerciseStats: monthExerciseStats,
        sleepStats: monthSleepStats,
        eatingStats: monthEatingStats,
        label: monthLabel
      };
      case 'year': return {
        stats: yearStats,
        exerciseStats: yearExerciseStats,
        sleepStats: yearSleepStats,
        eatingStats: yearEatingStats,
        label: `${currentYear}`
      };
    }
  };

  const { stats, exerciseStats, sleepStats, eatingStats, label } = getStatsForView();

  const handlePrevWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handlePrevYear = () => setCurrentYear(prev => prev - 1);
  const handleNextYear = () => setCurrentYear(prev => prev + 1);

  const handleMonthClick = (month: number) => {
    setCurrentMonth(new Date(currentYear, month, 1));
    setView('month');
  };

  // Handle double-click on calendar day for relative comments
  const handleDayDoubleClick = (date: Date) => {
    if (!isRelativeViewing) return;
    setSelectedDateForComment(date);
    setCommentDialogOpen(true);
  };

  // Get existing comment for selected date
  const existingCommentForDialog = selectedDateForComment 
    ? getCommentForDate(format(selectedDateForComment, 'yyyy-MM-dd'))?.comment 
    : undefined;

  // Get relative comments data for the current month
  const monthRelativeCommentsData = useMemo(() => {
    if (!isRelativeViewing) return {};
    return getCommentsMap();
  }, [isRelativeViewing, getCommentsMap]);




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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg font-semibold">{patientName}</h2>
          {latestMoodEntry && (
            <p className="text-sm text-muted-foreground/60 mt-0.5">
              Senaste: {MOOD_LABELS[latestMoodEntry.mood as MoodType]}
              {latestMoodEntry.date && (
                <span> · {format(new Date(latestMoodEntry.date), 'd MMM', { locale: sv })}</span>
              )}
            </p>
          )}
          {!latestMoodEntry && (
            <p className="text-sm text-muted-foreground/40 mt-0.5">Ingen incheckning ännu</p>
          )}
        </div>
      </div>

      {!hideExtras && diagnoses.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Diagnoser</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {diagnoses.map((diagnosis) => (
              <Badge key={diagnosis.id} variant="secondary" className="text-sm">
                {diagnosis.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* View tabs */}
      <div className="flex items-center gap-4">
        <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="flex-1 max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Idag</TabsTrigger>
            <TabsTrigger value="month">Månad</TabsTrigger>
            <TabsTrigger value="year">År</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats and calendars based on what's shared */}
      <div className="space-y-8">
        {connection.share_mood && (
          <section>
            <div>
              {view === 'week' && (() => {
                const today = format(new Date(), 'yyyy-MM-dd');
                const todayEntry = getEntryForDate(today);
                
                const getMoodColor = (mood: MoodType) => {
                  if (mood === 'elevated' || mood === 'somewhat_elevated') return 'text-mood-elevated';
                  if (mood === 'depressed' || mood === 'somewhat_depressed') return 'text-mood-depressed';
                  return 'text-mood-stable';
                };
                
                const getMoodGlow = (mood: MoodType) => {
                  if (mood === 'elevated' || mood === 'somewhat_elevated') return 'shadow-[0_0_12px_hsl(var(--mood-elevated)/0.4)]';
                  if (mood === 'depressed' || mood === 'somewhat_depressed') return 'shadow-[0_0_12px_hsl(var(--mood-depressed)/0.4)]';
                  return 'shadow-[0_0_12px_hsl(var(--mood-stable)/0.4)]';
                };
                
                const getMoodBg = (mood: MoodType) => {
                  if (mood === 'elevated' || mood === 'somewhat_elevated') return 'bg-mood-elevated/20';
                  if (mood === 'depressed' || mood === 'somewhat_depressed') return 'bg-mood-depressed/20';
                  return 'bg-mood-stable/20';
                };

                return (
                  <div className="space-y-5">
                    <p className="text-xs text-muted-foreground/40 font-medium uppercase tracking-wider">
                      {format(new Date(), 'EEEE d MMMM yyyy', { locale: sv })}
                    </p>
                    {todayEntry ? (
                      <div className="space-y-5">
                        {/* Mood indicator */}
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center animate-scale-in",
                            getMoodBg(todayEntry.mood),
                            getMoodGlow(todayEntry.mood)
                          )}>
                            <div className={cn(
                              "w-4 h-4 rounded-full",
                              todayEntry.mood === 'elevated' || todayEntry.mood === 'somewhat_elevated' ? 'bg-mood-elevated' :
                              todayEntry.mood === 'depressed' || todayEntry.mood === 'somewhat_depressed' ? 'bg-mood-depressed' :
                              'bg-mood-stable'
                            )} />
                          </div>
                          <div>
                            <span className="text-2xl font-semibold text-foreground/80">
                              {MOOD_LABELS[todayEntry.mood]}
                            </span>
                            <p className="text-xs text-muted-foreground/40 mt-0.5">
                              Incheckad {format(new Date(todayEntry.timestamp), 'HH:mm', { locale: sv })}
                            </p>
                          </div>
                        </div>

                        {todayEntry.comment && (
                          <p className="text-sm text-muted-foreground/60 leading-relaxed">
                            "{todayEntry.comment}"
                          </p>
                        )}

                        <div className="space-y-2 pt-1">
                          {todayEntry.energyLevel && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground/50">Energi</span>
                              <span className="text-foreground/60">{todayEntry.energyLevel === 'low' ? 'Låg' : todayEntry.energyLevel === 'normal' ? 'Normal' : 'Hög'}</span>
                            </div>
                          )}
                          {todayEntry.eatingQuality && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground/50">Kost</span>
                              <span className="text-foreground/60">{todayEntry.eatingQuality === 'good' ? 'Bra' : todayEntry.eatingQuality === 'bad' ? 'Dålig' : 'Helt ok'}</span>
                            </div>
                          )}
                          {todayEntry.exercised !== undefined && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground/50">Träning</span>
                              <span className="text-foreground/60">{todayEntry.exercised ? 'Ja' : 'Nej'}</span>
                            </div>
                          )}
                        </div>

                        {todayEntry.tags && todayEntry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {todayEntry.tags.map((tag, i) => (
                              <span key={i} className="text-xs text-muted-foreground/50 bg-foreground/[0.04] px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground/40">Har inte checkat in idag</p>
                    )}
                  </div>
                );
              })()}
              {view === 'month' && (
                <MonthCalendar
                  currentDate={currentMonth}
                  moodData={monthMoodData}
                  relativeCommentsData={monthRelativeCommentsData}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onDayDoubleClick={handleDayDoubleClick}
                />
              )}
              {view === 'year' && (
                <YearHeatmap
                  year={currentYear}
                  entries={yearEntries}
                  onPrevYear={handlePrevYear}
                  onNextYear={handleNextYear}
                  onMonthClick={handleMonthClick}
                />
              )}
            </div>
          </section>
        )}

        {/* AI Insights Section - only for doctors */}
        {!isRelativeViewing && (
          <PatientAIInsights
            entries={entries}
            stats={stats}
            periodLabel={label}
            view={view}
            patientName={patientName}
            isShared={'share_ai_insights' in connection && connection.share_ai_insights === true}
          />
        )}

        {/* No data shared message */}
        {!connection.share_mood && !connection.share_sleep && !connection.share_eating && !connection.share_exercise && !connection.share_medication && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Användaren delar ingen data med dig.</p>
          </div>
        )}
      </div>

      {/* Relative comment dialog */}
      {isRelativeViewing && (
        <RelativeCommentDialog
          open={commentDialogOpen}
          onOpenChange={setCommentDialogOpen}
          date={selectedDateForComment}
          existingComment={existingCommentForDialog}
          onSave={saveComment}
          onDelete={deleteComment}
        />
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MoodStats as MoodStatsType, ExerciseType } from '@/types/mood';
import { Loader2, ChevronLeft, Radio, Pill, Check, X, MessageSquare, Moon, Utensils, Dumbbell, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PatientOverviewProps {
  connection: PatientConnection;
  onBack: () => void;
  onToggleChatEnabled?: (connectionId: string, enabled: boolean) => Promise<boolean>;
}

type ViewType = 'week' | 'month' | 'year';

export function PatientOverview({ connection, onBack, onToggleChatEnabled }: PatientOverviewProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isChatToggling, setIsChatToggling] = useState(false);
  
  // State for relative comment dialog
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedDateForComment, setSelectedDateForComment] = useState<Date | null>(null);
  
  // Check if this is a relative viewing (no chat toggle means relative)
  const isRelativeViewing = !onToggleChatEnabled;
  
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
    return connection.patient_email || 'Patient';
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
    let elevated = 0, stable = 0, depressed = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.mood === 'elevated') elevated++;
      if (entry?.mood === 'stable') stable++;
      if (entry?.mood === 'depressed') depressed++;
    });
    const total = elevated + stable + depressed;
    const totalDays = weekDays.length;
    const unregistered = totalDays - total;
    return { elevated, stable, depressed, unregistered, total, totalDays };
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

  const handleChatToggle = async (enabled: boolean) => {
    if (!onToggleChatEnabled) return;
    setIsChatToggling(true);
    await onToggleChatEnabled(connection.id, enabled);
    setIsChatToggling(false);
  };

  const handleOpenChat = () => {
    navigate(`/lakare-chatt?patient=${connection.patient_id}`);
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
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-semibold">{patientName}</h2>
            {latestMoodEntry && (
              <div 
                className={`w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-background ${
                  latestMoodEntry.mood === 'elevated' 
                    ? 'bg-mood-elevated ring-mood-elevated/30' 
                    : latestMoodEntry.mood === 'stable' 
                      ? 'bg-mood-stable ring-mood-stable/30' 
                      : 'bg-mood-depressed ring-mood-depressed/30'
                }`}
                title={`Senaste mående: ${latestMoodEntry.mood === 'elevated' ? 'Uppvarvad' : latestMoodEntry.mood === 'stable' ? 'Stabil' : 'Nedstämd'}`}
              />
            )}
          </div>
          {connection.patient_email && connection.patient_profile?.first_name && (
            <p className="text-sm text-muted-foreground">{connection.patient_email}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Live</span>
          </div>
          {onToggleChatEnabled && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleOpenChat}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chatt
            </Button>
          )}
        </div>
      </div>

      {/* Diagnoses section - only for doctors */}
      {onToggleChatEnabled && diagnoses.length > 0 && (
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

      {/* Chat toggle setting - only for doctors */}
      {onToggleChatEnabled && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="chat-toggle" className="font-medium">Tillåt chatt med patient</Label>
                <p className="text-sm text-muted-foreground">
                  Patienten kan skicka meddelanden till dig när aktiverat
                </p>
              </div>
            </div>
            <Switch
              id="chat-toggle"
              checked={connection.chat_enabled}
              onCheckedChange={handleChatToggle}
              disabled={isChatToggling}
            />
          </div>
        </div>
      )}

      {/* View tabs */}
      <div className="flex items-center gap-4">
        <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="flex-1 max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Vecka</TabsTrigger>
            <TabsTrigger value="month">Månad</TabsTrigger>
            <TabsTrigger value="year">År</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats and calendars based on what's shared */}
      <div className="space-y-8">
        {connection.share_mood && (
          <section>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold">Mående</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setCurrentWeek(today);
                    setCurrentMonth(today);
                    setCurrentYear(today.getFullYear());
                  }}
                >
                  Idag
                </Button>
              </div>
              {isRelativeViewing && view === 'month' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Dubbelklicka på ett datum för att lägga till egen anteckning
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {view === 'week' && (
                <WeekCalendar
                  weekDays={weekDays}
                  weekLabel={weekLabel}
                  getEntryForDate={getEntryForDate}
                  getMedicationsTakenOnDate={() => []}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                />
              )}
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
              <div className="lg:self-start">
                <MoodStats stats={stats} periodLabel={label} />
              </div>
            </div>
          </section>
        )}

        {/* Sleep */}
        {connection.share_sleep && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Moon className="w-6 h-6 text-primary" />
              <h3 className="font-display text-2xl font-semibold">Sömn</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {view === 'week' && (
                <SleepWeekCalendar
                  weekDays={weekDays}
                  weekLabel={weekLabel}
                  getSleepForDate={(dateStr) => getEntryForDate(dateStr)?.sleepQuality}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                />
              )}
              {view === 'month' && (
                <SleepMonthCalendar
                  currentDate={currentMonth}
                  sleepData={monthSleepData}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                />
              )}
              {view === 'year' && (
                <SleepYearHeatmap
                  year={currentYear}
                  entries={yearEntries}
                  onPrevYear={handlePrevYear}
                  onNextYear={handleNextYear}
                  onMonthClick={handleMonthClick}
                />
              )}
              <div className="lg:self-start">
                <SleepStats stats={sleepStats} periodLabel={label} />
              </div>
            </div>
          </section>
        )}

        {/* Eating */}
        {connection.share_eating && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Utensils className="w-6 h-6 text-primary" />
              <h3 className="font-display text-2xl font-semibold">Kost</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {view === 'week' && (
                <EatingWeekCalendar
                  weekDays={weekDays}
                  weekLabel={weekLabel}
                  getEatingForDate={(dateStr) => getEntryForDate(dateStr)?.eatingQuality}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                />
              )}
              {view === 'month' && (
                <EatingMonthCalendar
                  currentDate={currentMonth}
                  eatingData={monthEatingData}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                />
              )}
              {view === 'year' && (
                <EatingYearHeatmap
                  year={currentYear}
                  entries={yearEntries}
                  onPrevYear={handlePrevYear}
                  onNextYear={handleNextYear}
                  onMonthClick={handleMonthClick}
                />
              )}
              <div className="lg:self-start">
                <EatingStats stats={eatingStats} periodLabel={label} />
              </div>
            </div>
          </section>
        )}

        {/* Exercise */}
        {connection.share_exercise && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Dumbbell className="w-6 h-6 text-primary" />
              <h3 className="font-display text-2xl font-semibold">Träning</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {view === 'week' && (
                <ExerciseWeekCalendar
                  weekDays={weekDays}
                  weekLabel={weekLabel}
                  getExerciseForDate={(dateStr) => {
                    const entry = getEntryForDate(dateStr);
                    if (entry?.exercised === undefined) return undefined;
                    return { exercised: entry.exercised, types: entry.exerciseTypes };
                  }}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                />
              )}
              {view === 'month' && (
                <ExerciseMonthCalendar
                  currentDate={currentMonth}
                  exerciseData={monthExerciseData}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                />
              )}
              {view === 'year' && (
                <ExerciseYearHeatmap
                  year={currentYear}
                  entries={yearEntries}
                  onPrevYear={handlePrevYear}
                  onNextYear={handleNextYear}
                  onMonthClick={handleMonthClick}
                />
              )}
              <div className="lg:self-start">
                <ExerciseStats stats={exerciseStats} periodLabel={label} />
              </div>
            </div>
          </section>
        )}

        {/* Medications */}
        {connection.share_medication && (
          <section className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Läkemedel
            </h3>
            
            {activeMedications.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Aktiva mediciner</h4>
                <div className="grid gap-3">
                  {activeMedications.map((med) => (
                    <div
                      key={med.id}
                      className="glass-card p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-muted-foreground">{med.dosage}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Sedan {format(new Date(med.started_at), 'd MMM yyyy', { locale: sv })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inactiveMedications.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Avslutade mediciner</h4>
                <div className="grid gap-2">
                  {inactiveMedications.map((med) => (
                    <div
                      key={med.id}
                      className="glass-card p-3 flex items-center justify-between opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{med.name}</p>
                          <p className="text-xs text-muted-foreground">{med.dosage}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMedications.length === 0 && inactiveMedications.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p>Inga läkemedel registrerade.</p>
              </div>
            )}
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
            <p>Patienten delar ingen data med dig.</p>
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

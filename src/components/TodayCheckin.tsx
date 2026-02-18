import { useState, useEffect, useMemo, useRef } from 'react';
import { format, differenceInDays, parseISO, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Zap, Sun, CloudRain, MessageSquare, CheckCircle2, Pill, Pencil, Moon, Utensils, Dumbbell, ThumbsUp, ThumbsDown, Check, X, ChevronRight, ChevronLeft, Heart, AlertTriangle, HelpCircle, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoodType, MoodEntry, MOOD_LABELS, QualityType, QUALITY_LABELS, CheckinData } from '@/types/mood';
import { Medication } from '@/types/medication';
import { UserPreferences } from '@/hooks/useUserPreferences';
import { CustomQuestion } from '@/hooks/useCustomCheckinQuestions';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { StreakBadge } from '@/components/StreakBadge';
import { CelebrationAnimation } from '@/components/CelebrationAnimation';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  hasCheckedInToday: boolean;
  lastCheckinDate: string | null;
}

interface TodayCheckinProps {
  todayEntry: MoodEntry | undefined;
  activeMedications: Medication[];
  medicationsTakenToday: string[];
  yearEntries: MoodEntry[];
  firstName: string | null;
  onSaveCheckin: (data: CheckinData) => Promise<boolean>;
  onToggleMedication: (medicationId: string, taken: boolean) => void;
  preferences: UserPreferences | null;
  streakData: StreakData;
  customQuestions?: CustomQuestion[];
  customAnswers?: Record<string, string>;
  onSaveCustomAnswers?: (answers: Record<string, string>) => Promise<boolean>;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

const moodButtons: { mood: MoodType; icon: typeof Zap; label: string; cssClass: string }[] = [
  { mood: 'elevated', icon: Zap, label: MOOD_LABELS.elevated, cssClass: 'mood-btn-elevated' },
  { mood: 'stable', icon: Sun, label: MOOD_LABELS.stable, cssClass: 'mood-btn-stable' },
  { mood: 'depressed', icon: CloudRain, label: MOOD_LABELS.depressed, cssClass: 'mood-btn-depressed' },
];

type Step = 'mood' | 'sleep' | 'eating' | 'exercise' | 'medication' | 'custom_questions' | 'success-animation' | 'complete';

// Default steps - will be filtered based on preferences
const ALL_STEPS: Step[] = ['mood', 'sleep', 'eating', 'exercise', 'medication', 'custom_questions'];

export function TodayCheckin({ 
  todayEntry, 
  activeMedications,
  medicationsTakenToday,
  yearEntries,
  firstName,
  onSaveCheckin,
  onToggleMedication,
  preferences,
  streakData,
  customQuestions = [],
  customAnswers: initialCustomAnswers = {},
  onSaveCustomAnswers,
  selectedDate: selectedDateProp,
  onSelectDate,
}: TodayCheckinProps) {
  const displayDate = selectedDateProp || new Date();
  const isDisplayToday = isToday(displayDate);
  const formattedDate = format(displayDate, "EEEE d MMMM", { locale: sv });

  // Build dynamic steps based on preferences
  const STEPS = useMemo(() => {
    const steps: Step[] = ['mood']; // Mood is always included
    
    if (preferences?.include_sleep) steps.push('sleep');
    if (preferences?.include_eating) steps.push('eating');
    if (preferences?.include_exercise) steps.push('exercise');
    if (preferences?.include_medication) steps.push('medication');
    if (customQuestions.length > 0) steps.push('custom_questions');
    
    return steps;
  }, [preferences, customQuestions.length]);

  // Calculate encouragement data for depressed mood
  const encouragementData = useMemo(() => {
    const goodDays = yearEntries.filter(e => e.mood === 'stable' || e.mood === 'elevated');
    const goodDaysCount = goodDays.length;
    
    // Find the most recent good day
    const sortedGoodDays = goodDays
      .map(e => ({ ...e, dateObj: parseISO(e.date) }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    
    const lastGoodDay = sortedGoodDays[0];
    const daysSinceGood = lastGoodDay 
      ? differenceInDays(displayDate, lastGoodDay.dateObj)
      : null;
    
    return { goodDaysCount, daysSinceGood };
  }, [yearEntries, displayDate]);
  
  const [currentStep, setCurrentStep] = useState<Step>('mood');
  const [isEditing, setIsEditing] = useState(false);
  const [showComment, setShowComment] = useState<Step | null>(null);
  const commentRef = useRef<HTMLDivElement>(null);
  
  // Form data
  const [checkinData, setCheckinData] = useState<CheckinData>({});
  const [customAnswersState, setCustomAnswersState] = useState<Record<string, string>>(initialCustomAnswers);

  // Scroll comment area into view when shown
  useEffect(() => {
    if (showComment && commentRef.current) {
      setTimeout(() => {
        commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [showComment]);

  // Reset state when date changes
  useEffect(() => {
    setCurrentStep('mood');
    setIsEditing(false);
    setShowComment(null);
  }, [displayDate.toDateString()]);

  // Load existing entry data
  useEffect(() => {
    if (todayEntry) {
      setCheckinData({
        mood: todayEntry.mood,
        moodComment: todayEntry.comment,
        sleepQuality: todayEntry.sleepQuality,
        sleepComment: todayEntry.sleepComment,
        eatingQuality: todayEntry.eatingQuality,
        eatingComment: todayEntry.eatingComment,
        exercised: todayEntry.exercised,
        exerciseComment: todayEntry.exerciseComment,
      });
    } else {
      setCheckinData({});
    }
  }, [todayEntry, displayDate.toDateString()]);

  // Check if checkin is complete based on active preferences
  const isCheckinComplete = useMemo(() => {
    if (!todayEntry?.mood) return false;
    if (preferences?.include_sleep && todayEntry?.sleepQuality === undefined) return false;
    if (preferences?.include_eating && todayEntry?.eatingQuality === undefined) return false;
    if (preferences?.include_exercise && todayEntry?.exercised === undefined) return false;
    return true;
  }, [todayEntry, preferences]);

  // Helper to get next step in the flow
  const getNextStep = (currentStep: Step): Step | 'success-animation' => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex === STEPS.length - 1) {
      return 'success-animation';
    }
    return STEPS[currentIndex + 1];
  };

  // Helper to check if current step is the last one
  const isLastStep = (step: Step): boolean => {
    return STEPS.indexOf(step) === STEPS.length - 1;
  };

  const handleMoodSelect = (mood: MoodType) => {
    setCheckinData(prev => ({ ...prev, mood }));
    const nextStep = getNextStep('mood');
    if (nextStep === 'success-animation') {
      // Only mood is enabled, complete right away
      handleCompleteWithData({ ...checkinData, mood });
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleSleepSelect = (quality: QualityType) => {
    setCheckinData(prev => ({ ...prev, sleepQuality: quality }));
    const nextStep = getNextStep('sleep');
    if (nextStep === 'success-animation') {
      handleCompleteWithData({ ...checkinData, sleepQuality: quality });
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleEatingSelect = (quality: QualityType) => {
    setCheckinData(prev => ({ ...prev, eatingQuality: quality }));
    const nextStep = getNextStep('eating');
    if (nextStep === 'success-animation') {
      handleCompleteWithData({ ...checkinData, eatingQuality: quality });
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleExerciseSelect = (exercised: boolean) => {
    setCheckinData(prev => ({ ...prev, exercised }));
    const nextStep = getNextStep('exercise');
    if (nextStep === 'success-animation') {
      handleCompleteWithData({ ...checkinData, exercised });
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleCompleteWithData = async (data: CheckinData) => {
    const success = await onSaveCheckin(data);
    if (success) {
      setCurrentStep('success-animation');
      setTimeout(() => {
        setCurrentStep('complete');
        setIsEditing(false);
      }, 2000);
    }
  };

  const handleComplete = async () => {
    const success = await onSaveCheckin(checkinData);
    if (success) {
      setCurrentStep('success-animation');
      // Show animation for 2 seconds, then show complete state
      setTimeout(() => {
        setCurrentStep('complete');
        setIsEditing(false);
      }, 2000);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setCurrentStep('mood');
  };

  const getStepProgress = () => {
    const stepIndex = STEPS.indexOf(currentStep);
    if (currentStep === 'complete' || isCheckinComplete) return 100;
    return ((stepIndex) / STEPS.length) * 100;
  };

  const goBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const updateComment = (step: Step, comment: string) => {
    switch (step) {
      case 'mood':
        setCheckinData(prev => ({ ...prev, moodComment: comment }));
        break;
      case 'sleep':
        setCheckinData(prev => ({ ...prev, sleepComment: comment }));
        break;
      case 'eating':
        setCheckinData(prev => ({ ...prev, eatingComment: comment }));
        break;
      case 'exercise':
        setCheckinData(prev => ({ ...prev, exerciseComment: comment }));
        break;
    }
  };

  const hasMedications = activeMedications.length > 0;

  // Show complete state
  if (isCheckinComplete && !isEditing) {
    return (
      <div className="glass-card p-6 md:p-8 fade-in max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="text-center mb-4">
          <p className="text-muted-foreground text-base capitalize">{formattedDate}</p>
          {!isDisplayToday && (
            <p className="text-xs text-primary mt-1">Retroaktiv incheckning</p>
          )}
        </div>

        <div className="text-center fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-mood-stable/20 mb-4">
            <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-mood-stable" />
          </div>
          
          <h1 className="font-display text-xl md:text-2xl font-bold mb-1 text-mood-stable">
            Du har checkat in!
          </h1>

          {/* Streak badge */}
          {streakData.currentStreak > 0 && (
            <div className="max-w-md mx-auto mt-3">
              <StreakBadge 
                currentStreak={streakData.currentStreak}
                longestStreak={streakData.longestStreak}
                hasCheckedInToday={streakData.hasCheckedInToday}
              />
            </div>
          )}

          {/* Encouragement message for depressed mood */}
          {todayEntry?.mood === 'depressed' && (
            <div className="max-w-md mx-auto mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                Det är tufft just nu, men bättre dagar kommer. <span className="text-primary font-medium">Håll ut! 💪</span>
                {encouragementData.goodDaysCount > 0 && (
                  <>
                    {' '}Du mådde bra för{' '}
                    <strong>{encouragementData.daysSinceGood !== null ? encouragementData.daysSinceGood : '?'} {encouragementData.daysSinceGood === 1 ? 'dag' : 'dagar'}</strong> sen
                    {' '}och du har mått bra <strong>{encouragementData.goodDaysCount} {encouragementData.goodDaysCount === 1 ? 'dag' : 'dagar'}</strong> i år.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="max-w-md mx-auto mt-4 space-y-2 text-left">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
              {todayEntry?.mood === 'elevated' && <Zap className="w-5 h-5 text-mood-elevated" />}
              {todayEntry?.mood === 'stable' && <Sun className="w-5 h-5 text-mood-stable" />}
              {todayEntry?.mood === 'depressed' && <CloudRain className="w-5 h-5 text-mood-depressed" />}
              <span>Mående: <strong>{MOOD_LABELS[todayEntry!.mood]}</strong></span>
            </div>
            {preferences?.include_sleep && todayEntry?.sleepQuality && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                <Moon className="w-5 h-5 text-primary" />
                <span>Sömn: <strong>{QUALITY_LABELS[todayEntry.sleepQuality]}</strong></span>
              </div>
            )}
            {preferences?.include_eating && todayEntry?.eatingQuality && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                <Utensils className="w-5 h-5 text-primary" />
                <span>Mat: <strong>{QUALITY_LABELS[todayEntry.eatingQuality]}</strong></span>
              </div>
            )}
            {preferences?.include_exercise && todayEntry?.exercised !== undefined && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                <Dumbbell className="w-5 h-5 text-primary" />
                <span>Träning: <strong>{todayEntry.exercised ? 'Ja' : 'Nej'}</strong></span>
              </div>
            )}
            {customQuestions.map((q) => {
              const answer = customAnswersState[q.id];
              if (!answer) return null;
              return (
                <div key={q.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <span>{q.question_text}: <strong>{answer === 'yes' ? 'Ja' : 'Nej'}</strong></span>
                </div>
              );
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={handleEdit} className="mt-4 gap-2">
            <Pencil className="w-4 h-4" />
            Ändra incheckning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 md:p-12 fade-in max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-lg capitalize">{formattedDate}</p>
        {!isDisplayToday && (
          <p className="text-xs text-primary mt-1">Retroaktiv incheckning</p>
        )}
      </div>

      {/* Progress bar - hide during success animation */}
      {currentStep !== 'success-animation' && (
        <div className="max-w-md mx-auto mb-8">
          <Progress value={getStepProgress()} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-2">
            Steg {STEPS.indexOf(currentStep) + 1} av {STEPS.length}
          </p>
        </div>
      )}

      {/* Step: Mood */}
      {currentStep === 'mood' && (
        <div className="space-y-6 fade-in">
          {isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="mb-4 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10">
              <X className="w-4 h-4" />
              Avbryt
            </Button>
          )}
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              {isDisplayToday 
                ? (firstName ? `Hej ${firstName}! Hur har du mått idag?` : 'Hej! Hur har du mått idag?')
                : (firstName ? `Hej ${firstName}! Hur mådde du den här dagen?` : 'Hur mådde du den här dagen?')
              }
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            {moodButtons.map(({ mood, icon: Icon, label, cssClass }) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "mood-btn rounded-3xl p-6 md:p-8 flex flex-col items-center gap-4 group",
                  cssClass,
                  checkinData.mood === mood && "ring-4 ring-offset-4 ring-offset-background scale-[1.02]"
                )}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Icon className="w-12 h-12 md:w-14 md:h-14 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="font-semibold text-sm md:text-base text-center leading-tight tracking-wide">{label}</span>
              </button>
            ))}
          </div>

          {showComment === 'mood' ? (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om hur du mår..."
                value={checkinData.moodComment || ''}
                onChange={(e) => updateComment('mood', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowComment('mood')}
              className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Lägg till kommentar
            </button>
          )}
        </div>
      )}

      {/* Step: Sleep */}
      {currentStep === 'sleep' && (
        <div className="space-y-6 fade-in">
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 gap-1">
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </Button>
          <div className="text-center mb-6">
            <Moon className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Hur har du sovit?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-5 max-w-lg mx-auto">
            <button
              onClick={() => handleSleepSelect('good')}
              className={cn(
                "checkin-option-card positive",
                checkinData.sleepQuality === 'good' && "selected"
              )}
            >
              <div className="icon-wrapper">
                <ThumbsUp className="w-8 h-8 text-mood-stable" />
              </div>
              <span className="font-semibold text-lg">Bra</span>
              <span className="text-xs text-muted-foreground">Jag sov gott</span>
            </button>
            <button
              onClick={() => handleSleepSelect('bad')}
              className={cn(
                "checkin-option-card negative",
                checkinData.sleepQuality === 'bad' && "selected"
              )}
            >
              <div className="icon-wrapper">
                <ThumbsDown className="w-8 h-8 text-mood-depressed" />
              </div>
              <span className="font-semibold text-lg">Dåligt</span>
              <span className="text-xs text-muted-foreground">Sov oroligt</span>
            </button>
          </div>

          {showComment === 'sleep' ? (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om din sömn..."
                value={checkinData.sleepComment || ''}
                onChange={(e) => updateComment('sleep', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowComment('sleep')}
              className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Lägg till kommentar
            </button>
          )}
        </div>
      )}

      {/* Step: Eating */}
      {currentStep === 'eating' && (
        <div className="space-y-6 fade-in">
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 gap-1">
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </Button>
          <div className="text-center mb-6">
            <Utensils className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Hur har du ätit?
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => handleEatingSelect('good')}
              className={cn(
                "checkin-option-card positive",
                checkinData.eatingQuality === 'good' && "selected"
              )}
            >
              <div className="icon-wrapper">
                <ThumbsUp className="w-8 h-8 text-mood-stable" />
              </div>
              <span className="font-semibold text-lg">Bra</span>
              <span className="text-xs text-muted-foreground">Ätit regelbundet</span>
            </button>
            <button
              onClick={() => handleEatingSelect('okay')}
              className={cn(
                "checkin-option-card neutral",
                checkinData.eatingQuality === 'okay' && "selected"
              )}
            >
              <div className="icon-wrapper">
                <Utensils className="w-8 h-8 text-primary" />
              </div>
              <span className="font-semibold text-lg">Helt ok</span>
              <span className="text-xs text-muted-foreground">Lagom</span>
            </button>
            <button
              onClick={() => handleEatingSelect('bad')}
              className={cn(
                "checkin-option-card negative",
                checkinData.eatingQuality === 'bad' && "selected"
              )}
            >
              <div className="icon-wrapper">
                <ThumbsDown className="w-8 h-8 text-mood-depressed" />
              </div>
              <span className="font-semibold text-lg">Dåligt</span>
              <span className="text-xs text-muted-foreground">Oregelbundet</span>
            </button>
          </div>

          {showComment === 'eating' ? (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om din mat..."
                value={checkinData.eatingComment || ''}
                onChange={(e) => updateComment('eating', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowComment('eating')}
              className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Lägg till kommentar
            </button>
          )}
        </div>
      )}

      {/* Step: Exercise */}
      {currentStep === 'exercise' && (
        <div className="space-y-6 fade-in">
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 gap-1">
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </Button>
          <div className="text-center mb-6">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Har du tränat?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-5 max-w-lg mx-auto">
            <button
              onClick={() => handleExerciseSelect(true)}
              className={cn(
                "checkin-option-card positive",
                checkinData.exercised === true && "selected"
              )}
            >
              <div className="icon-wrapper">
                <Check className="w-8 h-8 text-mood-stable" />
              </div>
              <span className="font-semibold text-lg">Ja</span>
              <span className="text-xs text-muted-foreground">Jag har tränat</span>
            </button>
            <button
              onClick={() => handleExerciseSelect(false)}
              className={cn(
                "checkin-option-card neutral",
                checkinData.exercised === false && "selected"
              )}
            >
              <div className="icon-wrapper">
                <X className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="font-semibold text-lg">Nej</span>
              <span className="text-xs text-muted-foreground">Vilodag</span>
            </button>
          </div>

          {showComment === 'exercise' ? (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om din träning..."
                value={checkinData.exerciseComment || ''}
                onChange={(e) => updateComment('exercise', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowComment('exercise')}
              className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Lägg till kommentar
            </button>
          )}
        </div>
      )}

      {/* Step: Medication */}
      {currentStep === 'medication' && (
        <div className="space-y-6 fade-in">
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 gap-1">
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </Button>
          <div className="text-center mb-6">
            <Pill className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Har du tagit dina mediciner?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-5 max-w-lg mx-auto">
            <button
              onClick={() => {
                // Mark all medications as taken
                activeMedications.forEach(med => {
                  if (!medicationsTakenToday.includes(med.id)) {
                    onToggleMedication(med.id, true);
                  }
                });
              }}
              className={cn(
                "checkin-option-card positive",
                medicationsTakenToday.length === activeMedications.length && activeMedications.length > 0 && "selected"
              )}
            >
              <div className="icon-wrapper">
                <Check className="w-8 h-8 text-mood-stable" />
              </div>
              <span className="font-semibold text-lg">Ja</span>
              <span className="text-xs text-muted-foreground">Alla tagna</span>
            </button>
            <button
              onClick={() => {
                // Mark all medications as not taken
                activeMedications.forEach(med => {
                  if (medicationsTakenToday.includes(med.id)) {
                    onToggleMedication(med.id, false);
                  }
                });
              }}
              className={cn(
                "checkin-option-card neutral",
                medicationsTakenToday.length === 0 && activeMedications.length > 0 && "selected"
              )}
            >
              <div className="icon-wrapper">
                <X className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="font-semibold text-lg">Nej</span>
              <span className="text-xs text-muted-foreground">Inga tagna</span>
            </button>
          </div>

          {/* Individual medication selection */}
          {hasMedications && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Eller välj enskilda mediciner:
              </p>
              <div className="space-y-2">
                {activeMedications.map(med => {
                  const isTaken = medicationsTakenToday.includes(med.id);
                  return (
                    <button
                      key={med.id}
                      onClick={() => onToggleMedication(med.id, !isTaken)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isTaken 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-muted/30 hover:border-primary/50"
                      )}
                    >
                      <Checkbox 
                        checked={isTaken}
                        onCheckedChange={(checked) => onToggleMedication(med.id, !!checked)}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <p className={cn("font-medium text-sm", isTaken && "text-primary")}>
                          {med.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{med.dosage}</p>
                      </div>
                      {isTaken && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Side effects section */}
          <div className="max-w-md mx-auto space-y-4">
            <div className="border-t pt-4">
              <button
                onClick={() => setCheckinData(prev => ({
                  ...prev,
                  medicationSideEffects: prev.medicationSideEffects?.length ? [] : ['other']
                }))}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                  checkinData.medicationSideEffects?.length 
                    ? "border-amber-500/50 bg-amber-500/10" 
                    : "border-border hover:border-amber-500/30"
                )}
              >
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  checkinData.medicationSideEffects?.length ? "text-amber-500" : "text-muted-foreground"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "font-medium text-sm",
                    checkinData.medicationSideEffects?.length && "text-amber-600 dark:text-amber-400"
                  )}>
                    Rapportera biverkningar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tryck här om du upplevt biverkningar
                  </p>
                </div>
                <Checkbox 
                  checked={!!checkinData.medicationSideEffects?.length}
                  className="h-5 w-5"
                />
              </button>

              {/* Side effects options */}
              {checkinData.medicationSideEffects?.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Vilka biverkningar har du upplevt?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'nausea', label: 'Illamående' },
                      { id: 'headache', label: 'Huvudvärk' },
                      { id: 'dizziness', label: 'Yrsel' },
                      { id: 'fatigue', label: 'Trötthet' },
                      { id: 'insomnia', label: 'Sömnproblem' },
                      { id: 'appetite', label: 'Aptitförändringar' },
                      { id: 'mood_changes', label: 'Humörförändringar' },
                      { id: 'other', label: 'Annat' },
                    ].map(effect => (
                      <button
                        key={effect.id}
                        onClick={() => {
                          const current = checkinData.medicationSideEffects || [];
                          const updated = current.includes(effect.id)
                            ? current.filter(e => e !== effect.id)
                            : [...current, effect.id];
                          setCheckinData(prev => ({
                            ...prev,
                            medicationSideEffects: updated.length ? updated : undefined
                          }));
                        }}
                        className={cn(
                          "p-2 rounded-lg border text-sm transition-all",
                          checkinData.medicationSideEffects?.includes(effect.id)
                            ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : "border-border hover:border-amber-500/30"
                        )}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Comment section */}
            <div className="space-y-3">
              {showComment === 'medication' ? (
                <div ref={commentRef}>
                  <Textarea
                    placeholder="Skriv en kommentar om dina mediciner..."
                    value={checkinData.medicationComment || ''}
                    onChange={(e) => setCheckinData(prev => ({ ...prev, medicationComment: e.target.value }))}
                    className="min-h-[80px] resize-none"
                    maxLength={500}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowComment('medication')}
                  className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Lägg till kommentar
                </button>
              )}
            </div>

            {isLastStep('medication') ? (
              <Button onClick={handleComplete} className="w-full mt-4 gap-2">
                <ChevronRight className="w-4 h-4" />
                Slutför incheckning
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(getNextStep('medication') as Step)} className="w-full mt-4 gap-2">
                <ChevronRight className="w-4 h-4" />
                Nästa
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step: Custom Questions */}
      {currentStep === 'custom_questions' && (
        <div className="space-y-6 fade-in">
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 gap-1">
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </Button>
          <div className="text-center mb-6">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Egna frågor
            </h1>
          </div>

          <div className="max-w-lg mx-auto space-y-3">
            {customQuestions.map((q) => {
              const answered = customAnswersState[q.id];
              return (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium text-center">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCustomAnswersState(prev => ({ ...prev, [q.id]: 'yes' }))}
                      className={cn(
                        "checkin-option-card positive py-4",
                        answered === 'yes' && "selected"
                      )}
                    >
                      <Check className="w-6 h-6 text-mood-stable" />
                      <span className="font-semibold">Ja</span>
                    </button>
                    <button
                      onClick={() => setCustomAnswersState(prev => ({ ...prev, [q.id]: 'no' }))}
                      className={cn(
                        "checkin-option-card neutral py-4",
                        answered === 'no' && "selected"
                      )}
                    >
                      <X className="w-6 h-6 text-muted-foreground" />
                      <span className="font-semibold">Nej</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-w-md mx-auto">
            <Button onClick={async () => {
              if (onSaveCustomAnswers) {
                await onSaveCustomAnswers(customAnswersState);
              }
              handleComplete();
            }} className="w-full mt-4 gap-2">
              <ChevronRight className="w-4 h-4" />
              Slutför incheckning
            </Button>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {currentStep === 'success-animation' && (
        <CelebrationAnimation />
      )}

    </div>
  );
}
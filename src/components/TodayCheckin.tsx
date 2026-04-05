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
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward');
  const [stepKey, setStepKey] = useState(0);
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

  const navigateStep = (step: Step) => {
    setSlideDirection('forward');
    setStepKey(k => k + 1);
    setCurrentStep(step);
  };

  const handleMoodSelect = (mood: MoodType) => {
    setCheckinData(prev => ({ ...prev, mood }));
    const nextStep = getNextStep('mood');
    if (nextStep === 'success-animation') {
      handleCompleteWithData({ ...checkinData, mood });
    } else {
      navigateStep(nextStep);
    }
  };

  const handleSleepSelect = (quality: QualityType) => {
    setCheckinData(prev => ({ ...prev, sleepQuality: quality }));
    const nextStep = getNextStep('sleep');
    if (nextStep === 'success-animation') {
      handleCompleteWithData({ ...checkinData, sleepQuality: quality });
    } else {
      navigateStep(nextStep);
    }
  };

  const handleEatingSelect = (quality: QualityType) => {
    setCheckinData(prev => ({ ...prev, eatingQuality: quality }));
    const nextStep = getNextStep('eating');
    if (nextStep === 'success-animation') {
      handleCompleteWithData({ ...checkinData, eatingQuality: quality });
    } else {
      navigateStep(nextStep);
    }
  };

  const handleExerciseSelect = (exercised: boolean) => {
    setCheckinData(prev => ({ ...prev, exercised }));
    const nextStep = getNextStep('exercise');
    if (nextStep === 'success-animation') {
      handleCompleteWithData({ ...checkinData, exercised });
    } else {
      navigateStep(nextStep);
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
      setSlideDirection('back');
      setStepKey(k => k + 1);
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
      <div className="fade-in h-full md:h-auto flex flex-col justify-center px-6 py-8 md:glass-card md:p-10 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
        <div className="text-center mb-6">
          <p className="text-muted-foreground/70 text-xs tracking-widest uppercase">{formattedDate}</p>
          {!isDisplayToday && (
            <p className="text-xs text-primary mt-1.5 font-medium">Retroaktiv incheckning</p>
          )}
        </div>

        <div className="text-center fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-full bg-mood-stable/15 mb-4">
            <CheckCircle2 className="w-7 h-7 md:w-10 md:h-10 text-mood-stable" />
          </div>
          
          <h1 className="font-display text-lg md:text-2xl font-bold text-mood-stable">
            Du har checkat in!
          </h1>

          {/* Streak badge */}
          {streakData.currentStreak > 0 && (
            <div className="max-w-sm mx-auto mt-5">
              <StreakBadge 
                currentStreak={streakData.currentStreak}
                longestStreak={streakData.longestStreak}
                hasCheckedInToday={streakData.hasCheckedInToday}
              />
            </div>
          )}

          {/* Encouragement message for depressed mood */}
          {todayEntry?.mood === 'depressed' && (
            <div className="max-w-sm mx-auto mt-5 p-4 rounded-xl bg-primary/10 border border-primary/20">
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
          <div className="max-w-sm mx-auto mt-5 space-y-2.5 text-left">
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border",
              todayEntry?.mood === 'elevated' && "bg-mood-elevated/10 border-mood-elevated/20",
              todayEntry?.mood === 'stable' && "bg-mood-stable/10 border-mood-stable/20",
              todayEntry?.mood === 'depressed' && "bg-mood-depressed/10 border-mood-depressed/20",
            )}>
              {todayEntry?.mood === 'elevated' && <Zap className="w-5 h-5 text-mood-elevated flex-shrink-0" />}
              {todayEntry?.mood === 'stable' && <Sun className="w-5 h-5 text-mood-stable flex-shrink-0" />}
              {todayEntry?.mood === 'depressed' && <CloudRain className="w-5 h-5 text-mood-depressed flex-shrink-0" />}
              <span className="text-sm font-medium">Mående: <strong>{MOOD_LABELS[todayEntry!.mood]}</strong></span>
            </div>
            {preferences?.include_sleep && todayEntry?.sleepQuality && (
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border",
                todayEntry.sleepQuality === 'good' ? "bg-mood-stable/10 border-mood-stable/20" : "bg-mood-depressed/10 border-mood-depressed/20"
              )}>
                <Moon className={cn("w-5 h-5 flex-shrink-0", todayEntry.sleepQuality === 'good' ? "text-mood-stable" : "text-mood-depressed")} />
                <span className="text-sm font-medium">Sömn: <strong>{QUALITY_LABELS[todayEntry.sleepQuality]}</strong></span>
              </div>
            )}
            {preferences?.include_eating && todayEntry?.eatingQuality && (
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border",
                todayEntry.eatingQuality === 'good' ? "bg-mood-stable/10 border-mood-stable/20" : todayEntry.eatingQuality === 'bad' ? "bg-mood-depressed/10 border-mood-depressed/20" : "bg-primary/10 border-primary/20"
              )}>
                <Utensils className={cn("w-5 h-5 flex-shrink-0", todayEntry.eatingQuality === 'good' ? "text-mood-stable" : todayEntry.eatingQuality === 'bad' ? "text-mood-depressed" : "text-primary")} />
                <span className="text-sm font-medium">Mat: <strong>{QUALITY_LABELS[todayEntry.eatingQuality]}</strong></span>
              </div>
            )}
            {preferences?.include_exercise && todayEntry?.exercised !== undefined && (
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border",
                todayEntry.exercised ? "bg-mood-stable/10 border-mood-stable/20" : "bg-muted/50 border-border"
              )}>
                <Dumbbell className={cn("w-5 h-5 flex-shrink-0", todayEntry.exercised ? "text-mood-stable" : "text-muted-foreground")} />
                <span className="text-sm font-medium">Träning: <strong>{todayEntry.exercised ? 'Ja' : 'Nej'}</strong></span>
              </div>
            )}
            {customQuestions.map((q) => {
              const answer = customAnswersState[q.id];
              if (!answer) return null;
              return (
                <div key={q.id} className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border",
                  answer === 'yes' ? "bg-mood-stable/10 border-mood-stable/20" : "bg-muted/50 border-border"
                )}>
                  <HelpCircle className={cn("w-5 h-5 flex-shrink-0", answer === 'yes' ? "text-mood-stable" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">{q.question_text}: <strong>{answer === 'yes' ? 'Ja' : 'Nej'}</strong></span>
                </div>
              );
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={handleEdit} className="mt-6 gap-2 text-muted-foreground">
            <Pencil className="w-4 h-4" />
            Ändra incheckning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-6 py-8 md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
      <div className="text-center mb-5 md:mb-6">
        <p className="text-muted-foreground/70 text-xs tracking-widest uppercase">{formattedDate}</p>
        {!isDisplayToday && (
          <p className="text-xs text-primary mt-1.5 font-medium">Retroaktiv incheckning</p>
        )}
      </div>

      {/* Progress dots */}
      {currentStep !== 'success-animation' && (
        <div className="flex items-center justify-center gap-2.5 mb-8 md:mb-10">
          {STEPS.map((step, i) => {
            const currentIndex = STEPS.indexOf(currentStep);
            const isActive = i === currentIndex;
            const isCompleted = i < currentIndex;
            return (
              <div
                key={step}
                className={cn(
                  "rounded-full transition-all duration-500",
                  isActive ? "w-8 h-2.5 bg-primary" : isCompleted ? "w-2.5 h-2.5 bg-primary/50" : "w-2.5 h-2.5 bg-muted-foreground/15"
                )}
              />
            );
          })}
        </div>
      )}

      {/* Step: Mood */}
      {currentStep === 'mood' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in relative`} key={stepKey}>
          <div className="flex items-center justify-between">
            {isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                <X className="w-4 h-4" />
                Avbryt
              </Button>
            ) : <div />}
            <button
              onClick={() => setShowComment(showComment === 'mood' ? null : 'mood')}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                showComment === 'mood' ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl md:text-3xl font-bold leading-tight">
              {isDisplayToday 
                ? (firstName ? `Hej ${firstName}! Hur har du mått idag?` : 'Hej! Hur har du mått idag?')
                : (firstName ? `Hej ${firstName}! Hur mådde du den här dagen?` : 'Hur mådde du den här dagen?')
              }
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3.5 md:gap-6 max-w-3xl mx-auto">
            {moodButtons.map(({ mood, icon: Icon, label, cssClass }) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "mood-btn rounded-[1.25rem] aspect-square flex flex-col items-center justify-center gap-3 group",
                  cssClass,
                  checkinData.mood === mood && "ring-3 ring-offset-2 ring-offset-background scale-[1.02]"
                )}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="font-semibold text-sm sm:text-base text-center leading-tight tracking-wide">{label}</span>
              </button>
            ))}
          </div>

          {showComment === 'mood' && (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om hur du mår..."
                value={checkinData.moodComment || ''}
                onChange={(e) => updateComment('mood', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          )}
        </div>
      )}

      {/* Step: Sleep */}
      {currentStep === 'sleep' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in`} key={stepKey}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'sleep' ? null : 'sleep')}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                showComment === 'sleep' ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <Moon className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Hur har du sovit?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <button
              onClick={() => handleSleepSelect('good')}
              className={cn(
                "checkin-option-card positive aspect-square",
                checkinData.sleepQuality === 'good' && "selected"
              )}
            >
              <div className="icon-wrapper !w-14 !h-14">
                <ThumbsUp className="w-8 h-8 text-mood-stable" />
              </div>
              <span className="font-semibold text-lg">Bra</span>
              <span className="text-xs text-muted-foreground/60">Jag sov gott</span>
            </button>
            <button
              onClick={() => handleSleepSelect('bad')}
              className={cn(
                "checkin-option-card negative aspect-square",
                checkinData.sleepQuality === 'bad' && "selected"
              )}
            >
              <div className="icon-wrapper !w-14 !h-14">
                <ThumbsDown className="w-8 h-8 text-mood-depressed" />
              </div>
              <span className="font-semibold text-lg">Dåligt</span>
              <span className="text-xs text-muted-foreground/60">Sov oroligt</span>
            </button>
          </div>

          {showComment === 'sleep' && (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om din sömn..."
                value={checkinData.sleepComment || ''}
                onChange={(e) => updateComment('sleep', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          )}
        </div>
      )}

      {/* Step: Eating */}
      {currentStep === 'eating' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in`} key={stepKey}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'eating' ? null : 'eating')}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                showComment === 'eating' ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <Utensils className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Hur har du ätit?
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <button
              onClick={() => handleEatingSelect('good')}
              className={cn(
                "checkin-option-card positive aspect-square",
                checkinData.eatingQuality === 'good' && "selected"
              )}
            >
              <div className="icon-wrapper !w-12 !h-12">
                <ThumbsUp className="w-7 h-7 text-mood-stable" />
              </div>
              <span className="font-semibold text-base">Bra</span>
            </button>
            <button
              onClick={() => handleEatingSelect('okay')}
              className={cn(
                "checkin-option-card neutral aspect-square",
                checkinData.eatingQuality === 'okay' && "selected"
              )}
            >
              <div className="icon-wrapper !w-12 !h-12">
                <Utensils className="w-7 h-7 text-primary" />
              </div>
              <span className="font-semibold text-base">Ok</span>
            </button>
            <button
              onClick={() => handleEatingSelect('bad')}
              className={cn(
                "checkin-option-card negative aspect-square",
                checkinData.eatingQuality === 'bad' && "selected"
              )}
            >
              <div className="icon-wrapper !w-12 !h-12">
                <ThumbsDown className="w-7 h-7 text-mood-depressed" />
              </div>
              <span className="font-semibold text-base">Dåligt</span>
            </button>
          </div>

          {showComment === 'eating' && (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om din mat..."
                value={checkinData.eatingComment || ''}
                onChange={(e) => updateComment('eating', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          )}
        </div>
      )}

      {/* Step: Exercise */}
      {currentStep === 'exercise' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in`} key={stepKey}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'exercise' ? null : 'exercise')}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                showComment === 'exercise' ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <Dumbbell className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Har du tränat?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <button
              onClick={() => handleExerciseSelect(true)}
              className={cn(
                "checkin-option-card positive aspect-square",
                checkinData.exercised === true && "selected"
              )}
            >
              <div className="icon-wrapper !w-14 !h-14">
                <Check className="w-8 h-8 text-mood-stable" />
              </div>
              <span className="font-semibold text-lg">Ja</span>
              <span className="text-xs text-muted-foreground/60">Jag har tränat</span>
            </button>
            <button
              onClick={() => handleExerciseSelect(false)}
              className={cn(
                "checkin-option-card neutral aspect-square",
                checkinData.exercised === false && "selected"
              )}
            >
              <div className="icon-wrapper !w-14 !h-14">
                <X className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="font-semibold text-lg">Nej</span>
              <span className="text-xs text-muted-foreground/60">Vilodag</span>
            </button>
          </div>

          {showComment === 'exercise' && (
            <div ref={commentRef} className="max-w-md mx-auto space-y-3">
              <Textarea
                placeholder="Berätta mer om din träning..."
                value={checkinData.exerciseComment || ''}
                onChange={(e) => updateComment('exercise', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          )}
        </div>
      )}

      {/* Step: Medication */}
      {currentStep === 'medication' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in`} key={stepKey}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'medication' ? null : 'medication')}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                showComment === 'medication' ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <Pill className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Har du tagit dina mediciner?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
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
              <Button onClick={() => navigateStep(getNextStep('medication') as Step)} className="w-full mt-4 gap-2">
                <ChevronRight className="w-4 h-4" />
                Nästa
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step: Custom Questions */}
      {currentStep === 'custom_questions' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in`} key={stepKey}>
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60">
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </Button>
          <div className="text-center">
            <HelpCircle className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
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
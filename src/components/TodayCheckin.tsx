import { useState, useEffect, useMemo, useRef } from 'react';
import { format, differenceInDays, parseISO, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Flame, Zap, Sun, Cloud, CloudRain, MessageSquare, CheckCircle2, Pill, Pencil, Moon, Utensils, Dumbbell, ThumbsUp, ThumbsDown, Check, X, ChevronRight, ChevronLeft, Heart, AlertTriangle, HelpCircle, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoodType, MoodEntry, MOOD_LABELS, ENERGY_LABELS, QualityType, QUALITY_LABELS, CheckinData, EnergyType } from '@/types/mood';
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
import { FullscreenComment } from '@/components/FullscreenComment';
import { useIsMobile } from '@/hooks/use-mobile';

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

const moodButtons: { mood: MoodType; icon: typeof Zap; label: string; sublabel: string; cssClass: string }[] = [
  { mood: 'elevated', icon: Flame, label: 'Mycket upp', sublabel: 'Rastlös, racing thoughts', cssClass: 'mood-btn-elevated' },
  { mood: 'somewhat_elevated', icon: Zap, label: 'Upp', sublabel: 'Energisk, positiv', cssClass: 'mood-btn-somewhat-elevated' },
  { mood: 'stable', icon: Sun, label: 'Stabil', sublabel: 'Balanserad, lugn', cssClass: 'mood-btn-stable' },
  { mood: 'somewhat_depressed', icon: Cloud, label: 'Låg', sublabel: 'Tung, trött', cssClass: 'mood-btn-somewhat-depressed' },
  { mood: 'depressed', icon: CloudRain, label: 'Mycket låg', sublabel: 'Mörkt, hopplöst', cssClass: 'mood-btn-depressed' },
];

const TAG_OPTIONS = [
  { value: 'ångest', label: 'Ångest', emoji: '😰' },
  { value: 'irritabilitet', label: 'Irritabilitet', emoji: '😤' },
  { value: 'rastlöshet', label: 'Rastlöshet', emoji: '🦶' },
  { value: 'sömnsvårigheter', label: 'Sömnsvårigheter', emoji: '🌙' },
  { value: 'koncentrationssvårigheter', label: 'Fokussvårt', emoji: '🧠' },
  { value: 'social tillbakadragning', label: 'Isolering', emoji: '🚪' },
  { value: 'racing thoughts', label: 'Racing thoughts', emoji: '💭' },
  { value: 'impulsivitet', label: 'Impulsivitet', emoji: '⚡' },
  { value: 'gråtmild', label: 'Gråtmild', emoji: '😢' },
  { value: 'hopplöshet', label: 'Hopplöshet', emoji: '🌑' },
  { value: 'eufori', label: 'Eufori', emoji: '✨' },
  { value: 'stress', label: 'Stress', emoji: '😓' },
];

// Smart follow-up messages based on mood + energy combination
function getSmartFollowUp(mood: MoodType, energy?: EnergyType): { message: string; icon: string } | null {
  if (mood === 'depressed' && energy === 'high') {
    return { message: 'Hög energi + lågt humör kan tyda på ångest. Försök andas lugnt.', icon: '💙' };
  }
  if (mood === 'depressed' || mood === 'somewhat_depressed') {
    return { message: 'Det är tufft just nu. Kom ihåg att bättre dagar kommer.', icon: '💛' };
  }
  if (mood === 'elevated' && energy === 'high') {
    return { message: 'Mycket hög energi + humör – känner du igen detta mönster?', icon: '⚠️' };
  }
  if (mood === 'elevated') {
    return { message: 'Håll koll på sömnen och försök sakta ner lite.', icon: '🧘' };
  }
  if (mood === 'somewhat_elevated' && energy === 'high') {
    return { message: 'Du verkar ha en bra dag! Njut av den.', icon: '✨' };
  }
  if (mood === 'stable') {
    return { message: 'Bra att höra! Stabilitet är styrka.', icon: '☀️' };
  }
  return null;
}

type Step = 'mood' | 'tags' | 'sleep' | 'eating' | 'exercise' | 'medication' | 'custom_questions' | 'success-animation' | 'complete';

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
    const steps: Step[] = ['mood', 'tags']; // Mood + Tags always included
    
    if (preferences?.include_sleep) steps.push('sleep');
    if (preferences?.include_eating) steps.push('eating');
    if (preferences?.include_exercise) steps.push('exercise');
    if (preferences?.include_medication) steps.push('medication');
    if (customQuestions.length > 0) steps.push('custom_questions');
    
    return steps;
  }, [preferences, customQuestions.length]);

  // Calculate encouragement data for depressed mood
  const encouragementData = useMemo(() => {
    const goodDays = yearEntries.filter(e => e.mood === 'stable' || e.mood === 'somewhat_elevated');
    const goodDaysCount = goodDays.length;
    
    const sortedGoodDays = goodDays
      .map(e => ({ ...e, dateObj: parseISO(e.date) }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    
    const lastGoodDay = sortedGoodDays[0];
    const daysSinceGood = lastGoodDay 
      ? differenceInDays(displayDate, lastGoodDay.dateObj)
      : null;
    
    return { goodDaysCount, daysSinceGood };
  }, [yearEntries, displayDate]);
  
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState<Step>('mood');
  const [isEditing, setIsEditing] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward');
  const [stepKey, setStepKey] = useState(0);
  const [showComment, setShowComment] = useState<Step | null>(null);
  const [showSideEffects, setShowSideEffects] = useState(false);
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
        energyLevel: todayEntry.energyLevel,
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
    navigateStep('tags');
  };

  const handleTagToggle = (tag: string) => {
    setCheckinData(prev => {
      const current = prev.tags || [];
      const updated = current.includes(tag) 
        ? current.filter(t => t !== tag) 
        : [...current, tag];
      return { ...prev, tags: updated };
    });
  };

  const handleTagsContinue = () => {
    const nextStep = getNextStep('tags');
    if (nextStep === 'success-animation') {
      handleCompleteWithData(checkinData);
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

  const commentConfig: Record<string, { title: string; placeholder: string; getValue: () => string; setValue: (v: string) => void }> = {
    mood: { title: 'Kommentar – Mående', placeholder: 'Berätta mer om hur du mår...', getValue: () => checkinData.moodComment || '', setValue: (v) => updateComment('mood', v) },
    sleep: { title: 'Kommentar – Sömn', placeholder: 'Berätta mer om din sömn...', getValue: () => checkinData.sleepComment || '', setValue: (v) => updateComment('sleep', v) },
    eating: { title: 'Kommentar – Mat', placeholder: 'Berätta mer om din mat...', getValue: () => checkinData.eatingComment || '', setValue: (v) => updateComment('eating', v) },
    exercise: { title: 'Kommentar – Träning', placeholder: 'Berätta mer om din träning...', getValue: () => checkinData.exerciseComment || '', setValue: (v) => updateComment('exercise', v) },
    medication: { title: 'Kommentar – Medicin', placeholder: 'Skriv en kommentar om dina mediciner...', getValue: () => checkinData.medicationComment || '', setValue: (v) => setCheckinData(prev => ({ ...prev, medicationComment: v })) },
  };

  const renderCommentSection = (step: Step) => {
    if (showComment !== step) return null;
    const config = commentConfig[step];
    if (!config) return null;

    if (isMobile) {
      return (
        <FullscreenComment
          title={config.title}
          placeholder={config.placeholder}
          value={config.getValue()}
          onChange={config.setValue}
          onClose={() => setShowComment(null)}
        />
      );
    }

    return (
      <div ref={commentRef} className="max-w-md mx-auto space-y-3">
        <Textarea
          placeholder={config.placeholder}
          value={config.getValue()}
          onChange={(e) => config.setValue(e.target.value)}
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
      </div>
    );
  };

  const hasMedications = activeMedications.length > 0;

  // Helper to get mood icon and color for summary
  const getMoodDisplay = (mood: MoodType) => {
    const config: Record<MoodType, { icon: typeof Zap; colorClass: string; bgClass: string; borderClass: string }> = {
      elevated: { icon: Flame, colorClass: 'text-mood-elevated', bgClass: 'bg-mood-elevated/10', borderClass: 'border-mood-elevated/20' },
      somewhat_elevated: { icon: Zap, colorClass: 'text-mood-somewhat-elevated', bgClass: 'bg-mood-somewhat-elevated/10', borderClass: 'border-mood-somewhat-elevated/20' },
      stable: { icon: Sun, colorClass: 'text-mood-stable', bgClass: 'bg-mood-stable/10', borderClass: 'border-mood-stable/20' },
      somewhat_depressed: { icon: Cloud, colorClass: 'text-mood-somewhat-depressed', bgClass: 'bg-mood-somewhat-depressed/10', borderClass: 'border-mood-somewhat-depressed/20' },
      depressed: { icon: CloudRain, colorClass: 'text-mood-depressed', bgClass: 'bg-mood-depressed/10', borderClass: 'border-mood-depressed/20' },
    };
    return config[mood];
  };


  // Show complete state
  if (isCheckinComplete && !isEditing) {
    const moodDisplay = todayEntry ? getMoodDisplay(todayEntry.mood) : null;
    const MoodIcon = moodDisplay?.icon || Sun;
    const followUp = todayEntry ? getSmartFollowUp(todayEntry.mood, todayEntry.energyLevel) : null;

    return (
      <div className="fade-in h-full md:h-auto flex flex-col justify-center px-6 py-8 md:glass-card md:p-10 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
        <div className="text-center mb-6">
          <p className="text-muted-foreground/70 text-xs tracking-widest uppercase">{formattedDate}</p>
          {!isDisplayToday && (
            <p className="text-xs text-primary mt-1.5 font-medium">Retroaktiv incheckning</p>
          )}
        </div>

        <div className="text-center fade-in">
          <div className={cn("inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-full mb-4", moodDisplay?.bgClass)}>
            <CheckCircle2 className={cn("w-7 h-7 md:w-10 md:h-10", moodDisplay?.colorClass || 'text-mood-stable')} />
          </div>
          
          <h1 className="font-display text-lg md:text-2xl font-bold text-foreground">
            Du har checkat in!
          </h1>

          {/* Smart follow-up message */}
          {followUp && (
            <div className="max-w-sm mx-auto mt-4 p-4 rounded-xl bg-card border border-border/50">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="mr-1.5">{followUp.icon}</span>
                {followUp.message}
              </p>
            </div>
          )}

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
          {(todayEntry?.mood === 'depressed' || todayEntry?.mood === 'somewhat_depressed') && (
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
            {/* Mood summary */}
            {todayEntry && moodDisplay && (
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", moodDisplay.bgClass, moodDisplay.borderClass)}>
                <MoodIcon className={cn("w-5 h-5 flex-shrink-0", moodDisplay.colorClass)} />
                <span className="text-sm font-medium">Mående: <strong>{MOOD_LABELS[todayEntry.mood]}</strong></span>
              </div>
            )}
            {/* Tags summary */}
            {todayEntry?.tags && todayEntry.tags.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card border-border/50">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-primary" />
                <span className="text-sm font-medium">
                  {todayEntry.tags.map(t => TAG_OPTIONS.find(o => o.value === t)?.label || t).join(', ')}
                </span>
              </div>
            )}
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
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-6 py-4 overflow-hidden md:overflow-y-auto md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
      <div className="text-center mb-5 md:mb-6">
        <p className="text-muted-foreground/70 text-xs tracking-widest uppercase">{formattedDate}</p>
        {!isDisplayToday && (
          <p className="text-xs text-primary mt-1.5 font-medium">Retroaktiv incheckning</p>
        )}
      </div>

      {/* Progress dots */}
      {currentStep !== 'success-animation' && (
        <div className="flex flex-col items-center gap-1.5 mb-8 md:mb-10">
          <p className="text-xs text-muted-foreground/60">
            Steg {STEPS.indexOf(currentStep) + 1} av {STEPS.length}
          </p>
          <div className="flex items-center gap-2.5">
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
        </div>
      )}

      {/* Step: Mood - 5 levels in vertical list */}
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
                ? (firstName ? `Hej ${firstName}!` : 'Hej!')
                : 'Hur mådde du?'
              }
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              {isDisplayToday ? 'Hur känns det idag?' : formattedDate}
            </p>
          </div>

          <div className="flex flex-col gap-3 max-w-md mx-auto">
            {moodButtons.map(({ mood, icon: Icon, label, sublabel, cssClass }) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "mood-btn rounded-2xl flex items-center gap-4 px-5 py-4 text-left group",
                  cssClass,
                  checkinData.mood === mood && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-base sm:text-lg block">{label}</span>
                  <span className="text-xs sm:text-sm opacity-70 block">{sublabel}</span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-70 transition-opacity flex-shrink-0" />
              </button>
            ))}
          </div>

          {renderCommentSection('mood')}
        </div>
      )}

      {/* Step: Tags */}
      {currentStep === 'tags' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in`} key={stepKey}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <div />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Något som stack ut?
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Välj det som stämmer – eller hoppa vidare
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-md mx-auto">
            {TAG_OPTIONS.map(({ value, label, emoji }) => {
              const selected = (checkinData.tags || []).includes(value);
              return (
                <button
                  key={value}
                  onClick={() => handleTagToggle(value)}
                  className={cn(
                    "px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
                    "active:scale-95",
                    selected
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-white/[0.04]"
                  )}
                >
                  <span className="mr-1.5">{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleTagsContinue}
              className="px-8 py-3 rounded-xl text-base font-semibold"
            >
              {(checkinData.tags || []).length > 0 ? 'Fortsätt' : 'Hoppa över'}
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
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

          {renderCommentSection('sleep')}
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

          {renderCommentSection('eating')}
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

          {renderCommentSection('exercise')}
        </div>
      )}

      {/* Step: Medication - Direct checklist */}
      {currentStep === 'medication' && (
        <div className={`space-y-6 md:space-y-8 step-slide-in`} key={stepKey}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSideEffects(!showSideEffects)}
                className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  (showSideEffects || checkinData.medicationSideEffects?.length) ? "bg-amber-500/10 text-amber-500" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
                )}
                aria-label="Rapportera biverkningar"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
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
          </div>
          <div className="text-center">
            <Pill className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Hur gick det med medicinen?
            </h1>
            {hasMedications && (
              <p className="text-sm text-muted-foreground mt-2">
                {medicationsTakenToday.length} av {activeMedications.length} tagna
              </p>
            )}
          </div>

          {/* Direct medication checklist */}
          {hasMedications ? (
            <div className="max-w-md mx-auto space-y-2.5">
              {/* Quick toggle: mark all */}
              {activeMedications.length > 1 && (
                <button
                  onClick={() => {
                    const allTaken = medicationsTakenToday.length === activeMedications.length;
                    activeMedications.forEach(med => {
                      onToggleMedication(med.id, !allTaken);
                    });
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    medicationsTakenToday.length === activeMedications.length
                      ? "text-mood-stable bg-mood-stable/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {medicationsTakenToday.length === activeMedications.length ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Alla tagna!
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Markera alla
                    </>
                  )}
                </button>
              )}

              {/* Individual medications */}
              {activeMedications.map(med => {
                const isTaken = medicationsTakenToday.includes(med.id);
                return (
                  <button
                    key={med.id}
                    onClick={() => onToggleMedication(med.id, !isTaken)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                      "active:scale-[0.98]",
                      isTaken 
                        ? "border-mood-stable/40 bg-mood-stable/10" 
                        : "border-border/50 bg-card/50 hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      isTaken ? "bg-mood-stable text-white" : "bg-muted/50 border border-border"
                    )}>
                      {isTaken && <Check className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-base transition-colors",
                        isTaken ? "text-foreground" : "text-foreground/80"
                      )}>
                        {med.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{med.dosage}</p>
                    </div>
                    {isTaken && (
                      <span className="text-xs text-mood-stable font-medium flex-shrink-0">Tagen ✓</span>
                    )}
                  </button>
                );
              })}

              {/* Missed medication reason (shown when any medication is NOT taken) */}
              {medicationsTakenToday.length < activeMedications.length && medicationsTakenToday.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground text-center mb-2">Anledning till missad dos?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { id: 'forgot', label: 'Glömde' },
                      { id: 'side_effects', label: 'Biverkningar' },
                      { id: 'out_of_stock', label: 'Slut på medicin' },
                      { id: 'choice', label: 'Ville inte' },
                    ].map(reason => (
                      <button
                        key={reason.id}
                        onClick={() => {
                          setCheckinData(prev => ({
                            ...prev,
                            medicationComment: prev.medicationComment === reason.label ? '' : reason.label,
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs border transition-all",
                          checkinData.medicationComment === reason.label
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-muted-foreground/50"
                        )}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-4">
              <p className="text-sm text-muted-foreground">
                Du har inga aktiva mediciner registrerade.
              </p>
            </div>
          )}

          {/* Side effects section */}
          <div className="max-w-md mx-auto space-y-4">
            {showSideEffects && (
              <div className="space-y-2 pt-2 border-t border-border/50">
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
            )}

            {renderCommentSection('medication')}

            {isLastStep('medication') ? (
              <Button onClick={handleComplete} className="w-full mt-4 gap-2">
                Klar ✓
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
              Klar ✓
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

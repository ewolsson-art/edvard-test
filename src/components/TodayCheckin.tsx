import { useState, useEffect, useMemo, useRef, KeyboardEvent } from 'react';
import { format, differenceInDays, parseISO, isToday, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Flame, Zap, Sun, Cloud, CloudRain, MessageSquarePlus, CheckCircle2, Pill, Pencil, Moon, MoonStar, CloudMoon, Utensils, Dumbbell, ThumbsUp, ThumbsDown, Check, X, ChevronRight, ChevronLeft, Heart, AlertTriangle, HelpCircle, CalendarIcon, Plus, Trophy } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoodType, MoodEntry, MOOD_LABELS, ENERGY_LABELS, QualityType, QUALITY_LABELS, CheckinData, EnergyType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
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
import { MilestoneInfo } from '@/hooks/useStreak';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  hasCheckedInToday: boolean;
  lastCheckinDate: string | null;
  milestone?: MilestoneInfo;
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

// Static fallback mood buttons (will be overridden by diagnosis config)
const defaultMoodButtons: { mood: MoodType; icon: typeof Zap; label: string; sublabel: string; cssClass: string }[] = [
  { mood: 'elevated', icon: Flame, label: 'Mycket upp', sublabel: 'Rastlös, racing thoughts', cssClass: 'mood-btn-elevated' },
  { mood: 'somewhat_elevated', icon: Zap, label: 'Upp', sublabel: 'Energisk, positiv', cssClass: 'mood-btn-somewhat-elevated' },
  { mood: 'stable', icon: Sun, label: 'Stabil', sublabel: 'Balanserad, lugn', cssClass: 'mood-btn-stable' },
  { mood: 'somewhat_depressed', icon: Cloud, label: 'Låg', sublabel: 'Tung, trött', cssClass: 'mood-btn-somewhat-depressed' },
  { mood: 'depressed', icon: CloudRain, label: 'Mycket låg', sublabel: 'Väldigt tungt idag', cssClass: 'mood-btn-depressed' },
];

const moodIcons: Record<MoodType, typeof Zap> = {
  elevated: Flame,
  somewhat_elevated: Zap,
  stable: Sun,
  somewhat_depressed: Cloud,
  depressed: CloudRain,
};

const moodCssClasses: Record<MoodType, string> = {
  elevated: 'mood-btn-elevated',
  somewhat_elevated: 'mood-btn-somewhat-elevated',
  stable: 'mood-btn-stable',
  somewhat_depressed: 'mood-btn-somewhat-depressed',
  depressed: 'mood-btn-depressed',
};

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
  const { moodLabels, moodSublabels, moodTags: diagnosisMoodTags } = useDiagnosisConfig();
  
  const moodButtons = useMemo(() => {
    const moods: MoodType[] = ['elevated', 'somewhat_elevated', 'stable', 'somewhat_depressed', 'depressed'];
    return moods.map(mood => ({
      mood,
      icon: moodIcons[mood],
      label: moodLabels[mood],
      sublabel: moodSublabels[mood],
      cssClass: moodCssClasses[mood],
    }));
  }, [moodLabels, moodSublabels]);

  const MOOD_TAGS = diagnosisMoodTags;
  const ALL_TAG_OPTIONS = useMemo(() => 
    Object.values(MOOD_TAGS).flat().filter((t, i, arr) => arr.findIndex(a => a.value === t.value) === i),
    [MOOD_TAGS]
  );

  const displayDate = selectedDateProp || new Date();
  const isDisplayToday = isToday(displayDate);
  const isDisplayYesterday = isYesterday(displayDate);
  const formattedDate = isDisplayToday 
    ? 'Idag' 
    : isDisplayYesterday 
      ? 'Igår' 
      : format(displayDate, "EEEE d MMMM", { locale: sv });

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
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [showSideEffects, setShowSideEffects] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);
  
  // Form data
  const [checkinData, setCheckinData] = useState<CheckinData>({});
  const [customAnswersState, setCustomAnswersState] = useState<Record<string, string>>(initialCustomAnswers);

  // Auto-mark all medications as taken when entering medication step for the first time
  const hasPrefilled = useRef(false);
  useEffect(() => {
    if (currentStep === 'medication' && activeMedications.length > 0 && medicationsTakenToday.length === 0 && !hasPrefilled.current) {
      hasPrefilled.current = true;
      activeMedications.forEach(med => onToggleMedication(med.id, true));
    }
  }, [currentStep, activeMedications, medicationsTakenToday.length, onToggleMedication]);

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
        tags: todayEntry.tags,
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
      }, 3500);
    }
  };

  const handleComplete = async () => {
    const success = await onSaveCheckin(checkinData);
    if (success) {
      setCurrentStep('success-animation');
      setTimeout(() => {
        setCurrentStep('complete');
        setIsEditing(false);
      }, 3500);
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

    return (
      <FullscreenComment
        title={config.title}
        placeholder={config.placeholder}
        value={config.getValue()}
        onChange={config.setValue}
        onClose={() => setShowComment(null)}
      />
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
  if (isCheckinComplete && !isEditing && currentStep !== 'success-animation') {
    const moodDisplay = todayEntry ? getMoodDisplay(todayEntry.mood) : null;
    const MoodIcon = moodDisplay?.icon || Sun;
    const followUp = todayEntry ? getSmartFollowUp(todayEntry.mood, todayEntry.energyLevel) : null;

    // Build inline summary items
    const summaryItems: { label: string; value: string; colorClass?: string }[] = [];
    if (todayEntry) {
      summaryItems.push({ label: 'Mående', value: moodLabels[todayEntry.mood], colorClass: moodDisplay?.colorClass });
    }
    if (preferences?.include_sleep && todayEntry?.sleepQuality) {
      summaryItems.push({ 
        label: 'Sömn', 
        value: QUALITY_LABELS[todayEntry.sleepQuality],
        colorClass: todayEntry.sleepQuality === 'good' ? 'text-mood-stable' : todayEntry.sleepQuality === 'bad' ? 'text-mood-depressed' : 'text-primary'
      });
    }
    if (preferences?.include_eating && todayEntry?.eatingQuality) {
      summaryItems.push({ 
        label: 'Mat', 
        value: QUALITY_LABELS[todayEntry.eatingQuality],
        colorClass: todayEntry.eatingQuality === 'good' ? 'text-mood-stable' : todayEntry.eatingQuality === 'bad' ? 'text-mood-depressed' : 'text-primary'
      });
    }
    if (preferences?.include_exercise && todayEntry?.exercised !== undefined) {
      summaryItems.push({ 
        label: 'Träning', 
        value: todayEntry.exercised ? 'Ja' : 'Nej',
        colorClass: todayEntry.exercised ? 'text-mood-stable' : 'text-muted-foreground'
      });
    }

    const tags = todayEntry?.tags && todayEntry.tags.length > 0
      ? todayEntry.tags.map(t => ALL_TAG_OPTIONS.find(o => o.value === t)?.label || t)
      : [];

    const customAnswerItems = customQuestions
      .filter(q => customAnswersState[q.id])
      .map(q => ({ question: q.question_text, answer: customAnswersState[q.id] === 'yes' ? 'Ja' : 'Nej' }));

    return (
      <div className="fade-in h-full md:h-auto flex flex-col items-center justify-center px-5 py-16">
        <div className="flex flex-col items-center text-center">
          {/* Checkmark */}
          <div 
            className="relative mb-10"
            style={{ animation: 'scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              moodDisplay?.bgClass || 'bg-mood-stable/10'
            )}>
              <Check 
                className={cn("w-6 h-6", moodDisplay?.colorClass || 'text-mood-stable')} 
                style={{ strokeWidth: 2.5 }} 
              />
            </div>
          </div>

          {/* Streak number — the hero */}
          {streakData.currentStreak > 0 && (
            <div className="mb-8" style={{ animation: 'scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}>
              <span className="text-[88px] md:text-[112px] font-bold tabular-nums leading-[0.8] tracking-tighter text-foreground block">
                {streakData.currentStreak}
              </span>
              <p className="text-[13px] text-foreground/20 mt-3 tracking-wide">
                {streakData.currentStreak === 1 ? 'dag' : 'dagar'} i rad
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-x-2 text-[14px] mb-10">
            {summaryItems.map((item, i) => (
              <span key={item.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-foreground/10">·</span>}
                <span className={cn("font-medium", item.colorClass || 'text-foreground/50')}>{item.value}</span>
              </span>
            ))}
          </div>

          {/* Encouragement for low mood */}
          {(todayEntry?.mood === 'depressed' || todayEntry?.mood === 'somewhat_depressed') && (
            <p className="text-[13px] text-foreground/35 leading-relaxed max-w-[280px] mb-8">
              <Heart className="w-3.5 h-3.5 inline mr-1.5 text-primary/30 -mt-0.5" />
              Bättre dagar kommer.
              {encouragementData.goodDaysCount > 0 && (
                <span className="text-foreground/25">
                  {' '}Du mådde bra för {encouragementData.daysSinceGood ?? '?'} {encouragementData.daysSinceGood === 1 ? 'dag' : 'dagar'} sen.
                </span>
              )}
            </p>
          )}

          {/* Edit link */}
          <button
            onClick={handleEdit}
            className="text-[13px] text-foreground/25 hover:text-foreground/45 transition-colors duration-200 cursor-pointer"
          >
            Ändra incheckning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-5 pt-12 pb-4 md:pt-4 overflow-hidden md:overflow-y-auto md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
      {/* Date removed from here - now shown inline with each step heading */}


      {/* Step: Mood */}
      {currentStep === 'mood' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-4">
            {isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2">
                <X className="w-4 h-4" />
                Avbryt
              </Button>
            ) : <div />}
          </div>

          {/* Date label + Heading + Streak */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-muted-foreground/50 text-[13px] tracking-[0.08em] uppercase font-semibold">
                {isDisplayToday ? format(displayDate, "EEEE d MMMM", { locale: sv }) : formattedDate}
              </p>
              {streakData.currentStreak > 0 && (
                <StreakBadge 
                  currentStreak={streakData.currentStreak}
                  longestStreak={streakData.longestStreak}
                  hasCheckedInToday={streakData.hasCheckedInToday}
                  milestone={streakData.milestone}
                  variant="compact"
                />
              )}
            </div>
            <h1 className="font-display text-[28px] sm:text-3xl md:text-3xl font-bold leading-tight tracking-tight">
              {isDisplayToday ? 'Hur känns det idag?' : 'Hur mådde du?'}
            </h1>
          </div>

          {/* Mood buttons */}
          <div className="flex flex-col gap-3.5 max-w-md">
            {moodButtons.map(({ mood, icon: Icon, label, sublabel, cssClass }) => {
              const isStable = mood === 'stable';
              return (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  className={cn(
                    "mood-btn rounded-2xl flex items-center gap-4 px-5 text-left group transition-all",
                    isStable ? "py-[18px]" : "py-[14px]",
                    cssClass,
                    checkinData.mood === mood && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={cn("relative z-10 transition-transform duration-300 group-hover:scale-110", isStable ? "w-7 h-7 sm:w-8 sm:h-8" : "w-6 h-6 sm:w-7 sm:h-7")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("font-semibold block", isStable ? "text-base sm:text-[17px]" : "text-[15px] sm:text-base")}>{label}</span>
                    <span className="text-xs opacity-60 block">{sublabel}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: Tags */}
      {currentStep === 'tags' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/50 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'mood' ? null : 'mood')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'mood' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <p className="text-muted-foreground/30 text-[11px] tracking-[0.15em] uppercase font-medium mb-3">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              Något särskilt idag?
            </h1>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2.5 max-w-md mb-6">
            {(checkinData.mood ? MOOD_TAGS[checkinData.mood] : []).map(({ value, label, emoji }) => {
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
                      : "border-border/40 text-muted-foreground/80 hover:border-border/70 hover:bg-white/[0.03]"
                  )}
                >
                  {selected && <Check className="w-3.5 h-3.5 mr-1.5 inline" />}
                  <span className="mr-1.5">{emoji}</span>
                  {label}
                </button>
              );
            })}
            {/* Custom tags already added */}
            {(checkinData.tags || [])
              .filter(t => !(checkinData.mood ? MOOD_TAGS[checkinData.mood] : []).some(o => o.value === t))
              .map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className="px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 active:scale-95 bg-primary/15 border-primary/40 text-primary"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5 inline" />
                  <span className="mr-1.5">🏷️</span>
                  {tag}
                </button>
              ))
            }
            {/* Add custom tag button — progressive disclosure */}
            {!showCustomTagInput ? (
              <button
                onClick={() => setShowCustomTagInput(true)}
                className="px-4 py-2.5 rounded-full border border-dashed border-border/30 text-sm font-medium text-muted-foreground/40 hover:text-muted-foreground/60 hover:border-border/50 transition-all"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5 inline" />
                Lägg till egen
              </button>
            ) : (
              <div className="w-full mt-2 flex items-center gap-2 max-w-xs">
                <input
                  type="text"
                  autoFocus
                  placeholder="Skriv en egen tagg..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-primary/30 bg-white/[0.03] text-base text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  maxLength={30}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const val = input.value.trim().toLowerCase();
                      if (val && !(checkinData.tags || []).includes(val)) {
                        handleTagToggle(val);
                      }
                      input.value = '';
                      input.blur();
                      setShowCustomTagInput(false);
                    }
                    if (e.key === 'Escape') {
                      setShowCustomTagInput(false);
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim().toLowerCase();
                    if (val && !(checkinData.tags || []).includes(val)) {
                      handleTagToggle(val);
                    }
                    setShowCustomTagInput(false);
                  }}
                />
              </div>
            )}
          </div>

          {renderCommentSection('mood')}

          <div className="flex justify-center mt-auto pt-4">
            <button
              onClick={handleTagsContinue}
              className="px-10 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:shadow-[0_8px_32px_hsl(45_85%_55%/0.5)] hover:bg-[hsl(45_85%_62%)] hover:scale-105 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5"
            >
              {(checkinData.tags || []).length > 0 ? 'Klar' : 'Nej, hoppa över'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Sleep */}
      {currentStep === 'sleep' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/50 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'sleep' ? null : 'sleep')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'sleep' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              Hur har du sovit?
            </h1>
          </div>

          <div className="flex flex-col gap-3.5 max-w-md">
            <button
              onClick={() => handleSleepSelect('good')}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-emerald-500/90 hover:bg-emerald-500",
                checkinData.sleepQuality === 'good' && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <MoonStar className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base text-white block">Bra</span>
                <span className="text-xs text-white/60 block">Sov gott</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" />
            </button>
            <button
              onClick={() => handleSleepSelect('okay')}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-amber-500/90 hover:bg-amber-500",
                checkinData.sleepQuality === 'okay' && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <Moon className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base text-white block">Helt ok</span>
                <span className="text-xs text-white/60 block">Varken bra eller dåligt</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" />
            </button>
            <button
              onClick={() => handleSleepSelect('bad')}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-rose-500/90 hover:bg-rose-500",
                checkinData.sleepQuality === 'bad' && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <CloudMoon className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base text-white block">Dåligt</span>
                <span className="text-xs text-white/60 block">Sov oroligt</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" />
            </button>
          </div>

          {renderCommentSection('sleep')}
        </div>
      )}

      {/* Step: Eating */}
      {currentStep === 'eating' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/50 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'eating' ? null : 'eating')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'eating' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              Hur har du ätit?
            </h1>
          </div>

          <div className="flex flex-col gap-3.5 max-w-md">
            <button
              onClick={() => handleEatingSelect('good')}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-emerald-500/90 hover:bg-emerald-500",
                checkinData.eatingQuality === 'good' && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <ThumbsUp className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base text-white block">Bra</span>
                <span className="text-xs text-white/60 block">Ätit bra idag</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" />
            </button>
            <button
              onClick={() => handleEatingSelect('okay')}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-amber-500/90 hover:bg-amber-500",
                checkinData.eatingQuality === 'okay' && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <Utensils className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base text-white block">Ok</span>
                <span className="text-xs text-white/60 block">Varken bra eller dåligt</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" />
            </button>
            <button
              onClick={() => handleEatingSelect('bad')}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-rose-500/90 hover:bg-rose-500",
                checkinData.eatingQuality === 'bad' && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <ThumbsDown className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base text-white block">Dåligt</span>
                <span className="text-xs text-white/60 block">Ätit dåligt</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" />
            </button>
          </div>

          {renderCommentSection('eating')}
        </div>
      )}

      {/* Step: Exercise */}
      {currentStep === 'exercise' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/50 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'exercise' ? null : 'exercise')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'exercise' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label="Lägg till kommentar"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              Har du tränat?
            </h1>
          </div>

          <div className="flex flex-col gap-3.5 max-w-md">
            <button
              onClick={() => handleExerciseSelect(true)}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-emerald-500/90 hover:bg-emerald-500",
                checkinData.exercised === true && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <Check className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base text-white block">Ja</span>
                <span className="text-xs text-white/60 block">Jag har tränat</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" />
            </button>
            <button
              onClick={() => handleExerciseSelect(false)}
              className={cn(
                "rounded-2xl flex items-center gap-4 px-5 py-[14px] text-left group transition-all bg-muted/50 hover:bg-muted/70",
                checkinData.exercised === false && "ring-3 ring-offset-2 ring-offset-background scale-[1.01]"
              )}
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[15px] sm:text-base block">Nej</span>
                <span className="text-xs text-muted-foreground/60 block">Vilodag</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-opacity flex-shrink-0" />
            </button>
          </div>

          {renderCommentSection('exercise')}
        </div>
      )}

      {/* Step: Medication */}
      {currentStep === 'medication' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/50 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowSideEffects(!showSideEffects)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  (showSideEffects || checkinData.medicationSideEffects?.length) ? "bg-amber-500/10 text-amber-500" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
                )}
                aria-label="Rapportera biverkningar"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowComment(showComment === 'medication' ? null : 'medication')}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  showComment === 'medication' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
                )}
                aria-label="Lägg till kommentar"
              >
                <MessageSquarePlus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              Har du tagit din medicin?
            </h1>
          </div>

          {/* Medication checklist */}
          {hasMedications ? (
            <div className="max-w-md space-y-2.5">
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
                    "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
                    medicationsTakenToday.length === activeMedications.length
                      ? "text-mood-stable bg-mood-stable/10"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
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
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                      "active:scale-[0.98]",
                      isTaken 
                        ? "border-mood-stable/20 bg-mood-stable/5" 
                        : "border-border/30 bg-card/20 hover:border-muted-foreground/20"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      isTaken ? "bg-mood-stable text-white" : "bg-muted/30 border border-border/50"
                    )}>
                      {isTaken && <Check className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-[15px] transition-colors",
                        isTaken ? "text-foreground" : "text-foreground/70"
                      )}>
                        {med.name}
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">{med.dosage}</p>
                    </div>
                    {isTaken && (
                      <span className="text-xs text-mood-stable/80 font-medium flex-shrink-0">Tagen ✓</span>
                    )}
                  </button>
                );
              })}

              {/* Missed medication reason */}
              {medicationsTakenToday.length < activeMedications.length && (
                <div className="pt-3">
                  <p className="text-xs text-muted-foreground/50 mb-2">Anledning till missad dos?</p>
                  <div className="flex flex-wrap gap-2">
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
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground/60 hover:border-muted-foreground/40"
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
            <div className="max-w-md py-4">
              <p className="text-sm text-muted-foreground/50">
                Du har inga aktiva mediciner registrerade.
              </p>
            </div>
          )}

          {/* Side effects section */}
          <div className="max-w-md space-y-4 mt-4">
            {showSideEffects && (
              <div className="space-y-2 pt-3 border-t border-border/30">
                <p className="text-sm font-medium text-amber-500/80">
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
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-border/30 text-muted-foreground/60 hover:border-amber-500/20"
                      )}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {renderCommentSection('medication')}

            {/* Status summary */}
            {activeMedications.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex gap-1">
                  {activeMedications.map(med => (
                    <div
                      key={med.id}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        medicationsTakenToday.includes(med.id) ? "bg-mood-stable" : "bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground/50">
                  {medicationsTakenToday.length} av {activeMedications.length} tagna
                </span>
              </div>
            )}

            {isLastStep('medication') ? (
              <Button onClick={handleComplete} className="w-full mt-4 py-6 text-base font-semibold gap-2">
                {activeMedications.length === 0
                  ? 'Fortsätt'
                  : medicationsTakenToday.length === activeMedications.length
                    ? 'Ja'
                    : medicationsTakenToday.length === 0
                      ? 'Nej'
                      : 'Inte alla'}
              </Button>
            ) : (
              <Button onClick={() => navigateStep(getNextStep('medication') as Step)} className="w-full mt-4 py-6 text-base font-semibold gap-2">
                {activeMedications.length === 0
                  ? 'Fortsätt'
                  : medicationsTakenToday.length === activeMedications.length
                    ? 'Ja'
                    : medicationsTakenToday.length === 0
                      ? 'Nej'
                      : 'Inte alla'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step: Custom Questions */}
      {currentStep === 'custom_questions' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/50 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </Button>
            <div />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              Egna frågor
            </h1>
          </div>

          <div className="max-w-lg space-y-3">
            {customQuestions.map((q) => {
              const answered = customAnswersState[q.id];
              return (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">{q.question_text}</p>
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

          <div className="max-w-md mt-auto pt-6">
            {(() => {
              const totalQ = customQuestions.length;
              const answeredQ = Object.keys(customAnswersState).length;
              const allAnswered = answeredQ >= totalQ;
              const noneAnswered = answeredQ === 0;
              const label = allAnswered ? 'Klar ✓' : noneAnswered ? 'Hoppa över' : 'Fortsätt ändå';
              return (
                <Button onClick={async () => {
                  if (onSaveCustomAnswers) {
                    await onSaveCustomAnswers(customAnswersState);
                  }
                  handleComplete();
                }} className="w-full py-6 text-base font-semibold gap-2">
                  {label}
                </Button>
              );
            })()}
          </div>
        </div>
      )}

      {/* Success Animation */}
      {currentStep === 'success-animation' && (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <CelebrationAnimation 
            streak={streakData.currentStreak}
            milestone={streakData.milestone}
          />
        </div>
      )}

    </div>
  );
}

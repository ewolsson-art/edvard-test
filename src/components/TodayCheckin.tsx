import { useState, useEffect, useMemo, useRef, KeyboardEvent } from 'react';
import { format, differenceInDays, parseISO, isToday, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Flame, Zap, Sun, Cloud, CloudRain, MessageSquarePlus, CheckCircle2, Pill, Pencil, Moon, MoonStar, CloudMoon, Utensils, Dumbbell, ThumbsUp, ThumbsDown, Check, X, ChevronRight, ChevronLeft, Heart, AlertTriangle, HelpCircle, CalendarIcon, Plus } from 'lucide-react';
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
  { mood: 'depressed', icon: CloudRain, label: 'Mycket låg', sublabel: 'Väldigt tungt idag', cssClass: 'mood-btn-depressed' },
];

const MOOD_TAGS: Record<MoodType, { value: string; label: string; emoji: string }[]> = {
  elevated: [
    { value: 'racing thoughts', label: 'Racing thoughts', emoji: '💭' },
    { value: 'rastlöshet', label: 'Rastlöshet', emoji: '🦶' },
    { value: 'impulsivitet', label: 'Impulsivitet', emoji: '⚡' },
    { value: 'eufori', label: 'Eufori', emoji: '✨' },
    { value: 'irritabilitet', label: 'Irritabilitet', emoji: '😤' },
    { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
    { value: 'storslagna planer', label: 'Storslagna planer', emoji: '🏔️' },
    { value: 'pratar mycket', label: 'Pratar mycket', emoji: '🗣️' },
  ],
  somewhat_elevated: [
    { value: 'rastlöshet', label: 'Rastlöshet', emoji: '🦶' },
    { value: 'impulsivitet', label: 'Impulsivitet', emoji: '⚡' },
    { value: 'irritabilitet', label: 'Irritabilitet', emoji: '😤' },
    { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
    { value: 'social', label: 'Social', emoji: '👥' },
    { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
    { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
    { value: 'stress', label: 'Stress', emoji: '😓' },
  ],
  stable: [
    { value: 'lugn', label: 'Lugn', emoji: '🧘' },
    { value: 'fokuserad', label: 'Fokuserad', emoji: '🎯' },
    { value: 'tacksam', label: 'Tacksam', emoji: '🙏' },
    { value: 'social', label: 'Social', emoji: '👥' },
    { value: 'stress', label: 'Stress', emoji: '😓' },
    { value: 'ångest', label: 'Ångest', emoji: '😰' },
    { value: 'trött', label: 'Trött', emoji: '😴' },
    { value: 'nöjd', label: 'Nöjd', emoji: '😊' },
  ],
  somewhat_depressed: [
    { value: 'ångest', label: 'Ångest', emoji: '😰' },
    { value: 'trött', label: 'Trött', emoji: '😴' },
    { value: 'koncentrationssvårigheter', label: 'Fokussvårt', emoji: '🧠' },
    { value: 'social tillbakadragning', label: 'Isolering', emoji: '🚪' },
    { value: 'gråtmild', label: 'Gråtmild', emoji: '😢' },
    { value: 'irritabilitet', label: 'Irritabilitet', emoji: '😤' },
    { value: 'stress', label: 'Stress', emoji: '😓' },
    { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
  ],
  depressed: [
    { value: 'hopplöshet', label: 'Hopplöshet', emoji: '🌑' },
    { value: 'ångest', label: 'Ångest', emoji: '😰' },
    { value: 'gråtmild', label: 'Gråtmild', emoji: '😢' },
    { value: 'social tillbakadragning', label: 'Isolering', emoji: '🚪' },
    { value: 'koncentrationssvårigheter', label: 'Fokussvårt', emoji: '🧠' },
    { value: 'tomhet', label: 'Tomhet', emoji: '🫥' },
    { value: 'skuldkänslor', label: 'Skuldkänslor', emoji: '😞' },
    { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
  ],
};

// All unique tags for display in summaries
const ALL_TAG_OPTIONS = Object.values(MOOD_TAGS).flat().filter((t, i, arr) => arr.findIndex(a => a.value === t.value) === i);

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
  if (isCheckinComplete && !isEditing) {
    const moodDisplay = todayEntry ? getMoodDisplay(todayEntry.mood) : null;
    const MoodIcon = moodDisplay?.icon || Sun;
    const followUp = todayEntry ? getSmartFollowUp(todayEntry.mood, todayEntry.energyLevel) : null;

    return (
      <div className="fade-in h-full md:h-auto flex flex-col justify-center px-5 py-8 md:glass-card md:p-10 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
        <div className="text-center mb-5">
          <p className="text-muted-foreground/60 text-[11px] tracking-[0.2em] uppercase font-medium">{formattedDate}</p>
          {!isDisplayToday && (
            <p className="text-[11px] text-primary mt-1 font-medium">Retroaktiv incheckning</p>
          )}
        </div>

        <div className="fade-in">
          <div className="flex justify-center mb-4">
            <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center", moodDisplay?.bgClass)}>
              <CheckCircle2 className={cn("w-7 h-7 md:w-8 md:h-8", moodDisplay?.colorClass || 'text-mood-stable')} />
            </div>
          </div>
          
          <h1 className="font-display text-[22px] md:text-2xl font-bold text-foreground text-center">
            Du har checkat in!
          </h1>

          {/* Smart follow-up message */}
          {followUp && (
            <div className="max-w-sm mx-auto mt-4 p-4 rounded-xl bg-card border border-border/30">
              <p className="text-sm text-foreground/80 leading-relaxed text-center">
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
              <p className="text-sm text-foreground/80 leading-relaxed text-center">
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
          <div className="max-w-sm mx-auto mt-5 space-y-2 text-left">
            {todayEntry && moodDisplay && (
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", moodDisplay.bgClass, moodDisplay.borderClass)}>
                <MoodIcon className={cn("w-5 h-5 flex-shrink-0", moodDisplay.colorClass)} />
                <span className="text-sm font-medium">Mående: <strong>{MOOD_LABELS[todayEntry.mood]}</strong></span>
              </div>
            )}
            {todayEntry?.tags && todayEntry.tags.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card border-border/30">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-primary" />
                <span className="text-sm font-medium">
                  {todayEntry.tags.map(t => ALL_TAG_OPTIONS.find(o => o.value === t)?.label || t).join(', ')}
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
                todayEntry.exercised ? "bg-mood-stable/10 border-mood-stable/20" : "bg-muted/30 border-border/30"
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
                  answer === 'yes' ? "bg-mood-stable/10 border-mood-stable/20" : "bg-muted/30 border-border/30"
                )}>
                  <HelpCircle className={cn("w-5 h-5 flex-shrink-0", answer === 'yes' ? "text-mood-stable" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">{q.question_text}: <strong>{answer === 'yes' ? 'Ja' : 'Nej'}</strong></span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleEdit} className="mt-6 gap-2 text-muted-foreground/50">
              <Pencil className="w-4 h-4" />
              Ändra incheckning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-5 py-4 overflow-hidden md:overflow-y-auto md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
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
            {streakData.currentStreak > 0 && (
              <StreakBadge 
                currentStreak={streakData.currentStreak}
                longestStreak={streakData.longestStreak}
                hasCheckedInToday={streakData.hasCheckedInToday}
                variant="compact"
              />
            )}
          </div>

          {/* Date label + Heading */}
          <div className="mb-10">
            <p className="text-muted-foreground/50 text-[13px] tracking-[0.08em] uppercase font-semibold mb-3">
              {isDisplayToday ? format(displayDate, "EEEE d MMMM", { locale: sv }) : formattedDate}
            </p>
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
            <Button
              onClick={handleTagsContinue}
              className="px-8 py-3 rounded-xl text-base font-semibold"
            >
              {(checkinData.tags || []).length > 0 ? 'Klar' : 'Nej, hoppa över'}
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
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

          <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
              onClick={() => handleSleepSelect('good')}
              className={cn(
                "checkin-option-card positive aspect-square",
                checkinData.sleepQuality === 'good' && "selected"
              )}
            >
              <div className="icon-wrapper !w-12 !h-12">
                <MoonStar className="w-7 h-7 text-mood-stable" />
              </div>
              <span className="font-semibold text-base">Bra</span>
              <span className="text-[10px] text-muted-foreground/50">Sov gott</span>
            </button>
            <button
              onClick={() => handleSleepSelect('okay')}
              className={cn(
                "checkin-option-card aspect-square",
                checkinData.sleepQuality === 'okay' && "selected"
              )}
            >
              <div className="icon-wrapper !w-12 !h-12">
                <Moon className="w-7 h-7 text-mood-somewhat-elevated" />
              </div>
              <span className="font-semibold text-base">Helt ok</span>
              <span className="text-[10px] text-muted-foreground/50">Varken bra eller dåligt</span>
            </button>
            <button
              onClick={() => handleSleepSelect('bad')}
              className={cn(
                "checkin-option-card negative aspect-square",
                checkinData.sleepQuality === 'bad' && "selected"
              )}
            >
              <div className="icon-wrapper !w-12 !h-12">
                <CloudMoon className="w-7 h-7 text-mood-depressed" />
              </div>
              <span className="font-semibold text-base">Dåligt</span>
              <span className="text-[10px] text-muted-foreground/50">Sov oroligt</span>
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

          <div className="grid grid-cols-3 gap-3 max-w-sm">
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

          <div className="grid grid-cols-2 gap-4 max-w-sm">
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
              <span className="text-xs text-muted-foreground/50">Jag har tränat</span>
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
              <span className="text-xs text-muted-foreground/50">Vilodag</span>
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

          {/* Direct medication checklist */}
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
              {medicationsTakenToday.length < activeMedications.length && medicationsTakenToday.length > 0 && (
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

            {isLastStep('medication') ? (
              <Button onClick={handleComplete} className="w-full mt-8 py-6 text-base font-semibold gap-2">
                Klar ✓
              </Button>
            ) : (
              <Button onClick={() => navigateStep(getNextStep('medication') as Step)} className="w-full mt-8 py-6 text-base font-semibold gap-2">
                Fortsätt
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
            <Button onClick={async () => {
              if (onSaveCustomAnswers) {
                await onSaveCustomAnswers(customAnswersState);
              }
              handleComplete();
            }} className="w-full py-6 text-base font-semibold gap-2">
              Klar ✓
            </Button>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {currentStep === 'success-animation' && (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <CelebrationAnimation />
        </div>
      )}

    </div>
  );
}

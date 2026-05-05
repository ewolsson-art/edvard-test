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
import { VerticalMoodSlider } from '@/components/VerticalMoodSlider';
import { VerticalScaleSlider, ScaleOption } from '@/components/VerticalScaleSlider';
import { MoodTapButtons } from '@/components/MoodTapButtons';
import { TurtleLogo } from '@/components/TurtleLogo';
import { FullscreenComment } from '@/components/FullscreenComment';
import { useIsMobile } from '@/hooks/use-mobile';
import { MilestoneInfo } from '@/hooks/useStreak';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

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

const useSleepSliderOptions = () => {
  const { t } = useTranslation();
  return useMemo((): ScaleOption<QualityType>[] => [
    // 'bad' = för mycket sömn (kan vara symptom på depression / utmattning)
    { value: 'bad', label: t('checkin.tooMuchSleep'), sublabel: t('checkin.tooMuchSleepSub'), icon: MoonStar, color: '25 70% 50%' },
    { value: 'very_good', label: t('checkin.deepCalm'), sublabel: t('checkin.deepCalmSub'), icon: MoonStar, color: '160 70% 40%' },
    { value: 'good', label: t('checkin.goodEnough'), sublabel: t('checkin.goodEnoughSub'), icon: MoonStar, color: '150 55% 48%' },
    { value: 'okay', label: t('checkin.justOkay'), sublabel: t('checkin.justOkaySub'), icon: Moon, color: '45 70% 50%' },
    { value: 'little', label: t('checkin.unusuallyLittle'), sublabel: t('checkin.unusuallyLittleSub'), icon: CloudMoon, color: '25 70% 50%' },
    { value: 'very_little', label: t('checkin.almostNothing'), sublabel: t('checkin.almostNothingSub'), icon: CloudMoon, color: '0 65% 50%' },
  ], [t]);
};

// Static fallback mood buttons (will be overridden by diagnosis config)
const defaultMoodButtons: { mood: MoodType; icon: typeof Zap; label: string; sublabel: string; cssClass: string }[] = [
  { mood: 'elevated', icon: Flame, label: 'Mycket upp', sublabel: 'Rastlös, racing thoughts', cssClass: 'mood-btn-elevated' },
  { mood: 'somewhat_elevated', icon: Zap, label: 'Upp', sublabel: 'Energisk, positiv', cssClass: 'mood-btn-somewhat-elevated' },
  { mood: 'stable', icon: Sun, label: 'Stabil', sublabel: 'Balanserad, lugn', cssClass: 'mood-btn-stable' },
  { mood: 'somewhat_depressed', icon: Cloud, label: 'Låg', sublabel: 'Tung, trött', cssClass: 'mood-btn-somewhat-depressed' },
  { mood: 'depressed', icon: CloudRain, label: 'Mycket låg', sublabel: 'Väldigt tungt idag', cssClass: 'mood-btn-depressed' },
];

const moodIcons: Record<MoodType, typeof Zap> = {
  severe_elevated: Flame,
  elevated: Flame,
  somewhat_elevated: Zap,
  stable: Sun,
  somewhat_depressed: Cloud,
  depressed: CloudRain,
  severe_depressed: CloudRain,
};

const moodCssClasses: Record<MoodType, string> = {
  severe_elevated: 'mood-btn-severe-elevated',
  elevated: 'mood-btn-elevated',
  somewhat_elevated: 'mood-btn-somewhat-elevated',
  stable: 'mood-btn-stable',
  somewhat_depressed: 'mood-btn-somewhat-depressed',
  depressed: 'mood-btn-depressed',
  severe_depressed: 'mood-btn-severe-depressed',
};

const moodColorVars: Record<MoodType, string> = {
  severe_elevated: 'var(--mood-severe-elevated)',
  elevated: 'var(--mood-elevated)',
  somewhat_elevated: 'var(--mood-somewhat-elevated)',
  stable: 'var(--mood-stable)',
  somewhat_depressed: 'var(--mood-somewhat-depressed)',
  depressed: 'var(--mood-depressed)',
  severe_depressed: 'var(--mood-severe-depressed)',
};

// Smart follow-up messages based on mood + energy combination
function getSmartFollowUp(mood: MoodType, energy?: EnergyType, t?: (key: string) => string): { message: string; icon: string } | null {
  const tr = t || ((k: string) => k);
  if ((mood === 'severe_depressed' || mood === 'depressed') && energy === 'high') {
    return { message: tr('checkin.highEnergyLow'), icon: '💙' };
  }
  if (mood === 'severe_depressed' || mood === 'depressed' || mood === 'somewhat_depressed') {
    return { message: tr('checkin.toughNow'), icon: '💛' };
  }
  if ((mood === 'severe_elevated' || mood === 'elevated') && energy === 'high') {
    return { message: tr('checkin.veryHighEnergy'), icon: '⚠️' };
  }
  if (mood === 'severe_elevated' || mood === 'elevated') {
    return { message: tr('checkin.watchSleep'), icon: '🧘' };
  }
  if (mood === 'somewhat_elevated' && energy === 'high') {
    return { message: tr('checkin.goodDay'), icon: '✨' };
  }
  if (mood === 'stable') {
    return { message: tr('checkin.goodToHear'), icon: '☀️' };
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
  const { t } = useTranslation();
  const { moodLabels, moodSublabels, moodTags: diagnosisMoodTags } = useDiagnosisConfig();
  const sleepSliderOptions = useSleepSliderOptions();
  
  const moodButtons = useMemo(() => {
    const moods: MoodType[] = ['severe_depressed', 'depressed', 'somewhat_depressed', 'stable', 'somewhat_elevated', 'elevated', 'severe_elevated'];
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
    Object.values(MOOD_TAGS).flat().filter((tag, i, arr) => arr.findIndex(a => a.value === tag.value) === i),
    [MOOD_TAGS]
  );

  const displayDate = selectedDateProp || new Date();
  const isDisplayToday = isToday(displayDate);
  const isDisplayYesterday = isYesterday(displayDate);
  const formattedDate = isDisplayToday 
    ? t('common.today') 
    : isDisplayYesterday 
      ? t('common.yesterday') 
      : format(displayDate, "EEEE d MMMM", { locale: sv });

  // Build dynamic steps based on preferences (separate sets for quick vs detailed)
  const STEPS = useMemo(() => {
    const steps: Step[] = ['mood', 'tags']; // Mood + Tags always included
    const isQuick = checkinMode === 'quick';

    const includeSleep = isQuick ? preferences?.quick_include_sleep : preferences?.include_sleep;
    const includeEating = isQuick ? preferences?.quick_include_eating : preferences?.include_eating;
    const includeExercise = isQuick ? preferences?.quick_include_exercise : preferences?.include_exercise;
    const includeMedication = isQuick ? preferences?.quick_include_medication : preferences?.include_medication;

    if (includeSleep) steps.push('sleep');
    if (includeEating) steps.push('eating');
    if (includeExercise) steps.push('exercise');
    if (includeMedication) steps.push('medication');
    if (!isQuick && customQuestions.length > 0) steps.push('custom_questions');

    return steps;
  }, [preferences, customQuestions.length, checkinMode]);

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
  const [checkinData, setCheckinData] = useState<CheckinData>({ mood: 'stable', sleepQuality: 'okay' });
  const [customAnswersState, setCustomAnswersState] = useState<Record<string, string>>(initialCustomAnswers);
  const [checkinMode, setCheckinMode] = useState<'quick' | 'detailed'>('detailed');

  // Auto-mark scheduled medications as taken when entering medication step for the first time.
  // Vid behov-mediciner är frivilliga och förkryssas aldrig.
  const hasPrefilled = useRef(false);
  useEffect(() => {
    if (currentStep === 'medication' && activeMedications.length > 0 && medicationsTakenToday.length === 0 && !hasPrefilled.current) {
      hasPrefilled.current = true;
      activeMedications
        .filter(med => med.frequency !== 'as_needed')
        .forEach(med => onToggleMedication(med.id, true));
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
      setCheckinData({ mood: 'stable', sleepQuality: 'okay' });
    }
  }, [todayEntry, displayDate.toDateString()]);

  // Check if checkin is complete based on active preferences
  const isCheckinComplete = useMemo(() => {
    // A check-in is considered complete as soon as a mood has been registered
    // for the day. This supports the "quick" check-in mode where the user only
    // logs their mood — we still want to show them the celebratory summary
    // view rather than a blank screen. Sleep / eating / exercise sections in
    // the summary already render conditionally based on what's available.
    return Boolean(todayEntry?.mood);
  }, [todayEntry]);

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
  };

  const handleMoodContinue = () => {
    if (checkinData.mood) {
      navigateStep('tags');
    }
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
  };

  const handleSleepContinue = () => {
    if (checkinData.sleepQuality) {
      const nextStep = getNextStep('sleep');
      if (nextStep === 'success-animation') {
        handleCompleteWithData(checkinData);
      } else {
        navigateStep(nextStep);
      }
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
    mood: { title: t('checkin.commentMood'), placeholder: t('checkin.tellMoreMood'), getValue: () => checkinData.moodComment || '', setValue: (v) => updateComment('mood', v) },
    sleep: { title: t('checkin.commentSleep'), placeholder: t('checkin.tellMoreSleep'), getValue: () => checkinData.sleepComment || '', setValue: (v) => updateComment('sleep', v) },
    eating: { title: t('checkin.commentEating'), placeholder: t('checkin.tellMoreEating'), getValue: () => checkinData.eatingComment || '', setValue: (v) => updateComment('eating', v) },
    exercise: { title: t('checkin.commentExercise'), placeholder: t('checkin.tellMoreExercise'), getValue: () => checkinData.exerciseComment || '', setValue: (v) => updateComment('exercise', v) },
    medication: { title: t('checkin.commentMedication'), placeholder: t('checkin.tellMoreMedication'), getValue: () => checkinData.medicationComment || '', setValue: (v) => setCheckinData(prev => ({ ...prev, medicationComment: v })) },
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
  const scheduledMedications = activeMedications.filter(m => m.frequency !== 'as_needed');
  const asNeededMedications = activeMedications.filter(m => m.frequency === 'as_needed');
  const scheduledTakenCount = scheduledMedications.filter(m => medicationsTakenToday.includes(m.id)).length;
  const allScheduledTaken = scheduledMedications.length > 0 && scheduledTakenCount === scheduledMedications.length;
  const noScheduledTaken = scheduledMedications.length > 0 && scheduledTakenCount === 0;

  // Helper to get mood icon and color for summary
  const getMoodDisplay = (mood: MoodType) => {
    const config: Record<MoodType, { icon: typeof Zap; colorClass: string; bgClass: string; borderClass: string }> = {
      severe_elevated: { icon: Flame, colorClass: 'text-mood-severe-elevated', bgClass: 'bg-mood-severe-elevated/10', borderClass: 'border-mood-severe-elevated/20' },
      elevated: { icon: Flame, colorClass: 'text-mood-elevated', bgClass: 'bg-mood-elevated/10', borderClass: 'border-mood-elevated/20' },
      somewhat_elevated: { icon: Zap, colorClass: 'text-mood-somewhat-elevated', bgClass: 'bg-mood-somewhat-elevated/10', borderClass: 'border-mood-somewhat-elevated/20' },
      stable: { icon: Sun, colorClass: 'text-mood-stable', bgClass: 'bg-mood-stable/10', borderClass: 'border-mood-stable/20' },
      somewhat_depressed: { icon: Cloud, colorClass: 'text-mood-somewhat-depressed', bgClass: 'bg-mood-somewhat-depressed/10', borderClass: 'border-mood-somewhat-depressed/20' },
      depressed: { icon: CloudRain, colorClass: 'text-mood-depressed', bgClass: 'bg-mood-depressed/10', borderClass: 'border-mood-depressed/20' },
      severe_depressed: { icon: CloudRain, colorClass: 'text-mood-severe-depressed', bgClass: 'bg-mood-severe-depressed/10', borderClass: 'border-mood-severe-depressed/20' },
    };
    return config[mood];
  };

  const [checkinMode, setCheckinMode] = useState<'quick' | 'detailed'>('detailed');

  // Show complete state
  if (isCheckinComplete && !isEditing && currentStep !== 'success-animation') {
    const moodDisplay = todayEntry ? getMoodDisplay(todayEntry.mood) : null;
    const MoodIcon = moodDisplay?.icon || Sun;
    const followUp = todayEntry ? getSmartFollowUp(todayEntry.mood, todayEntry.energyLevel) : null;

    // Build inline summary items
    const summaryItems: { label: string; value: string; colorClass?: string }[] = [];
    if (todayEntry) {
      summaryItems.push({ label: t('checkin.mood'), value: moodLabels[todayEntry.mood], colorClass: moodDisplay?.colorClass });
    }
    if (preferences?.include_sleep && todayEntry?.sleepQuality) {
      summaryItems.push({ 
        label: t('checkin.sleep'), 
        value: QUALITY_LABELS[todayEntry.sleepQuality],
        colorClass: (todayEntry.sleepQuality === 'good' || todayEntry.sleepQuality === 'very_good') ? 'text-mood-stable' : (todayEntry.sleepQuality === 'little' || todayEntry.sleepQuality === 'very_little' || todayEntry.sleepQuality === 'bad') ? 'text-mood-depressed' : 'text-primary'
      });
    }
    if (preferences?.include_eating && todayEntry?.eatingQuality) {
      summaryItems.push({ 
        label: t('checkin.eating'), 
        value: QUALITY_LABELS[todayEntry.eatingQuality],
        colorClass: todayEntry.eatingQuality === 'good' ? 'text-mood-stable' : todayEntry.eatingQuality === 'bad' ? 'text-mood-depressed' : 'text-primary'
      });
    }
    if (preferences?.include_exercise && todayEntry?.exercised !== undefined) {
      summaryItems.push({ 
        label: t('checkin.exercise'), 
        value: todayEntry.exercised ? t('common.yes') : t('common.no'),
        colorClass: todayEntry.exercised ? 'text-mood-stable' : 'text-muted-foreground'
      });
    }

    const tags = todayEntry?.tags && todayEntry.tags.length > 0
      ? todayEntry.tags.map(t => ALL_TAG_OPTIONS.find(o => o.value === t)?.label || t)
      : [];

    const customAnswerItems = customQuestions
      .filter(q => customAnswersState[q.id])
      .map(q => ({ question: q.question_text, answer: customAnswersState[q.id] === 'yes' ? t('common.yes') : t('common.no') }));

    const isLowMood = todayEntry?.mood === 'severe_depressed' || todayEntry?.mood === 'depressed' || todayEntry?.mood === 'somewhat_depressed';
    const isHighMood = todayEntry?.mood === 'severe_elevated' || todayEntry?.mood === 'elevated' || todayEntry?.mood === 'somewhat_elevated';
    const isStable = todayEntry?.mood === 'stable';

    const moodColorVar = todayEntry ? moodColorVars[todayEntry.mood] : 'var(--primary)';
    const moodColor = `hsl(${moodColorVar})`;

    // Personlig hälsning baserat på stämningsläge
    const namePart = firstName?.trim() ? `, ${firstName.trim()}` : '';
    const heroTitle = isLowMood
      ? `Tack för att du loggade idag${namePart}`
      : isHighMood
        ? `Bra att du fångar känslan${namePart}`
        : isStable
          ? `Snyggt jobbat${namePart}`
          : `Klart${namePart}`;

    const heroSub = isLowMood
      ? 'En tung dag är också värd att se. Var snäll mot dig själv ikväll.'
      : isHighMood
        ? 'Försök hitta en lugn stund — bra för balansen över tid.'
        : isStable
          ? 'Stabilitet är en superkraft. Fortsätt med det du gör.'
          : 'Din incheckning är sparad.';

    return (
      <div className="fade-in h-full md:h-auto flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden">
        {/* Mood-färgad ambient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-[520px] h-[520px] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${moodColor.replace(')', ' / 0.16)')} 0%, transparent 60%)`,
            }}
          />
        </div>

        <div className="relative flex flex-col items-center text-center w-full max-w-md">
          {/* Hero: mood-ikon i färgad cirkel + ev. streak */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22, mass: 0.7 }}
            className="flex items-center gap-4 md:gap-6 mb-8"
          >
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: moodColor.replace(')', ' / 0.12)'),
                boxShadow: `0 0 40px ${moodColor.replace(')', ' / 0.3)')}, inset 0 0 0 1px ${moodColor.replace(')', ' / 0.25)')}`,
              }}
            >
              <MoodIcon
                className="w-12 h-12 md:w-14 md:h-14"
                style={{ color: moodColor }}
                strokeWidth={1.75}
              />
            </div>
            {streakData.currentStreak > 0 && (
              <div className="text-left">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 18 }}
                  className="block text-[72px] md:text-[88px] font-bold tabular-nums leading-[0.8] tracking-tighter bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-transparent"
                >
                  {streakData.currentStreak}
                </motion.span>
                <div className="flex items-center gap-1.5 mt-2 ml-1">
                  <Flame className="w-3 h-3 text-primary/70" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/40 font-medium">
                    {streakData.currentStreak === 1 ? t('checkin.dayStreak') : t('checkin.daysStreak')} {t('checkin.inARow')}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Personlig hälsning borttagen */}

          {/* Status pills */}
          {summaryItems.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } } }}
              className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-[340px]"
            >
              {summaryItems.map((item) => (
                <motion.span
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, y: 8, scale: 0.9 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 22 } },
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-foreground/10 backdrop-blur-sm text-[12.5px]"
                >
                  <span className="text-foreground/35 text-[10.5px] uppercase tracking-wider font-medium">{item.label}</span>
                  <span className={cn('font-semibold', item.colorClass || 'text-foreground/85')}>{item.value}</span>
                </motion.span>
              ))}
            </motion.div>
          )}

          {/* Empatiskt budskap för låga mood — pedagogiskt & varmt */}
          {isLowMood && encouragementData.goodDaysCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 24 }}
              className="mb-6 max-w-[340px] w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] backdrop-blur-sm"
            >
              {/* Färgad accent-stripe */}
              <div
                className="h-[3px] w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${moodColor}, transparent)` }}
              />

              <div className="px-5 py-4">
                {/* Header: ikon + label */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: moodColor.replace(')', ' / 0.15)') }}
                  >
                    <Heart
                      className="w-3.5 h-3.5"
                      style={{ color: moodColor, fill: moodColor.replace(')', ' / 0.4)') }}
                    />
                  </div>
                  <span className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-foreground/45">
                    En liten påminnelse
                  </span>
                </div>

                {/* Pedagogisk mätare: senaste bra dag */}
                {encouragementData.daysSinceGood !== null && encouragementData.daysSinceGood <= 14 ? (
                  <div className="text-left space-y-3">
                    <p className="text-[15px] leading-snug text-foreground/90 font-medium">
                      För <span style={{ color: moodColor }}>{encouragementData.daysSinceGood}</span>{' '}
                      {encouragementData.daysSinceGood === 1 ? 'dag' : 'dagar'} sedan mådde du bra.
                    </p>
                    <p className="text-[13px] leading-relaxed text-foreground/55">
                      Måendet rör sig i vågor — det här är en svacka, inte en slutpunkt. Var snäll mot dig själv idag.
                    </p>
                  </div>
                ) : (
                  <div className="text-left space-y-3">
                    <p className="text-[15px] leading-snug text-foreground/90 font-medium">
                      Du har haft <span style={{ color: moodColor }}>{encouragementData.goodDaysCount}</span> bra{' '}
                      {encouragementData.goodDaysCount === 1 ? 'dag' : 'dagar'} i år.
                    </p>
                    <p className="text-[13px] leading-relaxed text-foreground/55">
                      Bättre stunder kommer tillbaka. Att checka in idag är ett steg i rätt riktning.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Hint till översikten – visas alltid efter en klar incheckning */}
          <motion.a
            href="/oversikt"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, type: 'spring', stiffness: 260, damping: 24 }}
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[hsl(45_85%_55%)] hover:text-[hsl(45_85%_65%)] transition-colors"
          >
            Du kan följa upp ditt mående i översikt
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.a>

          {/* Edit-länk */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 text-[13px] text-foreground/40 hover:text-foreground/70 transition-colors duration-200 cursor-pointer group"
          >
            <Pencil className="w-3 h-3 transition-transform group-hover:rotate-[-8deg]" />
            {t('checkin.editCheckin')}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-5 pt-12 pb-4 md:pt-4 overflow-hidden md:overflow-y-auto md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:border md:border-foreground/10 md:bg-foreground/[0.03] md:backdrop-blur-sm md:rounded-2xl md:shadow-sm">
      {/* Date removed from here - now shown inline with each step heading */}


      {/* Step: Mood */}
      {currentStep === 'mood' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-4">
            {isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2">
                <X className="w-4 h-4" />
                {t('checkin.cancel')}
              </Button>
            ) : <div />}

            {/* Minimal segmented mode toggle */}
            <div
              role="tablist"
              aria-label={t('checkin.checkinMode')}
              className="relative inline-flex items-center rounded-full bg-foreground/[0.05] p-0.5 text-[11px] font-medium tracking-wide"
            >
              {/* Sliding thumb */}
              <motion.div
                aria-hidden
                className="absolute top-0.5 bottom-0.5 rounded-full bg-foreground/[0.08] border border-foreground/10"
                initial={false}
                animate={{
                  left: checkinMode === 'quick' ? 2 : '50%',
                  right: checkinMode === 'quick' ? '50%' : 2,
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.6 }}
              />
              <button
                role="tab"
                aria-selected={checkinMode === 'quick'}
                onClick={() => setCheckinMode('quick')}
                className={cn(
                  "relative z-10 px-3 py-1 rounded-full transition-colors duration-200",
                  checkinMode === 'quick'
                    ? "text-foreground"
                    : "text-muted-foreground/55 hover:text-foreground/80"
                )}
              >
                {t('checkin.quickCheckin')}
              </button>
              <button
                role="tab"
                aria-selected={checkinMode === 'detailed'}
                onClick={() => setCheckinMode('detailed')}
                className={cn(
                  "relative z-10 px-3 py-1 rounded-full transition-colors duration-200",
                  checkinMode === 'detailed'
                    ? "text-foreground"
                    : "text-muted-foreground/55 hover:text-foreground/80"
                )}
              >
                {t('checkin.detailedCheckin')}
              </button>
            </div>
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
          </div>

          {/* Mood selector — slider on all devices */}
          <div className="flex-1 flex flex-col justify-center">
            <VerticalMoodSlider
              options={moodButtons.map(b => ({ mood: b.mood, label: b.label, sublabel: b.sublabel }))}
              value={checkinData.mood}
              onSelect={handleMoodSelect}
            />
          </div>

          {checkinData.mood && (
            <div className="flex flex-col items-stretch gap-2 pt-4 pb-2 max-w-md mx-auto w-full">
              <button
                onClick={() => {
                  if (checkinMode === 'quick') {
                    handleCompleteWithData({ mood: checkinData.mood });
                  } else {
                    handleMoodContinue();
                  }
                }}
                className="px-8 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:shadow-[0_8px_32px_hsl(45_85%_55%/0.5)] hover:bg-[hsl(45_85%_62%)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-1.5"
              >
                {checkinMode === 'quick' ? t('checkin.saveCheckin') : t('common.continue')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Tags */}
      {currentStep === 'tags' && (
        <div className="step-slide-in flex flex-col flex-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/50 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'mood' ? null : 'mood')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'mood' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label={t('checkin.addComment')}
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <p className="text-muted-foreground/30 text-[11px] tracking-[0.15em] uppercase font-medium mb-3">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              {t('checkin.anythingSpecial')}
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
                {t('checkin.addOwn')}
              </button>
            ) : (
              <div className="w-full mt-2 flex items-center gap-2 max-w-xs">
                <input
                  type="text"
                  autoFocus
                  placeholder={t('checkin.writeTag')}
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
              {(checkinData.tags || []).length > 0 ? t('checkin.done') : t('checkin.skipIt')}
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
              {t('common.back')}
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'sleep' ? null : 'sleep')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'sleep' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label={t('checkin.addComment')}
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              {t('checkin.howDidYouSleep')}
            </h1>
          </div>

          {/* Sleep slider */}
          <div className="flex-1 flex flex-col justify-center">
            <VerticalScaleSlider<QualityType>
              options={sleepSliderOptions}
              value={checkinData.sleepQuality}
              onSelect={handleSleepSelect}
            />
          </div>

          {checkinData.sleepQuality && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                onClick={handleSleepContinue}
                className="px-10 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:shadow-[0_8px_32px_hsl(45_85%_55%/0.5)] hover:bg-[hsl(45_85%_62%)] hover:scale-105 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5"
              >
                {t('common.continue')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

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
              {t('common.back')}
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'eating' ? null : 'eating')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'eating' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label={t('checkin.addComment')}
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              {t('checkin.howDidYouEat')}
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
                <span className="font-semibold text-[15px] sm:text-base text-white block">{t('checkin.goodEating')}</span>
                <span className="text-xs text-white/60 block">{t('checkin.goodEatingDesc')}</span>
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
                <span className="font-semibold text-[15px] sm:text-base text-white block">{t('checkin.okEating')}</span>
                <span className="text-xs text-white/60 block">{t('checkin.okEatingDesc')}</span>
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
                <span className="font-semibold text-[15px] sm:text-base text-white block">{t('checkin.badEating')}</span>
                <span className="text-xs text-white/60 block">{t('checkin.badEatingDesc')}</span>
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
              {t('common.back')}
            </Button>
            <button
              onClick={() => setShowComment(showComment === 'exercise' ? null : 'exercise')}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showComment === 'exercise' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
              )}
              aria-label={t('checkin.addComment')}
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              {t('checkin.didYouExercise')}
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
                <span className="font-semibold text-[15px] sm:text-base text-white block">{t('common.yes')}</span>
                <span className="text-xs text-white/60 block">{t('checkin.iExercised')}</span>
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
                <span className="font-semibold text-[15px] sm:text-base block">{t('common.no')}</span>
                <span className="text-xs text-muted-foreground/60 block">{t('checkin.restDay')}</span>
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
              {t('common.back')}
            </Button>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowSideEffects(!showSideEffects)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  (showSideEffects || checkinData.medicationSideEffects?.length) ? "bg-amber-500/10 text-amber-500" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
                )}
                aria-label={t('checkin.reportSideEffects')}
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowComment(showComment === 'medication' ? null : 'medication')}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  showComment === 'medication' ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/30"
                )}
                aria-label={t('checkin.addComment')}
              >
                <MessageSquarePlus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              {t('checkin.haveYouTakenMedicine')}
            </h1>
          </div>

          {/* Medication checklist */}
          {hasMedications ? (
            <div className="max-w-md space-y-2.5">
              {/* Quick toggle: mark all (scheduled only) */}
              {scheduledMedications.length > 1 && (
                <button
                  onClick={() => {
                    scheduledMedications.forEach(med => {
                      onToggleMedication(med.id, !allScheduledTaken);
                    });
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
                    allScheduledTaken
                      ? "text-mood-stable bg-mood-stable/10"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {allScheduledTaken ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {t('checkin.allTaken')}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t('checkin.markAll')}
                    </>
                  )}
                </button>
              )}

              {/* Scheduled medications */}
              {scheduledMedications.map(med => {
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
                      <span className="text-xs text-mood-stable/80 font-medium flex-shrink-0">{t('checkin.takenCheck')}</span>
                    )}
                  </button>
                );
              })}

              {/* Missed scheduled medication reason */}
              {scheduledMedications.length > 0 && scheduledTakenCount < scheduledMedications.length && (
                <div className="pt-3">
                  <p className="text-xs text-muted-foreground/50 mb-2">{t('checkin.missedDoseReason')}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'forgot', label: t('checkin.forgot') },
                      { id: 'side_effects', label: t('checkin.sideEffectsReason') },
                      { id: 'out_of_stock', label: t('checkin.outOfStock') },
                      { id: 'choice', label: t('checkin.didntWantTo') },
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

              {/* Vid behov-mediciner — frivillig sektion, ingen "missad" logik */}
              {asNeededMedications.length > 0 && (
                <div className="pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/30 mb-2 px-1">
                    Vid behov
                  </p>
                  <p className="text-xs text-muted-foreground/50 mb-3 px-1">
                    Markera om du tagit någon av dessa idag.
                  </p>
                  <div className="space-y-2.5">
                    {asNeededMedications.map(med => {
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
                            <p className="text-xs text-muted-foreground/50 mt-0.5">
                              {med.dosage} · Vid behov
                            </p>
                          </div>
                          {isTaken && (
                            <span className="text-xs text-mood-stable/80 font-medium flex-shrink-0">{t('checkin.takenCheck')}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md py-4">
              <p className="text-sm text-muted-foreground/50">
                {t('checkin.noActiveMeds')}
              </p>
            </div>
          )}

          {/* Side effects section */}
          <div className="max-w-md space-y-4 mt-4">
            {showSideEffects && (
              <div className="space-y-2 pt-3 border-t border-border/30">
                <p className="text-sm font-medium text-amber-500/80">
                  {t('checkin.whichSideEffects')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'nausea', label: t('checkin.nausea') },
                    { id: 'headache', label: t('checkin.headache') },
                    { id: 'dizziness', label: t('checkin.dizziness') },
                    { id: 'fatigue', label: t('checkin.fatigue') },
                    { id: 'insomnia', label: t('checkin.sleepProblems') },
                    { id: 'appetite', label: t('checkin.appetiteChanges') },
                    { id: 'mood_changes', label: t('checkin.moodChanges') },
                    { id: 'other', label: t('checkin.other') },
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

            {/* Status summary — visar bara schemalagda mediciner */}
            {scheduledMedications.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex gap-1">
                  {scheduledMedications.map(med => (
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
                  {t('checkin.takenCount', { count: scheduledTakenCount, total: scheduledMedications.length })}
                </span>
              </div>
            )}

            {isLastStep('medication') ? (
              <Button onClick={handleComplete} className="w-full mt-4 py-6 text-base font-semibold gap-2">
                {scheduledMedications.length === 0
                  ? t('common.continue')
                  : allScheduledTaken
                    ? t('common.yes')
                    : noScheduledTaken
                      ? t('common.no')
                      : t('checkin.notAll')}
              </Button>
            ) : (
              <Button onClick={() => navigateStep(getNextStep('medication') as Step)} className="w-full mt-4 py-6 text-base font-semibold gap-2">
                {scheduledMedications.length === 0
                  ? t('common.continue')
                  : allScheduledTaken
                    ? t('common.yes')
                    : noScheduledTaken
                      ? t('common.no')
                      : t('checkin.notAll')}
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
              {t('common.back')}
            </Button>
            <div />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-muted-foreground/50 text-[13px] tracking-wide capitalize mb-1.5">{formattedDate}</p>
            <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight">
              {t('checkin.customQuestions')}
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
                      <span className="font-semibold">{t('common.yes')}</span>
                    </button>
                    <button
                      onClick={() => setCustomAnswersState(prev => ({ ...prev, [q.id]: 'no' }))}
                      className={cn(
                        "checkin-option-card neutral py-4",
                        answered === 'no' && "selected"
                      )}
                    >
                      <X className="w-6 h-6 text-muted-foreground" />
                      <span className="font-semibold">{t('common.no')}</span>
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
              const label = allAnswered ? t('checkin.done') + ' ✓' : noneAnswered ? t('checkin.skipIt') : t('checkin.continueAnyway');
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
            mood={checkinData.mood}
            firstName={firstName}
          />
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useMemo, useRef, KeyboardEvent } from 'react';
import { format, differenceInDays, parseISO, isToday, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Flame, Zap, Sun, Cloud, CloudRain, MessageSquarePlus, CheckCircle2, Pill, Pencil, Moon, MoonStar, CloudMoon, Utensils, Dumbbell, ThumbsUp, ThumbsDown, Check, X, ChevronRight, ChevronLeft, ChevronDown, Heart, AlertTriangle, HelpCircle, CalendarIcon, Plus, Trophy, ListChecks } from 'lucide-react';
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
import { TurtleLogo } from '@/components/TurtleLogo';
import { getTurtleMoodForMood } from '@/lib/moodTurtle';
import { FullscreenComment } from '@/components/FullscreenComment';
import { useIsMobile } from '@/hooks/use-mobile';
import { MilestoneInfo } from '@/hooks/useStreak';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePatientCharacteristics } from '@/hooks/usePatientCharacteristics';

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
  onToggleMedication: (medicationId: string, taken: boolean, options?: { silent?: boolean }) => void;
  preferences: UserPreferences | null;
  streakData: StreakData;
  /** When inside a retroactive multi-day batch: { current: 1-based, total } */
  retroProgress?: { current: number; total: number };
  customQuestions?: CustomQuestion[];
  customAnswers?: Record<string, string>;
  onSaveCustomAnswers?: (answers: Record<string, string>) => Promise<boolean>;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

const useSleepSliderOptions = () => {
  const { t } = useTranslation();
  return useMemo((): ScaleOption<QualityType>[] => [
    // U-form: extremerna (för mycket / för lite) är varningstecken vid bipolär.
    // 'good' (lagom) är förvalt mittenläge.
    { value: 'bad', label: t('checkin.tooMuchSleep'), sublabel: t('checkin.tooMuchSleepSub'), icon: MoonStar, color: '25 70% 50%' },
    { value: 'very_good', label: t('checkin.deepCalm'), sublabel: t('checkin.deepCalmSub'), icon: MoonStar, color: '160 70% 40%' },
    { value: 'good', label: t('checkin.goodEnough'), sublabel: t('checkin.goodEnoughSub'), icon: MoonStar, color: '150 55% 48%' },
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

type Step = 'mood' | 'day_rating' | 'tags' | 'sleep' | 'eating' | 'exercise' | 'medication' | 'custom_questions' | 'success-animation' | 'complete';

type DayRating = 'bad' | 'ok' | 'good';
const DAY_RATING_TAG_PREFIX = 'day:';
const getDayRatingFromTags = (tags?: string[]): DayRating | undefined => {
  const t = (tags || []).find(t => t.startsWith(DAY_RATING_TAG_PREFIX));
  if (!t) return undefined;
  const v = t.slice(DAY_RATING_TAG_PREFIX.length);
  return v === 'bad' || v === 'ok' || v === 'good' ? v : undefined;
};
const setDayRatingInTags = (tags: string[] | undefined, rating: DayRating): string[] => {
  const filtered = (tags || []).filter(t => !t.startsWith(DAY_RATING_TAG_PREFIX));
  return [...filtered, `${DAY_RATING_TAG_PREFIX}${rating}`];
};

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
  retroProgress,
  customQuestions = [],
  customAnswers: initialCustomAnswers = {},
  onSaveCustomAnswers,
  selectedDate: selectedDateProp,
  onSelectDate,
}: TodayCheckinProps) {
  const { t } = useTranslation();
  const { tap: hapticTap } = useHaptics();
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

  const [checkinMode, setCheckinMode] = useState<'quick' | 'detailed'>('quick');

  // Auto-save countdown för snabbläget — användaren rör sliden, väntar 1.5s, sparas.
  // Avbryts om de rör igen, byter steg/läge, eller trycker "Spara nu".
  const AUTOSAVE_MS = 1500;
  const [autoSaveDeadline, setAutoSaveDeadline] = useState<number | null>(null);
  const [autoSaveProgress, setAutoSaveProgress] = useState(0); // 0..1
  const userTouchedMoodRef = useRef(false);

  // Fixed step sets:
  //   Quick    = mood only (+ tags)
  //   Detailed = mood + medication + sleep (+ tags + custom questions)
  const STEPS = useMemo(() => {
    const steps: Step[] = ['mood'];
    if (checkinMode === 'quick') {
      steps.push('day_rating');
    } else {
      steps.push('day_rating');
      steps.push('medication');
      steps.push('sleep');
      if (customQuestions.length > 0) steps.push('custom_questions');
    }
    return steps;
  }, [customQuestions.length, checkinMode]);

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
  const [showThoughtInput, setShowThoughtInput] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);
  
  // Form data
  const [checkinData, setCheckinData] = useState<CheckinData>({ mood: 'stable', sleepQuality: 'good' });
  const [customAnswersState, setCustomAnswersState] = useState<Record<string, string>>(initialCustomAnswers);

  // Förslag baserade på användarens egna tidigare in-checkningar
  const { user } = useAuth();
  const { characteristics: userCheckinChars } = usePatientCharacteristics(user?.id);
  const moodTypeForSuggestions = useMemo(() => {
    const m = checkinData.mood;
    if (!m) return null;
    if (['severe_elevated', 'elevated', 'somewhat_elevated'].includes(m)) return 'elevated';
    if (['severe_depressed', 'depressed', 'somewhat_depressed'].includes(m)) return 'depressed';
    return null;
  }, [checkinData.mood]);
  const suggestedPriorTags = useMemo(() => {
    if (!moodTypeForSuggestions || !checkinData.mood) return [] as { name: string; count: number }[];
    const presetValues = new Set(
      MOOD_TAGS[checkinData.mood].flatMap(o => [o.value.toLowerCase(), o.label.toLowerCase()])
    );
    const selectedLower = new Set((checkinData.tags || []).map(t => t.toLowerCase()));
    const counts = new Map<string, { name: string; count: number }>();
    userCheckinChars
      .filter(c => c.source === 'checkin' && c.mood_type === moodTypeForSuggestions)
      .forEach(c => {
        const key = c.name.trim().toLowerCase();
        if (!key || presetValues.has(key) || selectedLower.has(key)) return;
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { name: c.name.trim(), count: 1 });
      });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [userCheckinChars, moodTypeForSuggestions, checkinData.mood, checkinData.tags, MOOD_TAGS]);

  // Medicin är en ren ja/nej-fråga — inget förkryssas automatiskt.
  // Användaren svarar själv genom att trycka Ja eller Nej.
  const hasPrefilled = useRef(false);

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
        sleepQuality: todayEntry.sleepQuality ?? 'good',
        sleepComment: todayEntry.sleepComment,
        eatingQuality: todayEntry.eatingQuality,
        eatingComment: todayEntry.eatingComment,
        exercised: todayEntry.exercised,
        exerciseComment: todayEntry.exerciseComment,
        tags: todayEntry.tags,
      });
    } else {
      setCheckinData({ mood: 'stable', sleepQuality: 'good' });
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

  // Autosave behålls för bakåtkompatibilitet men aktiveras inte längre i snabbläget
  useEffect(() => {
    setAutoSaveDeadline(null);
    setAutoSaveProgress(0);
  }, [checkinMode, currentStep, showComment]);

  useEffect(() => {
    if (!autoSaveDeadline) {
      setAutoSaveProgress(0);
      return;
    }
    const start = autoSaveDeadline - AUTOSAVE_MS;
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      const p = Math.min(1, (now - start) / AUTOSAVE_MS);
      setAutoSaveProgress(p);
      if (now >= autoSaveDeadline) {
        setAutoSaveDeadline(null);
        setAutoSaveProgress(0);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSaveDeadline]);

  const handleMoodContinue = () => {
    if (checkinData.mood) {
      navigateStep('day_rating');
    }
  };

  const handleQuickMoodContinue = () => {
    if (checkinData.mood) {
      navigateStep('day_rating');
    }
  };

  const handleDayRatingSelect = (rating: DayRating) => {
    hapticTap();
    setCheckinData(prev => ({ ...prev, tags: setDayRatingInTags(prev.tags, rating) }));
  };

  const handleQuickFinish = () => {
    if (!checkinData.mood) return;
    handleCompleteWithData({
      mood: checkinData.mood,
      moodComment: checkinData.moodComment,
      tags: checkinData.tags,
    });
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
      }, 5500);
    }
  };

  const handleComplete = async () => {
    const success = await onSaveCheckin(checkinData);
    if (success) {
      setCurrentStep('success-animation');
      setTimeout(() => {
        setCurrentStep('complete');
        setIsEditing(false);
      }, 5500);
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

  // Behandla alla aktiva mediciner som en enda ja/nej-fråga — systemet ska
  // inte särskilja på "vid behov" vs "schemalagt".
  const hasMedications = activeMedications.length > 0;
  const scheduledMedications = activeMedications;
  const asNeededMedications: Medication[] = [];
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



  // Show complete state
  if (isCheckinComplete && !isEditing && currentStep !== 'success-animation') {
    const moodDisplay = todayEntry ? getMoodDisplay(todayEntry.mood) : null;

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

    // Retroaktiv incheckning: enklare copy, ingen pedagogisk uppmuntran.
    const isRetroDay = !isDisplayToday;
    const isLastRetro = !!retroProgress && retroProgress.current === retroProgress.total;
    const retroDateLabel = format(displayDate, 'EEEE d MMM', { locale: sv });

    // Personlig hälsning baserat på stämningsläge — alltid neutral, aldrig värderande
    const namePart = firstName?.trim() ? `, ${firstName.trim()}` : '';
    const heroTitle = isRetroDay
      ? (isLastRetro
          ? `Dina missade dagar är ifyllda${namePart}`
          : 'Sparat')
      : isLowMood
        ? `Tack för att du loggade idag${namePart}`
        : isHighMood
          ? `Känslan är noterad${namePart}`
          : isStable
            ? `Dagen är loggad${namePart}`
            : `Klart${namePart}`;

    const heroSub = isRetroDay
      ? (isLastRetro
          ? `${streakData.currentStreak} ${streakData.currentStreak === 1 ? 'dag' : 'dagar'} i rad`
          : retroDateLabel.charAt(0).toUpperCase() + retroDateLabel.slice(1))
      : isLowMood
        ? 'En tung dag är också värd att se. Var snäll mot dig själv ikväll.'
        : isHighMood
          ? 'Försök hitta en lugn stund — bra för balansen över tid.'
          : isStable
            ? 'Stabilitet ger tydligare mönster över tid.'
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
          {/* Hero: stor stående sköldpadda som speglar dagens mående,
              med streak-tal som glödande badge i högra hörnet. */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.8 }}
            className="relative mb-6 translate-x-[6px]"
          >
            {/* Mjuk färgad glow bakom sköldpaddan */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl rounded-full opacity-50"
              style={{ background: `radial-gradient(circle, ${moodColor.replace(')', ' / 0.45)')}, transparent 70%)` }}
            />
            <TurtleLogo
              size="hero"
              animated
              staticPose
              mood={todayEntry ? getTurtleMoodForMood(todayEntry.mood) : undefined}
              holding={streakData.currentStreak > 0 ? 'sign' : 'book'}
              signValue={streakData.currentStreak > 0 ? streakData.currentStreak : undefined}
              signLabel={streakData.currentStreak > 0 ? `${streakData.currentStreak === 1 ? 'DAG' : 'DAGAR'} I RAD` : undefined}
              className="w-60 h-60 md:w-80 md:h-80 drop-shadow-[0_14px_32px_hsl(0_0%_0%/0.5)]"
            />
          </motion.div>

          {/* Hjälte-titel under sköldpaddan */}
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-[20px] md:text-[22px] font-semibold text-foreground/90 tracking-tight mb-1.5 max-w-[340px] mx-auto text-center"
          >
            {heroTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-[14px] text-foreground/55 leading-relaxed max-w-[320px] mx-auto text-center mb-10"
          >
            {heroSub}
          </motion.p>

          {/* Empatiskt budskap för låga mood — pedagogiskt & varmt.
              Visas inte för retroaktiva dagar — håll det enkelt där. */}
          {!isRetroDay && isLowMood && encouragementData.goodDaysCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 24 }}
              className="relative mb-8 w-full max-w-[360px] overflow-hidden rounded-3xl p-[1px] bg-gradient-to-b from-foreground/15 via-foreground/[0.04] to-transparent"
            >
              <div className="rounded-[23px] bg-[hsl(225_25%_5%)]/80 backdrop-blur-md px-6 py-5 text-left">
                {/* Header: ikon + label */}
                <div className="flex items-center gap-2 mb-4">
                  <Heart
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: moodColor, fill: moodColor.replace(')', ' / 0.35)') }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">
                    En liten påminnelse
                  </span>
                </div>

                {/* Pedagogisk mätare: senaste bra dag */}
                {encouragementData.daysSinceGood !== null && encouragementData.daysSinceGood <= 14 ? (
                  <>
                    <h3 className="text-[16px] leading-snug text-foreground/90 font-medium mb-2">
                      För <span style={{ color: moodColor }}>{encouragementData.daysSinceGood}</span>{' '}
                      {encouragementData.daysSinceGood === 1 ? 'dag' : 'dagar'} sedan mådde du bra.
                    </h3>
                    <p className="text-[13px] leading-relaxed text-foreground/50">
                      Måendet rör sig i vågor — det här är en svacka, inte en slutpunkt. Var snäll mot dig själv idag.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-[16px] leading-snug text-foreground/90 font-medium mb-2">
                      Du har haft <span style={{ color: moodColor }}>{encouragementData.goodDaysCount}</span> bra{' '}
                      {encouragementData.goodDaysCount === 1 ? 'dag' : 'dagar'} i år.
                    </h3>
                    <p className="text-[13px] leading-relaxed text-foreground/50">
                      Bättre stunder kommer tillbaka. Att checka in idag är ett steg i rätt riktning.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Sista retro-dagen klar — låt användaren manuellt gå till idag
              istället för att kastas tillbaka i ett tomt incheckningsformulär. */}
          {isLastRetro && onSelectDate && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 24 }}
              onClick={() => onSelectDate(new Date())}
              className="mb-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-[15px] tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:bg-[hsl(45_85%_62%)] active:scale-[0.98] transition-all duration-200"
            >
              Till idag
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}

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

  // Mood-färgad ambient backdrop tied to current selection (subtle, calming)
  const activeMoodColorVar = checkinData.mood ? moodColorVars[checkinData.mood] : 'var(--primary)';
  const activeMoodColor = `hsl(${activeMoodColorVar})`;

  return (
    <div className="fade-in relative h-full md:h-auto flex flex-col justify-center px-5 pt-12 pb-4 md:pt-4 overflow-hidden md:overflow-y-auto md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:rounded-2xl md:shadow-sm md:bg-foreground/[0.03] md:backdrop-blur-sm">
      {/* Mood-färgad ambient backdrop — andas med vald känsla */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${activeMoodColor.replace(')', ' / 0.10)')} 0%, transparent 55%)`,
          opacity: checkinData.mood ? 1 : 0.5,
        }}
      />
      {/* Retro batch progress banner — shown while filling in missed days */}
      {retroProgress && retroProgress.total > 1 && currentStep !== 'success-animation' && (
        <div className="mb-3 -mt-6 md:mt-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border border-foreground/10 bg-foreground/[0.04] backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarIcon className="w-3.5 h-3.5 text-[hsl(45_85%_55%)] shrink-0" />
            <span className="text-[12.5px] font-medium text-foreground/80 truncate">
              Missade dagar — {retroProgress.current} av {retroProgress.total}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: retroProgress.total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i < retroProgress.current - 1
                    ? 'w-3 bg-[hsl(45_85%_55%)]'
                    : i === retroProgress.current - 1
                      ? 'w-5 bg-[hsl(45_85%_55%)]'
                      : 'w-3 bg-foreground/15'
                )}
              />
            ))}
          </div>
        </div>
      )}

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

            {/* Segmented mode toggle — golden thumb, icons + text */}
            <div
              role="tablist"
              aria-label={t('checkin.checkinMode')}
              className="relative inline-flex items-center rounded-full bg-foreground/[0.04] ring-1 ring-foreground/[0.06] p-1 text-[12px] font-semibold tracking-tight"
            >
              {/* Sliding thumb — neutral surface, låter den gyllene CTA:n behålla fokus */}
              <motion.div
                aria-hidden
                className="absolute top-1 bottom-1 rounded-full bg-foreground/[0.09] ring-1 ring-foreground/[0.08] shadow-sm"
                initial={false}
                animate={{
                  left: checkinMode === 'quick' ? 4 : '50%',
                  right: checkinMode === 'quick' ? '50%' : 4,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.55 }}
              />
              <button
                role="tab"
                aria-selected={checkinMode === 'quick'}
                onClick={() => setCheckinMode('quick')}
                className={cn(
                  "relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors duration-200",
                  checkinMode === 'quick'
                    ? "text-foreground"
                    : "text-muted-foreground/55 hover:text-foreground/80"
                )}
              >
                <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
                {t('checkin.quickCheckin')}
              </button>
              <button
                role="tab"
                aria-selected={checkinMode === 'detailed'}
                onClick={() => setCheckinMode('detailed')}
                className={cn(
                  "relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors duration-200",
                  checkinMode === 'detailed'
                    ? "text-foreground"
                    : "text-muted-foreground/55 hover:text-foreground/80"
                )}
              >
                <ListChecks className="w-3.5 h-3.5" strokeWidth={2.5} />
                {t('checkin.detailedCheckin')}
              </button>
            </div>
          </div>

          {/* Date label + Streak — mjukare typografi */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-[12.5px] font-medium tracking-tight first-letter:uppercase lowercase transition-colors duration-500"
                style={{ color: checkinData.mood ? activeMoodColor.replace(')', ' / 0.7)') : 'hsl(var(--muted-foreground) / 0.55)' }}
              >
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

          {/* Mood selector — swipe i snabbläge, slider i utförligt */}
          <div className="flex-1 flex flex-col justify-center">
            {checkinMode === 'quick' ? (
              <VerticalMoodSlider
                options={moodButtons.map(b => ({ mood: b.mood, label: b.label, sublabel: b.sublabel }))}
                value={checkinData.mood}
                onSelect={(mood) => {
                  hapticTap();
                  setCheckinData(prev => ({ ...prev, mood }));
                }}
              />
            ) : (
              <VerticalMoodSlider
                options={moodButtons.map(b => ({ mood: b.mood, label: b.label, sublabel: b.sublabel }))}
                value={checkinData.mood}
                onSelect={handleMoodSelect}
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-5 pt-6 pb-2 max-w-md mx-auto w-full">
              {checkinData.mood && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    hapticTap();
                    if (checkinMode === 'quick') {
                      handleQuickMoodContinue();
                    } else {
                      handleMoodContinue();
                    }
                  }}
                  className="relative overflow-hidden w-full max-w-[280px] px-8 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_2px_14px_hsl(45_85%_55%/0.22)] hover:shadow-[0_4px_22px_hsl(45_85%_55%/0.32)] hover:bg-[hsl(45_85%_62%)] transition-[background-color,box-shadow] duration-200 inline-flex items-center justify-center gap-1.5"
                >
                  <span className="relative inline-flex items-center gap-1.5">
                    {t('common.continue')}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </motion.button>
              )}
            </div>
          {renderCommentSection('mood')}
        </div>
      )}

      {/* Step: Day rating + tanke om dagen (snabbläge sida 2) */}
      {currentStep === 'day_rating' && (
        <div className="step-slide-in flex flex-col flex-1 min-h-0 overflow-y-auto px-1" key={stepKey}>
          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 mb-3 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground/60 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          </div>

          {/* Heading */}
          <div className="mb-5 flex-shrink-0">
            <p className="text-muted-foreground/30 text-[11px] tracking-[0.15em] uppercase font-medium mb-2">{formattedDate}</p>
            <h1 className="font-display text-[22px] sm:text-2xl font-bold tracking-tight leading-tight">
              Hur var din dag allmänt?
            </h1>
          </div>


          {/* Day rating — 3 stora val */}
          {(() => {
            const rating = getDayRatingFromTags(checkinData.tags);
            const options: { value: DayRating; emoji: string; label: string; color: string }[] = [
              { value: 'bad', emoji: '🌧️', label: 'Dålig', color: 'var(--mood-depressed)' },
              { value: 'ok', emoji: '☁️', label: 'Okej', color: 'var(--mood-stable)' },
              { value: 'good', emoji: '☀️', label: 'Bra', color: 'var(--mood-somewhat-elevated)' },
            ];
            return (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {options.map(opt => {
                  const selected = rating === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleDayRatingSelect(opt.value)}
                      aria-pressed={selected}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border transition-all duration-200 active:scale-95",
                        selected
                          ? "border-transparent shadow-[0_4px_18px_hsl(var(--background)/0.4)]"
                          : "border-border/40 bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-border/70"
                      )}
                      style={selected ? {
                        backgroundColor: `hsl(${opt.color} / 0.18)`,
                        boxShadow: `0 0 0 2px hsl(${opt.color} / 0.45), 0 6px 22px hsl(${opt.color} / 0.25)`,
                      } : undefined}
                    >
                      <span className="text-3xl leading-none" aria-hidden>{opt.emoji}</span>
                      <span
                        className="text-sm font-semibold tracking-tight"
                        style={{ color: selected ? `hsl(${opt.color})` : undefined }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Färdiga taggar — anpassade efter dagens betyg */}
          {(() => {
            const rating = getDayRatingFromTags(checkinData.tags);
            if (!rating) return null;
            const RATING_TAGS: Record<DayRating, { value: string; label: string; emoji: string }[]> = {
              good: [
                { value: 'energisk', label: 'Energisk', emoji: '⚡' },
                { value: 'kreativ', label: 'Kreativ', emoji: '💡' },
                { value: 'positiv', label: 'Positiv', emoji: '😊' },
                { value: 'social', label: 'Social', emoji: '👥' },
                { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
                { value: 'motiverad', label: 'Motiverad', emoji: '🎯' },
                { value: 'lugn', label: 'Lugn', emoji: '🌿' },
                { value: 'tacksam', label: 'Tacksam', emoji: '🙏' },
              ],
              ok: [
                { value: 'vanlig', label: 'Vanlig dag', emoji: '🙂' },
                { value: 'fokuserad', label: 'Fokuserad', emoji: '🎯' },
                { value: 'avslappnad', label: 'Avslappnad', emoji: '😌' },
                { value: 'trött', label: 'Trött', emoji: '😴' },
                { value: 'neutral', label: 'Neutral', emoji: '😐' },
                { value: 'social', label: 'Social', emoji: '👥' },
              ],
              bad: [
                { value: 'trött', label: 'Trött', emoji: '😩' },
                { value: 'stress', label: 'Stress', emoji: '😖' },
                { value: 'nedstämd', label: 'Nedstämd', emoji: '🌧️' },
                { value: 'otålig', label: 'Otålig', emoji: '⏳' },
                { value: 'rastlös', label: 'Rastlös', emoji: '🌀' },
                { value: 'sömnsvårt', label: 'Sömnsvårt', emoji: '🌙' },
                { value: 'orolig', label: 'Orolig', emoji: '😟' },
                { value: 'ensam', label: 'Ensam', emoji: '🫥' },
              ],
            };
            const tagsForRating = RATING_TAGS[rating];
            const standardValues = new Set(tagsForRating.map(t => t.value));
            return (
              <div className="mb-8">
                <h3 className="text-[13px] font-semibold text-foreground/85 mb-3 tracking-tight">
                  Vad känner du igen idag?
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {tagsForRating.map(({ value, label, emoji }) => {
                    const selected = (checkinData.tags || []).includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { hapticTap(); handleTagToggle(value); }}
                        className={cn(
                          "px-4 py-2.5 rounded-full border text-[13px] font-medium transition-all duration-200 active:scale-95",
                          selected
                            ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]"
                            : "border-border/40 text-muted-foreground/85 hover:border-border/70 hover:bg-white/[0.03]"
                        )}
                      >
                        {selected && <Check className="w-3 h-3 mr-1 inline" />}
                        <span className="mr-1">{emoji}</span>
                        {label}
                      </button>
                    );
                  })}

                  {/* Egna taggar redan tillagda */}
                  {(checkinData.tags || [])
                    .filter(tag => !tag.startsWith(DAY_RATING_TAG_PREFIX) && !standardValues.has(tag))
                    .map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => { hapticTap(); handleTagToggle(tag); }}
                        className="px-4 py-2.5 rounded-full border bg-primary/15 border-primary/40 text-primary text-[13px] font-medium shadow-[0_0_0_1px_hsl(var(--primary)/0.25)] transition-all duration-200 active:scale-95"
                      >
                        <Check className="w-3 h-3 mr-1 inline" />
                        {tag}
                      </button>
                    ))}

                  {/* Annan — egen tagg */}
                  {!showCustomTagInput ? (
                    <button
                      type="button"
                      onClick={() => { hapticTap(); setShowCustomTagInput(true); }}
                      className="px-4 py-2.5 rounded-full border border-dashed border-border/50 text-muted-foreground/80 text-[13px] font-medium hover:border-border/80 hover:bg-white/[0.03] transition-all duration-200 active:scale-95"
                    >
                      + Annan
                    </button>
                  ) : (
                    <input
                      type="text"
                      autoFocus
                      placeholder="Egen tagg…"
                      className="px-4 py-2.5 rounded-full border border-primary/40 bg-white/[0.03] text-base text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all w-40"
                      maxLength={30}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const val = input.value.trim().toLowerCase();
                          if (val && !(checkinData.tags || []).includes(val)) handleTagToggle(val);
                          input.value = '';
                          input.blur();
                          setShowCustomTagInput(false);
                        }
                        if (e.key === 'Escape') setShowCustomTagInput(false);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim().toLowerCase();
                        if (val && !(checkinData.tags || []).includes(val)) handleTagToggle(val);
                        setShowCustomTagInput(false);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })()}


          {/* Skriv en tanke — click-down accordion */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => { hapticTap(); setShowThoughtInput(prev => !prev); }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all duration-200",
                showThoughtInput
                  ? "border-primary/30 bg-primary/[0.04]"
                  : "border-border/40 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
              )}
            >
              <span className="text-[13px] font-semibold text-foreground/85 tracking-tight">
                {showThoughtInput ? '✍️ Skriv en tanke om dagen' : '✍️ Vill du skriva en tanke?'}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground/60 transition-transform duration-200",
                  showThoughtInput && "rotate-180"
                )}
              />
            </button>

            {showThoughtInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden px-1 -mx-1"
              >
                <Textarea
                  id="thought-of-the-day"
                  value={checkinData.moodComment || ''}
                  onChange={(e) => setCheckinData(prev => ({ ...prev, moodComment: e.target.value }))}
                  placeholder="Vad rörde sig i ditt huvud idag? Något som hände, en känsla, en tanke…"
                  maxLength={500}
                  rows={4}
                  className="w-full resize-none text-base leading-relaxed bg-foreground/[0.03] border-border/40 placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border/60 rounded-2xl px-4 py-3.5"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-[11px] text-muted-foreground/50">
                    {(checkinData.moodComment || '').length}/500
                  </span>
                </div>
              </motion.div>
            )}
          </div>


          <div className="flex flex-col items-center gap-3 mt-auto pt-4 pb-2 max-w-md mx-auto w-full">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                hapticTap();
                if (isLastStep('day_rating')) {
                  handleQuickFinish();
                } else {
                  const next = getNextStep('day_rating');
                  if (next === 'success-animation') handleCompleteWithData(checkinData);
                  else navigateStep(next);
                }
              }}
              className="w-full max-w-[280px] px-8 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_2px_14px_hsl(45_85%_55%/0.22)] hover:shadow-[0_4px_22px_hsl(45_85%_55%/0.32)] hover:bg-[hsl(45_85%_62%)] transition-[background-color,box-shadow] duration-200 inline-flex items-center justify-center gap-1.5"
            >
              <span className="relative inline-flex items-center gap-1.5">
                {isLastStep('day_rating') ? 'Klar' : 'Nästa'}
                <Check className="w-4 h-4" />
              </span>
            </motion.button>
            {isLastStep('day_rating') && (
              <button
                type="button"
                onClick={() => { hapticTap(); handleQuickFinish(); }}
                className="text-[12.5px] text-muted-foreground/55 hover:text-muted-foreground transition-colors"
              >
                Hoppa över
              </button>
            )}
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
              {t('common.back')}
            </Button>
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
            {/* Förslag baserade på tidigare in-checkningar */}
            {suggestedPriorTags.map(s => (
              <button
                key={`prior-${s.name}`}
                onClick={() => handleTagToggle(s.name)}
                className="px-4 py-2.5 rounded-full border border-dashed border-border/40 text-sm font-medium text-muted-foreground/80 hover:text-foreground hover:border-border/70 hover:bg-white/[0.03] transition-all duration-200 active:scale-95"
                title="Från dina tidigare in-checkningar"
              >
                <span className="mr-1.5 opacity-60">↺</span>
                {s.name}
              </button>
            ))}
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

          <div className="flex flex-col items-center gap-5 mt-auto pt-6">
            {/* Pratbubbla — samma pill som i snabbläget, här ovanför Klar */}
            <button
              type="button"
              onClick={() => setShowComment('mood')}
              aria-label={checkinData.moodComment ? t('checkin.editThought') : t('checkin.thoughtAboutDay')}
              className={cn(
                "group relative inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full transition-all duration-200 active:scale-[0.97]",
                checkinData.moodComment
                  ? "bg-primary/10 hover:bg-primary/15 ring-1 ring-primary/30 text-primary"
                  : "bg-foreground/[0.04] hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground/80"
              )}
            >
              <span aria-hidden className="text-lg leading-none transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
                💭
              </span>
              <span className="text-sm font-medium tracking-tight max-w-[220px] truncate">
                {checkinData.moodComment
                  ? checkinData.moodComment
                  : t('checkin.thoughtAboutDay')}
              </span>
              {checkinData.moodComment && (
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(45_85%_55%)] flex-shrink-0" />
              )}
            </button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { hapticTap(); handleTagsContinue(); }}
              className="w-full max-w-[280px] px-8 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_2px_14px_hsl(45_85%_55%/0.22)] hover:shadow-[0_4px_22px_hsl(45_85%_55%/0.32)] hover:bg-[hsl(45_85%_62%)] transition-[background-color,box-shadow] duration-200 inline-flex items-center justify-center gap-1.5"
            >
              {(checkinData.tags || []).length > 0 ? t('checkin.done') : t('checkin.skipIt')}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
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

          {/* Sleep — vertikal lista i U-form (extremerna = varning) */}
          <div className="flex-1 flex flex-col justify-center">
            {(() => {
              // U-form-ordning uppifrån och ner: nästan inget → ovanligt lite → lagom → djupt lugn → för mycket
              const order: QualityType[] = ['very_little', 'little', 'good', 'very_good', 'bad'];
              const byValue = new Map(sleepSliderOptions.map(o => [o.value, o]));
              const ordered = order.map(v => byValue.get(v)!).filter(Boolean);
              return (
                <div className="flex flex-col gap-2 w-full max-w-md mx-auto" role="radiogroup" aria-label={t('checkin.howDidYouSleep')}>
                  {ordered.map((opt) => {
                    const Icon = opt.icon;
                    const selected = checkinData.sleepQuality === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => { hapticTap(); handleSleepSelect(opt.value); }}
                        className={cn(
                          "group flex items-center gap-3.5 w-full text-left rounded-2xl px-4 py-3.5 border transition-all duration-200 active:scale-[0.985]",
                          selected
                            ? "border-transparent"
                            : "border-border/40 bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-border/70"
                        )}
                        style={selected ? {
                          backgroundColor: `hsl(${opt.color} / 0.14)`,
                          boxShadow: `0 0 0 2px hsl(${opt.color} / 0.45), 0 6px 22px hsl(${opt.color} / 0.22)`,
                        } : undefined}
                      >
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                          style={{
                            background: `hsl(${opt.color} / ${selected ? 0.22 : 0.12})`,
                            boxShadow: `inset 0 0 0 1px hsl(${opt.color} / ${selected ? 0.4 : 0.25})`,
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color: `hsl(${opt.color})` }} strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span
                            className="block text-[15px] font-semibold leading-tight tracking-[-0.01em]"
                            style={{ color: selected ? `hsl(${opt.color})` : undefined }}
                          >
                            {opt.label}
                          </span>
                          <span className="block text-[12px] leading-snug text-muted-foreground/80 mt-0.5">
                            {opt.sublabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
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

          {/* Simple Yes / No */}
          {hasMedications ? (
            <div className="max-w-md space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    scheduledMedications.forEach(med => onToggleMedication(med.id, true, { silent: true }));
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all active:scale-[0.98]",
                    allScheduledTaken
                      ? "border-mood-stable/40 bg-mood-stable/10 text-mood-stable"
                      : "border-border/30 bg-card/20 text-foreground/70 hover:border-mood-stable/30"
                  )}
                >
                  <CheckCircle2 className="w-7 h-7" />
                  <span className="text-base font-semibold">{t('common.yes')}</span>
                </button>
                <button
                  onClick={() => {
                    scheduledMedications.forEach(med => onToggleMedication(med.id, false, { silent: true }));
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all active:scale-[0.98]",
                    noScheduledTaken
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border-border/30 bg-card/20 text-foreground/70 hover:border-amber-500/30"
                  )}
                >
                  <X className="w-7 h-7" />
                  <span className="text-base font-semibold">{t('common.no')}</span>
                </button>
              </div>

              {/* Missed dose reason */}
              {noScheduledTaken && (
                <div className="pt-3 animate-fade-in">
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


            {isLastStep('medication') ? (
              <Button onClick={handleComplete} className="w-full mt-4 py-6 text-base font-semibold gap-2">
                {t('common.continue')}
              </Button>
            ) : (
              <Button onClick={() => navigateStep(getNextStep('medication') as Step)} className="w-full mt-4 py-6 text-base font-semibold gap-2">
                {t('common.continue')}
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

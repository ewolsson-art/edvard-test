import { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Zap, Sun, CloudRain, MessageSquare, CheckCircle2, Pill, Pencil, Moon, Utensils, Dumbbell, ThumbsUp, ThumbsDown, Check, X, ChevronRight, ChevronLeft, Heart } from 'lucide-react';
import { MoodType, MoodEntry, MOOD_LABELS, QualityType, QUALITY_LABELS, CheckinData } from '@/types/mood';
import { Medication } from '@/types/medication';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

interface TodayCheckinProps {
  todayEntry: MoodEntry | undefined;
  activeMedications: Medication[];
  medicationsTakenToday: string[];
  yearEntries: MoodEntry[];
  onSaveCheckin: (data: CheckinData) => Promise<boolean>;
  onToggleMedication: (medicationId: string, taken: boolean) => void;
}

const moodButtons: { mood: MoodType; icon: typeof Zap; label: string; cssClass: string }[] = [
  { mood: 'elevated', icon: Zap, label: MOOD_LABELS.elevated, cssClass: 'mood-btn-elevated' },
  { mood: 'stable', icon: Sun, label: MOOD_LABELS.stable, cssClass: 'mood-btn-stable' },
  { mood: 'depressed', icon: CloudRain, label: MOOD_LABELS.depressed, cssClass: 'mood-btn-depressed' },
];

type Step = 'mood' | 'sleep' | 'eating' | 'exercise' | 'medication' | 'success-animation' | 'complete';

const STEPS: Step[] = ['mood', 'sleep', 'eating', 'exercise', 'medication'];

export function TodayCheckin({ 
  todayEntry, 
  activeMedications,
  medicationsTakenToday,
  yearEntries,
  onSaveCheckin,
  onToggleMedication,
}: TodayCheckinProps) {
  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: sv });

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
      ? differenceInDays(today, lastGoodDay.dateObj)
      : null;
    
    return { goodDaysCount, daysSinceGood };
  }, [yearEntries, today]);
  
  const [currentStep, setCurrentStep] = useState<Step>('mood');
  const [isEditing, setIsEditing] = useState(false);
  const [showComment, setShowComment] = useState<Step | null>(null);
  
  // Form data
  const [checkinData, setCheckinData] = useState<CheckinData>({});

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
    }
  }, [todayEntry]);

  const isCheckinComplete = todayEntry?.mood && 
    todayEntry?.sleepQuality !== undefined && 
    todayEntry?.eatingQuality !== undefined && 
    todayEntry?.exercised !== undefined;

  const handleMoodSelect = (mood: MoodType) => {
    setCheckinData(prev => ({ ...prev, mood }));
    setCurrentStep('sleep');
  };

  const handleSleepSelect = (quality: QualityType) => {
    setCheckinData(prev => ({ ...prev, sleepQuality: quality }));
    setCurrentStep('eating');
  };

  const handleEatingSelect = (quality: QualityType) => {
    setCheckinData(prev => ({ ...prev, eatingQuality: quality }));
    setCurrentStep('exercise');
  };

  const handleExerciseSelect = (exercised: boolean) => {
    setCheckinData(prev => ({ ...prev, exercised }));
    setCurrentStep('medication');
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
      <div className="glass-card p-8 md:p-12 fade-in">
        <div className="text-center mb-8">
          <p className="text-muted-foreground text-lg capitalize">{formattedDate}</p>
        </div>

        <div className="text-center fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-mood-stable/20 mb-6">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-mood-stable" />
          </div>
          
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 text-mood-stable">
            Du har checkat in!
          </h1>

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
          <div className="max-w-md mx-auto mt-6 space-y-3 text-left">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              {todayEntry?.mood === 'elevated' && <Zap className="w-5 h-5 text-mood-elevated" />}
              {todayEntry?.mood === 'stable' && <Sun className="w-5 h-5 text-mood-stable" />}
              {todayEntry?.mood === 'depressed' && <CloudRain className="w-5 h-5 text-mood-depressed" />}
              <span>Mående: <strong>{MOOD_LABELS[todayEntry!.mood]}</strong></span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Moon className="w-5 h-5 text-primary" />
              <span>Sömn: <strong>{QUALITY_LABELS[todayEntry!.sleepQuality!]}</strong></span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Utensils className="w-5 h-5 text-primary" />
              <span>Mat: <strong>{QUALITY_LABELS[todayEntry!.eatingQuality!]}</strong></span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Dumbbell className="w-5 h-5 text-primary" />
              <span>Träning: <strong>{todayEntry!.exercised ? 'Ja' : 'Nej'}</strong></span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleEdit} className="mt-6 gap-2">
            <Pencil className="w-4 h-4" />
            Ändra incheckning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 md:p-12 fade-in">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-lg capitalize">{formattedDate}</p>
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mb-8">
        <Progress value={getStepProgress()} className="h-2" />
        <p className="text-xs text-muted-foreground text-center mt-2">
          Steg {STEPS.indexOf(currentStep) + 1} av {STEPS.length}
        </p>
      </div>

      {/* Step: Mood */}
      {currentStep === 'mood' && (
        <div className="space-y-6 fade-in">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Hej! Hur har du mått idag?
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
            {moodButtons.map(({ mood, icon: Icon, label, cssClass }) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "mood-btn rounded-2xl p-5 md:p-8 flex flex-col items-center gap-3",
                  cssClass,
                  checkinData.mood === mood && "ring-4 ring-offset-2 ring-offset-background"
                )}
              >
                <Icon className="w-10 h-10 md:w-12 md:h-12" />
                <span className="font-medium text-sm md:text-base text-center leading-tight drop-shadow-sm">{label}</span>
              </button>
            ))}
          </div>

          {showComment === 'mood' ? (
            <div className="max-w-md mx-auto space-y-3">
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

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => handleSleepSelect('good')}
              className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                "hover:border-primary hover:bg-primary/5",
                checkinData.sleepQuality === 'good' && "border-primary bg-primary/10"
              )}
            >
              <ThumbsUp className="w-10 h-10 text-mood-stable" />
              <span className="font-medium">Bra</span>
            </button>
            <button
              onClick={() => handleSleepSelect('bad')}
              className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                "hover:border-primary hover:bg-primary/5",
                checkinData.sleepQuality === 'bad' && "border-primary bg-primary/10"
              )}
            >
              <ThumbsDown className="w-10 h-10 text-mood-depressed" />
              <span className="font-medium">Dåligt</span>
            </button>
          </div>

          {showComment === 'sleep' ? (
            <div className="max-w-md mx-auto space-y-3">
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

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => handleEatingSelect('good')}
              className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                "hover:border-primary hover:bg-primary/5",
                checkinData.eatingQuality === 'good' && "border-primary bg-primary/10"
              )}
            >
              <ThumbsUp className="w-10 h-10 text-mood-stable" />
              <span className="font-medium">Bra</span>
            </button>
            <button
              onClick={() => handleEatingSelect('bad')}
              className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                "hover:border-primary hover:bg-primary/5",
                checkinData.eatingQuality === 'bad' && "border-primary bg-primary/10"
              )}
            >
              <ThumbsDown className="w-10 h-10 text-mood-depressed" />
              <span className="font-medium">Dåligt</span>
            </button>
          </div>

          {showComment === 'eating' ? (
            <div className="max-w-md mx-auto space-y-3">
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

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => handleExerciseSelect(true)}
              className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                "hover:border-primary hover:bg-primary/5",
                checkinData.exercised === true && "border-primary bg-primary/10"
              )}
            >
              <Check className="w-10 h-10 text-mood-stable" />
              <span className="font-medium">Ja</span>
            </button>
            <button
              onClick={() => handleExerciseSelect(false)}
              className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                "hover:border-primary hover:bg-primary/5",
                checkinData.exercised === false && "border-primary bg-primary/10"
              )}
            >
              <X className="w-10 h-10 text-muted-foreground" />
              <span className="font-medium">Nej</span>
            </button>
          </div>

          {showComment === 'exercise' ? (
            <div className="max-w-md mx-auto space-y-3">
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
              Har du tagit din medicin?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => {
                // Mark all medications as taken
                activeMedications.forEach(med => {
                  if (!medicationsTakenToday.includes(med.id)) {
                    onToggleMedication(med.id, true);
                  }
                });
                handleComplete();
              }}
              className="p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all hover:border-primary hover:bg-primary/5"
            >
              <Check className="w-10 h-10 text-mood-stable" />
              <span className="font-medium">Ja</span>
            </button>
            <button
              onClick={() => {
                // Mark all medications as not taken
                activeMedications.forEach(med => {
                  if (medicationsTakenToday.includes(med.id)) {
                    onToggleMedication(med.id, false);
                  }
                });
                handleComplete();
              }}
              className="p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all hover:border-primary hover:bg-primary/5"
            >
              <X className="w-10 h-10 text-muted-foreground" />
              <span className="font-medium">Nej</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {currentStep === 'success-animation' && (
        <div className="flex flex-col items-center justify-center py-16 fade-in">
          <div className="success-circle">
            <Check className="w-16 h-16 md:w-20 md:h-20 text-white success-check" />
          </div>
        </div>
      )}

      {/* Cancel button when editing */}
      {isEditing && (
        <div className="text-center mt-6">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Avbryt
          </Button>
        </div>
      )}
    </div>
  );
}
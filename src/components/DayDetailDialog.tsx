import { format, isBefore, startOfDay, isToday } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';
import { Zap, Sun, CloudRain, Moon, Utensils, Dumbbell, Pill, MessageSquare, ThumbsUp, ThumbsDown, Check, X, Pencil, Plus } from 'lucide-react';
import { MoodEntry, MoodType, QUALITY_LABELS, EXERCISE_TYPE_LABELS, MOOD_ICONS } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  entry: MoodEntry | undefined;
  medicationsTaken?: { name: string; dosage: string }[];
}

export function DayDetailDialog({
  open,
  onOpenChange,
  date,
  entry,
  medicationsTaken = [],
}: DayDetailDialogProps) {
  const { moodLabels } = useDiagnosisConfig();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!date) return null;

  const locale = i18n.language?.startsWith('en') ? enUS : sv;
  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale });
  const dateStr = format(date, 'yyyy-MM-dd');
  const isPast = isBefore(date, startOfDay(new Date()));
  const isTodayDate = isToday(date);
  const canEdit = isPast || isTodayDate;

  const handleEditOrAdd = () => {
    onOpenChange(false);
    navigate(`/?date=${dateStr}`);
  };

  const getMoodIcon = (mood: MoodType) => {
    if (mood === 'severe_elevated' || mood === 'elevated') return <Zap className="w-6 h-6 text-mood-elevated" />;
    if (mood === 'somewhat_elevated') return <Zap className="w-6 h-6 text-mood-somewhat-elevated" />;
    if (mood === 'stable') return <Sun className="w-6 h-6 text-mood-stable" />;
    if (mood === 'somewhat_depressed') return <CloudRain className="w-6 h-6 text-mood-somewhat-depressed" />;
    if (mood === 'depressed' || mood === 'severe_depressed') return <CloudRain className="w-6 h-6 text-mood-depressed" />;
    return null;
  };

  const getMoodBgClass = (mood: MoodType) => {
    if (mood === 'severe_elevated' || mood === 'elevated' || mood === 'somewhat_elevated') return "bg-mood-elevated/10";
    if (mood === 'stable') return "bg-mood-stable/10";
    if (mood === 'somewhat_depressed' || mood === 'depressed' || mood === 'severe_depressed') return "bg-mood-depressed/10";
    return "";
  };

  const getQualityIcon = (quality: string) => {
    return quality === 'good' || quality === 'very_good'
      ? <ThumbsUp className="w-5 h-5 text-mood-stable" />
      : <ThumbsDown className="w-5 h-5 text-mood-depressed" />;
  };

  const content = (
    <div className="space-y-3">
      {!entry ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
            <Plus className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {t('dayDetail.noCheckin', 'Ingen incheckning gjord denna dag.')}
          </p>
          {canEdit && (
            <button
              onClick={handleEditOrAdd}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.97] transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('dayDetail.addCheckin', 'Lägg till incheckning')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mood */}
          <div className={cn("p-4 rounded-xl", getMoodBgClass(entry.mood))}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{MOOD_ICONS[entry.mood]}</span>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('dayDetail.mood', 'Mående')}</p>
                <p className="font-semibold">{moodLabels[entry.mood]}</p>
              </div>
            </div>
            {entry.comment && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{entry.comment}</p>
                </div>
              </div>
            )}
          </div>

          {/* Grid for sleep/eating */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sleep */}
            {entry.sleepQuality && (
              <div className="p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Moon className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('dayDetail.sleep', 'Sömn')}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {getQualityIcon(entry.sleepQuality)}
                  <span className="text-sm font-medium">{QUALITY_LABELS[entry.sleepQuality]}</span>
                </div>
                {entry.sleepComment && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.sleepComment}</p>
                )}
              </div>
            )}

            {/* Eating */}
            {entry.eatingQuality && (
              <div className="p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Utensils className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('dayDetail.eating', 'Mat')}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {getQualityIcon(entry.eatingQuality)}
                  <span className="text-sm font-medium">{QUALITY_LABELS[entry.eatingQuality]}</span>
                </div>
                {entry.eatingComment && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.eatingComment}</p>
                )}
              </div>
            )}
          </div>

          {/* Exercise */}
          {entry.exercised !== undefined && (
            <div className="p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('dayDetail.exercise', 'Träning')}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {entry.exercised 
                  ? <Check className="w-5 h-5 text-mood-stable" />
                  : <X className="w-5 h-5 text-muted-foreground" />
                }
                <span className="text-sm font-medium">{entry.exercised ? t('dayDetail.yes', 'Ja') : t('dayDetail.no', 'Nej')}</span>
              </div>
              {entry.exerciseTypes && entry.exerciseTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {entry.exerciseTypes.map(type => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {EXERCISE_TYPE_LABELS[type]}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medications */}
          {medicationsTaken.length > 0 && (
            <div className="p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('dayDetail.medication', 'Medicin')}</p>
              </div>
              <div className="space-y-1">
                {medicationsTaken.map((med, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-mood-stable" />
                    <span className="font-medium">{med.name}</span>
                    <span className="text-muted-foreground">{med.dosage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit button */}
          {canEdit && (
            <button
              onClick={handleEditOrAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-primary/30 bg-primary/5 text-primary font-semibold text-sm hover:bg-primary/10 active:scale-[0.97] transition-all"
            >
              <Pencil className="w-4 h-4" />
              {t('dayDetail.editCheckin', 'Ändra incheckning')}
            </button>
          )}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-5 pb-8 max-h-[85svh]">
          <DrawerHeader className="px-0 pb-3">
            <DrawerTitle className="capitalize text-lg font-display text-left">
              {formattedDate}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize text-lg font-display">
            {formattedDate}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

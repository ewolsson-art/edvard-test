import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Zap, Sun, CloudRain, Moon, Utensils, Dumbbell, Pill, MessageSquare, ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';
import { MoodEntry, MoodType, MOOD_LABELS, QUALITY_LABELS } from '@/types/mood';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  if (!date) return null;

  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: sv });

  const getMoodIcon = (mood: MoodType) => {
    switch (mood) {
      case 'elevated': return <Zap className="w-6 h-6 text-mood-elevated" />;
      case 'stable': return <Sun className="w-6 h-6 text-mood-stable" />;
      case 'depressed': return <CloudRain className="w-6 h-6 text-mood-depressed" />;
      default: return null;
    }
  };

  const getMoodBgClass = (mood: MoodType) => {
    switch (mood) {
      case 'elevated': return "bg-mood-elevated/10";
      case 'stable': return "bg-mood-stable/10";
      case 'depressed': return "bg-mood-depressed/10";
      default: return "";
    }
  };

  const getQualityIcon = (quality: string) => {
    return quality === 'good' 
      ? <ThumbsUp className="w-5 h-5 text-mood-stable" />
      : <ThumbsDown className="w-5 h-5 text-mood-depressed" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize text-lg font-display">
            {formattedDate}
          </DialogTitle>
        </DialogHeader>

        {!entry ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Ingen incheckning gjord denna dag.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mood */}
            <div className={cn("p-4 rounded-xl", getMoodBgClass(entry.mood))}>
              <div className="flex items-center gap-3">
                {getMoodIcon(entry.mood)}
                <div>
                  <p className="text-sm text-muted-foreground">Mående</p>
                  <p className="font-medium">{MOOD_LABELS[entry.mood]}</p>
                </div>
              </div>
              {entry.comment && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{entry.comment}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sleep */}
            {entry.sleepQuality && (
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Sömn</p>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(entry.sleepQuality)}
                      <span className="font-medium">{QUALITY_LABELS[entry.sleepQuality]}</span>
                    </div>
                  </div>
                </div>
                {entry.sleepComment && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>{entry.sleepComment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Eating */}
            {entry.eatingQuality && (
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Mat</p>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(entry.eatingQuality)}
                      <span className="font-medium">{QUALITY_LABELS[entry.eatingQuality]}</span>
                    </div>
                  </div>
                </div>
                {entry.eatingComment && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>{entry.eatingComment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exercise */}
            {entry.exercised !== undefined && (
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Träning</p>
                    <div className="flex items-center gap-2">
                      {entry.exercised 
                        ? <Check className="w-5 h-5 text-mood-stable" />
                        : <X className="w-5 h-5 text-muted-foreground" />
                      }
                      <span className="font-medium">{entry.exercised ? 'Ja' : 'Nej'}</span>
                    </div>
                  </div>
                </div>
                {entry.exerciseComment && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>{entry.exerciseComment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Medications */}
            {medicationsTaken.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3 mb-2">
                  <Pill className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Medicin</p>
                  </div>
                </div>
                <div className="space-y-1 ml-8">
                  {medicationsTaken.map((med, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-mood-stable" />
                      <span className="font-medium">{med.name}</span>
                      <span className="text-sm text-muted-foreground">{med.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

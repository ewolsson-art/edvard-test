import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Zap, Sun, CloudRain, MessageSquare, CheckCircle2, Pill } from 'lucide-react';
import { MoodType, MoodEntry, MOOD_LABELS } from '@/types/mood';
import { Medication } from '@/types/medication';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface TodayCheckinProps {
  todayEntry: MoodEntry | undefined;
  activeMedications: Medication[];
  medicationsTakenToday: string[]; // medication IDs
  onCheckin: (mood: MoodType, comment?: string) => void;
  onUpdateComment: (comment: string) => void;
  onToggleMedication: (medicationId: string, taken: boolean) => void;
}

const moodButtons: { mood: MoodType; icon: typeof Zap; label: string }[] = [
  { mood: 'elevated', icon: Zap, label: MOOD_LABELS.elevated },
  { mood: 'stable', icon: Sun, label: MOOD_LABELS.stable },
  { mood: 'depressed', icon: CloudRain, label: MOOD_LABELS.depressed },
];

export function TodayCheckin({ 
  todayEntry, 
  activeMedications,
  medicationsTakenToday,
  onCheckin, 
  onUpdateComment,
  onToggleMedication,
}: TodayCheckinProps) {
  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: sv });
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (todayEntry?.comment) {
      setComment(todayEntry.comment);
      setShowComment(true);
    }
  }, [todayEntry?.comment]);

  const handleMoodSelect = (mood: MoodType) => {
    onCheckin(mood, comment || undefined);
  };

  const handleSaveComment = () => {
    onUpdateComment(comment);
  };

  const hasCheckedIn = !!todayEntry?.mood;
  const hasMedications = activeMedications.length > 0;

  return (
    <div className="glass-card p-8 md:p-12 fade-in">
      <div className="text-center mb-8">
        <p className="text-muted-foreground text-lg capitalize">
          {formattedDate}
        </p>
      </div>

      {hasCheckedIn ? (
        // Checked in state - show success message
        <div className="text-center fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-mood-stable/20 mb-6">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-mood-stable" />
          </div>
          
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 text-mood-stable">
            Du har checkat in!
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Du mår <span className="font-medium">{MOOD_LABELS[todayEntry.mood].toLowerCase()}</span> idag
          </p>

          {/* Medication section */}
          {hasMedications && (
            <div className="max-w-lg mx-auto mb-8 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-center gap-2 text-sm font-medium mb-4">
                <Pill className="w-4 h-4 text-primary" />
                <span>Har du tagit din medicin idag?</span>
              </div>
              <div className="space-y-3">
                {activeMedications.map(med => {
                  const isTaken = medicationsTakenToday.includes(med.id);
                  return (
                    <label
                      key={med.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isTaken ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={isTaken}
                        onCheckedChange={(checked) => onToggleMedication(med.id, !!checked)}
                      />
                      <div className="flex-1 text-left">
                        <span className="font-medium">{med.name}</span>
                        <span className="text-muted-foreground ml-2 text-sm">{med.dosage}</span>
                      </div>
                      {isTaken && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment section */}
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>Lägg till en kommentar (valfritt)</span>
            </div>
            <Textarea
              placeholder="Hur kändes dagen? Vad hände?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            {comment !== (todayEntry.comment || '') && (
              <Button
                onClick={handleSaveComment}
                size="sm"
                className="w-full"
              >
                Spara kommentar
              </Button>
            )}
            {todayEntry.comment && comment === todayEntry.comment && (
              <p className="text-xs text-muted-foreground text-center">
                ✓ Kommentar sparad
              </p>
            )}
          </div>
        </div>
      ) : (
        // Not checked in - show mood selection
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Hej! Hur har din dag varit?
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
            {moodButtons.map(({ mood, icon: Icon, label }) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "mood-btn rounded-2xl p-6 md:p-8 flex flex-col items-center gap-3",
                  mood === 'elevated' && "mood-btn-elevated",
                  mood === 'stable' && "mood-btn-stable",
                  mood === 'depressed' && "mood-btn-depressed"
                )}
              >
                <Icon className="w-10 h-10 md:w-12 md:h-12" />
                <span className="font-medium text-sm md:text-base">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

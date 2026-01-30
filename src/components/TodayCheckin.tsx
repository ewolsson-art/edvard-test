import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Zap, Sun, CloudRain, Check, MessageSquare, X } from 'lucide-react';
import { MoodType, MoodEntry, MOOD_LABELS } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface TodayCheckinProps {
  todayEntry: MoodEntry | undefined;
  onCheckin: (mood: MoodType, comment?: string) => void;
  onUpdateComment: (comment: string) => void;
}

const moodButtons: { mood: MoodType; icon: typeof Zap; label: string }[] = [
  { mood: 'elevated', icon: Zap, label: MOOD_LABELS.elevated },
  { mood: 'stable', icon: Sun, label: MOOD_LABELS.stable },
  { mood: 'depressed', icon: CloudRain, label: MOOD_LABELS.depressed },
];

export function TodayCheckin({ todayEntry, onCheckin, onUpdateComment }: TodayCheckinProps) {
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

  return (
    <div className="glass-card p-8 md:p-12 fade-in">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
          Hej! Hur har din dag varit?
        </h1>
        <p className="text-muted-foreground text-lg capitalize">
          {formattedDate}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
          {moodButtons.map(({ mood, icon: Icon, label }) => {
            const isSelected = todayEntry?.mood === mood;
            
            return (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "mood-btn rounded-2xl p-6 md:p-8 flex flex-col items-center gap-3",
                  mood === 'elevated' && "mood-btn-elevated",
                  mood === 'stable' && "mood-btn-stable",
                  mood === 'depressed' && "mood-btn-depressed",
                  isSelected && "ring-4 ring-offset-4 ring-offset-background"
                )}
              >
                <div className="relative">
                  <Icon className="w-10 h-10 md:w-12 md:h-12" />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-foreground" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm md:text-base">{label}</span>
              </button>
            );
          })}
        </div>

        {todayEntry?.mood && (
          <div className="text-center fade-in">
            <p className="text-sm text-muted-foreground mb-4">
              Du har checkat in som <span className="font-medium">{MOOD_LABELS[todayEntry.mood].toLowerCase()}</span> idag ✓
            </p>
            
            {!showComment ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComment(true)}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Lägg till kommentar
              </Button>
            ) : (
              <div className="max-w-lg mx-auto space-y-3 fade-in">
                <div className="relative">
                  <Textarea
                    placeholder="Hur kändes dagen? Vad hände?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] resize-none pr-10"
                  />
                  <button
                    onClick={() => {
                      setShowComment(false);
                      setComment(todayEntry.comment || '');
                    }}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <Button
                  onClick={handleSaveComment}
                  size="sm"
                  className="w-full"
                >
                  Spara kommentar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

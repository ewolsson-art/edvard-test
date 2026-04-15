import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Dumbbell, Check } from 'lucide-react';
import { ExerciseType, EXERCISE_TYPE_LABELS } from '@/types/mood';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ExerciseTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  currentTypes: ExerciseType[];
  onSave: (types: ExerciseType[]) => Promise<boolean>;
}

const EXERCISE_OPTIONS: ExerciseType[] = ['chest', 'shoulders', 'back', 'legs'];

export function ExerciseTypeDialog({
  open,
  onOpenChange,
  date,
  currentTypes,
  onSave,
}: ExerciseTypeDialogProps) {
  const [selectedTypes, setSelectedTypes] = useState<ExerciseType[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTypes(currentTypes);
    }
  }, [open, currentTypes]);

  if (!date) return null;

  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: sv });

  const toggleType = (type: ExerciseType) => {
  const { t } = useTranslation();
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(selectedTypes);
    setIsSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 capitalize text-lg font-display">
            <Dumbbell className="w-5 h-5 text-primary" />
            Träningstyp
          </DialogTitle>
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">Vad tränade du den här dagen?</p>
          <div className="grid grid-cols-2 gap-3">
            {EXERCISE_OPTIONS.map(type => {
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                    isSelected 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="font-medium">{EXERCISE_TYPE_LABELS[type]}</span>
                  {isSelected && <Check className="w-5 h-5" />}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Sparar...' : 'Spara'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
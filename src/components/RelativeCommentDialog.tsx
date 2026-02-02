import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';

interface RelativeCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  existingComment?: string;
  onSave: (date: string, comment: string) => Promise<boolean>;
  onDelete?: (date: string) => Promise<boolean>;
}

export function RelativeCommentDialog({
  open,
  onOpenChange,
  date,
  existingComment,
  onSave,
  onDelete,
}: RelativeCommentDialogProps) {
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setComment(existingComment || '');
    }
  }, [open, existingComment]);

  const handleSave = async () => {
    if (!date || !comment.trim()) return;

    setIsSaving(true);
    const success = await onSave(format(date, 'yyyy-MM-dd'), comment.trim());
    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!date || !onDelete) return;

    setIsDeleting(true);
    const success = await onDelete(format(date, 'yyyy-MM-dd'));
    setIsDeleting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const formattedDate = date ? format(date, 'EEEE d MMMM yyyy', { locale: sv }) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Egen anteckning</DialogTitle>
          <DialogDescription className="capitalize">
            {formattedDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Skriv din observation om dagen, t.ex. 'Ringde och verkade ledsen' eller 'Hade en bra dag tillsammans'..."
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            Denna anteckning är bara synlig för dig.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingComment && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ta bort
                </>
              )}
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
              className="flex-1 sm:flex-none"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={!comment.trim() || isSaving || isDeleting}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Spara'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

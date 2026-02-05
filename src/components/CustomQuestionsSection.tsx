import { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomQuestion } from '@/hooks/useCustomCheckinQuestions';

interface CustomQuestionsSectionProps {
  questions: CustomQuestion[];
  onAdd: (text: string) => Promise<CustomQuestion | null>;
  onRemove: (id: string) => Promise<void>;
}

export function CustomQuestionsSection({ questions, onAdd, onRemove }: CustomQuestionsSectionProps) {
  const [newQuestion, setNewQuestion] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const text = newQuestion.trim();
    if (!text) return;
    setIsAdding(true);
    await onAdd(text);
    setNewQuestion('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Egna frågor</h2>
          <p className="text-sm text-muted-foreground">
            Lägg till egna ja/nej-frågor i din dagliga incheckning
          </p>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm font-medium">{q.question_text}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(q.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="T.ex. Har du ätit godis?"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          maxLength={200}
          disabled={isAdding}
        />
        <Button
          onClick={handleAdd}
          disabled={!newQuestion.trim() || isAdding}
          size="icon"
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

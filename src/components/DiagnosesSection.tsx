import { useState } from 'react';
import { Plus, X, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDiagnoses } from '@/hooks/useDiagnoses';

const COMMON_DIAGNOSES = [
  'Bipolär sjukdom typ 1',
  'Bipolär sjukdom typ 2',
  'Cyklotymi',
  'Depression',
  'Ångest',
  'ADHD',
  'PTSD',
];

export const DiagnosesSection = () => {
  const { diagnoses, isLoading, addDiagnosis, removeDiagnosis } = useDiagnoses();
  const [showForm, setShowForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCommon = async (name: string) => {
    // Don't add if already exists
    if (diagnoses.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setIsSubmitting(true);
    await addDiagnosis(name);
    setIsSubmitting(false);
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setIsSubmitting(true);
    const success = await addDiagnosis(customName);
    if (success) {
      setCustomName('');
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    setIsSubmitting(true);
    await removeDiagnosis(id);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mina diagnoser</h3>
        </div>
        <div className="h-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const existingNames = diagnoses.map(d => d.name.toLowerCase());
  const availableCommon = COMMON_DIAGNOSES.filter(
    name => !existingNames.includes(name.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mina diagnoser</h3>
        </div>
        <p className="text-xs text-muted-foreground">Delas med dina läkare</p>
      </div>

      {/* Current diagnoses */}
      {diagnoses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {diagnoses.map((diagnosis) => (
            <Badge
              key={diagnosis.id}
              variant="secondary"
              className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
            >
              {diagnosis.name}
              <button
                onClick={() => handleRemove(diagnosis.id)}
                disabled={isSubmitting}
                className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                aria-label={`Ta bort ${diagnosis.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {diagnoses.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Inga diagnoser tillagda ännu.
        </p>
      )}

      {/* Quick add common diagnoses */}
      {availableCommon.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Lägg till vanliga:</Label>
          <div className="flex flex-wrap gap-2">
            {availableCommon.map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => handleAddCommon(name)}
                disabled={isSubmitting}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom diagnosis form */}
      {showForm ? (
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ange diagnos..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={isSubmitting || !customName.trim()}>
            Lägg till
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowForm(false);
              setCustomName('');
            }}
          >
            Avbryt
          </Button>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till annan diagnos
        </Button>
      )}
    </div>
  );
};

import { Pill } from 'lucide-react';
import { Medication } from '@/types/medication';
import { useTranslation } from 'react-i18next';

interface MedicationBadgesProps {
  medications: Medication[];
  compact?: boolean;
}

export function MedicationBadges({ medications, compact = false }: MedicationBadgesProps) {
  const { t } = useTranslation();
  if (medications.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Pill className="h-3 w-3 text-primary" />
        <span className="text-xs text-muted-foreground">{medications.length}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {medications.map(med => (
        <span 
          key={med.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary"
          title={med.dosage}
        >
          <Pill className="h-3 w-3" />
          {med.name}
        </span>
      ))}
    </div>
  );
}

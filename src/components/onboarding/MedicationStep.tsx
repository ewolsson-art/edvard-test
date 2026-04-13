import { useState } from 'react';
import { Plus, X, Pill, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const COMMON_MEDICATIONS = [
  'Lithium',
  'Lamotrigin',
  'Valproat',
  'Quetiapin',
  'Olanzapin',
  'Aripiprazol',
  'Risperidon',
  'Sertralin',
  'Fluoxetin',
  'Venlafaxin',
  'Mirtazapin',
  'Zolpidem',
];

export interface MedicationInput {
  name: string;
  dosage: string;
}

interface MedicationStepProps {
  selectedMedications: MedicationInput[];
  onMedicationsChange: (medications: MedicationInput[]) => void;
}

export const MedicationStep = ({ selectedMedications, onMedicationsChange }: MedicationStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const existingNames = selectedMedications.map(m => m.name.toLowerCase());

  const filteredMedications = (() => {
    if (!searchQuery.trim()) return COMMON_MEDICATIONS;
    const query = searchQuery.toLowerCase();
    return COMMON_MEDICATIONS.filter(name => name.toLowerCase().includes(query));
  })();

  const handleToggleMedication = (name: string) => {
    if (existingNames.includes(name.toLowerCase())) {
      onMedicationsChange(selectedMedications.filter(m => m.name.toLowerCase() !== name.toLowerCase()));
    } else {
      onMedicationsChange([...selectedMedications, { name, dosage: '' }]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed || existingNames.includes(trimmed.toLowerCase())) return;
    onMedicationsChange([...selectedMedications, { name: trimmed, dosage: '' }]);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddCustom();
  };

  const showAddCustom = searchQuery.trim() && 
    !COMMON_MEDICATIONS.some(m => m.toLowerCase() === searchQuery.trim().toLowerCase()) &&
    !existingNames.includes(searchQuery.trim().toLowerCase());

  return (
    <div className="space-y-5">
      {/* Selected count */}
      {selectedMedications.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[hsl(45_85%_55%/0.08)] ring-1 ring-[hsl(45_85%_55%/0.2)]">
          <Pill className="w-5 h-5 text-[hsl(45_85%_55%)]" />
          <span className="text-sm font-medium text-white/80">
            {selectedMedications.length} medicin{selectedMedications.length !== 1 ? 'er' : ''} vald{selectedMedications.length !== 1 ? 'a' : ''}
          </span>
        </div>
      )}

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sök eller skriv din medicin..."
          className="pl-12 h-14 text-base rounded-2xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/30 focus:ring-[hsl(45_85%_55%/0.3)] focus:border-[hsl(45_85%_55%/0.3)]"
        />
      </form>

      {/* Add custom medication */}
      {showAddCustom && (
        <button
          type="button"
          onClick={handleAddCustom}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[hsl(45_85%_55%/0.06)] ring-1 ring-[hsl(45_85%_55%/0.2)] hover:bg-[hsl(45_85%_55%/0.1)] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[hsl(45_85%_55%/0.15)] flex items-center justify-center">
            <Plus className="w-5 h-5 text-[hsl(45_85%_55%)]" />
          </div>
          <span className="text-sm font-medium text-white/80">
            Lägg till "{searchQuery.trim()}"
          </span>
        </button>
      )}

      {/* Medication grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredMedications.map((med) => {
          const isSelected = existingNames.includes(med.toLowerCase());
          return (
            <button
              key={med}
              type="button"
              onClick={() => handleToggleMedication(med)}
              className={cn(
                "relative flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200",
                isSelected
                  ? 'bg-[hsl(45_85%_55%/0.1)] ring-2 ring-[hsl(45_85%_55%/0.4)] scale-[0.98]'
                  : 'bg-white/[0.04] ring-1 ring-white/[0.08] hover:ring-white/[0.15] hover:bg-white/[0.06] active:scale-[0.97]'
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                isSelected ? 'bg-[hsl(45_85%_55%/0.2)]' : 'bg-white/[0.06]'
              )}>
                {isSelected ? (
                  <Check className="w-4 h-4 text-[hsl(45_85%_55%)]" />
                ) : (
                  <Pill className="w-4 h-4 text-white/30" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                isSelected ? 'text-white' : 'text-white/60'
              )}>
                {med}
              </span>
            </button>
          );
        })}
      </div>

      {filteredMedications.length === 0 && !showAddCustom && (
        <p className="text-sm text-white/30 text-center py-4">
          Inga mediciner matchade din sökning
        </p>
      )}
    </div>
  );
};

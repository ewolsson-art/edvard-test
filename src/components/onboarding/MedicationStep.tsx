import { useState } from 'react';
import { Plus, Pill, Search, Check, X, Clock, ChevronDown } from 'lucide-react';
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

const TIMING_OPTIONS = [
  { id: 'morning', label: 'Morgon', icon: '🌅' },
  { id: 'evening', label: 'Kväll', icon: '🌙' },
  { id: 'both', label: 'Morgon & kväll', icon: '🔄' },
  { id: 'as_needed', label: 'Vid behov', icon: '💊' },
];

export interface MedicationInput {
  name: string;
  dosage: string;
  timing?: string;
}

interface MedicationStepProps {
  selectedMedications: MedicationInput[];
  onMedicationsChange: (medications: MedicationInput[]) => void;
}

export const MedicationStep = ({ selectedMedications, onMedicationsChange }: MedicationStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMed, setExpandedMed] = useState<string | null>(null);

  const existingNames = selectedMedications.map(m => m.name.toLowerCase());

  const filteredMedications = (() => {
    if (!searchQuery.trim()) return COMMON_MEDICATIONS;
    const query = searchQuery.toLowerCase();
    return COMMON_MEDICATIONS.filter(name => name.toLowerCase().includes(query));
  })();

  const handleToggleMedication = (name: string) => {
    if (existingNames.includes(name.toLowerCase())) {
      onMedicationsChange(selectedMedications.filter(m => m.name.toLowerCase() !== name.toLowerCase()));
      if (expandedMed === name) setExpandedMed(null);
    } else {
      onMedicationsChange([...selectedMedications, { name, dosage: '', timing: 'morning' }]);
      setExpandedMed(name);
    }
  };

  const handleAddCustom = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed || existingNames.includes(trimmed.toLowerCase())) return;
    onMedicationsChange([...selectedMedications, { name: trimmed, dosage: '', timing: 'morning' }]);
    setExpandedMed(trimmed);
    setSearchQuery('');
  };

  const handleUpdateMedication = (name: string, field: 'dosage' | 'timing', value: string) => {
    onMedicationsChange(
      selectedMedications.map(m =>
        m.name.toLowerCase() === name.toLowerCase() ? { ...m, [field]: value } : m
      )
    );
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
      {/* Selected medications with details */}
      {selectedMedications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Pill className="w-4 h-4 text-[hsl(45_85%_55%)]" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Valda mediciner ({selectedMedications.length})
            </span>
          </div>
          <div className="space-y-2">
            {selectedMedications.map((med) => {
              const isExpanded = expandedMed === med.name;
              const timingLabel = TIMING_OPTIONS.find(t => t.id === med.timing);
              
              return (
                <div
                  key={med.name}
                  className="rounded-2xl bg-[hsl(45_85%_55%/0.06)] ring-1 ring-[hsl(45_85%_55%/0.2)] overflow-hidden transition-all"
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 p-3.5 cursor-pointer"
                    onClick={() => setExpandedMed(isExpanded ? null : med.name)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[hsl(45_85%_55%/0.15)] flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[hsl(45_85%_55%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white">{med.name}</span>
                      {(med.dosage || timingLabel) && !isExpanded && (
                        <p className="text-xs text-white/40 mt-0.5 truncate">
                          {med.dosage && <span>{med.dosage}</span>}
                          {med.dosage && timingLabel && <span> · </span>}
                          {timingLabel && <span>{timingLabel.icon} {timingLabel.label}</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChevronDown className={cn(
                        "w-4 h-4 text-white/30 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMedication(med.name);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-white/30" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 space-y-3 animate-fade-in">
                      <div className="h-px bg-white/[0.06]" />
                      
                      {/* Dosage */}
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">
                          Dos (t.ex. 150 mg)
                        </label>
                        <Input
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedication(med.name, 'dosage', e.target.value)}
                          placeholder="Ange dos..."
                          className="h-11 text-sm rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus:ring-[hsl(45_85%_55%/0.3)] focus:border-[hsl(45_85%_55%/0.3)]"
                        />
                      </div>

                      {/* Timing */}
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">
                          <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
                          När tar du den?
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {TIMING_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleUpdateMedication(med.name, 'timing', option.id)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium",
                                med.timing === option.id
                                  ? 'bg-[hsl(45_85%_55%/0.15)] ring-1 ring-[hsl(45_85%_55%/0.4)] text-white'
                                  : 'bg-white/[0.04] ring-1 ring-white/[0.06] text-white/50 hover:bg-white/[0.06]'
                              )}
                            >
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
          if (isSelected) return null; // Already shown above
          return (
            <button
              key={med}
              type="button"
              onClick={() => handleToggleMedication(med)}
              className="relative flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 bg-white/[0.04] ring-1 ring-white/[0.08] hover:ring-white/[0.15] hover:bg-white/[0.06] active:scale-[0.97]"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.06]">
                <Pill className="w-4 h-4 text-white/30" />
              </div>
              <span className="text-sm font-medium text-white/60">
                {med}
              </span>
            </button>
          );
        })}
      </div>

      {filteredMedications.length === 0 && !showAddCustom && selectedMedications.length === 0 && (
        <p className="text-sm text-white/30 text-center py-4">
          Inga mediciner matchade din sökning
        </p>
      )}
    </div>
  );
};

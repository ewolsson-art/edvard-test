import { useState } from 'react';
import { Plus, X, Pill, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  const [showSuggestions, setShowSuggestions] = useState(false);

  const existingNames = selectedMedications.map(m => m.name.toLowerCase());

  const suggestions = (() => {
    if (!searchQuery.trim()) {
      return COMMON_MEDICATIONS.filter(
        name => !existingNames.includes(name.toLowerCase())
      ).slice(0, 6);
    }
    
    const query = searchQuery.toLowerCase();
    return COMMON_MEDICATIONS.filter(
      name => 
        name.toLowerCase().includes(query) && 
        !existingNames.includes(name.toLowerCase())
    ).slice(0, 6);
  })();

  const handleAddMedication = (name: string) => {
    if (!name.trim()) return;
    
    const trimmedName = name.trim();
    if (existingNames.includes(trimmedName.toLowerCase())) {
      return;
    }

    onMedicationsChange([...selectedMedications, { name: trimmedName, dosage: '' }]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemove = (name: string) => {
    onMedicationsChange(selectedMedications.filter(m => m.name !== name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddMedication(searchQuery);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Pill className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">Valfritt – du kan ändra detta senare</span>
      </div>

      {/* Selected medications */}
      {selectedMedications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedMedications.map((med) => (
            <Badge
              key={med.name}
              variant="secondary"
              className="pl-2 pr-1 py-1 text-xs flex items-center gap-1"
            >
              {med.name}
              <button
                onClick={() => handleRemove(med.name)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                aria-label={`Ta bort ${med.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Sök eller skriv din medicin..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddMedication(suggestion)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors",
                  "focus:bg-muted focus:outline-none"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>

      {searchQuery.trim() && !suggestions.some(s => s.toLowerCase() === searchQuery.toLowerCase().trim()) && (
        <Button 
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddMedication(searchQuery)}
          className="w-full h-8 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Lägg till "{searchQuery.trim()}"
        </Button>
      )}

      {selectedMedications.length === 0 && !searchQuery && (
        <p className="text-xs text-muted-foreground text-center">
          Klicka på en medicin nedan eller sök efter din
        </p>
      )}

      {/* Quick select common medications */}
      {!searchQuery && selectedMedications.length < 5 && (
        <div className="flex flex-wrap gap-1.5">
          {COMMON_MEDICATIONS.slice(0, 8).filter(m => !existingNames.includes(m.toLowerCase())).map((med) => (
            <button
              key={med}
              type="button"
              onClick={() => handleAddMedication(med)}
              className="px-2 py-1 text-[10px] rounded-full border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors"
            >
              {med}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

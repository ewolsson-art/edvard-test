import { useState, useMemo } from 'react';
import { Plus, X, Stethoscope, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const COMMON_DIAGNOSES = [
  'Bipolär sjukdom typ 1',
  'Bipolär sjukdom typ 2',
  'Cyklotymi',
  'Depression',
  'Generaliserat ångestsyndrom (GAD)',
  'Paniksyndrom',
  'Social fobi',
  'ADHD',
  'ADD',
  'Autismspektrumtillstånd (AST)',
  'PTSD',
  'Borderline personlighetssyndrom',
  'OCD (Tvångssyndrom)',
  'Ätstörning',
];

interface DiagnosisStepProps {
  selectedDiagnoses: string[];
  onDiagnosesChange: (diagnoses: string[]) => void;
}

export const DiagnosisStep = ({ selectedDiagnoses, onDiagnosesChange }: DiagnosisStepProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const existingNames = selectedDiagnoses.map(d => d.toLowerCase());

  // Filter suggestions based on search query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show common diagnoses when no search
      return COMMON_DIAGNOSES.filter(
        name => !existingNames.includes(name.toLowerCase())
      ).slice(0, 6);
    }
    
    const query = searchQuery.toLowerCase();
    return COMMON_DIAGNOSES.filter(
      name => 
        name.toLowerCase().includes(query) && 
        !existingNames.includes(name.toLowerCase())
    ).slice(0, 6);
  }, [searchQuery, existingNames]);

  const handleAddDiagnosis = (name: string) => {
    if (!name.trim()) return;
    
    const trimmedName = name.trim();
    if (existingNames.includes(trimmedName.toLowerCase())) {
      return;
    }

    onDiagnosesChange([...selectedDiagnoses, trimmedName]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemove = (name: string) => {
    onDiagnosesChange(selectedDiagnoses.filter(d => d !== name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddDiagnosis(searchQuery);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Stethoscope className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">Valfritt – delas med dina läkare</span>
      </div>

      {/* Selected diagnoses */}
      {selectedDiagnoses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedDiagnoses.map((diagnosis) => (
            <Badge
              key={diagnosis}
              variant="secondary"
              className="pl-2 pr-1 py-1 text-xs flex items-center gap-1"
            >
              {diagnosis}
              <button
                onClick={() => handleRemove(diagnosis)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                aria-label={`Ta bort ${diagnosis}`}
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
            placeholder="Sök eller skriv din diagnos..."
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
                onClick={() => handleAddDiagnosis(suggestion)}
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
          onClick={() => handleAddDiagnosis(searchQuery)}
          className="w-full h-8 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Lägg till "{searchQuery.trim()}"
        </Button>
      )}

      {selectedDiagnoses.length === 0 && !searchQuery && (
        <p className="text-xs text-muted-foreground text-center">
          Klicka på en diagnos nedan eller sök efter din
        </p>
      )}

      {/* Quick select common diagnoses */}
      {!searchQuery && selectedDiagnoses.length < 3 && (
        <div className="flex flex-wrap gap-1.5">
          {COMMON_DIAGNOSES.slice(0, 8).filter(d => !existingNames.includes(d.toLowerCase())).map((diagnosis) => (
            <button
              key={diagnosis}
              type="button"
              onClick={() => handleAddDiagnosis(diagnosis)}
              className="px-2 py-1 text-[10px] rounded-full border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors"
            >
              {diagnosis}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

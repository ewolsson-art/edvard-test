import { useState, useMemo } from 'react';
import { Plus, X, Stethoscope, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDiagnoses } from '@/hooks/useDiagnoses';
import { cn } from '@/lib/utils';

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
  'Schizofreni',
  'Schizoaffektivt syndrom',
];

export const DiagnosesSection = () => {
  const { diagnoses, isLoading, addDiagnosis, removeDiagnosis } = useDiagnoses();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const existingNames = diagnoses.map(d => d.name.toLowerCase());

  // Filter suggestions based on search query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return COMMON_DIAGNOSES.filter(
      name => 
        name.toLowerCase().includes(query) && 
        !existingNames.includes(name.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, existingNames]);

  const handleAddDiagnosis = async (name: string) => {
    if (!name.trim()) return;
    
    // Check if already exists
    if (existingNames.includes(name.toLowerCase().trim())) {
      return;
    }

    setIsSubmitting(true);
    const success = await addDiagnosis(name);
    if (success) {
      setSearchQuery('');
      setShowForm(false);
      setShowSuggestions(false);
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddDiagnosis(searchQuery);
  };

  const handleSelectSuggestion = async (name: string) => {
    await handleAddDiagnosis(name);
  };

  const handleRemove = async (id: string) => {
    setIsSubmitting(true);
    await removeDiagnosis(id);
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSearchQuery('');
    setShowSuggestions(false);
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
                className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                aria-label={`Ta bort ${diagnosis.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {diagnoses.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">
          Inga diagnoser tillagda ännu.
        </p>
      )}

      {/* Add diagnosis form */}
      {showForm ? (
        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Sök diagnos..."
                className="pl-10"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors",
                      "focus:bg-muted focus:outline-none"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !searchQuery.trim()}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till "{searchQuery.trim() || '...'}"
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Börja skriva för att se förslag, eller skriv in din diagnos och klicka på lägg till.
          </p>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Lägg till diagnos
        </Button>
      )}
    </div>
  );
};

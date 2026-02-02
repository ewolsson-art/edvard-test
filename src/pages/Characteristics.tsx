import { useState } from 'react';
import { Plus, X, Zap, Cloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { cn } from '@/lib/utils';

const Characteristics = () => {
  const {
    elevatedCharacteristics,
    depressedCharacteristics,
    isLoading,
    addCharacteristic,
    deleteCharacteristic,
  } = useCharacteristics();

  const { entries, isLoaded: moodLoaded } = useMoodData();
  
  // Get the latest mood from today's or most recent check-in
  const latestMood = entries.length > 0 
    ? entries.sort((a, b) => b.timestamp - a.timestamp)[0]?.mood 
    : null;

  const [newElevated, setNewElevated] = useState('');
  const [newDepressed, setNewDepressed] = useState('');
  const [isAddingElevated, setIsAddingElevated] = useState(false);
  const [isAddingDepressed, setIsAddingDepressed] = useState(false);
  const [showElevatedInput, setShowElevatedInput] = useState(false);
  const [showDepressedInput, setShowDepressedInput] = useState(false);

  const handleAddElevated = async () => {
    if (!newElevated.trim()) return;
    setIsAddingElevated(true);
    const success = await addCharacteristic(newElevated, 'elevated');
    if (success) {
      setNewElevated('');
      setShowElevatedInput(false);
    }
    setIsAddingElevated(false);
  };

  const handleAddDepressed = async () => {
    if (!newDepressed.trim()) return;
    setIsAddingDepressed(true);
    const success = await addCharacteristic(newDepressed, 'depressed');
    if (success) {
      setNewDepressed('');
      setShowDepressedInput(false);
    }
    setIsAddingDepressed(false);
  };

  if (isLoading || !moodLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mina kännetecken</h1>
        <p className="text-muted-foreground">
          Lägg till kännetecken som hjälper dig identifiera hur du brukar känna dig i olika perioder.
          Detta kan hjälpa dig och din vårdgivare att tidigt upptäcka förändringar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Elevated/Uppvarvad */}
        <Card className={cn(
          "border-amber-200 dark:border-amber-900/50 transition-all duration-300 min-h-[400px]",
          latestMood === 'elevated' && "ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-100 dark:shadow-amber-900/20"
        )}>
          <CardHeader className="pb-4 relative">
            {/* Plus button in top right */}
            <Button
              size="icon"
              onClick={() => setShowElevatedInput(true)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {latestMood === 'elevated' && (
              <div className="mb-3">
                <Badge className="bg-amber-500 text-white text-xs">
                  Senaste incheckning: Uppvarvad
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Uppvarvad period</CardTitle>
                <CardDescription className="text-sm">Hur känner du dig när du är uppvarvad?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {/* Input field - shown when plus is clicked */}
            {showElevatedInput && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Input
                  placeholder="T.ex. Mer social, Pratar snabbare..."
                  value={newElevated}
                  onChange={(e) => setNewElevated(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddElevated();
                    if (e.key === 'Escape') {
                      setShowElevatedInput(false);
                      setNewElevated('');
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowElevatedInput(false);
                    setNewElevated('');
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleAddElevated}
                  disabled={!newElevated.trim() || isAddingElevated}
                  className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                >
                  Lägg till
                </Button>
              </div>
            )}

            {/* Characteristics list */}
            <div className="flex flex-wrap gap-2.5 min-h-[100px]">
              {elevatedCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Inga kännetecken tillagda ännu. Tryck på + för att lägga till.
                </p>
              ) : (
                elevatedCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 gap-1.5 py-2 px-4 text-sm"
                  >
                    {char.name}
                    <button
                      onClick={() => deleteCharacteristic(char.id)}
                      className="ml-1 text-destructive hover:text-destructive/80 transition-colors"
                      aria-label={`Ta bort ${char.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Suggestions */}
            <div className="pt-4 border-t border-amber-100 dark:border-amber-900/30">
              <p className="text-xs text-muted-foreground font-medium mb-3">Vanliga exempel:</p>
              <div className="flex flex-wrap gap-2">
                {['Mer social', 'Sover mindre', 'Mer energi', 'Pratar snabbare', 'Tar fler initiativ', 'Rastlös'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setNewElevated(suggestion);
                      setShowElevatedInput(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Depressed/Nedstämd */}
        <Card className={cn(
          "border-blue-200 dark:border-blue-900/50 transition-all duration-300 min-h-[400px]",
          latestMood === 'depressed' && "ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
        )}>
          <CardHeader className="pb-4 relative">
            {/* Plus button in top right */}
            <Button
              size="icon"
              onClick={() => setShowDepressedInput(true)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {latestMood === 'depressed' && (
              <div className="mb-3">
                <Badge className="bg-blue-500 text-white text-xs">
                  Senaste incheckning: Nedstämd
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Nedstämd period</CardTitle>
                <CardDescription className="text-sm">Hur känner du dig när du är nedstämd?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {/* Input field - shown when plus is clicked */}
            {showDepressedInput && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Input
                  placeholder="T.ex. Drar mig undan, Sover mer..."
                  value={newDepressed}
                  onChange={(e) => setNewDepressed(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddDepressed();
                    if (e.key === 'Escape') {
                      setShowDepressedInput(false);
                      setNewDepressed('');
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowDepressedInput(false);
                    setNewDepressed('');
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleAddDepressed}
                  disabled={!newDepressed.trim() || isAddingDepressed}
                  className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                >
                  Lägg till
                </Button>
              </div>
            )}

            {/* Characteristics list */}
            <div className="flex flex-wrap gap-2.5 min-h-[100px]">
              {depressedCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Inga kännetecken tillagda ännu. Tryck på + för att lägga till.
                </p>
              ) : (
                depressedCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 gap-1.5 py-2 px-4 text-sm"
                  >
                    {char.name}
                    <button
                      onClick={() => deleteCharacteristic(char.id)}
                      className="ml-1 text-destructive hover:text-destructive/80 transition-colors"
                      aria-label={`Ta bort ${char.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Suggestions */}
            <div className="pt-4 border-t border-blue-100 dark:border-blue-900/30">
              <p className="text-xs text-muted-foreground font-medium mb-3">Vanliga exempel:</p>
              <div className="flex flex-wrap gap-2">
                {['Drar mig undan', 'Sover mer', 'Mindre energi', 'Svårt att koncentrera', 'Tappar aptiten', 'Gråter lättare'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setNewDepressed(suggestion);
                      setShowDepressedInput(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Characteristics;

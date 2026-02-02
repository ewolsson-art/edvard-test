import { useState } from 'react';
import { Plus, X, Zap, Cloud, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCharacteristics } from '@/hooks/useCharacteristics';
import { useMoodData } from '@/hooks/useMoodData';
import { cn } from '@/lib/utils';
import { CharacteristicsSharingSection } from '@/components/CharacteristicsSharingSection';

const Characteristics = () => {
  const {
    elevatedCharacteristics,
    depressedCharacteristics,
    stableCharacteristics,
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
  const [newStable, setNewStable] = useState('');
  const [isAddingElevated, setIsAddingElevated] = useState(false);
  const [isAddingDepressed, setIsAddingDepressed] = useState(false);
  const [isAddingStable, setIsAddingStable] = useState(false);
  const [showElevatedInput, setShowElevatedInput] = useState(false);
  const [showDepressedInput, setShowDepressedInput] = useState(false);
  const [showStableInput, setShowStableInput] = useState(false);

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

  const handleAddStable = async () => {
    if (!newStable.trim()) return;
    setIsAddingStable(true);
    const success = await addCharacteristic(newStable, 'stable');
    if (success) {
      setNewStable('');
      setShowStableInput(false);
    }
    setIsAddingStable(false);
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Stable/Stabilt - NOW IN THE MIDDLE */}
        <Card className={cn(
          "border-emerald-200 dark:border-emerald-900/50 transition-all duration-300 min-h-[400px]",
          latestMood === 'stable' && "ring-2 ring-emerald-400 dark:ring-emerald-500 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20"
        )}>
          <CardHeader className="pb-4 relative">
            {/* Plus button in top right */}
            <Button
              size="icon"
              onClick={() => setShowStableInput(true)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {latestMood === 'stable' && (
              <div className="mb-3">
                <Badge className="bg-emerald-500 text-white text-xs">
                  Senaste incheckning: Stabilt
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Sun className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Stabil period</CardTitle>
                <CardDescription className="text-sm">Hur känner du dig när du är i balans?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {/* Input field - shown when plus is clicked */}
            {showStableInput && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Input
                  placeholder="T.ex. God sömn, Lugn och fokuserad..."
                  value={newStable}
                  onChange={(e) => setNewStable(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddStable();
                    if (e.key === 'Escape') {
                      setShowStableInput(false);
                      setNewStable('');
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowStableInput(false);
                    setNewStable('');
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleAddStable}
                  disabled={!newStable.trim() || isAddingStable}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                >
                  Lägg till
                </Button>
              </div>
            )}

            {/* Characteristics list */}
            <div className="flex flex-wrap gap-2.5 min-h-[100px]">
              {stableCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Inga kännetecken tillagda ännu. Tryck på + för att lägga till.
                </p>
              ) : (
                stableCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 gap-1.5 py-2 px-4 text-sm"
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
            <div className="pt-4 border-t border-emerald-100 dark:border-emerald-900/30">
              <p className="text-xs text-muted-foreground font-medium mb-3">Vanliga exempel:</p>
              <div className="flex flex-wrap gap-2">
                {['God sömn', 'Regelbundna rutiner', 'Fokuserad', 'Social balans', 'Stabil aptit', 'Lugn'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setNewStable(suggestion);
                      setShowStableInput(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors"
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
          "border-red-200 dark:border-red-900/50 transition-all duration-300 min-h-[400px]",
          latestMood === 'depressed' && "ring-2 ring-red-400 dark:ring-red-500 shadow-lg shadow-red-100 dark:shadow-red-900/20"
        )}>
          <CardHeader className="pb-4 relative">
            {/* Plus button in top right */}
            <Button
              size="icon"
              onClick={() => setShowDepressedInput(true)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {latestMood === 'depressed' && (
              <div className="mb-3">
                <Badge className="bg-red-500 text-white text-xs">
                  Senaste incheckning: Nedstämd
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                <Cloud className="h-6 w-6 text-red-600 dark:text-red-400" />
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
                  className="bg-red-500 hover:bg-red-600 text-white shrink-0"
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
                    className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 gap-1.5 py-2 px-4 text-sm"
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
            <div className="pt-4 border-t border-red-100 dark:border-red-900/30">
              <p className="text-xs text-muted-foreground font-medium mb-3">Vanliga exempel:</p>
              <div className="flex flex-wrap gap-2">
                {['Drar mig undan', 'Sover mer', 'Mindre energi', 'Svårt att koncentrera', 'Tappar aptiten', 'Gråter lättare'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setNewDepressed(suggestion);
                      setShowDepressedInput(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Sharing section */}
      <div className="mt-8">
        <CharacteristicsSharingSection />
      </div>
    </div>
  );
};

export default Characteristics;

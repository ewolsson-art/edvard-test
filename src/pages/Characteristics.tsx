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

  const handleAddElevated = async () => {
    if (!newElevated.trim()) return;
    setIsAddingElevated(true);
    const success = await addCharacteristic(newElevated, 'elevated');
    if (success) setNewElevated('');
    setIsAddingElevated(false);
  };

  const handleAddDepressed = async () => {
    if (!newDepressed.trim()) return;
    setIsAddingDepressed(true);
    const success = await addCharacteristic(newDepressed, 'depressed');
    if (success) setNewDepressed('');
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
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mina kännetecken</h1>
        <p className="text-muted-foreground">
          Lägg till kännetecken som hjälper dig identifiera hur du brukar känna dig i olika perioder.
          Detta kan hjälpa dig och din vårdgivare att tidigt upptäcka förändringar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Elevated/Uppvarvad */}
        <Card className={cn(
          "border-amber-200 dark:border-amber-900/50 transition-all duration-300",
          latestMood === 'elevated' && "ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-100 dark:shadow-amber-900/20"
        )}>
          <CardHeader className="pb-4">
            {latestMood === 'elevated' && (
              <div className="mb-2">
                <Badge className="bg-amber-500 text-white text-xs">
                  Senaste incheckning: Uppvarvad
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Uppvarvad period</CardTitle>
                <CardDescription>Hur känner du dig när du är uppvarvad?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {elevatedCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Inga kännetecken tillagda ännu
                </p>
              ) : (
                elevatedCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 gap-1 py-1.5 px-3"
                  >
                    {char.name}
                    <button
                      onClick={() => deleteCharacteristic(char.id)}
                      className="ml-1 hover:text-amber-600 dark:hover:text-amber-200 transition-colors"
                      aria-label={`Ta bort ${char.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="T.ex. Mer social, Pratar snabbare..."
                value={newElevated}
                onChange={(e) => setNewElevated(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddElevated()}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleAddElevated}
                disabled={!newElevated.trim() || isAddingElevated}
                className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground font-medium mb-2">Vanliga exempel:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Mer social', 'Sover mindre', 'Mer energi', 'Pratar snabbare', 'Tar fler initiativ', 'Rastlös'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setNewElevated(suggestion)}
                    className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
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
          "border-blue-200 dark:border-blue-900/50 transition-all duration-300",
          latestMood === 'depressed' && "ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
        )}>
          <CardHeader className="pb-4">
            {latestMood === 'depressed' && (
              <div className="mb-2">
                <Badge className="bg-blue-500 text-white text-xs">
                  Senaste incheckning: Nedstämd
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Nedstämd period</CardTitle>
                <CardDescription>Hur känner du dig när du är nedstämd?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {depressedCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Inga kännetecken tillagda ännu
                </p>
              ) : (
                depressedCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 gap-1 py-1.5 px-3"
                  >
                    {char.name}
                    <button
                      onClick={() => deleteCharacteristic(char.id)}
                      className="ml-1 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
                      aria-label={`Ta bort ${char.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="T.ex. Drar mig undan, Sover mer..."
                value={newDepressed}
                onChange={(e) => setNewDepressed(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDepressed()}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleAddDepressed}
                disabled={!newDepressed.trim() || isAddingDepressed}
                className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground font-medium mb-2">Vanliga exempel:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Drar mig undan', 'Sover mer', 'Mindre energi', 'Svårt att koncentrera', 'Tappar aptiten', 'Gråter lättare'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setNewDepressed(suggestion)}
                    className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
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

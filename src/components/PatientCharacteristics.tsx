import { Zap, Cloud, Lock, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePatientCharacteristics } from '@/hooks/usePatientCharacteristics';
import { cn } from '@/lib/utils';
import { MoodType } from '@/types/mood';

interface PatientCharacteristicsProps {
  patientId: string;
  latestMood?: MoodType | null;
  isShared: boolean;
  patientName?: string;
}

export const PatientCharacteristics = ({ 
  patientId, 
  latestMood, 
  isShared,
  patientName = 'Patienten'
}: PatientCharacteristicsProps) => {
  const { elevatedCharacteristics, depressedCharacteristics, stableCharacteristics, isLoading } = usePatientCharacteristics(patientId);

  if (!isShared) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg text-muted-foreground">Kännetecken</CardTitle>
              <CardDescription>{patientName} har inte delat sina kännetecken</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const hasAnyCharacteristics = elevatedCharacteristics.length > 0 || depressedCharacteristics.length > 0 || stableCharacteristics.length > 0;

  if (!hasAnyCharacteristics) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg text-muted-foreground">Kännetecken</CardTitle>
              <CardDescription>{patientName} har inte lagt till några kännetecken ännu</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Kännetecken</h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Elevated/Uppvarvad */}
        <Card className={cn(
          "border-amber-200 dark:border-amber-900/50 transition-all duration-300",
          latestMood === 'elevated' && "ring-2 ring-amber-400 dark:ring-amber-500"
        )}>
          <CardHeader className="pb-3">
            {latestMood === 'elevated' && (
              <Badge className="bg-amber-500 text-white text-xs w-fit mb-2">
                Aktuellt läge
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Uppvarvad period</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {elevatedCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Inga kännetecken</p>
              ) : (
                elevatedCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 py-1.5 px-3"
                  >
                    {char.name}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Depressed/Nedstämd */}
        <Card className={cn(
          "border-red-200 dark:border-red-900/50 transition-all duration-300",
          latestMood === 'depressed' && "ring-2 ring-red-400 dark:ring-red-500"
        )}>
          <CardHeader className="pb-3">
            {latestMood === 'depressed' && (
              <Badge className="bg-red-500 text-white text-xs w-fit mb-2">
                Aktuellt läge
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Cloud className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-base">Nedstämd period</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {depressedCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Inga kännetecken</p>
              ) : (
                depressedCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 py-1.5 px-3"
                  >
                    {char.name}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stable/Stabilt */}
        <Card className={cn(
          "border-emerald-200 dark:border-emerald-900/50 transition-all duration-300",
          latestMood === 'stable' && "ring-2 ring-emerald-400 dark:ring-emerald-500"
        )}>
          <CardHeader className="pb-3">
            {latestMood === 'stable' && (
              <Badge className="bg-emerald-500 text-white text-xs w-fit mb-2">
                Aktuellt läge
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Sun className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Stabil period</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stableCharacteristics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Inga kännetecken</p>
              ) : (
                stableCharacteristics.map((char) => (
                  <Badge
                    key={char.id}
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 py-1.5 px-3"
                  >
                    {char.name}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

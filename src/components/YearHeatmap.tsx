import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfYear, endOfYear, getMonth, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';

interface YearHeatmapProps {
  year: number;
  entries: MoodEntry[];
  medicationDates?: string[];
  onPrevYear?: () => void;
  onNextYear?: () => void;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];

export function YearHeatmap({ year, entries, medicationDates = [], onPrevYear, onNextYear }: YearHeatmapProps) {
  const moodMap = useMemo(() => {
    const map: Record<string, MoodType> = {};
    entries.forEach(entry => {
      map[entry.date] = entry.mood;
    });
    return map;
  }, [entries]);

  const medicationSet = useMemo(() => {
    return new Set(medicationDates);
  }, [medicationDates]);

  const days = useMemo(() => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 0, 1));
    return eachDayOfInterval({ start, end });
  }, [year]);

  // Group days by month
  const monthGroups = useMemo(() => {
    const groups: { month: number; days: Date[] }[] = [];
    let currentMonth = -1;
    
    days.forEach(day => {
      const month = getMonth(day);
      if (month !== currentMonth) {
        groups.push({ month, days: [] });
        currentMonth = month;
      }
      groups[groups.length - 1].days.push(day);
    });
    
    return groups;
  }, [days]);

  return (
    <div className="glass-card p-6 fade-in">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevYear}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Föregående år"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl font-semibold">
          {year}
        </h3>

        <button
          onClick={onNextYear}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Nästa år"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max justify-center">
          {monthGroups.map(({ month, days: monthDays }) => (
            <div key={month} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground mb-1 text-center font-medium">
                {months[month]}
              </span>
              <div className="grid grid-rows-[repeat(31,1fr)] gap-[2px]">
                {monthDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const mood = moodMap[dateStr];
                  const hasMedication = medicationSet.has(dateStr);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      title={`${format(day, 'd MMMM', { locale: sv })}${mood ? ` - ${mood}` : ''}${hasMedication ? ' 💊' : ''}`}
                      className={cn(
                        "w-3.5 h-3.5 rounded-sm transition-all relative cursor-default",
                        !mood && "bg-muted/50",
                        mood === 'elevated' && "bg-mood-elevated",
                        mood === 'stable' && "bg-mood-stable",
                        mood === 'depressed' && "bg-mood-depressed",
                        isTodayDate && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      )}
                    >
                      {hasMedication && (
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <Pill className="h-2 w-2 text-primary" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-mood-elevated" />
          <span className="text-xs text-muted-foreground">Uppvarvad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-mood-stable" />
          <span className="text-xs text-muted-foreground">Stabil</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-mood-depressed" />
          <span className="text-xs text-muted-foreground">Nedstämd</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-muted/50" />
          <span className="text-xs text-muted-foreground">Ej registrerat</span>
        </div>
        <div className="flex items-center gap-2">
          <Pill className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">Medicin tagen</span>
        </div>
      </div>
    </div>
  );
}

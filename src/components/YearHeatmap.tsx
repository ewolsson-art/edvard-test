import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfYear, endOfYear, getMonth, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { MoodEntry, MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';

interface YearHeatmapProps {
  year: number;
  entries: MoodEntry[];
  showHeader?: boolean;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];

export function YearHeatmap({ year, entries, showHeader = true }: YearHeatmapProps) {
  const moodMap = useMemo(() => {
    const map: Record<string, MoodType> = {};
    entries.forEach(entry => {
      map[entry.date] = entry.mood;
    });
    return map;
  }, [entries]);

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
    <div className={showHeader ? "glass-card p-6 fade-in overflow-x-auto" : ""}>
      {showHeader && (
        <h3 className="font-display text-xl font-semibold mb-6">
          Årsöversikt {year}
        </h3>
      )}

      <div className="flex gap-1">
        {monthGroups.map(({ month, days: monthDays }) => (
          <div key={month} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground mb-1 text-center">
              {months[month]}
            </span>
            <div className="grid grid-rows-[repeat(31,1fr)] gap-[2px]">
              {monthDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const mood = moodMap[dateStr];
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={dateStr}
                    title={`${format(day, 'd MMMM', { locale: sv })}${mood ? ` - ${mood}` : ''}`}
                    className={cn(
                      "w-3 h-3 rounded-sm transition-all",
                      !mood && "bg-muted/50",
                      mood === 'elevated' && "bg-mood-elevated",
                      mood === 'stable' && "bg-mood-stable",
                      mood === 'depressed' && "bg-mood-depressed",
                      isTodayDate && "ring-1 ring-primary"
                    )}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 mt-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-mood-elevated" />
          <span className="text-xs text-muted-foreground">Uppvarvad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-mood-stable" />
          <span className="text-xs text-muted-foreground">Stabil</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-mood-depressed" />
          <span className="text-xs text-muted-foreground">Nedstämd</span>
        </div>
      </div>
    </div>
  );
}

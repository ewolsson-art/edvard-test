import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday, getWeek } from 'date-fns';
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
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

const weekDays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

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

  // Generate calendar data for each month
  const monthsData = useMemo(() => {
    return months.map((monthName, monthIndex) => {
      const monthDate = new Date(year, monthIndex, 1);
      const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });
      
      // Group days by week with week numbers
      const weeks: { weekNumber: number; days: Date[] }[] = [];
      let currentWeek: Date[] = [];
      let currentWeekNumber = -1;
      
      days.forEach((day, index) => {
        const weekNum = getWeek(day, { weekStartsOn: 1, firstWeekContainsDate: 4 });
        
        if (currentWeekNumber !== weekNum) {
          if (currentWeek.length > 0) {
            weeks.push({ weekNumber: currentWeekNumber, days: currentWeek });
          }
          currentWeek = [day];
          currentWeekNumber = weekNum;
        } else {
          currentWeek.push(day);
        }
        
        if (index === days.length - 1) {
          weeks.push({ weekNumber: currentWeekNumber, days: currentWeek });
        }
      });
      
      return { monthName, monthIndex, monthDate, weeks };
    });
  }, [year]);

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

      {/* Calendar grid - 3 columns x 4 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthsData.map(({ monthName, monthIndex, monthDate, weeks }) => (
          <div key={monthIndex} className="p-3 rounded-xl bg-muted/30 border border-border">
            <h4 className="font-medium text-sm mb-2 text-center">{monthName}</h4>
            
            {/* Week day headers */}
            <div className="grid grid-cols-8 gap-[2px] mb-1">
              <div className="text-[10px] text-muted-foreground text-center">v</div>
              {weekDays.map((day, i) => (
                <div key={i} className="text-[10px] text-muted-foreground text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Weeks */}
            <div className="space-y-[2px]">
              {weeks.map(({ weekNumber, days }) => (
                <div key={weekNumber} className="grid grid-cols-8 gap-[2px]">
                  {/* Week number */}
                  <div className="text-[9px] text-muted-foreground flex items-center justify-center">
                    {weekNumber}
                  </div>
                  
                  {/* Days */}
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const mood = moodMap[dateStr];
                    const hasMedication = medicationSet.has(dateStr);
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = isSameMonth(day, monthDate);

                    return (
                      <div
                        key={dateStr}
                        title={isCurrentMonth ? `${format(day, 'd MMMM', { locale: sv })}${mood ? ` - ${mood}` : ''}${hasMedication ? ' 💊' : ''}` : ''}
                        className={cn(
                          "w-full aspect-square rounded-sm flex items-center justify-center text-[9px] relative",
                          !isCurrentMonth && "opacity-20",
                          isCurrentMonth && !mood && "bg-muted/50",
                          isCurrentMonth && mood === 'elevated' && "bg-mood-elevated text-white",
                          isCurrentMonth && mood === 'stable' && "bg-mood-stable text-white",
                          isCurrentMonth && mood === 'depressed' && "bg-mood-depressed text-white",
                          isTodayDate && isCurrentMonth && "ring-1 ring-primary ring-offset-1 ring-offset-background"
                        )}
                      >
                        {isCurrentMonth && day.getDate()}
                        {hasMedication && isCurrentMonth && (
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <Pill className="h-1.5 w-1.5 text-primary" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
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
          <span className="text-xs text-muted-foreground">Medicin</span>
        </div>
      </div>
    </div>
  );
}

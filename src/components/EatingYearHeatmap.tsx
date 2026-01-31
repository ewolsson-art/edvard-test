import { useMemo, useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday, getWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MoodEntry, QualityType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EatingYearHeatmapProps {
  year: number;
  entries: MoodEntry[];
  onPrevYear?: () => void;
  onNextYear?: () => void;
  onMonthClick?: (month: number) => void;
}

const months = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

const weekDays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

export function EatingYearHeatmap({ year, entries, onPrevYear, onNextYear, onMonthClick }: EatingYearHeatmapProps) {
  const [showSecondHalf, setShowSecondHalf] = useState(false);
  
  const eatingMap = useMemo(() => {
    const map: Record<string, QualityType> = {};
    entries.forEach(entry => {
      if (entry.eatingQuality) {
        map[entry.date] = entry.eatingQuality;
      }
    });
    return map;
  }, [entries]);

  const monthsData = useMemo(() => {
    return months.map((monthName, monthIndex) => {
      const monthDate = new Date(year, monthIndex, 1);
      const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });
      
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

  const visibleMonths = showSecondHalf 
    ? monthsData.slice(6, 12) 
    : monthsData.slice(0, 6);

  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevYear}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Föregående år"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl font-semibold">{year}</h3>

        <button
          onClick={onNextYear}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Nästa år"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        <Button
          variant={!showSecondHalf ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSecondHalf(false)}
        >
          Jan – Jun
        </Button>
        <Button
          variant={showSecondHalf ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSecondHalf(true)}
        >
          Jul – Dec
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visibleMonths.map(({ monthName, monthIndex, monthDate, weeks }) => (
          <button
            key={monthIndex}
            onClick={() => onMonthClick?.(monthIndex)}
            className="p-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors text-left cursor-pointer"
          >
            <h4 className="font-medium text-sm mb-2 text-center">{monthName}</h4>
            
            <div className="grid grid-cols-8 gap-0.5 mb-1">
              <div className="text-[10px] text-muted-foreground text-center font-medium">v</div>
              {weekDays.map((day, i) => (
                <div key={i} className="text-[10px] text-muted-foreground text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="space-y-0.5">
              {weeks.map(({ weekNumber, days }) => (
                <div key={weekNumber} className="grid grid-cols-8 gap-0.5">
                  <div className="text-[10px] text-muted-foreground flex items-center justify-center font-medium">
                    {weekNumber}
                  </div>
                  
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const quality = eatingMap[dateStr];
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = isSameMonth(day, monthDate);

                    return (
                      <div
                        key={dateStr}
                        title={isCurrentMonth ? `${format(day, 'd MMMM', { locale: sv })}${quality ? ` - ${quality === 'good' ? 'Bra kost' : 'Dålig kost'}` : ''}` : ''}
                        className={cn(
                          "w-full aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium",
                          !isCurrentMonth && "opacity-0",
                          isCurrentMonth && !quality && "bg-muted/80 text-muted-foreground",
                          isCurrentMonth && quality === 'good' && "bg-mood-stable text-white",
                          isCurrentMonth && quality === 'bad' && "bg-mood-depressed text-white",
                          isTodayDate && isCurrentMonth && "ring-1 ring-primary ring-offset-1 ring-offset-background"
                        )}
                      >
                        {isCurrentMonth && day.getDate()}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-mood-stable" />
          <span className="text-xs text-muted-foreground">Bra kost</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-mood-depressed" />
          <span className="text-xs text-muted-foreground">Dålig kost</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-muted/50" />
          <span className="text-xs text-muted-foreground">Ej registrerat</span>
        </div>
      </div>
    </div>
  );
}

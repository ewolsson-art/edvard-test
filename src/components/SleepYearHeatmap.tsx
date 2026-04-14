import { useMemo, useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday, getWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MoonStar, Moon } from 'lucide-react';
import { MoodEntry, QualityType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SleepYearHeatmapProps {
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

export function SleepYearHeatmap({ year, entries, onPrevYear, onNextYear, onMonthClick }: SleepYearHeatmapProps) {
  const [showSecondHalf, setShowSecondHalf] = useState(false);
  
  const sleepMap = useMemo(() => {
    const map: Record<string, QualityType> = {};
    entries.forEach(entry => {
      if (entry.sleepQuality) {
        map[entry.date] = entry.sleepQuality;
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {visibleMonths.map(({ monthName, monthIndex, monthDate, weeks }) => (
          <button
            key={monthIndex}
            onClick={() => onMonthClick?.(monthIndex)}
            className="p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors text-left cursor-pointer"
          >
            <h4 className="font-medium text-sm mb-3 text-center">{monthName}</h4>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => (
                <div key={i} className="text-[10px] text-muted-foreground text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="space-y-1">
              {weeks.map(({ weekNumber, days }) => (
                <div key={weekNumber} className="grid grid-cols-7 gap-1">
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const quality = sleepMap[dateStr];
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = isSameMonth(day, monthDate);

                    return (
                      <div
                        key={dateStr}
                        title={isCurrentMonth ? `${format(day, 'd MMMM', { locale: sv })}${quality ? ` - ${quality === 'good' ? 'Bra sömn' : 'Dålig sömn'}` : ''}` : ''}
                        className={cn(
                          "w-full aspect-square rounded-sm",
                          !isCurrentMonth && "opacity-0",
                          isCurrentMonth && !quality && "bg-muted/80",
                          isCurrentMonth && quality === 'good' && "bg-mood-stable",
                          isCurrentMonth && quality === 'bad' && "bg-mood-depressed",
                          isTodayDate && isCurrentMonth && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        )}
                      />
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
          <span className="text-xs text-muted-foreground">Bra sömn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-mood-depressed" />
          <span className="text-xs text-muted-foreground">Dålig sömn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-muted/50" />
          <span className="text-xs text-muted-foreground">Ej registrerat</span>
        </div>
      </div>
    </div>
  );
}

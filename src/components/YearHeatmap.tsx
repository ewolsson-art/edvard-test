import { useMemo, memo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface YearHeatmapProps {
  year: number;
  entries: MoodEntry[];
  medicationDates?: string[];
  onPrevYear?: () => void;
  onNextYear?: () => void;
  onMonthClick?: (month: number) => void;
}

const monthNames = [
  'Januari', 'Februari', 'Mars',
  'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September',
  'Oktober', 'November', 'December'
];

const dayHeaders = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

export const YearHeatmap = memo(function YearHeatmap({ year, entries, medicationDates = [], onPrevYear, onNextYear, onMonthClick }: YearHeatmapProps) {
  const moodMap = useMemo(() => {
    const map: Record<string, MoodType> = {};
    entries.forEach(entry => {
      map[entry.date] = entry.mood;
    });
    return map;
  }, [entries]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;

  // Build month grids
  const monthGrids = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const start = startOfMonth(new Date(year, monthIdx, 1));
      const end = endOfMonth(new Date(year, monthIdx, 1));
      const days = eachDayOfInterval({ start, end });

      // Day of week for the 1st (0=Mon in our system)
      let firstDow = getDay(start);
      firstDow = firstDow === 0 ? 6 : firstDow - 1;

      // Build weeks array
      const weeks: (Date | null)[][] = [];
      let currentWeek: (Date | null)[] = Array(firstDow).fill(null);

      days.forEach(day => {
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
        currentWeek.push(day);
      });

      // Pad last week
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);

      return { monthIdx, weeks };
    });
  }, [year]);

  return (
    <div className="fade-in">
      {/* Year header - Apple style */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onPrevYear}
          className="flex items-center gap-1 text-primary hover:opacity-70 transition-opacity"
          aria-label="Föregående år"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-3xl font-bold text-primary">{year}</h2>
        {year < currentYear + 5 && (
          <button
            onClick={onNextYear}
            className="text-primary hover:opacity-70 transition-opacity rotate-180"
            aria-label="Nästa år"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="border-t border-border/50 mb-6" />

      {/* 3-column month grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-8">
        {monthGrids.map(({ monthIdx, weeks }) => {
          const isActive = isCurrentYear && monthIdx === currentMonth;

          return (
            <div
              key={monthIdx}
              className="cursor-pointer group"
              onClick={() => onMonthClick?.(monthIdx)}
            >
              {/* Month name */}
              <h3 className={cn(
                "text-sm font-semibold mb-2 transition-colors",
                isActive ? "text-primary" : "text-foreground group-hover:text-primary"
              )}>
                {monthNames[monthIdx]}
              </h3>

              {/* Day headers - hidden to save space, Apple doesn't show them in year view */}

              {/* Day grid */}
              <div className="space-y-0">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7">
                    {week.map((day, dIdx) => {
                      if (!day) {
                        return <div key={`empty-${dIdx}`} className="w-full aspect-square" />;
                      }

                      const dateStr = format(day, 'yyyy-MM-dd');
                      const mood = moodMap[dateStr];
                      const isTodayDate = isToday(day);

                      return (
                        <div
                          key={dateStr}
                          className="flex items-center justify-center"
                          {...(isTodayDate ? { 'data-today': 'true' } : {})}
                        >
                          <span className={cn(
                            "flex items-center justify-center text-[10px] w-5 h-5 rounded-full leading-none font-medium",
                            isTodayDate && "bg-primary text-primary-foreground font-bold",
                            !isTodayDate && mood === 'severe_elevated' && "bg-[hsl(45_95%_55%/0.85)] text-white",
                            !isTodayDate && (mood === 'elevated' || mood === 'somewhat_elevated') && "bg-[hsl(45_95%_55%/0.5)] text-white",
                            !isTodayDate && mood === 'stable' && "bg-[hsl(142_70%_45%/0.5)] text-white",
                            !isTodayDate && (mood === 'depressed' || mood === 'somewhat_depressed') && "bg-[hsl(0_75%_55%/0.5)] text-white",
                            !isTodayDate && mood === 'severe_depressed' && "bg-[hsl(0_75%_55%/0.85)] text-white",
                            !isTodayDate && !mood && "text-muted-foreground/70"
                          )}>
                            {day.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-8 pt-4 border-t border-border/30 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-mood-elevated" />
          <span className="text-[11px] text-muted-foreground">Uppvarvad</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-mood-stable" />
          <span className="text-[11px] text-muted-foreground">Stabil</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-mood-depressed" />
          <span className="text-[11px] text-muted-foreground">Nedstämd</span>
        </div>
      </div>
    </div>
  );
});

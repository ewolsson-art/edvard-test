import { useMemo, memo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { useDateLocale } from '@/lib/dateLocale';
import { ChevronLeft } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { TurtleLogo } from '@/components/TurtleLogo';
import { getTurtleMoodForMood } from '@/lib/moodTurtle';

interface YearHeatmapProps {
  year: number;
  entries: MoodEntry[];
  medicationDates?: string[];
  onPrevYear?: () => void;
  onNextYear?: () => void;
  onMonthClick?: (month: number) => void;
}


export const YearHeatmap = memo(function YearHeatmap({ year, entries, medicationDates = [], onPrevYear, onNextYear, onMonthClick }: YearHeatmapProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const dayHeaders = t('overview.weekDayHeaders', { returnObjects: true }) as string[];
  const monthNames = useMemo(
    () => Array.from({ length: 12 }, (_, i) => {
      const name = format(new Date(year, i, 1), 'LLLL', { locale: dateLocale });
      return name.charAt(0).toUpperCase() + name.slice(1);
    }),
    [dateLocale, year]
  );

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
    <div className="fade-in mx-auto max-w-5xl">
      {/* Year header — Apple Calendar style */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onPrevYear}
          className="flex items-center justify-center h-9 w-9 -ml-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
          aria-label="Föregående år"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-3xl font-bold text-primary tracking-tight">{year}</h2>
        {year < currentYear + 5 && (
          <button
            onClick={onNextYear}
            className="flex items-center justify-center h-9 w-9 rounded-full text-primary hover:bg-primary/10 transition-colors rotate-180"
            aria-label="Nästa år"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="border-t border-border/40 mb-6" />

      {/* Responsive month grid: 1 col on phone, 2 on tablet, 3 on desktop, 4 on wide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-7">
        {monthGrids.map(({ monthIdx, weeks }) => {
          const isActive = isCurrentYear && monthIdx === currentMonth;

          return (
            <div
              key={monthIdx}
              className="cursor-pointer group select-none"
              onClick={() => onMonthClick?.(monthIdx)}
            >
              {/* Month name — refined hierarchy */}
              <h3 className={cn(
                "text-[13px] font-semibold mb-2 tracking-wide transition-colors",
                isActive ? "text-primary" : "text-foreground/90 group-hover:text-primary"
              )}>
                {monthNames[monthIdx]}
              </h3>

              {/* Weekday header row — quiet orientation aid */}
              <div className="grid grid-cols-7 mb-1.5">
                {dayHeaders.map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid — tight, uniform, capped tile size */}
              <div className="space-y-[2px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 gap-[2px]">
                    {week.map((day, dIdx) => {
                      if (!day) {
                        return <div key={`empty-${dIdx}`} className="w-full aspect-square" />;
                      }

                      const dateStr = format(day, 'yyyy-MM-dd');
                      const mood = moodMap[dateStr];
                      const isTodayDate = isToday(day);
                      const tm = getTurtleMoodForMood(mood);
                      const isUp = tm === 'elevated' || tm === 'severe_elevated' || tm === 'somewhat_elevated';
                      const isDown = tm === 'depressed' || tm === 'severe_depressed' || tm === 'somewhat_depressed';
                      const isStable = tm === 'stable';
                      // Solid soft-saturation tiles — strong enough to read at a glance, quiet enough to not shout
                      const moodBg = isUp
                        ? 'bg-[hsl(45_92%_55%/0.7)]'
                        : isDown
                          ? 'bg-[hsl(0_75%_52%/0.7)]'
                          : isStable
                            ? 'bg-[hsl(142_60%_42%/0.7)]'
                            : '';

                      return (
                        <div
                          key={dateStr}
                          className="flex items-center justify-center"
                          {...(isTodayDate ? { 'data-today': 'true' } : {})}
                        >
                          <span className={cn(
                            "relative flex items-center justify-center w-full aspect-square max-w-[34px] rounded-md leading-none font-medium tabular-nums transition-transform group-hover:scale-[1.01]",
                            moodBg,
                            isTodayDate && !mood && "ring-2 ring-primary",
                            isTodayDate && mood && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                            !mood && "text-[10px] text-muted-foreground/55"
                          )}>
                            {mood ? (
                              <TurtleLogo size="sm" animated={false} mood={tm} framing="face" className="h-[78%] w-[78%]" />
                            ) : (
                              day.getDate()
                            )}
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

      {/* Legend — compact, centered, secondary */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-10 pt-5 border-t border-border/30 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[hsl(45_92%_55%/0.7)]" />
          <span className="text-[11px] text-muted-foreground">Uppvarvad</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[hsl(142_60%_42%/0.7)]" />
          <span className="text-[11px] text-muted-foreground">Stabil</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[hsl(0_75%_52%/0.7)]" />
          <span className="text-[11px] text-muted-foreground">Nedstämd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] border border-border/50" />
          <span className="text-[11px] text-muted-foreground">Ingen check-in</span>
        </div>
      </div>
    </div>
  );
});

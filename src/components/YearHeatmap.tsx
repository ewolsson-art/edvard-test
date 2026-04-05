import { useMemo } from 'react';
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, getWeek, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface YearHeatmapProps {
  year: number;
  entries: MoodEntry[];
  medicationDates?: string[];
  onPrevYear?: () => void;
  onNextYear?: () => void;
  onMonthClick?: (month: number) => void;
}

const dayLabels = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export function YearHeatmap({ year, entries, medicationDates = [], onPrevYear, onNextYear, onMonthClick }: YearHeatmapProps) {
  const moodMap = useMemo(() => {
    const map: Record<string, MoodType> = {};
    entries.forEach(entry => {
      map[entry.date] = entry.mood;
    });
    return map;
  }, [entries]);

  const medicationSet = useMemo(() => new Set(medicationDates), [medicationDates]);

  // Build a grid: 7 rows (Mon–Sun) × 53 columns (weeks)
  const { grid, monthPositions } = useMemo(() => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 0, 1));
    const allDays = eachDayOfInterval({ start, end });

    // Grid: weekIndex → dayOfWeek → date
    const weekMap: Map<number, (Date | null)[]> = new Map();
    const monthFirstWeek: Map<number, number> = new Map();

    allDays.forEach(day => {
      // getDay: 0=Sun, we want 0=Mon
      let dow = getDay(day);
      dow = dow === 0 ? 6 : dow - 1; // Mon=0, Sun=6

      const weekNum = getWeek(day, { weekStartsOn: 1, firstWeekContainsDate: 4 });
      // Use a sequential week index based on position in year
      const weekIndex = Math.floor((day.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (!weekMap.has(weekIndex)) {
        weekMap.set(weekIndex, Array(7).fill(null));
      }
      weekMap.get(weekIndex)![dow] = day;

      // Track first week of each month
      const month = day.getMonth();
      if (!monthFirstWeek.has(month)) {
        monthFirstWeek.set(month, weekIndex);
      }
    });

    // Convert to sorted array
    const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) => a[0] - b[0]);
    const gridData = sortedWeeks.map(([_, days]) => days);

    // Month label positions (column index)
    const positions: { month: number; col: number }[] = [];
    monthFirstWeek.forEach((weekIdx, month) => {
      const col = sortedWeeks.findIndex(([k]) => k === weekIdx);
      if (col >= 0) positions.push({ month, col });
    });
    positions.sort((a, b) => a.col - b.col);

    return { grid: gridData, monthPositions: positions };
  }, [year]);

  const cellSize = 11;
  const cellGap = 2;
  const dayLabelWidth = 20;
  const headerHeight = 18;
  const totalWidth = dayLabelWidth + grid.length * (cellSize + cellGap);
  const totalHeight = headerHeight + 7 * (cellSize + cellGap);

  return (
    <div className="glass-card p-4 sm:p-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Heatmap */}
      <ScrollArea className="w-full">
        <div style={{ minWidth: totalWidth + 8 }} className="pb-2">
          <svg
            width={totalWidth + 8}
            height={totalHeight + 4}
            className="block"
          >
            {/* Month labels */}
            {monthPositions.map(({ month, col }) => (
              <text
                key={month}
                x={dayLabelWidth + col * (cellSize + cellGap)}
                y={12}
                className="fill-muted-foreground"
                fontSize={10}
                fontWeight={500}
                style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
                onClick={() => onMonthClick?.(month)}
              >
                {monthLabels[month]}
              </text>
            ))}

            {/* Day labels (Mon, Wed, Fri) */}
            {[0, 2, 4].map(row => (
              <text
                key={row}
                x={0}
                y={headerHeight + row * (cellSize + cellGap) + cellSize - 1}
                className="fill-muted-foreground"
                fontSize={9}
                fontWeight={500}
              >
                {dayLabels[row]}
              </text>
            ))}

            {/* Grid cells */}
            {grid.map((week, colIdx) =>
              week.map((day, rowIdx) => {
                if (!day) return null;
                const dateStr = format(day, 'yyyy-MM-dd');
                const mood = moodMap[dateStr];
                const hasMed = medicationSet.has(dateStr);
                const isT = isToday(day);
                const x = dayLabelWidth + colIdx * (cellSize + cellGap);
                const y = headerHeight + rowIdx * (cellSize + cellGap);

                let fill = 'hsl(var(--muted))';
                if (mood === 'elevated') fill = 'hsl(var(--mood-elevated))';
                else if (mood === 'stable') fill = 'hsl(var(--mood-stable))';
                else if (mood === 'depressed') fill = 'hsl(var(--mood-depressed))';

                return (
                  <g key={dateStr}>
                    <rect
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx={2}
                      fill={fill}
                      opacity={mood ? 1 : 0.4}
                      style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
                      onClick={() => onMonthClick?.(day.getMonth())}
                    >
                      <title>{`${format(day, 'd MMMM', { locale: sv })}${mood ? ` – ${mood === 'elevated' ? 'Uppvarvad' : mood === 'stable' ? 'Stabil' : 'Nedstämd'}` : ''}${hasMed ? ' 💊' : ''}`}</title>
                    </rect>
                    {isT && (
                      <rect
                        x={x - 1}
                        y={y - 1}
                        width={cellSize + 2}
                        height={cellSize + 2}
                        rx={3}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth={1.5}
                      />
                    )}
                    {hasMed && (
                      <circle
                        cx={x + cellSize - 1}
                        cy={y + cellSize - 1}
                        r={2}
                        fill="hsl(var(--primary))"
                      />
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-mood-elevated" />
          <span className="text-[11px] text-muted-foreground">Uppvarvad</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-mood-stable" />
          <span className="text-[11px] text-muted-foreground">Stabil</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-mood-depressed" />
          <span className="text-[11px] text-muted-foreground">Nedstämd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted opacity-40" />
          <span className="text-[11px] text-muted-foreground">Ej registrerat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill className="h-3 w-3 text-primary" />
          <span className="text-[11px] text-muted-foreground">Medicin</span>
        </div>
      </div>
    </div>
  );
}

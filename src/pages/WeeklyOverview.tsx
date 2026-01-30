import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMoodData } from '@/hooks/useMoodData';
import { MoodStats } from '@/components/MoodStats';
import { MOOD_LABELS, MOOD_ICONS, MoodStats as MoodStatsType } from '@/types/mood';
import { cn } from '@/lib/utils';

const WeeklyOverview = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { isLoaded, getEntryForDate } = useMoodData();

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const weekStats = useMemo((): MoodStatsType => {
    let elevated = 0, stable = 0, depressed = 0;
    weekDays.forEach(day => {
      const entry = getEntryForDate(format(day, 'yyyy-MM-dd'));
      if (entry?.mood === 'elevated') elevated++;
      if (entry?.mood === 'stable') stable++;
      if (entry?.mood === 'depressed') depressed++;
    });
    return { elevated, stable, depressed, total: elevated + stable + depressed };
  }, [weekDays, getEntryForDate]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'd MMM', { locale: sv })} – ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Veckoöversikt
          </h1>
          <p className="text-muted-foreground">
            Se hur du mått under veckan
          </p>
        </header>

        <MoodStats stats={weekStats} periodLabel={weekLabel} />

        <div className="glass-card p-6 fade-in">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentWeek(prev => subWeeks(prev, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Föregående vecka"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h3 className="font-display text-xl font-semibold capitalize">
              {weekLabel}
            </h3>
            
            <button
              onClick={() => setCurrentWeek(prev => addWeeks(prev, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Nästa vecka"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {weekDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const entry = getEntryForDate(dateStr);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                    isTodayDate && "ring-2 ring-primary/30",
                    entry?.mood === 'elevated' && "bg-mood-elevated/10 border-mood-elevated/30",
                    entry?.mood === 'stable' && "bg-mood-stable/10 border-mood-stable/30",
                    entry?.mood === 'depressed' && "bg-mood-depressed/10 border-mood-depressed/30",
                    !entry && "bg-muted/30 border-border"
                  )}
                >
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-xs text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: sv })}
                    </span>
                    <span className={cn(
                      "text-2xl font-bold",
                      isTodayDate && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="flex-1">
                    {entry ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{MOOD_ICONS[entry.mood]}</span>
                        <span className="font-medium">{MOOD_LABELS[entry.mood]}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Ingen incheckning</span>
                    )}
                    {entry?.comment && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {entry.comment}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOverview;

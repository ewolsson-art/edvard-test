import { MoodStats as MoodStatsType, MOOD_LABELS } from '@/types/mood';
import { Zap, Sun, CloudRain, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoodStatsProps {
  stats: MoodStatsType;
  year: number;
}

export function MoodStats({ stats, year }: MoodStatsProps) {
  const statCards = [
    {
      mood: 'elevated' as const,
      icon: Zap,
      count: stats.elevated,
      bgClass: 'bg-mood-elevated-light',
      textClass: 'text-mood-elevated',
      label: MOOD_LABELS.elevated,
    },
    {
      mood: 'stable' as const,
      icon: Sun,
      count: stats.stable,
      bgClass: 'bg-mood-stable-light',
      textClass: 'text-mood-stable',
      label: MOOD_LABELS.stable,
    },
    {
      mood: 'depressed' as const,
      icon: CloudRain,
      count: stats.depressed,
      bgClass: 'bg-mood-depressed-light',
      textClass: 'text-mood-depressed',
      label: MOOD_LABELS.depressed,
    },
  ];

  const percentage = (count: number) => {
    if (stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-display text-xl font-semibold">
          Statistik {year}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ mood, icon: Icon, count, bgClass, textClass, label }) => (
          <div
            key={mood}
            className={cn("stat-card text-center", bgClass)}
          >
            <Icon className={cn("w-6 h-6 mx-auto mb-2", textClass)} />
            <p className={cn("text-3xl font-bold", textClass)}>{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            <p className="text-xs text-muted-foreground">
              {percentage(count)}%
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {statCards.map(({ mood, count, label }) => (
          <div key={mood} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{count} dagar</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  mood === 'elevated' && "bg-mood-elevated",
                  mood === 'stable' && "bg-mood-stable",
                  mood === 'depressed' && "bg-mood-depressed"
                )}
                style={{ width: `${percentage(count)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Totalt registrerade dagar</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
      </div>
    </div>
  );
}

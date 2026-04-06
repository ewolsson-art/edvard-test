import { MoodStats as MoodStatsType, MOOD_LABELS } from '@/types/mood';
import { Flame, Zap, Sun, Cloud, CloudRain, Calendar, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoodStatsProps {
  stats: MoodStatsType;
  periodLabel: string;
}

export function MoodStats({ stats, periodLabel }: MoodStatsProps) {
  const statCards = [
    {
      key: 'elevated',
      icon: Flame,
      count: stats.elevated,
      bgClass: 'bg-mood-elevated-light',
      textClass: 'text-mood-elevated',
      barClass: 'bg-mood-elevated',
      label: MOOD_LABELS.elevated,
    },
    {
      key: 'somewhat_elevated',
      icon: Zap,
      count: stats.somewhat_elevated,
      bgClass: 'bg-mood-somewhat-elevated-light',
      textClass: 'text-mood-somewhat-elevated',
      barClass: 'bg-mood-somewhat-elevated',
      label: MOOD_LABELS.somewhat_elevated,
    },
    {
      key: 'stable',
      icon: Sun,
      count: stats.stable,
      bgClass: 'bg-mood-stable-light',
      textClass: 'text-mood-stable',
      barClass: 'bg-mood-stable',
      label: MOOD_LABELS.stable,
    },
    {
      key: 'somewhat_depressed',
      icon: Cloud,
      count: stats.somewhat_depressed,
      bgClass: 'bg-mood-somewhat-depressed-light',
      textClass: 'text-mood-somewhat-depressed',
      barClass: 'bg-mood-somewhat-depressed',
      label: MOOD_LABELS.somewhat_depressed,
    },
    {
      key: 'depressed',
      icon: CloudRain,
      count: stats.depressed,
      bgClass: 'bg-mood-depressed-light',
      textClass: 'text-mood-depressed',
      barClass: 'bg-mood-depressed',
      label: MOOD_LABELS.depressed,
    },
    {
      key: 'unregistered',
      icon: HelpCircle,
      count: stats.unregistered,
      bgClass: 'bg-muted',
      textClass: 'text-muted-foreground',
      barClass: 'bg-muted-foreground/50',
      label: 'Ej registrerat',
    },
  ];

  const percentage = (count: number) => {
    if (stats.totalDays === 0) return 0;
    return Math.round((count / stats.totalDays) * 100);
  };

  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-display text-xl font-semibold">
          Statistik – {periodLabel}
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {statCards.map(({ key, icon: Icon, count, bgClass, textClass, label }) => (
          <div
            key={key}
            className={cn("stat-card text-center p-3", bgClass)}
          >
            <Icon className={cn("w-4 h-4 mx-auto mb-1", textClass)} />
            <p className={cn("text-xl font-bold", textClass)}>{count}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
            <p className="text-[10px] text-muted-foreground">
              {percentage(count)}%
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {statCards.map(({ key, count, label, barClass }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{count} dagar</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barClass)}
                style={{ width: `${percentage(count)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Totalt registrerade dagar</span>
          <span className="font-semibold">{stats.total} av {stats.totalDays}</span>
        </div>
      </div>
    </div>
  );
}

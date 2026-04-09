import { MoodStats as MoodStatsType, MOOD_LABELS } from '@/types/mood';
import { cn } from '@/lib/utils';

interface MoodStatsProps {
  stats: MoodStatsType;
  periodLabel: string;
}

export function MoodStats({ stats, periodLabel }: MoodStatsProps) {
  const statRows = [
    { key: 'elevated', count: stats.elevated, barClass: 'bg-mood-elevated/60', label: MOOD_LABELS.elevated },
    { key: 'somewhat_elevated', count: stats.somewhat_elevated, barClass: 'bg-mood-somewhat-elevated/60', label: MOOD_LABELS.somewhat_elevated },
    { key: 'stable', count: stats.stable, barClass: 'bg-mood-stable/60', label: MOOD_LABELS.stable },
    { key: 'somewhat_depressed', count: stats.somewhat_depressed, barClass: 'bg-mood-somewhat-depressed/60', label: MOOD_LABELS.somewhat_depressed },
    { key: 'depressed', count: stats.depressed, barClass: 'bg-mood-depressed/60', label: MOOD_LABELS.depressed },
    { key: 'unregistered', count: stats.unregistered, barClass: 'bg-muted-foreground/20', label: 'Ej registrerat' },
  ];

  const percentage = (count: number) => {
    if (stats.totalDays === 0) return 0;
    return Math.round((count / stats.totalDays) * 100);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground/60 font-medium">
        Statistik – {periodLabel}
      </p>

      <div className="space-y-2.5">
        {statRows.map(({ key, count, label, barClass }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground/70">{label}</span>
              <span className="text-muted-foreground/50 tabular-nums">{count}</span>
            </div>
            <div className="h-1.5 bg-foreground/[0.04] rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barClass)}
                style={{ width: `${percentage(count)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border/20">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground/50">Registrerade dagar</span>
          <span className="text-muted-foreground/70 tabular-nums">{stats.total} av {stats.totalDays}</span>
        </div>
      </div>
    </div>
  );
}

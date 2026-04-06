import { MoodStats as MoodStatsType, MOOD_LABELS } from '@/types/mood';
import { cn } from '@/lib/utils';

interface MoodDistributionBarProps {
  stats: MoodStatsType;
  periodLabel: string;
}

const segments = [
  { key: 'elevated' as const, colorClass: 'bg-mood-elevated', label: MOOD_LABELS.elevated },
  { key: 'somewhat_elevated' as const, colorClass: 'bg-mood-somewhat-elevated', label: MOOD_LABELS.somewhat_elevated },
  { key: 'stable' as const, colorClass: 'bg-mood-stable', label: MOOD_LABELS.stable },
  { key: 'somewhat_depressed' as const, colorClass: 'bg-mood-somewhat-depressed', label: MOOD_LABELS.somewhat_depressed },
  { key: 'depressed' as const, colorClass: 'bg-mood-depressed', label: MOOD_LABELS.depressed },
  { key: 'unregistered' as const, colorClass: 'bg-muted-foreground/25', label: 'Ej registrerat' },
];

export function MoodDistributionBar({ stats, periodLabel }: MoodDistributionBarProps) {
  const totalDays = stats.totalDays || 1;
  
  const data = segments.map(seg => ({
    ...seg,
    count: seg.key === 'unregistered' ? stats.unregistered : stats[seg.key],
    pct: Math.round(((seg.key === 'unregistered' ? stats.unregistered : stats[seg.key]) / totalDays) * 100),
  })).filter(d => d.count > 0);

  return (
    <div className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fördelning</h2>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{periodLabel}</span>
      </div>

      {/* Horizontal stacked bar */}
      <div className="h-8 rounded-full overflow-hidden flex bg-muted/30">
        {data.map(({ key, colorClass, pct }) => (
          pct > 0 && (
            <div
              key={key}
              className={cn("h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full", colorClass)}
              style={{ width: `${Math.max(pct, 2)}%` }}
              title={`${segments.find(s => s.key === key)?.label}: ${pct}%`}
            />
          )
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {data.map(({ key, colorClass, label, count, pct }) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div className={cn("w-2.5 h-2.5 rounded-full", colorClass)} />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{count}d</span>
            <span className="text-muted-foreground/60">({pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

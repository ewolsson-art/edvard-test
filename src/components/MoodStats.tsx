import { MoodStats as MoodStatsType, MOOD_LABELS } from '@/types/mood';

interface MoodStatsProps {
  stats: MoodStatsType;
  periodLabel: string;
}

export function MoodStats({ stats, periodLabel }: MoodStatsProps) {
  const statRows = [
    { key: 'elevated', count: stats.elevated, label: MOOD_LABELS.elevated },
    { key: 'somewhat_elevated', count: stats.somewhat_elevated, label: MOOD_LABELS.somewhat_elevated },
    { key: 'stable', count: stats.stable, label: MOOD_LABELS.stable },
    { key: 'somewhat_depressed', count: stats.somewhat_depressed, label: MOOD_LABELS.somewhat_depressed },
    { key: 'depressed', count: stats.depressed, label: MOOD_LABELS.depressed },
    { key: 'unregistered', count: stats.unregistered, label: 'Ej registrerat' },
  ];

  const pluralize = (count: number) => count === 1 ? 'dag' : 'dagar';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground/40 font-medium uppercase tracking-wider">
        Statistik · {periodLabel}
      </p>

      <div className="space-y-1">
        {statRows.filter(r => r.count > 0).map(({ key, count, label }) => (
          <div key={key} className="flex justify-between py-1">
            <span className="text-sm text-muted-foreground/60">{label}</span>
            <span className="text-sm text-foreground/50 tabular-nums">{count} {pluralize(count)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground/30 pt-1">
        <span>Registrerat</span>
        <span className="tabular-nums">{stats.total} av {stats.totalDays}</span>
      </div>
    </div>
  );
}

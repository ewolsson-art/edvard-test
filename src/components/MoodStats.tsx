import { MoodStats as MoodStatsType, MoodType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { useTranslation } from 'react-i18next';

interface MoodStatsProps {
  stats: MoodStatsType;
  periodLabel: string;
  customLabels?: Record<MoodType, string>;
}

export function MoodStats({ stats, periodLabel, customLabels }: MoodStatsProps) {
  const { t } = useTranslation();
  const { moodLabels } = useDiagnosisConfig();
  const labels = customLabels || moodLabels;

  const statRows = [
    { key: 'severe_elevated', count: stats.severe_elevated, label: labels.severe_elevated },
    { key: 'elevated', count: stats.elevated, label: labels.elevated },
    { key: 'somewhat_elevated', count: stats.somewhat_elevated, label: labels.somewhat_elevated },
    { key: 'stable', count: stats.stable, label: labels.stable },
    { key: 'somewhat_depressed', count: stats.somewhat_depressed, label: labels.somewhat_depressed },
    { key: 'depressed', count: stats.depressed, label: labels.depressed },
    { key: 'severe_depressed', count: stats.severe_depressed, label: labels.severe_depressed },
    { key: 'unregistered', count: stats.unregistered, label: t('moodStats.unregistered') },
  ];

  const pluralize = (count: number) => count === 1 ? t('common.day') : t('common.days');

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground/40 font-medium uppercase tracking-wider">
        {t('moodStats.statsLabel', { period: periodLabel })}
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
        <span>{t('moodStats.registered')}</span>
        <span className="tabular-nums">{stats.total} {t('moodStats.of')} {stats.totalDays}</span>
      </div>
    </div>
  );
}

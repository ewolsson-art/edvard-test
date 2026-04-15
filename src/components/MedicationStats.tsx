import { Pill, Check, X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface MedicationStatsType {
  taken: number;
  notTaken: number;
  unregistered: number;
  total: number;
  totalDays: number;
}

interface MedicationStatsProps {
  stats: MedicationStatsType;
  periodLabel: string;
}

export function MedicationStats({ stats, periodLabel }: MedicationStatsProps) {
  const statCards = [
    {
      key: 'taken',
      icon: Check,
      count: stats.taken,
      bgClass: 'bg-mood-stable-light',
      textClass: 'text-mood-stable',
      barClass: 'bg-mood-stable',
      label: 'Tagen',
    },
    {
      key: 'notTaken',
      icon: X,
      count: stats.notTaken,
      bgClass: 'bg-mood-depressed-light',
      textClass: 'text-mood-depressed',
      barClass: 'bg-mood-depressed',
      label: 'Ej tagen',
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
  const { t } = useTranslation();
    if (stats.totalDays === 0) return 0;
    return Math.round((count / stats.totalDays) * 100);
  };

  const takenRate = stats.total > 0 
    ? Math.round((stats.taken / stats.total) * 100) 
    : 0;

  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Pill className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-display text-xl font-semibold">
          Medicin – {periodLabel}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map(({ key, icon: Icon, count, bgClass, textClass, label }) => (
          <div
            key={key}
            className={cn("stat-card text-center p-4", bgClass)}
          >
            <Icon className={cn("w-5 h-5 mx-auto mb-2", textClass)} />
            <p className={cn("text-2xl font-bold", textClass)}>{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            <p className="text-xs text-muted-foreground">
              {percentage(count)}%
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
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
          <span className="text-muted-foreground">Följsamhet (av registrerade)</span>
          <span className="font-semibold">{takenRate}%</span>
        </div>
      </div>
    </div>
  );
}

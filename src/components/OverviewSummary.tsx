import { useMemo } from 'react';
import { MoodStats as MoodStatsType, MoodEntry } from '@/types/mood';
import { Activity, CalendarCheck, Pill, Moon } from 'lucide-react';

interface OverviewSummaryProps {
  stats: MoodStatsType;
  entries: MoodEntry[];
  periodLabel: string;
  medicationPercentage: number;
  sleepBadDays: number;
  showMedication: boolean;
  showSleep: boolean;
}

export function OverviewSummary({
  stats,
  periodLabel,
  medicationPercentage,
  sleepBadDays,
  showMedication,
  showSleep,
}: OverviewSummaryProps) {
  const dominantMood = useMemo(() => {
    const moods = [
      { key: 'elevated' as const, count: stats.elevated, label: 'Mycket upp' },
      { key: 'somewhat_elevated' as const, count: stats.somewhat_elevated, label: 'Upp' },
      { key: 'stable' as const, count: stats.stable, label: 'Stabil' },
      { key: 'somewhat_depressed' as const, count: stats.somewhat_depressed, label: 'Låg' },
      { key: 'depressed' as const, count: stats.depressed, label: 'Mycket låg' },
    ].filter(m => m.count > 0);
    
    if (moods.length === 0) return null;
    return moods.sort((a, b) => b.count - a.count)[0];
  }, [stats]);

  const registrationRate = stats.totalDays > 0 
    ? Math.round((stats.total / stats.totalDays) * 100) 
    : 0;

  return (
    <div className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sammanfattning</h2>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{periodLabel}</span>
      </div>

      {dominantMood && (
        <p className="text-sm text-muted-foreground">
          {dominantMood.label} dominerar ({dominantMood.count} dagar)
        </p>
      )}

      {/* Key metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={CalendarCheck}
          value={`${stats.total}/${stats.totalDays}`}
          label="Registrerade"
          sublabel={`${registrationRate}%`}
        />
        <MetricCard
          icon={Activity}
          value={`${stats.stable}`}
          label="Stabila dagar"
        />
        {showSleep && sleepBadDays > 0 && (
          <MetricCard
            icon={Moon}
            value={`${sleepBadDays}`}
            label="Dålig sömn"
            warning
          />
        )}
        {showMedication && (
          <MetricCard
            icon={Pill}
            value={`${medicationPercentage}%`}
            label="Medicin tagen"
          />
        )}
      </div>
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  value, 
  label, 
  sublabel,
  warning,
}: { 
  icon: typeof Activity; 
  value: string; 
  label: string; 
  sublabel?: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card/50 border border-border/30 p-3 space-y-1">
      <Icon className={`w-4 h-4 ${warning ? 'text-mood-somewhat-depressed' : 'text-muted-foreground'}`} />
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground/70">{sublabel}</p>}
    </div>
  );
}

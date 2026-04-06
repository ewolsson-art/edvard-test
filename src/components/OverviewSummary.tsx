import { useMemo } from 'react';
import { MoodStats as MoodStatsType, MoodEntry, MOOD_LABELS } from '@/types/mood';
import { Activity, CalendarCheck, Pill, Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  entries,
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

  // Determine trend from recent entries
  const trend = useMemo(() => {
    if (entries.length < 3) return 'neutral';
    const recent = entries.slice(-7);
    const moodValues: Record<string, number> = {
      depressed: 1, somewhat_depressed: 2, stable: 3, somewhat_elevated: 4, elevated: 5,
    };
    const recentAvg = recent.reduce((sum, e) => sum + (moodValues[e.mood] || 3), 0) / recent.length;
    const olderEntries = entries.slice(-14, -7);
    if (olderEntries.length === 0) return 'neutral';
    const olderAvg = olderEntries.reduce((sum, e) => sum + (moodValues[e.mood] || 3), 0) / olderEntries.length;
    
    if (recentAvg > olderAvg + 0.5) return 'up';
    if (recentAvg < olderAvg - 0.5) return 'down';
    return 'neutral';
  }, [entries]);

  const registrationRate = stats.totalDays > 0 
    ? Math.round((stats.total / stats.totalDays) * 100) 
    : 0;

  const trendText = trend === 'up' 
    ? 'Uppåtgående trend' 
    : trend === 'down' 
    ? 'Nedåtgående trend' 
    : 'Stabil trend';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' 
    ? 'text-mood-somewhat-elevated' 
    : trend === 'down' 
    ? 'text-mood-somewhat-depressed' 
    : 'text-mood-stable';

  return (
    <div className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sammanfattning</h2>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{periodLabel}</span>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-card border border-border/50`}>
          <TrendIcon className={`w-4.5 h-4.5 ${trendColor}`} />
        </div>
        <div>
          <p className={`text-sm font-medium ${trendColor}`}>{trendText}</p>
          {dominantMood && (
            <p className="text-xs text-muted-foreground">
              {dominantMood.label} dominerar ({dominantMood.count} dagar)
            </p>
          )}
        </div>
      </div>

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

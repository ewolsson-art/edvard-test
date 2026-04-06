import { useMemo } from 'react';
import { MoodStats as MoodStatsType, MoodEntry, MOOD_LABELS, MOOD_ICONS } from '@/types/mood';
import { CalendarCheck, Pill, Moon, Repeat, Clock } from 'lucide-react';

interface OverviewSummaryProps {
  stats: MoodStatsType;
  entries: MoodEntry[];
  periodLabel: string;
  sleepBadDays: number;
  showSleep: boolean;
}

export function OverviewSummary({
  stats,
  entries,
  periodLabel,
  sleepBadDays,
  showSleep,
}: OverviewSummaryProps) {
  // Current streak: how many consecutive days in the same mood state (from most recent)
  const currentStreak = useMemo(() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const currentMood = sorted[0].mood;
    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].mood === currentMood) {
        count++;
      } else {
        break;
      }
    }
    return {
      mood: currentMood,
      label: MOOD_LABELS[currentMood] || currentMood,
      icon: MOOD_ICONS[currentMood] || '•',
      days: count,
    };
  }, [entries]);

  // Days since last different mood state
  const daysSinceOtherMood = useMemo(() => {
    if (entries.length < 2 || !currentStreak) return null;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const currentMood = sorted[0].mood;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].mood !== currentMood) {
        const lastDifferentDate = new Date(sorted[i].date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastDifferentDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          mood: sorted[i].mood,
          label: MOOD_LABELS[sorted[i].mood] || sorted[i].mood,
          icon: MOOD_ICONS[sorted[i].mood] || '•',
          daysAgo: diffDays,
        };
      }
    }
    return null;
  }, [entries, currentStreak]);

  const registrationRate = stats.totalDays > 0 
    ? Math.round((stats.total / stats.totalDays) * 100) 
    : 0;

  return (
    <div className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sammanfattning</h2>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{periodLabel}</span>
      </div>

      {/* Current streak */}
      {currentStreak && (
        <div className="flex items-center gap-3 rounded-xl bg-card/80 border border-border/30 p-4">
          <span className="text-2xl">{currentStreak.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm font-medium">
                {currentStreak.days} {currentStreak.days === 1 ? 'dag' : 'dagar'} i rad
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentStreak.label}
            </p>
          </div>
          {daysSinceOtherMood && (
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-muted-foreground/70" />
                <p className="text-xs text-muted-foreground">
                  {daysSinceOtherMood.daysAgo}d sedan
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {daysSinceOtherMood.icon} {daysSinceOtherMood.label}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={CalendarCheck}
          value={`${stats.total}/${stats.totalDays}`}
          label="Registrerade"
          sublabel={`${registrationRate}%`}
        />
        {showSleep && sleepBadDays > 0 && (
          <MetricCard
            icon={Moon}
            value={`${sleepBadDays}`}
            label="Dålig sömn"
            warning
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
  icon: typeof CalendarCheck; 
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

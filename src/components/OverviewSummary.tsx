import { useMemo } from 'react';
import { MoodStats as MoodStatsType, MoodEntry } from '@/types/mood';
import { CalendarCheck, Moon } from 'lucide-react';

interface OverviewSummaryProps {
  stats: MoodStatsType;
  entries: MoodEntry[];
  periodLabel: string;
  sleepBadDays: number;
  showSleep: boolean;
}

const MOOD_GROUPS = [
  {
    key: 'elevated',
    label: 'Uppvarvad',
    icon: '🔥',
    moods: ['elevated', 'somewhat_elevated'],
    colorClass: 'border-l-orange-400',
  },
  {
    key: 'stable',
    label: 'Stabil',
    icon: '☀️',
    moods: ['stable'],
    colorClass: 'border-l-emerald-400',
  },
  {
    key: 'depressed',
    label: 'Nedstämd',
    icon: '🌧️',
    moods: ['depressed', 'somewhat_depressed'],
    colorClass: 'border-l-blue-400',
  },
];

export function OverviewSummary({
  stats,
  entries,
  periodLabel,
  sleepBadDays,
  showSleep,
}: OverviewSummaryProps) {
  // For each mood group, find how many days ago it last occurred
  const moodGroupTimeline = useMemo(() => {
    if (entries.length === 0) return [];
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return MOOD_GROUPS.map((group) => {
      const lastEntry = sorted.find((e) => group.moods.includes(e.mood));
      if (!lastEntry) {
        return { ...group, daysAgo: null, isActive: false };
      }
      const entryDate = new Date(lastEntry.date);
      entryDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      // Check if the most recent entry belongs to this group (= currently active)
      const isActive = group.moods.includes(sorted[0].mood);
      return { ...group, daysAgo: diffDays, isActive };
    });
  }, [entries]);

  // All-time mood distribution by group
  const allTimeDistribution = useMemo(() => {
    if (entries.length === 0) return null;
    const total = entries.length;
    return MOOD_GROUPS.map((group) => {
      const count = entries.filter((e) => group.moods.includes(e.mood)).length;
      const percentage = Math.round((count / total) * 100);
      return { ...group, count, percentage };
    });
  }, [entries]);

  // Current streak
  const currentStreak = useMemo(() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const currentMood = sorted[0].mood;
    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].mood === currentMood) count++;
      else break;
    }
    const group = MOOD_GROUPS.find((g) => g.moods.includes(currentMood));
    return {
      label: group?.label || '',
      icon: group?.icon || '',
      days: count,
    };
  }, [entries]);

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
      {currentStreak && currentStreak.days > 0 && (
        <div className="rounded-xl bg-card/80 border border-border/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="text-base mr-1.5">{currentStreak.icon}</span>
            <span className="font-medium text-foreground">{currentStreak.days} {currentStreak.days === 1 ? 'dag' : 'dagar'}</span>
            {' '}i rad — {currentStreak.label}
          </p>
        </div>
      )}

      {/* Days since each mood group */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Senast i varje läge</p>
        <div className="grid grid-cols-3 gap-2">
          {moodGroupTimeline.map((group) => (
            <div
              key={group.key}
              className={`rounded-xl border-l-[3px] ${group.colorClass} bg-card/50 border border-border/30 p-3 text-center space-y-1 ${group.isActive ? 'ring-1 ring-primary/30' : ''}`}
            >
              <span className="text-lg">{group.icon}</span>
              <p className="text-xs font-medium text-foreground">{group.label}</p>
              <p className="text-sm font-bold text-foreground">
                {group.daysAgo === null
                  ? '—'
                  : group.daysAgo === 0
                    ? 'Idag'
                    : group.daysAgo === 1
                      ? 'Igår'
                      : `${group.daysAgo}d sedan`}
              </p>
            </div>
          ))}
        </div>
      </div>

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

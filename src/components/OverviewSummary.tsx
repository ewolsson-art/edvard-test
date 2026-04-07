import { useMemo } from 'react';
import { MoodStats as MoodStatsType, MoodEntry } from '@/types/mood';
import { Flame, Sun, CloudRain, CalendarCheck, TrendingUp } from 'lucide-react';

interface OverviewSummaryProps {
  stats: MoodStatsType;
  entries: MoodEntry[];
  periodLabel: string;
  sleepBadDays: number;
  showSleep: boolean;
}

const MOOD_GROUPS = [
  { key: 'elevated', label: 'Uppvarvad', icon: Flame, moods: ['elevated', 'somewhat_elevated'], colorClass: 'text-mood-elevated', bgClass: 'bg-mood-elevated/10', barClass: 'bg-mood-elevated', borderClass: 'border-mood-elevated/30' },
  { key: 'stable', label: 'Stabil', icon: Sun, moods: ['stable'], colorClass: 'text-mood-stable', bgClass: 'bg-mood-stable/10', barClass: 'bg-mood-stable', borderClass: 'border-mood-stable/30' },
  { key: 'depressed', label: 'Nedstämd', icon: CloudRain, moods: ['depressed', 'somewhat_depressed'], colorClass: 'text-mood-depressed', bgClass: 'bg-mood-depressed/10', barClass: 'bg-mood-depressed', borderClass: 'border-mood-depressed/30' },
];

function findGroup(mood: string) {
  return MOOD_GROUPS.find(g => g.moods.includes(mood));
}

export function OverviewSummary({ stats, entries, periodLabel }: OverviewSummaryProps) {
  // Current streak
  const currentStreak = useMemo(() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const currentGroup = findGroup(sorted[0].mood);
    if (!currentGroup) return null;
    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (currentGroup.moods.includes(sorted[i].mood)) count++;
      else break;
    }
    return { days: count, group: currentGroup };
  }, [entries]);

  // Days since each group
  const daysSinceGroup = useMemo(() => {
    if (entries.length === 0) return [];
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return MOOD_GROUPS.map(group => {
      const lastEntry = sorted.find(e => group.moods.includes(e.mood));
      if (!lastEntry) return { ...group, daysAgo: null };
      const entryDate = new Date(lastEntry.date);
      entryDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      return { ...group, daysAgo: diffDays };
    });
  }, [entries]);

  // Distribution + avg episode helper
  const calcDistribution = (source: MoodEntry[]) => {
    if (source.length === 0) return null;
    const total = source.length;
    const sorted = [...source].sort((a, b) => a.date.localeCompare(b.date));

    return MOOD_GROUPS.map(group => {
      const count = source.filter(e => group.moods.includes(e.mood)).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      let episodes = 0, totalEpisodeDays = 0, inEpisode = false, currentLength = 0;
      for (const entry of sorted) {
        if (group.moods.includes(entry.mood)) {
          if (!inEpisode) { inEpisode = true; episodes++; currentLength = 1; } else { currentLength++; }
        } else {
          if (inEpisode) { totalEpisodeDays += currentLength; inEpisode = false; currentLength = 0; }
        }
      }
      if (inEpisode) totalEpisodeDays += currentLength;
      const avgEpisodeDays = episodes > 0 ? Math.round((totalEpisodeDays / episodes) * 10) / 10 : 0;

      return { ...group, count, percentage, avgEpisodeDays };
    });
  };

  const allTimeDistribution = useMemo(() => calcDistribution(entries), [entries]);

  const yearDistribution = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return calcDistribution(entries.filter(e => new Date(e.date).getFullYear() === currentYear));
  }, [entries]);

  // Calculate days since first check-in
  const { totalDaysSinceStart, registrationRate } = useMemo(() => {
    if (entries.length === 0) return { totalDaysSinceStart: 0, registrationRate: 0 };
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = new Date(sorted[0].date);
    firstDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = Math.round((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const rate = totalDays > 0 ? Math.round((entries.length / totalDays) * 100) : 0;
    return { totalDaysSinceStart: totalDays, registrationRate: rate };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-card/60 border border-border/40 p-6 text-center">
        <p className="text-muted-foreground">Ingen data att visa ännu. Börja checka in för att se statistik.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Current streak */}
      {currentStreak && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={TrendingUp} title="Nuvarande tillstånd" />
          <div className={`mt-3 rounded-xl ${currentStreak.group.bgClass} border ${currentStreak.group.borderClass} p-4 flex items-center gap-4`}>
            <currentStreak.group.icon className={`w-8 h-8 ${currentStreak.group.colorClass}`} />
            <div>
              <p className="text-lg font-bold">{currentStreak.group.label}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{currentStreak.days}</span> {currentStreak.days === 1 ? 'dag' : 'dagar'} i rad
              </p>
            </div>
          </div>
          {currentStreak.group.key === 'depressed' && allTimeDistribution && (() => {
            const depGroup = allTimeDistribution.find(g => g.key === 'depressed');
            const stableGroup = allTimeDistribution.find(g => g.key === 'stable');
            const avgDays = depGroup?.avgEpisodeDays || 0;
            const stablePct = stableGroup?.percentage || 0;
            if (avgDays === 0 && stablePct === 0) return null;
            return (
              <div className="mt-3 rounded-xl bg-mood-stable/10 border border-mood-stable/20 px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-mood-stable flex items-center gap-1.5">
                  <span>💚</span> Det vänder snart
                </p>
                {avgDays > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Dina nedstämda perioder varar i snitt <span className="font-semibold text-foreground">{avgDays} {avgDays === 1 ? 'dag' : 'dagar'}</span>. Du är på dag {currentStreak.days}.
                  </p>
                )}
                {stablePct > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{stablePct}%</span> av alla dina dagar har du mått stabilt.
                  </p>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {/* 2. Days since each group */}
      <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
        <SectionHeader icon={CalendarCheck} title="Dagar sedan senast" />
        <p className="text-xs text-muted-foreground mt-1 mb-3">Antal dagar sedan du senast var i varje tillstånd.</p>
        <div className="grid grid-cols-3 gap-3">
          {daysSinceGroup.map(item => (
            <div key={item.key} className={`rounded-xl ${item.bgClass} border ${item.borderClass} p-4 text-center`}>
              <item.icon className={`w-5 h-5 mx-auto mb-1.5 ${item.colorClass}`} />
              <p className="text-2xl font-bold">
                {item.daysAgo === null ? '—' : item.daysAgo}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.daysAgo === null ? 'Aldrig' : item.daysAgo === 0 ? 'Idag' : item.daysAgo === 1 ? 'dag sedan' : 'dagar sedan'}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground/80 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. All-time distribution */}
      {allTimeDistribution && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={CalendarCheck} title="Sedan start" />
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Fördelning av dina {entries.length} registrerade {entries.length === 1 ? 'dag' : 'dagar'}.
          </p>
          <div className="flex h-4 rounded-full overflow-hidden mb-3">
            {allTimeDistribution.map(item => item.percentage > 0 && (
              <div key={item.key} className={item.barClass} style={{ width: `${item.percentage}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {allTimeDistribution.map(item => (
              <div key={item.key} className="text-center">
                <item.icon className={`w-4 h-4 mx-auto ${item.colorClass}`} />
                <p className="text-lg font-bold mt-0.5">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. This year */}
      {yearDistribution && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={CalendarCheck} title={`${new Date().getFullYear()}`} />
          <p className="text-xs text-muted-foreground mt-1 mb-3">Dagar i varje tillstånd i år.</p>
          <div className="flex h-4 rounded-full overflow-hidden mb-3">
            {yearDistribution.map(item => item.percentage > 0 && (
              <div key={item.key} className={item.barClass} style={{ width: `${item.percentage}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {yearDistribution.map(item => (
              <div key={item.key} className="text-center">
                <item.icon className={`w-4 h-4 mx-auto ${item.colorClass}`} />
                <p className="text-lg font-bold mt-0.5">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Average episode length */}
      {allTimeDistribution && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={TrendingUp} title="Genomsnittlig episodlängd" />
          <p className="text-xs text-muted-foreground mt-1 mb-3">Hur länge varar en period i varje tillstånd i genomsnitt?</p>
          <div className="space-y-3">
            {allTimeDistribution.map(item => {
              const maxDays = Math.max(...allTimeDistribution.map(i => i.avgEpisodeDays), 1);
              const barWidth = item.avgEpisodeDays > 0 ? Math.max((item.avgEpisodeDays / maxDays) * 100, 4) : 0;
              return (
                <div key={item.key} className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${item.colorClass}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-bold">{item.avgEpisodeDays > 0 ? `${item.avgEpisodeDays} d` : '—'}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.barClass}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Registration rate */}
      <section className="rounded-2xl bg-card/60 border border-border/40 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Registrerade dagar</p>
          <p className="text-xs text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{stats.total}<span className="text-muted-foreground font-normal text-sm">/{stats.totalDays}</span></p>
          <p className="text-xs text-muted-foreground">{registrationRate}%</p>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof CalendarCheck; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
    </div>
  );
}

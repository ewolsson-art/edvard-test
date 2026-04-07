import { useMemo } from 'react';
import { MoodStats as MoodStatsType, MoodEntry, MOOD_LABELS } from '@/types/mood';
import { Flame, Zap, Sun, Cloud, CloudRain, CalendarCheck, TrendingUp } from 'lucide-react';

interface OverviewSummaryProps {
  stats: MoodStatsType;
  entries: MoodEntry[];
  periodLabel: string;
  sleepBadDays: number;
  showSleep: boolean;
}

const MOOD_CONFIG = [
  { key: 'elevated' as const, label: MOOD_LABELS.elevated, icon: Flame, moods: ['elevated'], colorClass: 'text-mood-elevated', bgClass: 'bg-mood-elevated/10', barClass: 'bg-mood-elevated', borderClass: 'border-mood-elevated/30' },
  { key: 'somewhat_elevated' as const, label: MOOD_LABELS.somewhat_elevated, icon: Zap, moods: ['somewhat_elevated'], colorClass: 'text-mood-somewhat-elevated', bgClass: 'bg-mood-somewhat-elevated/10', barClass: 'bg-mood-somewhat-elevated', borderClass: 'border-mood-somewhat-elevated/30' },
  { key: 'stable' as const, label: MOOD_LABELS.stable, icon: Sun, moods: ['stable'], colorClass: 'text-mood-stable', bgClass: 'bg-mood-stable/10', barClass: 'bg-mood-stable', borderClass: 'border-mood-stable/30' },
  { key: 'somewhat_depressed' as const, label: MOOD_LABELS.somewhat_depressed, icon: Cloud, moods: ['somewhat_depressed'], colorClass: 'text-mood-somewhat-depressed', bgClass: 'bg-mood-somewhat-depressed/10', barClass: 'bg-mood-somewhat-depressed', borderClass: 'border-mood-somewhat-depressed/30' },
  { key: 'depressed' as const, label: MOOD_LABELS.depressed, icon: CloudRain, moods: ['depressed'], colorClass: 'text-mood-depressed', bgClass: 'bg-mood-depressed/10', barClass: 'bg-mood-depressed', borderClass: 'border-mood-depressed/30' },
];

export function OverviewSummary({
  stats,
  entries,
  periodLabel,
}: OverviewSummaryProps) {
  // Current streak (consecutive days in the same mood, most recent first)
  const currentStreak = useMemo(() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const currentMood = sorted[0].mood;
    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].mood === currentMood) count++;
      else break;
    }
    const config = MOOD_CONFIG.find(c => c.moods.includes(currentMood));
    return { mood: currentMood, days: count, config };
  }, [entries]);

  // Days since user was last in each mood
  const daysSinceMood = useMemo(() => {
    if (entries.length === 0) return [];
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return MOOD_CONFIG.map(config => {
      const lastEntry = sorted.find(e => config.moods.includes(e.mood));
      if (!lastEntry) return { ...config, daysAgo: null };
      const entryDate = new Date(lastEntry.date);
      entryDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      return { ...config, daysAgo: diffDays };
    });
  }, [entries]);

  // All-time distribution (since start)
  const allTimeDistribution = useMemo(() => {
    if (entries.length === 0) return null;
    const total = entries.length;
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    return MOOD_CONFIG.map(config => {
      const count = entries.filter(e => config.moods.includes(e.mood)).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      // Average consecutive episode length
      let episodes = 0;
      let totalEpisodeDays = 0;
      let inEpisode = false;
      let currentLength = 0;

      for (const entry of sorted) {
        if (config.moods.includes(entry.mood)) {
          if (!inEpisode) {
            inEpisode = true;
            episodes++;
            currentLength = 1;
          } else {
            currentLength++;
          }
        } else {
          if (inEpisode) {
            totalEpisodeDays += currentLength;
            inEpisode = false;
            currentLength = 0;
          }
        }
      }
      if (inEpisode) totalEpisodeDays += currentLength;

      const avgEpisodeDays = episodes > 0 ? Math.round((totalEpisodeDays / episodes) * 10) / 10 : 0;

      return { ...config, count, percentage, avgEpisodeDays };
    });
  }, [entries]);

  // Year distribution
  const yearDistribution = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearEntries = entries.filter(e => new Date(e.date).getFullYear() === currentYear);
    if (yearEntries.length === 0) return null;
    const total = yearEntries.length;

    return MOOD_CONFIG.map(config => {
      const count = yearEntries.filter(e => config.moods.includes(e.mood)).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...config, count, percentage };
    });
  }, [entries]);

  const registrationRate = stats.totalDays > 0
    ? Math.round((stats.total / stats.totalDays) * 100)
    : 0;

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
      {currentStreak && currentStreak.config && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={TrendingUp} title="Nuvarande tillstånd" />
          <div className={`mt-3 rounded-xl ${currentStreak.config.bgClass} border ${currentStreak.config.borderClass} p-4 flex items-center gap-4`}>
            <currentStreak.config.icon className={`w-8 h-8 ${currentStreak.config.colorClass}`} />
            <div>
              <p className="text-lg font-bold">{currentStreak.config.label}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{currentStreak.days}</span> {currentStreak.days === 1 ? 'dag' : 'dagar'} i rad
              </p>
            </div>
          </div>
          {/* Encouraging message when depressed */}
          {['depressed', 'somewhat_depressed'].includes(currentStreak.mood) && allTimeDistribution && (() => {
            const depConfig = allTimeDistribution.find(g => g.key === currentStreak.mood);
            const stableConfig = allTimeDistribution.find(g => g.key === 'stable');
            const avgDays = depConfig?.avgEpisodeDays || 0;
            const stablePct = stableConfig?.percentage || 0;
            if (avgDays === 0 && stablePct === 0) return null;
            return (
              <div className="mt-3 rounded-xl bg-mood-stable/10 border border-mood-stable/20 px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-mood-stable flex items-center gap-1.5">
                  <span>💚</span> Det vänder snart
                </p>
                {avgDays > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Dina perioder som {depConfig?.label?.toLowerCase()} varar i snitt <span className="font-semibold text-foreground">{avgDays} {avgDays === 1 ? 'dag' : 'dagar'}</span>. Du är på dag {currentStreak.days}.
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

      {/* 2. Days since each mood */}
      <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
        <SectionHeader icon={CalendarCheck} title="Dagar sedan senast" />
        <p className="text-xs text-muted-foreground mt-1 mb-3">Antal dagar sedan du senast var i varje tillstånd.</p>
        <div className="grid grid-cols-5 gap-2">
          {daysSinceMood.map(item => (
            <div key={item.key} className={`rounded-xl ${item.bgClass} border ${item.borderClass} p-3 text-center`}>
              <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.colorClass}`} />
              <p className="text-lg font-bold">
                {item.daysAgo === null ? '—' : item.daysAgo === 0 ? '0' : item.daysAgo}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                {item.daysAgo === null ? 'Aldrig' : item.daysAgo === 0 ? 'Idag' : item.daysAgo === 1 ? 'dag' : 'dagar'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. All-time distribution */}
      {allTimeDistribution && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={CalendarCheck} title="Sedan start" />
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Fördelning av dina {entries.length} registrerade {entries.length === 1 ? 'dag' : 'dagar'} sedan du började.
          </p>

          {/* Stacked bar */}
          <div className="flex h-4 rounded-full overflow-hidden mb-3">
            {allTimeDistribution.map(item => (
              item.percentage > 0 && (
                <div key={item.key} className={item.barClass} style={{ width: `${item.percentage}%` }} />
              )
            ))}
          </div>

          {/* Grid with counts */}
          <div className="grid grid-cols-5 gap-2">
            {allTimeDistribution.map(item => (
              <div key={item.key} className="text-center space-y-0.5">
                <item.icon className={`w-3.5 h-3.5 mx-auto ${item.colorClass}`} />
                <p className="text-sm font-bold">{item.count}</p>
                <p className="text-[10px] text-muted-foreground">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. This year distribution */}
      {yearDistribution && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={CalendarCheck} title={`${new Date().getFullYear()}`} />
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Dagar i varje tillstånd i år.
          </p>

          <div className="flex h-4 rounded-full overflow-hidden mb-3">
            {yearDistribution.map(item => (
              item.percentage > 0 && (
                <div key={item.key} className={item.barClass} style={{ width: `${item.percentage}%` }} />
              )
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {yearDistribution.map(item => (
              <div key={item.key} className="text-center space-y-0.5">
                <item.icon className={`w-3.5 h-3.5 mx-auto ${item.colorClass}`} />
                <p className="text-sm font-bold">{item.count}</p>
                <p className="text-[10px] text-muted-foreground">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Average episode length */}
      {allTimeDistribution && (
        <section className="rounded-2xl bg-card/60 border border-border/40 p-5">
          <SectionHeader icon={TrendingUp} title="Genomsnittlig episodlängd" />
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Hur länge varar en period i varje tillstånd i genomsnitt?
          </p>

          <div className="space-y-2">
            {allTimeDistribution.map(item => {
              const maxDays = Math.max(...allTimeDistribution.map(i => i.avgEpisodeDays), 1);
              const barWidth = item.avgEpisodeDays > 0 ? Math.max((item.avgEpisodeDays / maxDays) * 100, 4) : 0;
              return (
                <div key={item.key} className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${item.colorClass}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-bold">
                        {item.avgEpisodeDays > 0 ? `${item.avgEpisodeDays} d` : '—'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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

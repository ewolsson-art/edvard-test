import { useMemo } from 'react';
import { useMoodData } from '@/hooks/useMoodData';
import { useProfile } from '@/hooks/useProfile';
import {
  Heart, Sun, TrendingUp, Clock, Shield, Sparkles, ArrowUpRight, Dumbbell, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EncouragingStat {
  icon: typeof Heart;
  value: string;
  label: string;
  detail: string;
  color: string;
  bgColor: string;
}

export default function BadDay() {
  const { entries } = useMoodData();
  const { firstName } = useProfile();

  const encouragingStats = useMemo(() => {
    if (!entries || entries.length < 2) return null;

    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    // Group moods
    const groupMood = (mood: string) =>
      (mood === 'elevated' || mood === 'somewhat_elevated') ? 'elevated'
        : (mood === 'depressed' || mood === 'somewhat_depressed') ? 'depressed'
        : 'stable';

    // Episodes
    const episodes: { mood: string; days: number }[] = [];
    let epStart = 0;
    for (let i = 1; i <= sorted.length; i++) {
      const prevGroup = groupMood(sorted[epStart].mood);
      const curGroup = i < sorted.length ? groupMood(sorted[i].mood) : '';
      if (i === sorted.length || curGroup !== prevGroup) {
        episodes.push({ mood: prevGroup, days: i - epStart });
        epStart = i;
      }
    }

    // Average depressed episode length
    const depEpisodes = episodes.filter(e => e.mood === 'depressed');
    const avgDepDays = depEpisodes.length > 0
      ? Math.round(depEpisodes.reduce((a, b) => a + b.days, 0) / depEpisodes.length * 10) / 10
      : 0;

    // Current streak
    const currentGroup = groupMood(sorted[sorted.length - 1].mood);
    let currentStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (groupMood(sorted[i].mood) === currentGroup) currentStreak++;
      else break;
    }

    // How many times the user went from depressed to stable/elevated
    let recoveryCount = 0;
    for (let i = 0; i < episodes.length - 1; i++) {
      if (episodes[i].mood === 'depressed' && episodes[i + 1].mood !== 'depressed') {
        recoveryCount++;
      }
    }

    // % of total days that were stable or elevated
    const goodDays = sorted.filter(e => groupMood(e.mood) !== 'depressed').length;
    const goodPct = Math.round((goodDays / sorted.length) * 100);

    // After depressed episodes, how quickly did mood improve?
    // (average of the first non-depressed episode length after a depressed one)
    let recoveryAfterDep: number[] = [];
    for (let i = 0; i < episodes.length - 1; i++) {
      if (episodes[i].mood === 'depressed') {
        recoveryAfterDep.push(episodes[i].days);
      }
    }

    // Days with good sleep during depressed periods vs not
    const depEntries = sorted.filter(e => groupMood(e.mood) === 'depressed');
    const depWithGoodSleep = depEntries.filter(e => e.sleepQuality === 'good').length;
    const depWithExercise = depEntries.filter(e => e.exercised).length;

    // Longest stable streak ever
    const stableEpisodes = episodes.filter(e => e.mood === 'stable' || e.mood === 'elevated');
    const longestStable = stableEpisodes.length > 0 ? Math.max(...stableEpisodes.map(e => e.days)) : 0;

    const stats: EncouragingStat[] = [];

    if (recoveryCount > 0) {
      stats.push({
        icon: ArrowUpRight,
        value: `${recoveryCount}x`,
        label: 'Återhämtningar',
        detail: `Du har tagit dig ur nedstämdhet ${recoveryCount} ${recoveryCount === 1 ? 'gång' : 'gånger'} tidigare.`,
        color: 'text-mood-stable',
        bgColor: 'bg-mood-stable/10 border-mood-stable/20',
      });
    }

    if (avgDepDays > 0) {
      stats.push({
        icon: Clock,
        value: `~${avgDepDays}d`,
        label: 'Genomsnittlig period',
        detail: `Dina nedstämda perioder varar i snitt ${avgDepDays} dagar. Det går över.`,
        color: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20',
      });
    }

    stats.push({
      icon: Sun,
      value: `${goodPct}%`,
      label: 'Bra dagar totalt',
      detail: `${goodPct}% av alla dina incheckade dagar har du mått stabilt eller uppvarvat.`,
      color: 'text-mood-stable',
      bgColor: 'bg-mood-stable/10 border-mood-stable/20',
    });

    if (longestStable > 0) {
      stats.push({
        icon: Shield,
        value: `${longestStable}d`,
        label: 'Längsta stabila period',
        detail: `Din längsta period utan nedstämdhet var ${longestStable} dagar. Du kan nå dit igen.`,
        color: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20',
      });
    }

    if (depWithExercise > 0 && depEntries.length > 0) {
      const exercisePct = Math.round((depWithExercise / depEntries.length) * 100);
      stats.push({
        icon: Dumbbell,
        value: `${exercisePct}%`,
        label: 'Träning under svåra dagar',
        detail: `Du tränade ${exercisePct}% av dina nedstämda dagar — varje rörelse hjälper.`,
        color: 'text-mood-stable',
        bgColor: 'bg-mood-stable/10 border-mood-stable/20',
      });
    }

    if (depWithGoodSleep > 0 && depEntries.length > 0) {
      const sleepPct = Math.round((depWithGoodSleep / depEntries.length) * 100);
      stats.push({
        icon: Moon,
        value: `${sleepPct}%`,
        label: 'Bra sömn under svåra dagar',
        detail: `Du sov bra ${sleepPct}% av dina nedstämda dagar — sömn är din allierade.`,
        color: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20',
      });
    }

    if (currentStreak > 0 && currentGroup === 'depressed' && avgDepDays > 0) {
      const daysLeft = Math.max(0, Math.round(avgDepDays - currentStreak));
      if (daysLeft > 0) {
        stats.push({
          icon: TrendingUp,
          value: `~${daysLeft}d`,
          label: 'Kvar i snitt',
          detail: `Baserat på ditt mönster kan det vända inom ~${daysLeft} dagar.`,
          color: 'text-mood-stable',
          bgColor: 'bg-mood-stable/10 border-mood-stable/20',
        });
      }
    }

    return { stats, currentStreak, currentGroup, recoveryCount, avgDepDays };
  }, [entries]);

  const greeting = firstName ? `${firstName}, ` : '';

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto md:mx-0 pb-24">
      <h1 className="font-display text-3xl font-bold mb-2">Dålig dag?</h1>

      {/* Encouraging hero */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-1">
              {greeting}det kommer bli bättre.
            </p>
            <p className="text-sm text-muted-foreground">
              {encouragingStats && encouragingStats.recoveryCount > 0
                ? `Du har återhämtat dig ${encouragingStats.recoveryCount} ${encouragingStats.recoveryCount === 1 ? 'gång' : 'gånger'} förut. Dina egna siffror visar att detta är tillfälligt.`
                : 'Dina incheckningar visar att svåra perioder alltid tar slut. Här är bevis från din egen data.'}
            </p>
          </div>
        </div>
      </div>

      {(!encouragingStats || !entries || entries.length < 5) ? (
        <div className="rounded-2xl border border-border/40 bg-card/60 p-8 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Fortsätt checka in så kan vi visa dig uppmuntrande statistik baserad på dina mönster.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {encouragingStats.stats.map((stat, i) => (
            <div
              key={i}
              className={cn(
                'rounded-2xl border p-4 transition-all animate-fade-in',
                stat.bgColor
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center flex-shrink-0">
                  <stat.icon className={cn('w-6 h-6', stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={cn('text-2xl font-bold', stat.color)}>{stat.value}</span>
                    <span className="text-sm font-medium text-foreground/80">{stat.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.detail}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              ❤️ Baserat på dina {entries.length} incheckningar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

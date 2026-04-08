import { useMemo } from 'react';
import { useMoodData } from '@/hooks/useMoodData';
import { useProfile } from '@/hooks/useProfile';
import {
  Heart, Sun, TrendingUp, Clock, Shield, Sparkles, ArrowUpRight, Phone, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EncouragingStat {
  icon: typeof Heart;
  value: string;
  label: string;
  detail: string;
  color: string;
  ringColor: string;
  glowColor: string;
}

function StatCircle({ stat, index }: { stat: EncouragingStat; index: number }) {
  return (
    <div
      className="flex flex-col items-center gap-3 animate-fade-in"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className={cn(
        'relative w-28 h-28 rounded-full flex items-center justify-center',
        'border-2 transition-all',
        stat.ringColor
      )}>
        <div className={cn(
          'absolute inset-0 rounded-full opacity-20 blur-md',
          stat.glowColor
        )} />
        <div className="flex flex-col items-center z-10">
          <stat.icon className={cn('w-6 h-6 mb-1', stat.color)} />
          <span className={cn('text-xl font-bold leading-none', stat.color)}>
            {stat.value}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-foreground/70 text-center max-w-[100px] leading-tight">
        {stat.label}
      </span>
    </div>
  );
}

export default function BadDay() {
  const { entries } = useMoodData();
  const { firstName } = useProfile();

  const encouragingStats = useMemo(() => {
    if (!entries || entries.length < 2) return null;

    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    const groupMood = (mood: string) =>
      (mood === 'elevated' || mood === 'somewhat_elevated') ? 'elevated'
        : (mood === 'depressed' || mood === 'somewhat_depressed') ? 'depressed'
        : 'stable';

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

    const depEpisodes = episodes.filter(e => e.mood === 'depressed');
    const avgDepDays = depEpisodes.length > 0
      ? Math.round(depEpisodes.reduce((a, b) => a + b.days, 0) / depEpisodes.length * 10) / 10
      : 0;

    const currentGroup = groupMood(sorted[sorted.length - 1].mood);
    let currentStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (groupMood(sorted[i].mood) === currentGroup) currentStreak++;
      else break;
    }

    let recoveryCount = 0;
    for (let i = 0; i < episodes.length - 1; i++) {
      if (episodes[i].mood === 'depressed' && episodes[i + 1].mood !== 'depressed') {
        recoveryCount++;
      }
    }

    const goodDays = sorted.filter(e => groupMood(e.mood) !== 'depressed').length;
    const goodPct = Math.round((goodDays / sorted.length) * 100);

    const stableEpisodes = episodes.filter(e => e.mood === 'stable' || e.mood === 'elevated');
    const longestStable = stableEpisodes.length > 0 ? Math.max(...stableEpisodes.map(e => e.days)) : 0;

    const stats: EncouragingStat[] = [];

    if (recoveryCount > 0) {
      stats.push({
        icon: ArrowUpRight,
        value: '✓',
        label: 'Återhämtning',
        detail: 'Du har återhämtat dig från nedstämdhet tidigare. Du kan göra det igen.',
        color: 'text-mood-stable',
        ringColor: 'border-mood-stable/40',
        glowColor: 'bg-mood-stable/40',
      });
    }

    if (avgDepDays > 0) {
      stats.push({
        icon: Clock,
        value: `~${avgDepDays}d`,
        label: 'Snittperiod',
        detail: `Dina nedstämda perioder varar i snitt ${avgDepDays} incheckade dagar.`,
        color: 'text-primary',
        ringColor: 'border-primary/40',
        glowColor: 'bg-primary/40',
      });
    }

    stats.push({
      icon: Sun,
      value: `${goodPct}%`,
      label: 'Bra dagar',
      detail: `${goodPct}% av dina incheckade dagar har du mått stabilt eller uppvarvat.`,
      color: 'text-mood-stable',
      ringColor: 'border-mood-stable/40',
      glowColor: 'bg-mood-stable/40',
    });

    if (longestStable > 0) {
      stats.push({
        icon: Shield,
        value: `${longestStable}d`,
        label: 'Längsta stabila',
        detail: `Din längsta period utan nedstämdhet var ${longestStable} incheckade dagar.`,
        color: 'text-primary',
        ringColor: 'border-primary/40',
        glowColor: 'bg-primary/40',
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
          ringColor: 'border-mood-stable/40',
          glowColor: 'bg-mood-stable/40',
        });
      }
    }

    return { stats, currentStreak, currentGroup, recoveryCount, avgDepDays };
  }, [entries]);

  const greeting = firstName ? `${firstName}, ` : '';

  // Pick the most relevant detail to show below circles
  const activeDetail = encouragingStats?.stats[0]?.detail;

  return (
    <div className="p-5 md:p-8 max-w-2xl md:mx-0 pb-24">
      <h1 className="font-display text-3xl font-bold mb-6">Dålig dag?</h1>

      {/* Hero message */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <p className="text-2xl font-semibold text-foreground mb-2">
          {greeting}det kommer bli bättre.
        </p>
        <p className="text-base text-muted-foreground max-w-md mx-auto">
          {encouragingStats && encouragingStats.recoveryCount > 0
            ? 'Du har återhämtat dig förut. Dina siffror visar att detta är tillfälligt.'
            : 'Svåra perioder tar slut. Här är bevis från din data.'}
        </p>
      </div>

      {(!encouragingStats || !entries || entries.length < 5) ? (
        <div className="rounded-2xl border border-border/40 bg-card/60 p-8 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Fortsätt checka in så kan vi visa dig uppmuntrande statistik baserad på dina mönster.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Circles grid */}
          <div className="flex flex-wrap justify-center gap-8">
            {encouragingStats.stats.map((stat, i) => (
              <StatCircle key={i} stat={stat} index={i} />
            ))}
          </div>

          {/* Detail text below */}
          {encouragingStats.stats.length > 0 && (
            <div className="rounded-2xl border border-border/30 bg-card/40 p-5 text-center space-y-3">
              {encouragingStats.stats.map((stat, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                  <stat.icon className={cn('w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5', stat.color)} />
                  {stat.detail}
                </p>
              ))}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/40 text-center">
            ❤️ Baserat på dina {entries.length} incheckningar
          </p>
        </div>
      )}

      {/* Vill du prata med någon? */}
      <div className="mt-10 rounded-2xl border border-border/30 bg-card/40 p-6 text-center">
        <Phone className="w-7 h-7 text-primary mx-auto mb-3" />
        <p className="text-lg font-semibold text-foreground mb-1">Glöm aldrig att det finns människor som gärna lyssnar på dig</p>
        <p className="text-sm text-muted-foreground mb-5">Du är inte ensam. Ring när du behöver.</p>

        <div className="space-y-3 max-w-sm mx-auto">
          {[
            { name: 'Mind Självmordslinjen', phone: '90101', note: 'Dygnet runt' },
            { name: 'Jourhavande medmänniska', phone: '08-702 16 80', note: 'Kväll & natt' },
            { name: 'Mind Äldrelinjen', phone: '020-22 22 33', note: 'Vardagar' },
            { name: '1177 Vårdguiden', phone: '1177', note: 'Dygnet runt' },
          ].map((line) => (
            <a
              key={line.phone}
              href={`tel:${line.phone.replace(/[^0-9]/g, '')}`}
              className="flex items-center justify-between rounded-xl border border-border/20 bg-background/40 px-4 py-3 hover:bg-primary/5 transition-colors group"
            >
              <div className="text-left">
                <span className="text-sm font-medium text-foreground">{line.name}</span>
                <span className="block text-[11px] text-muted-foreground">{line.note}</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <span className="text-sm font-semibold">{line.phone}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

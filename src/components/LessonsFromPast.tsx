import { useMemo } from 'react';
import { MoodEntry } from '@/types/mood';
import { Characteristic } from '@/hooks/useCharacteristics';
import { BookOpen, Flame, Sun, CloudRain, TrendingUp, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LessonsFromPastProps {
  entries: MoodEntry[];
  characteristics: Characteristic[];
}

const MOOD_GROUPS = [
  { key: 'elevated', moods: ['elevated', 'somewhat_elevated'], icon: Flame, colorClass: 'text-mood-elevated', bgClass: 'bg-mood-elevated/10', borderClass: 'border-mood-elevated/30' },
  { key: 'stable', moods: ['stable'], icon: Sun, colorClass: 'text-mood-stable', bgClass: 'bg-mood-stable/10', borderClass: 'border-mood-stable/30' },
  { key: 'depressed', moods: ['depressed', 'somewhat_depressed'], icon: CloudRain, colorClass: 'text-mood-depressed', bgClass: 'bg-mood-depressed/10', borderClass: 'border-mood-depressed/30' },
];

function findGroup(mood: string) {
  return MOOD_GROUPS.find(g => g.moods.includes(mood));
}

export function LessonsFromPast({ entries, characteristics }: LessonsFromPastProps) {
  const { t } = useTranslation();

  const moodGroupLabels: Record<string, string> = {
    elevated: t('overviewSummary.elevated'),
    stable: t('overviewSummary.stable'),
    depressed: t('overviewSummary.depressed'),
  };

  const analysis = useMemo(() => {
    if (entries.length < 3) return null;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const currentGroup = findGroup(sorted[0].mood);
    if (!currentGroup) return null;

    let currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (currentGroup.moods.includes(sorted[i].mood)) currentStreak++;
      else break;
    }

    const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const episodes: number[] = [];
    let inEpisode = false;
    let episodeLength = 0;

    for (const entry of chronological) {
      if (currentGroup.moods.includes(entry.mood)) {
        if (!inEpisode) { inEpisode = true; episodeLength = 1; } else episodeLength++;
      } else {
        if (inEpisode) { episodes.push(episodeLength); inEpisode = false; episodeLength = 0; }
      }
    }

    if (episodes.length === 0) return { currentGroup, currentStreak, avgDays: 0, minDays: 0, maxDays: 0, matchingChars: [], episodes: 0 };

    const avgDays = Math.round((episodes.reduce((a, b) => a + b, 0) / episodes.length) * 10) / 10;
    const minDays = Math.min(...episodes);
    const maxDays = Math.max(...episodes);

    const moodTypeMap: Record<string, string> = { elevated: 'elevated', stable: 'stable', depressed: 'depressed' };
    const matchingChars = characteristics.filter(c => c.mood_type === moodTypeMap[currentGroup.key]);

    return { currentGroup, currentStreak, avgDays, minDays, maxDays, matchingChars, episodes: episodes.length };
  }, [entries, characteristics]);

  if (!analysis) return null;

  const { currentGroup, currentStreak, avgDays, minDays, maxDays, matchingChars, episodes } = analysis;
  const Icon = currentGroup.icon;
  const label = moodGroupLabels[currentGroup.key];
  const labelLower = label.toLowerCase();

  return (
    <section className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('lessonsFromPast.title')}</h3>
      </div>

      <div className={`rounded-xl ${currentGroup.bgClass} border ${currentGroup.borderClass} p-4 space-y-3`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${currentGroup.colorClass}`} />
          <p className="font-semibold">{label} – {t('lessonsFromPast.day')} {currentStreak}</p>
        </div>

        {episodes > 0 && avgDays > 0 ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('lessonsFromPast.previousPeriods', { count: episodes, mood: labelLower })}
                {' '}{t('lessonsFromPast.avgDuration', { days: `${avgDays} ${avgDays === 1 ? t('common.day') : t('common.days')}` })}
                {minDays !== maxDays && <> {t('lessonsFromPast.range', { min: minDays, max: maxDays })}</>}.
              </p>
            </div>

            {currentStreak < avgDays ? (
              <p className="text-xs text-muted-foreground pl-6">
                {t('lessonsFromPast.youAreOnDay', { current: currentStreak, avg: avgDays })} {t('lessonsFromPast.daysLeft', { remaining: `${Math.round(avgDays - currentStreak)} ${Math.round(avgDays - currentStreak) === 1 ? t('common.day') : t('common.days')}` })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground pl-6">
                {t('lessonsFromPast.passedAvg', { mood: labelLower, avg: avgDays })} {t('lessonsFromPast.changeNear')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('lessonsFromPast.firstPeriod', { mood: labelLower })}
          </p>
        )}
      </div>

      {matchingChars.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('lessonsFromPast.characteristicsWhen', { mood: labelLower })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {matchingChars.map(c => (
              <span key={c.id} className={`text-xs px-3 py-1.5 rounded-full ${currentGroup.bgClass} border ${currentGroup.borderClass} font-medium`}>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

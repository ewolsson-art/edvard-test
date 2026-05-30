import { useMemo } from 'react';
import { MoodType } from '@/types/mood';
import { useDiagnosisConfig } from '@/hooks/useDiagnosisConfig';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TurtleLogo } from '@/components/TurtleLogo';
import { getTurtleMoodForMood } from '@/lib/moodTurtle';

interface MoodStatsRowProps {
  /** All mood entries to summarise (any keying — only values matter). */
  moods: MoodType[];
  className?: string;
}

type MoodGroup = 'elevated' | 'stable' | 'depressed';

const GROUP_MEMBERS: Record<MoodGroup, MoodType[]> = {
  elevated: ['severe_elevated', 'elevated', 'somewhat_elevated'],
  stable: ['stable'],
  depressed: ['somewhat_depressed', 'depressed', 'severe_depressed'],
};

/**
 * Three-bucket mood distribution chip row (uppvarvad / stabil / nedstämd).
 * Shared between MonthCalendar and WeekCalendar.
 */
export function MoodStatsRow({ moods, className }: MoodStatsRowProps) {
  const { moodLabels } = useDiagnosisConfig();

  const { moodStats, perMoodCounts } = useMemo(() => {
    const counts: Partial<Record<MoodType, number>> = {};
    moods.forEach((m) => { counts[m] = (counts[m] ?? 0) + 1; });
    const buckets: Record<MoodGroup, number> = { elevated: 0, stable: 0, depressed: 0 };
    (Object.keys(GROUP_MEMBERS) as MoodGroup[]).forEach((g) => {
      buckets[g] = GROUP_MEMBERS[g].reduce((sum, m) => sum + (counts[m] ?? 0), 0);
    });
    const total = buckets.elevated + buckets.stable + buckets.depressed;
    const order: MoodGroup[] = ['elevated', 'stable', 'depressed'];
    const stats = order.map((g) => ({
      group: g,
      count: buckets[g],
      percent: total > 0 ? Math.round((buckets[g] / total) * 100) : 0,
    }));
    return { moodStats: stats, perMoodCounts: counts };
  }, [moods]);

  const groupLabel: Record<MoodGroup, string> = {
    elevated: 'uppvarvad',
    stable: moodLabels.stable.toLowerCase(),
    depressed: 'nedstämd',
  };

  if (moods.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}>
      {moodStats.map(({ group, count, percent }) => {
        const breakdown = GROUP_MEMBERS[group]
          .map((m) => ({ mood: m, count: perMoodCounts[m] ?? 0 }))
          .filter((b) => b.count > 0);
        const isGroup = group !== 'stable';
        const total = count;

        const trigger = (
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors',
              isGroup && 'hover:bg-muted/40 cursor-pointer',
              !isGroup && 'cursor-default',
            )}
            aria-label={`${percent}% ${groupLabel[group]}${isGroup ? ' — visa fördelning' : ''}`}
          >
            <span
              className={cn(
                'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 overflow-hidden',
                group === 'elevated' && 'bg-[hsl(45_95%_60%)] ring-[hsl(38_90%_45%)]',
                group === 'stable' && 'bg-[hsl(142_60%_50%)] ring-[hsl(150_55%_35%)]',
                group === 'depressed' && 'bg-[hsl(0_75%_58%)] ring-[hsl(0_70%_42%)]',
              )}
              aria-hidden
            >
              <TurtleLogo size="sm" animated={false} mood={group} framing="face" className="h-5 w-5" />
            </span>
            <span className="text-[12px] text-foreground/70">
              <span className="font-semibold text-foreground/85">{percent}%</span>{' '}
              <span className="text-foreground/55">{groupLabel[group]}</span>
            </span>
          </button>
        );

        if (!isGroup || breakdown.length <= 1) {
          return <div key={group}>{trigger}</div>;
        }

        return (
          <Popover key={group}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-56 p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 capitalize">
                {groupLabel[group]} — fördelning
              </div>
              <div className="space-y-1.5">
                {breakdown.map(({ mood, count: c }) => {
                  const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                  return (
                    <div key={mood} className="flex items-center justify-between gap-3 text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <TurtleLogo size="sm" animated={false} mood={getTurtleMoodForMood(mood)} className="h-5 w-5 shrink-0" />
                        <span className="truncate text-foreground/80">{moodLabels[mood]}</span>
                      </div>
                      <span className="text-foreground/60 tabular-nums shrink-0">
                        {c} <span className="text-foreground/40">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

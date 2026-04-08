import { useMemo } from 'react';
import { MoodEntry } from '@/types/mood';
import { Characteristic } from '@/hooks/useCharacteristics';
import { BookOpen, Flame, Sun, CloudRain, TrendingUp, Sparkles } from 'lucide-react';

interface LessonsFromPastProps {
  entries: MoodEntry[];
  characteristics: Characteristic[];
}

const MOOD_GROUPS = [
  { key: 'elevated', label: 'Uppvarvad', moods: ['elevated', 'somewhat_elevated'], icon: Flame, colorClass: 'text-mood-elevated', bgClass: 'bg-mood-elevated/10', borderClass: 'border-mood-elevated/30' },
  { key: 'stable', label: 'Stabil', moods: ['stable'], icon: Sun, colorClass: 'text-mood-stable', bgClass: 'bg-mood-stable/10', borderClass: 'border-mood-stable/30' },
  { key: 'depressed', label: 'Nedstämd', moods: ['depressed', 'somewhat_depressed'], icon: CloudRain, colorClass: 'text-mood-depressed', bgClass: 'bg-mood-depressed/10', borderClass: 'border-mood-depressed/30' },
];

function findGroup(mood: string) {
  return MOOD_GROUPS.find(g => g.moods.includes(mood));
}

export function LessonsFromPast({ entries, characteristics }: LessonsFromPastProps) {
  const analysis = useMemo(() => {
    if (entries.length < 3) return null;

    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const currentGroup = findGroup(sorted[0].mood);
    if (!currentGroup) return null;

    // Current streak length
    let currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (currentGroup.moods.includes(sorted[i].mood)) currentStreak++;
      else break;
    }

    // Find all historical episodes for this group
    const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const episodes: number[] = [];
    let inEpisode = false;
    let episodeLength = 0;

    for (const entry of chronological) {
      if (currentGroup.moods.includes(entry.mood)) {
        if (!inEpisode) { inEpisode = true; episodeLength = 1; }
        else episodeLength++;
      } else {
        if (inEpisode) {
          episodes.push(episodeLength);
          inEpisode = false;
          episodeLength = 0;
        }
      }
    }
    // Don't count the current ongoing episode in historical stats
    // (it's still ongoing)

    if (episodes.length === 0) return { currentGroup, currentStreak, avgDays: 0, minDays: 0, maxDays: 0, matchingChars: [], episodes: 0 };

    const avgDays = Math.round((episodes.reduce((a, b) => a + b, 0) / episodes.length) * 10) / 10;
    const minDays = Math.min(...episodes);
    const maxDays = Math.max(...episodes);

    // Find characteristics that match the current mood group
    const moodTypeMap: Record<string, string> = {
      elevated: 'elevated',
      stable: 'stable',
      depressed: 'depressed',
    };
    const matchingChars = characteristics.filter(c => c.mood_type === moodTypeMap[currentGroup.key]);

    return { currentGroup, currentStreak, avgDays, minDays, maxDays, matchingChars, episodes: episodes.length };
  }, [entries, characteristics]);

  if (!analysis) return null;

  const { currentGroup, currentStreak, avgDays, minDays, maxDays, matchingChars, episodes } = analysis;
  const Icon = currentGroup.icon;

  return (
    <section className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lärdomar från förr</h3>
      </div>

      <div className={`rounded-xl ${currentGroup.bgClass} border ${currentGroup.borderClass} p-4 space-y-3`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${currentGroup.colorClass}`} />
          <p className="font-semibold">{currentGroup.label} – dag {currentStreak}</p>
        </div>

        {episodes > 0 && avgDays > 0 ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Du har haft <span className="font-semibold text-foreground">{episodes}</span> tidigare {currentGroup.label.toLowerCase()}-perioder. 
                De varade i snitt <span className="font-semibold text-foreground">{avgDays} {avgDays === 1 ? 'dag' : 'dagar'}</span>
                {minDays !== maxDays && (
                  <> (mellan {minDays} och {maxDays} dagar)</>
                )}.
              </p>
            </div>

            {currentStreak < avgDays ? (
              <p className="text-xs text-muted-foreground pl-6">
                Du är på dag {currentStreak} av i snitt {avgDays}. Baserat på historiken har du oftast 
                <span className="font-semibold text-foreground"> {Math.round(avgDays - currentStreak)}</span> {Math.round(avgDays - currentStreak) === 1 ? 'dag' : 'dagar'} kvar.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground pl-6">
                Du har passerat din genomsnittliga {currentGroup.label.toLowerCase()}-period ({avgDays} dagar). 
                En förändring kan vara nära.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Detta är din första {currentGroup.label.toLowerCase()}-period. Mer data behövs för att hitta mönster.
          </p>
        )}
      </div>

      {matchingChars.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Kännetecken som kan förekomma när du är {currentGroup.label.toLowerCase()}:
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {matchingChars.map(c => (
              <span
                key={c.id}
                className={`text-xs px-3 py-1.5 rounded-full ${currentGroup.bgClass} border ${currentGroup.borderClass} font-medium`}
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

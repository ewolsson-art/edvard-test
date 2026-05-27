import { useMemo } from 'react';
import { ArrowRight, Repeat } from 'lucide-react';
import { detectEpisodes, type Episode, type EpisodeKind } from '@/lib/episodeDetection';
import { useMoodData } from '@/hooks/useMoodData';

type PhaseKind = 'elevated' | 'depressed' | 'mixed' | 'stable';

interface Phase {
  kind: PhaseKind;
  startDate: string;
  endDate: string;
  days: number;
}

const PHASE_META: Record<PhaseKind, { label: string; color: string; dot: string }> = {
  elevated:  { label: 'Uppvarvad', color: 'text-orange-300', dot: 'bg-orange-400' },
  depressed: { label: 'Nedstämd',  color: 'text-blue-300',   dot: 'bg-blue-400' },
  mixed:     { label: 'Blandad',   color: 'text-red-300',    dot: 'bg-red-400' },
  stable:    { label: 'Stabil',    color: 'text-emerald-300',dot: 'bg-emerald-400' },
};

const SWE_MONTHS = ['jan', 'feb', 'mars', 'april', 'maj', 'juni', 'juli', 'aug', 'sept', 'okt', 'nov', 'dec'];
const fmt = (d: string) => {
  const date = new Date(d);
  return `${date.getDate()} ${SWE_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const episodeToPhase = (kind: EpisodeKind): PhaseKind => {
  if (kind === 'manic' || kind === 'hypomanic') return 'elevated';
  if (kind === 'depressive') return 'depressed';
  return 'mixed';
};

const dayDiff = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

function buildPhases(episodes: Episode[]): Phase[] {
  if (episodes.length === 0) return [];
  // Collapse consecutive episodes of the same phase kind
  const raw: Phase[] = episodes.map(e => ({
    kind: episodeToPhase(e.kind),
    startDate: e.startDate,
    endDate: e.endDate,
    days: e.days,
  }));

  const phases: Phase[] = [];
  for (const p of raw) {
    const last = phases[phases.length - 1];
    if (last && last.kind === p.kind && dayDiff(last.endDate, p.startDate) <= 3) {
      last.endDate = p.endDate > last.endDate ? p.endDate : last.endDate;
      last.days = dayDiff(last.startDate, last.endDate) + 1;
    } else {
      phases.push({ ...p });
    }
  }

  // Insert stable phases in gaps ≥ 5 days
  const withStable: Phase[] = [];
  for (let i = 0; i < phases.length; i++) {
    withStable.push(phases[i]);
    const next = phases[i + 1];
    if (next) {
      const gap = dayDiff(phases[i].endDate, next.startDate) - 1;
      if (gap >= 5) {
        const start = new Date(phases[i].endDate);
        start.setDate(start.getDate() + 1);
        const end = new Date(next.startDate);
        end.setDate(end.getDate() - 1);
        withStable.push({
          kind: 'stable',
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          days: gap,
        });
      }
    }
  }
  return withStable;
}

interface Transition {
  from: PhaseKind;
  to: PhaseKind;
  fromPhase: Phase;
  toPhase: Phase;
}

export function MoodTransitions() {
  const { entries, isLoaded } = useMoodData();

  const { transitions, phases, grouped } = useMemo(() => {
    const eps = detectEpisodes(entries);
    const phs = buildPhases(eps);
    const trans: Transition[] = [];
    for (let i = 0; i < phs.length - 1; i++) {
      if (phs[i].kind !== phs[i + 1].kind) {
        trans.push({ from: phs[i].kind, to: phs[i + 1].kind, fromPhase: phs[i], toPhase: phs[i + 1] });
      }
    }
    const g = new Map<string, Transition[]>();
    for (const t of trans) {
      const key = `${t.from}->${t.to}`;
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(t);
    }
    const sorted = [...g.entries()].sort((a, b) => b[1].length - a[1].length);
    return { transitions: trans, phases: phs, grouped: sorted };
  }, [entries]);

  if (!isLoaded) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Repeat className="h-5 w-5 text-[hsl(45_85%_55%)]" />
        <h2 className="text-lg font-semibold">Hur du rör dig mellan faser</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Varje gång ditt mående har skiftat tydligt — t.ex. från en uppvarvad period till en nedstämd. Här ser du alla övergångar i din historik.
      </p>

      {phases.length < 2 ? (
        <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Vi behöver fler perioder i historiken för att kartlägga övergångar. Fortsätt checka in dagligen — mönstren växer fram.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([key, list]) => {
            const [fromK, toK] = key.split('->') as [PhaseKind, PhaseKind];
            const fromMeta = PHASE_META[fromK];
            const toMeta = PHASE_META[toK];
            return (
              <div key={key} className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
                  <div className="flex items-center gap-2.5 text-[15px] font-medium">
                    <span className={`inline-flex items-center gap-1.5 ${fromMeta.color}`}>
                      <span className={`w-2 h-2 rounded-full ${fromMeta.dot}`} />
                      {fromMeta.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
                    <span className={`inline-flex items-center gap-1.5 ${toMeta.color}`}>
                      <span className={`w-2 h-2 rounded-full ${toMeta.dot}`} />
                      {toMeta.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {list.length} {list.length === 1 ? 'gång' : 'gånger'}
                  </span>
                </div>
                <ul className="divide-y divide-border/10">
                  {list
                    .slice()
                    .sort((a, b) => b.fromPhase.startDate.localeCompare(a.fromPhase.startDate))
                    .map((t, i) => (
                      <li key={i} className="px-5 py-3 text-[13px] text-foreground/80 leading-relaxed">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-muted-foreground/70">
                            {fmt(t.fromPhase.startDate)} – {fmt(t.fromPhase.endDate)}
                          </span>
                          <span className="text-muted-foreground/40">→</span>
                          <span className="text-foreground/90">
                            {fmt(t.toPhase.startDate)} – {fmt(t.toPhase.endDate)}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground/50 mt-0.5">
                          {t.fromPhase.days} dagar {PHASE_META[t.from].label.toLowerCase()} → {t.toPhase.days} dagar {PHASE_META[t.to].label.toLowerCase()}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

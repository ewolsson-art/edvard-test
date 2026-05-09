// === EPISODE BANDS (smart episode detection visualization) ===
// Isolated component — to remove this entire feature:
//   1. Delete this file (src/components/EpisodeBands.tsx)
//   2. Delete src/lib/episodeDetection.ts
//   3. Remove the <EpisodeBands /> block in src/pages/Overview.tsx
//      (it's wrapped in === EPISODE BANDS START/END === comments)

import { useMemo, useState } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { AlertTriangle, Phone, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { MoodEntry } from '@/types/mood';
import { detectEpisodes, EPISODE_META, type Episode, type EpisodeKind } from '@/lib/episodeDetection';
import { TurtleLogo } from '@/components/TurtleLogo';

interface EpisodeBandsProps {
  entries: MoodEntry[];
  /** Number of days to render in the timeline. Defaults to 30. */
  days?: number;
}

const KIND_FILL: Record<EpisodeKind, string> = {
  hypomanic: 'hsl(45 85% 55%)',
  manic: 'hsl(28 90% 55%)',
  depressive: 'hsl(215 75% 55%)',
  mixed: 'hsl(0 75% 55%)',
};

// === TIDIGA SIGNALER (prodromer) ===
// Diskreta observationer i den senaste veckan jämfört med personlig baseline (60 d).
// Returnerar 0–3 enradiga svenska meningar. Aldrig varningar — bara konstateranden.
function detectEarlySignals(entries: MoodEntry[]): string[] {
  if (!entries || entries.length < 14) return [];

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7); // senaste 7 in-checkningarna
  const baseline = sorted.slice(-67, -7); // föregående ~60 dagar
  if (baseline.length < 14) return [];

  const SHORT_SLEEP = new Set(['very_little', 'little']);
  const LOW_EAT = new Set(['very_little', 'little']);
  const HIGH_EAT = new Set(['very_good']); // proxy för "äter mycket mer än vanligt"

  const signals: string[] = [];

  // Sömn: hur många nätter i rad senast har varit korta?
  let shortRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].sleepQuality && SHORT_SLEEP.has(recent[i].sleepQuality!)) shortRun++;
    else break;
  }
  const baselineShortRate =
    baseline.filter((e) => e.sleepQuality && SHORT_SLEEP.has(e.sleepQuality!)).length /
    baseline.length;
  if (shortRun >= 3 && baselineShortRate < 0.4) {
    signals.push(`Sömnen har varit kortare än ditt snitt ${shortRun} nätter i rad.`);
  }

  // Energi: hög energi flera dagar i rad
  let highEnergyRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].energyLevel === 'high') highEnergyRun++;
    else break;
  }
  const baselineHighRate =
    baseline.filter((e) => e.energyLevel === 'high').length / baseline.length;
  if (highEnergyRun >= 3 && baselineHighRate < 0.4) {
    signals.push(`Energin har legat högt ${highEnergyRun} dagar i rad.`);
  }

  // Aptit: minskad aptit flera dagar i rad
  let lowEatRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].eatingQuality && LOW_EAT.has(recent[i].eatingQuality!)) lowEatRun++;
    else break;
  }
  const baselineLowEatRate =
    baseline.filter((e) => e.eatingQuality && LOW_EAT.has(e.eatingQuality!)).length /
    baseline.length;
  if (lowEatRun >= 3 && baselineLowEatRate < 0.4) {
    signals.push(`Aptiten har varit lägre än ditt snitt ${lowEatRun} dagar i rad.`);
  }

  // Ökad aptit (hyperfagi-signal)
  let highEatRun = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].eatingQuality && HIGH_EAT.has(recent[i].eatingQuality!)) highEatRun++;
    else break;
  }
  const baselineHighEatRate =
    baseline.filter((e) => e.eatingQuality && HIGH_EAT.has(e.eatingQuality!)).length /
    baseline.length;
  if (highEatRun >= 3 && baselineHighEatRate < 0.3) {
    signals.push(`Aptiten har varit högre än ditt snitt ${highEatRun} dagar i rad.`);
  }

  return signals.slice(0, 3);
}


export function EpisodeBands({ entries, days = 14 }: EpisodeBandsProps) {
  const [expanded, setExpanded] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const startDate = useMemo(() => subDays(today, days - 1), [today, days]);

  // Senaste 14 dagarna — vad vi visar i tidslinjen
  const windowEntries = useMemo(
    () => entries.filter((e) => parseISO(e.date) >= startDate),
    [entries, startDate],
  );

  const episodes = useMemo(() => detectEpisodes(windowEntries), [windowEntries]);

  // ALLA historiska episoder — för att hitta "sist du visade detta mönster ledde det till..."
  const allEpisodes = useMemo(() => detectEpisodes(entries), [entries]);

  // === TIDIGA SIGNALER (prodromer) — diskreta rader, inga varningar ===
  const earlySignals = useMemo(() => detectEarlySignals(entries), [entries]);


  // För varje aktuell episod: hitta senaste tidigare episod av SAMMA typ (innan fönstret),
  // och se vad som följde inom 30 dagar.
  const historicalContext = useMemo(() => {
    const map = new Map<string, { priorDate: string; followedBy?: Episode }>();
    for (const current of episodes) {
      const priorSameKind = [...allEpisodes]
        .filter(
          (e) =>
            e.kind === current.kind &&
            parseISO(e.endDate) < startDate,
        )
        .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];

      if (!priorSameKind) continue;

      const priorEnd = parseISO(priorSameKind.endDate);
      const followedBy = allEpisodes
        .filter((e) => {
          const start = parseISO(e.startDate);
          const diff = (start.getTime() - priorEnd.getTime()) / 86_400_000;
          return diff > 0 && diff <= 30 && e.kind !== priorSameKind.kind;
        })
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

      map.set(`${current.kind}-${current.startDate}`, {
        priorDate: priorSameKind.startDate,
        followedBy,
      });
    }
    return map;
  }, [episodes, allEpisodes, startDate]);

  const mixedEpisode = episodes.find((e) => e.kind === 'mixed');

  // Don't render anything until we have at least 3 entries — the bands would be misleading
  if (windowEntries.length < 3) return null;

  // No episodes detected → render a calm, reassuring strip (no scary empty state)
  if (episodes.length === 0) {
    return (
      <div className="rounded-2xl bg-foreground/[0.03] border border-border/30 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Inga episoder upptäckta de senaste {days} dagarna.
          </span>
          <span className="text-xs text-muted-foreground/60">
            {windowEntries.length} check-ins
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* === CRISIS TURTLE INDICATOR for mixed episodes === */}
      {mixedEpisode && (
        <CrisisTurtleButton onClick={() => setCrisisOpen(true)} />
      )}
      {mixedEpisode && crisisOpen && (
        <CrisisDialog episode={mixedEpisode} onClose={() => setCrisisOpen(false)} />
      )}

      <div className="rounded-2xl bg-foreground/[0.03] border border-border/30 overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-foreground/90">
              Mönster senaste {days} dagarna
            </span>
            <span className="text-xs text-muted-foreground/70">
              {episodes.length} {episodes.length === 1 ? 'period' : 'perioder'}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          )}
        </button>

        {/* Timeline strip — always visible */}
        <div className="px-4 pb-3">
          <Timeline episodes={episodes} startDate={startDate} days={days} />
        </div>

        {expanded && (
          <div className="border-t border-border/20 p-4 space-y-2.5">
            {earlySignals.length > 0 && (
              <ul className="space-y-1 pb-1">
                {earlySignals.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground/80 leading-relaxed"
                  >
                    <span className="text-foreground/55 mr-1.5">·</span>
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {episodes.map((ep, i) => (
              <EpisodeRow
                key={`${ep.kind}-${ep.startDate}-${i}`}
                episode={ep}
                history={historicalContext.get(`${ep.kind}-${ep.startDate}`)}
              />
            ))}
            <p className="text-[11px] leading-relaxed text-muted-foreground/70 pt-1.5 border-t border-border/15">
              Detta är inga läkarråd eller en klinisk bedömning — bara tekniska spaningar
              i din egen data. Se det som en hjälp att uppmärksamma mönster, inget annat.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function Timeline({ episodes, startDate, days }: { episodes: Episode[]; startDate: Date; days: number }) {
  return (
    <div className="relative h-6 w-full rounded-md bg-foreground/[0.04] overflow-hidden">
      {episodes.map((ep, i) => {
        const epStart = parseISO(ep.startDate);
        const epEnd = parseISO(ep.endDate);
        const offsetDays = Math.max(0, differenceInDays(epStart, startDate));
        const widthDays = Math.max(1, differenceInDays(epEnd, epStart) + 1);
        const left = (offsetDays / days) * 100;
        const width = (widthDays / days) * 100;
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              backgroundColor: KIND_FILL[ep.kind],
              opacity: ep.kind === 'mixed' ? 0.95 : 0.8,
            }}
            title={`${EPISODE_META[ep.kind].label} (${ep.days} dagar)`}
          />
        );
      })}
      {/* Today marker */}
      <div className="absolute top-0 bottom-0 right-0 w-px bg-foreground/40" />
    </div>
  );
}

function EpisodeRow({
  episode,
  history,
}: {
  episode: Episode;
  history?: { priorDate: string; followedBy?: Episode };
}) {
  const meta = EPISODE_META[episode.kind];
  const startLabel = format(parseISO(episode.startDate), 'd MMM', { locale: sv });
  const endLabel = format(parseISO(episode.endDate), 'd MMM', { locale: sv });
  const dateLabel = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

  const priorLabel = history
    ? format(parseISO(history.priorDate), 'd MMM yyyy', { locale: sv })
    : null;
  const followedKindLabel = history?.followedBy
    ? EPISODE_META[history.followedBy.kind].label.toLowerCase()
    : null;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-3`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
        <span className="text-xs text-muted-foreground/80">
          {dateLabel} · {episode.days} {episode.days === 1 ? 'dag' : 'dagar'}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>

      {history && priorLabel && (
        <div className="mt-2.5 pt-2.5 border-t border-foreground/[0.06]">
          <p className="text-[11px] text-muted-foreground/85 leading-relaxed">
            <span className="text-foreground/70 font-medium">Historiskt mönster: </span>
            {followedKindLabel ? (
              <>
                Sist du visade ett liknande mönster ({priorLabel}) följdes det inom kort
                av en period av <span className="text-foreground/80">{followedKindLabel}</span>.
              </>
            ) : (
              <>Du visade ett liknande mönster senast {priorLabel}.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function CrisisTurtleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Vi ser några varningstecken — visa stödresurser"
      className="fixed bottom-24 right-5 z-[90] group flex items-end gap-2 rounded-2xl bg-card/90 backdrop-blur-md border border-red-500/40 shadow-lg shadow-red-500/10 p-2 pr-3 hover:border-red-500/70 hover:bg-card transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      <span className="relative block">
        <TurtleLogo size="md" staticPose />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-card animate-pulse" />
      </span>
      <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground pb-1">
        Varning
      </span>
    </button>
  );
}


function CrisisDialog({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.06] transition-colors"
          aria-label="Stäng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 mt-0.5 h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Vi ser några varningstecken
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Du har varit uppvarvad samtidigt som du registrerat mörka tankar. Det är en period
              då många mår sämre än de tror — du förtjänar att prata med någon nu.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <a
            href="tel:112"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/20 border border-red-500/30 transition-colors"
          >
            <Phone className="h-4 w-4 text-red-400 shrink-0" />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">112 — vid akut fara</div>
              <div className="text-xs text-muted-foreground">Ring direkt om du eller någon annan är i fara</div>
            </div>
          </a>
          <a
            href="tel:90101"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.07] border border-border/40 transition-colors"
          >
            <Phone className="h-4 w-4 text-foreground/80 shrink-0" />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">90101 — Mind Självmordslinjen</div>
              <div className="text-xs text-muted-foreground">Anonym samtalspartner, dygnet runt</div>
            </div>
          </a>
          <a
            href="tel:1177"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.07] border border-border/40 transition-colors"
          >
            <Phone className="h-4 w-4 text-foreground/80 shrink-0" />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">1177 — Vårdguiden</div>
              <div className="text-xs text-muted-foreground">Sjukvårdsrådgivning dygnet runt</div>
            </div>
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full text-xs text-muted-foreground/70 hover:text-foreground py-2 transition-colors"
        >
          Jag är trygg just nu — stäng
        </button>
      </div>
    </div>
  );
}

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

export function EpisodeBands({ entries, days = 30 }: EpisodeBandsProps) {
  const [expanded, setExpanded] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const startDate = useMemo(() => subDays(today, days - 1), [today, days]);

  // Only consider entries inside the visible window
  const windowEntries = useMemo(
    () => entries.filter((e) => parseISO(e.date) >= startDate),
    [entries, startDate],
  );

  const episodes = useMemo(() => detectEpisodes(windowEntries), [windowEntries]);

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
            {episodes.map((ep, i) => (
              <EpisodeRow key={`${ep.kind}-${ep.startDate}-${i}`} episode={ep} />
            ))}
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

function EpisodeRow({ episode }: { episode: Episode }) {
  const meta = EPISODE_META[episode.kind];
  const startLabel = format(parseISO(episode.startDate), 'd MMM', { locale: sv });
  const endLabel = format(parseISO(episode.endDate), 'd MMM', { locale: sv });
  const dateLabel = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-3`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
        <span className="text-xs text-muted-foreground/80">
          {dateLabel} · {episode.days} {episode.days === 1 ? 'dag' : 'dagar'}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
    </div>
  );
}

function CrisisTurtleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Vi ser några varningstecken — visa stödresurser"
      className="fixed bottom-24 right-5 z-[90] group flex items-center gap-2 rounded-full bg-card/90 backdrop-blur-md border border-red-500/40 shadow-lg shadow-red-500/10 pl-1.5 pr-3 py-1.5 hover:border-red-500/70 hover:bg-card transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      <span className="relative">
        <TurtleLogo size="sm" mood="severe_depressed" framing="face" staticPose />
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-card animate-pulse" />
      </span>
      <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground">
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

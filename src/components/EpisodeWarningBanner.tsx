import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ChevronRight } from 'lucide-react';
import { detectActiveWarnings, SEVERITY_META, type ActiveWarning } from '@/lib/episodeDetection';
import type { MoodEntry } from '@/types/mood';

interface Props {
  entries: MoodEntry[];
}

const STORAGE_KEY = 'toddy:warning-dismissed-v1';

interface DismissState {
  // Map of warning signature → ISO date dismissed
  [signature: string]: string;
}

function signatureFor(w: ActiveWarning): string {
  return `${w.kind}:${w.daysObserved}:${w.severity}`;
}

function readDismissed(): DismissState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDismissed(state: DismissState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function EpisodeWarningBanner({ entries }: Props) {
  const warnings = useMemo(() => detectActiveWarnings(entries), [entries]);
  const [dismissed, setDismissed] = useState<DismissState>({});

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  // Critical warnings can NEVER be dismissed permanently — they re-appear every load.
  const visible = warnings.filter((w) => {
    if (w.severity === 'critical') return true;
    const sig = signatureFor(w);
    const dismissedAt = dismissed[sig];
    if (!dismissedAt) return true;
    // Allow re-show after 24h
    return Date.now() - new Date(dismissedAt).getTime() > 24 * 60 * 60 * 1000;
  });

  if (visible.length === 0) return null;

  const handleDismiss = (w: ActiveWarning) => {
    if (w.severity === 'critical') return;
    const sig = signatureFor(w);
    const next = { ...dismissed, [sig]: new Date().toISOString() };
    setDismissed(next);
    writeDismissed(next);
  };

  // Show only the most severe warning (single hero) — others can be added later if needed.
  const top = visible[0];
  const meta = SEVERITY_META[top.severity];

  return (
    <AnimatePresence>
      <motion.div
        key={signatureFor(top)}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`relative rounded-2xl border ${meta.border} ${meta.bg} backdrop-blur-sm px-5 py-4 mb-4`}
        role={top.severity === 'critical' ? 'alert' : 'status'}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none mt-0.5" aria-hidden>{meta.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${meta.text}`}>
                {meta.label}
              </span>
              {top.pastReference && (
                <span className="text-[11px] text-white/40">
                  · liknar tidigare mönster
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white leading-tight mb-1.5">
              {top.title}
            </h3>
            <p className="text-sm text-white/75 leading-relaxed">
              {top.body}
            </p>

            {/* Suicidal / critical → direct action buttons */}
            {top.suicidalSignal && (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="tel:90101"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  Mind 90101
                </a>
                <a
                  href="tel:1177"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  1177
                </a>
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  112
                </a>
              </div>
            )}

            {/* Non-critical → soft action */}
            {!top.suicidalSignal && (
              <a
                href="/monster"
                className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${meta.text} hover:opacity-80 transition-opacity`}
              >
                Se mönster och historik
                <ChevronRight className="w-3 h-3" />
              </a>
            )}
          </div>

          {top.severity !== 'critical' && (
            <button
              onClick={() => handleDismiss(top)}
              className="flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              aria-label="Dölj varning i 24 timmar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

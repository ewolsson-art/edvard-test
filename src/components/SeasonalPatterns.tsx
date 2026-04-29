import { useMemo } from 'react';
import { MoodEntry } from '@/types/mood';
import { Sparkles } from 'lucide-react';

interface SeasonalPatternsProps {
  entries: MoodEntry[];
}

const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const seasonOf = (m: number) => (m <= 1 || m === 11 ? 'Vinter' : m <= 4 ? 'Vår' : m <= 7 ? 'Sommar' : 'Höst');

type MonthAgg = {
  year: number;
  month: number;
  elevated: number;
  stable: number;
  depressed: number;
  total: number;
};

/**
 * Säsongsvy: visar varje månad senaste 24 mån som ett horisontellt färgband.
 * Hjälper användaren upptäcka säsongsmönster (t.ex. mer uppvarvad på våren,
 * mer nedstämd på hösten) — något många bara ser när det visualiseras över tid.
 */
export function SeasonalPatterns({ entries }: SeasonalPatternsProps) {
  const months = useMemo<MonthAgg[]>(() => {
    const now = new Date();
    const list: MonthAgg[] = [];
    // 24 månader bakåt, äldsta först
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth(), elevated: 0, stable: 0, depressed: 0, total: 0 });
    }
    const idx: Record<string, MonthAgg> = {};
    list.forEach(m => { idx[`${m.year}-${m.month}`] = m; });

    entries.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = idx[key];
      if (!bucket) return;
      if (e.mood === 'severe_elevated' || e.mood === 'elevated' || e.mood === 'somewhat_elevated') {
        bucket.elevated++;
      } else if (e.mood === 'stable') {
        bucket.stable++;
      } else if (e.mood === 'somewhat_depressed' || e.mood === 'depressed' || e.mood === 'severe_depressed') {
        bucket.depressed++;
      }
      bucket.total++;
    });
    return list;
  }, [entries]);

  // Insight: identifiera vilken säsong som har mest uppvarvad respektive nedstämd
  const insight = useMemo(() => {
    const seasons: Record<string, { elev: number; depr: number; total: number }> = {
      'Vinter': { elev: 0, depr: 0, total: 0 },
      'Vår': { elev: 0, depr: 0, total: 0 },
      'Sommar': { elev: 0, depr: 0, total: 0 },
      'Höst': { elev: 0, depr: 0, total: 0 },
    };
    months.forEach(m => {
      const s = seasonOf(m.month);
      seasons[s].elev += m.elevated;
      seasons[s].depr += m.depressed;
      seasons[s].total += m.total;
    });

    const totalRegistered = months.reduce((sum, m) => sum + m.total, 0);
    if (totalRegistered < 30) return null; // för lite data

    let topElev: { season: string; ratio: number } | null = null;
    let topDepr: { season: string; ratio: number } | null = null;
    Object.entries(seasons).forEach(([season, s]) => {
      if (s.total < 10) return;
      const elevRatio = s.elev / s.total;
      const deprRatio = s.depr / s.total;
      if (!topElev || elevRatio > topElev.ratio) topElev = { season, ratio: elevRatio };
      if (!topDepr || deprRatio > topDepr.ratio) topDepr = { season, ratio: deprRatio };
    });

    const parts: string[] = [];
    if (topElev && topElev.ratio > 0.2) {
      parts.push(`fler uppvarvade dagar på ${topElev.season.toLowerCase()}en`);
    }
    if (topDepr && topDepr.ratio > 0.2 && topDepr.season !== topElev?.season) {
      parts.push(`fler nedstämda dagar på ${topDepr.season.toLowerCase()}en`);
    }
    if (parts.length === 0) return null;
    return `Senaste två åren: ${parts.join(' och ')}.`;
  }, [months]);

  const hasAnyData = months.some(m => m.total > 0);

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Säsongsmönster</h3>
        <span className="text-[11px] text-muted-foreground">Senaste 24 mån</span>
      </div>

      {!hasAnyData ? (
        <p className="text-sm text-muted-foreground italic">
          När du registrerat under en längre tid visas dina säsongsmönster här.
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            {months.map((m, i) => {
              const showYearLabel = i === 0 || m.month === 0;
              const total = m.total || 1;
              const elevPct = (m.elevated / total) * 100;
              const stabPct = (m.stable / total) * 100;
              const deprPct = (m.depressed / total) * 100;
              const emptyPct = m.total === 0 ? 100 : 0;
              return (
                <div key={`${m.year}-${m.month}`} className="flex items-center gap-2">
                  <div className="w-14 text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {monthShort[m.month]}
                    {showYearLabel && <span className="ml-1 opacity-60">{String(m.year).slice(2)}</span>}
                  </div>
                  <div className="flex-1 h-3 rounded-full overflow-hidden bg-muted/30 flex">
                    {emptyPct > 0 ? (
                      <div className="w-full h-full" />
                    ) : (
                      <>
                        {elevPct > 0 && <div style={{ width: `${elevPct}%` }} className="bg-[hsl(45_95%_55%/0.85)]" />}
                        {stabPct > 0 && <div style={{ width: `${stabPct}%` }} className="bg-[hsl(142_70%_45%/0.7)]" />}
                        {deprPct > 0 && <div style={{ width: `${deprPct}%` }} className="bg-[hsl(0_75%_55%/0.85)]" />}
                      </>
                    )}
                  </div>
                  <div className="w-8 text-[10px] text-muted-foreground tabular-nums text-right shrink-0">
                    {m.total > 0 ? m.total : '–'}
                  </div>
                </div>
              );
            })}
          </div>

          {insight && (
            <div className="mt-5 flex gap-2.5 p-3.5 rounded-2xl bg-primary/5 border border-primary/10">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/90 leading-relaxed">{insight}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-border/30 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(45_95%_55%)]" />
              <span className="text-[11px] text-muted-foreground">Uppvarvad</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(142_70%_45%)]" />
              <span className="text-[11px] text-muted-foreground">Stabil</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(0_75%_55%)]" />
              <span className="text-[11px] text-muted-foreground">Nedstämd</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

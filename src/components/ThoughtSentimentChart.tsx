import { useThoughtAnalysis } from '@/hooks/useThoughtAnalysis';
import { Sparkles, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

/**
 * Visualises the emotional tone of a user's daily thoughts as a sparkline,
 * with a one-line read of how the tone has shifted over the last week.
 */
export function ThoughtSentimentChart() {
  const { rows, isLoading, analyze, isAnalyzing, trend, weekAvg } = useThoughtAnalysis();

  if (isLoading) {
    return <div className="h-24 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const points = rows.slice(-30);

  if (points.length < 3) {
    return (
      <div className="rounded-2xl bg-foreground/[0.03] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground/80">Tankar över tid</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Skriv en tanke i några check-ins så analyserar AI:n tonen över tid.
        </p>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => analyze()} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
          Kör analys
        </Button>
      </div>
    );
  }

  // Sparkline geometry
  const W = 320;
  const H = 60;
  const xs = points.map((_, i) => (i / Math.max(1, points.length - 1)) * W);
  const ys = points.map((p) => H / 2 - (Number(p.sentiment) * (H / 2 - 4)));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');

  const trendLabel =
    trend < -0.2
      ? 'Tonen har blivit mörkare senaste veckan'
      : trend > 0.2
      ? 'Tonen har blivit ljusare senaste veckan'
      : 'Stabil ton senaste veckan';
  const TrendIcon = trend < -0.05 ? TrendingDown : trend > 0.05 ? TrendingUp : Sparkles;
  const trendColor = trend < -0.2 ? 'text-orange-400' : trend > 0.2 ? 'text-green-400' : 'text-foreground/60';

  const rangeStart = parseISO(points[0].date);
  const rangeEnd = parseISO(points[points.length - 1].date);

  return (
    <div className="rounded-2xl bg-foreground/[0.03] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-foreground/80">Tankar över tid</h3>
          </div>
          <p className={`text-sm mt-1 flex items-center gap-1.5 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendLabel}
          </p>
        </div>
        <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={() => analyze()} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Uppdatera'}
        </Button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
        {/* Zero line */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="currentColor" strokeWidth={0.4} className="text-foreground/15" strokeDasharray="2 3" />
        {/* Sparkline */}
        <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className={trend < -0.2 ? 'text-orange-400' : 'text-primary'} strokeLinecap="round" strokeLinejoin="round" />
        {/* Last point */}
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2.5} fill="currentColor" className={trend < -0.2 ? 'text-orange-400' : 'text-primary'} />
      </svg>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{format(rangeStart, 'd MMM', { locale: sv })}</span>
        <span>{points.length} dagar med tankar</span>
        <span>{format(rangeEnd, 'd MMM', { locale: sv })}</span>
      </div>
    </div>
  );
}

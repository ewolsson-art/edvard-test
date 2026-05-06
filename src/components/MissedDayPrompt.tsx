import { format, parseISO, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarDays, ArrowRight, Flame } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';

interface MissedDayPromptProps {
  missedDays: string[];           // yyyy-MM-dd, most recent first
  currentStreak: number;
  onPickMissedDay: (date: Date) => void;
  onCheckInToday: () => void;
}

function formatLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isYesterday(d)) return 'Igår';
  return format(d, 'EEEE d MMM', { locale: sv });
}

function formatSubLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  return format(d, 'd MMMM', { locale: sv });
}

export function MissedDayPrompt({
  missedDays,
  currentStreak,
  onPickMissedDay,
  onCheckInToday,
}: MissedDayPromptProps) {
  const count = missedDays.length;
  const onlyYesterday = count === 1 && isYesterday(parseISO(missedDays[0]));

  const headline = onlyYesterday
    ? 'Du glömde checka in igår'
    : count === 1
      ? 'Du missade en dag'
      : `Du missade ${count} dagar`;

  const sub = onlyYesterday
    ? 'Inga problem — fyll i hur igår var, så är du i fas igen. Det tar bara en halv minut.'
    : currentStreak > 0
      ? `Fyll i de missade dagarna för att rädda din streak på ${currentStreak} ${currentStreak === 1 ? 'dag' : 'dagar'}.`
      : 'Fyll i hur dagarna var så får du en mer rättvis bild över tid.';

  const primaryDay = missedDays[0];
  const restDays = missedDays.slice(1);

  return (
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-5 pt-12 pb-6 md:pt-4 md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-24 h-24 mb-6 flex items-center justify-center">
          <TurtleLogo size="lg" animated={false} className="scale-[2]" />
        </div>
        <p className="text-muted-foreground/50 text-[13px] tracking-[0.08em] uppercase font-semibold mb-3">
          En liten påminnelse
        </p>
        <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight mb-3">
          {headline}
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-[340px] leading-relaxed">
          {sub}
        </p>

        {currentStreak > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(45_85%_55%/0.12)] border border-[hsl(45_85%_55%/0.25)]">
            <Flame className="w-4 h-4 text-[hsl(45_85%_55%)]" />
            <span className="text-[14px] font-semibold text-[hsl(45_85%_55%)] tabular-nums">
              {currentStreak} {currentStreak === 1 ? 'dag' : 'dagar'} i rad
            </span>
          </div>
        )}
      </div>

      {/* Primary CTA — fill in the missed day */}
      <div className="max-w-md w-full mx-auto">
        <button
          onClick={() => onPickMissedDay(parseISO(primaryDay))}
          className="w-full px-6 py-4 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:bg-[hsl(45_85%_62%)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-2"
        >
          Fyll i {formatLabel(primaryDay).toLowerCase()}
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Other missed days as secondary list */}
        {restDays.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-[12px] tracking-[0.1em] uppercase font-medium text-muted-foreground/60 px-1 mb-2">
              Andra missade dagar
            </p>
            {restDays.map((d) => (
              <button
                key={d}
                onClick={() => onPickMissedDay(parseISO(d))}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all active:scale-[0.99] text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-muted-foreground/70" />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-foreground capitalize leading-tight">
                      {formatLabel(d)}
                    </p>
                    <p className="text-[12px] text-muted-foreground/60 mt-0.5">
                      {formatSubLabel(d)}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        )}

        {/* Secondary action — skip to today */}
        <button
          onClick={onCheckInToday}
          className="w-full mt-5 py-3 text-[14px] font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          Hoppa över och checka in för idag
        </button>
        <p className="text-[12px] text-muted-foreground/40 text-center mt-1 leading-relaxed">
          Du kan alltid fylla i missade dagar senare via kalendern.
        </p>
      </div>
    </div>
  );
}

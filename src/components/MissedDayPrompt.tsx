import { format, parseISO, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarDays, ArrowRight, Flame, AlertTriangle } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';

interface MissedDayPromptProps {
  missedDays: string[];           // yyyy-MM-dd, most recent first
  currentStreak: number;
  potentialStreak?: number;
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
  potentialStreak = 0,
  onPickMissedDay,
  onCheckInToday,
}: MissedDayPromptProps) {
  const count = missedDays.length;
  const onlyYesterday = count === 1 && isYesterday(parseISO(missedDays[0]));

  const numberWords = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];
  const countWord = count <= 12 ? numberWords[count] : String(count);

  const headline = onlyYesterday
    ? 'Du glömde checka in igår'
    : count === 1
      ? 'Du har missat en dag'
      : `Du har missat ${countWord} dagar`;

  const sub = onlyYesterday
    ? null
    : currentStreak > 0
      ? `Fyll i de missade dagarna för att rädda din streak på ${currentStreak} ${currentStreak === 1 ? 'dag' : 'dagar'}.`
      : null;

  const primaryDay = missedDays[0];
  const restDays = missedDays.slice(1);

  return (
    <div className="fade-in h-full md:h-auto flex flex-col justify-center px-5 pt-12 pb-6 md:pt-4 md:glass-card md:p-12 md:max-h-[calc(100vh-4rem)] md:border md:bg-card/80 md:rounded-2xl md:shadow-sm">
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-24 h-24 mb-6 flex items-center justify-center">
          <TurtleLogo size="lg" animated={false} mood="depressed" className="scale-[2]" />
        </div>
        <p className="text-muted-foreground/50 text-[13px] tracking-[0.08em] uppercase font-semibold mb-3">
          En liten påminnelse
        </p>
        <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight mb-3">
          {headline}
        </h1>
        {sub && (
          <p className="text-[15px] text-muted-foreground max-w-[340px] leading-relaxed">
            {sub}
          </p>
        )}

        {potentialStreak > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(45_85%_55%/0.12)] border border-[hsl(45_85%_55%/0.25)]">
            <Flame className="w-4 h-4 text-[hsl(45_85%_55%)]" />
            <span className="text-[14px] font-semibold text-[hsl(45_85%_55%)] tabular-nums">
              {potentialStreak} {potentialStreak === 1 ? 'dag' : 'dagar'} i rad
            </span>
            {potentialStreak > currentStreak && (
              <span className="text-[12px] font-medium text-[hsl(45_85%_55%)]/70">
                om du fyller i
              </span>
            )}
          </div>
        )}
      </div>

      {/* Two clear choices */}
      <div className="max-w-md w-full mx-auto space-y-3">
        <button
          onClick={() => onPickMissedDay(parseISO(primaryDay))}
          className="w-full px-6 py-4 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:bg-[hsl(45_85%_62%)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-2"
        >
          Fyll i missade dagar
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onCheckInToday}
          className="w-full px-6 py-4 rounded-full border border-border/60 bg-card/40 text-foreground/80 font-semibold text-base hover:bg-card/70 active:scale-[0.98] transition-all duration-200"
        >
          Hoppa över
        </button>

        {potentialStreak > 0 && (
          <p className="pt-2 text-[12.5px] text-muted-foreground/60 leading-relaxed text-center">
            Du förlorar då din streak.
          </p>
        )}
      </div>
    </div>
  );
}

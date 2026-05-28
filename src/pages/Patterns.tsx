import { PatternInsightsSection } from '@/components/PatternInsightsSection';
import { TurtleLogo } from '@/components/TurtleLogo';
import { PatientCharacteristics } from '@/components/PatientCharacteristics';
import { MoodTransitions } from '@/components/MoodTransitions';
import { OverviewSummary } from '@/components/OverviewSummary';
import { ThoughtJournal } from '@/components/ThoughtJournal';
import { useMoodData } from '@/hooks/useMoodData';
import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

type SectionProps = {
  number: string;
  title: string;
  children: ReactNode;
};

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="space-y-4 scroll-mt-20">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-mono text-muted-foreground/60 tracking-widest pt-1">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>
      <div className="pl-0 sm:pl-9">{children}</div>
    </section>
  );
}

export default function Patterns() {
  const { entries, isLoaded } = useMoodData();
  const { user } = useAuth();
  const latestMood = entries.length > 0 ? entries[entries.length - 1].mood : null;

  // Context line: check-ins last 30 days
  const last30Count = (() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return entries.filter(e => new Date(e.date).getTime() >= cutoff).length;
  })();

  // Aggregate stats across all entries
  const stats = (() => {
    let severe_elevated = 0, elevated = 0, somewhat_elevated = 0, stable = 0, somewhat_depressed = 0, depressed = 0, severe_depressed = 0;
    entries.forEach(e => {
      if (e.mood === 'severe_elevated') severe_elevated++;
      else if (e.mood === 'elevated') elevated++;
      else if (e.mood === 'somewhat_elevated') somewhat_elevated++;
      else if (e.mood === 'stable') stable++;
      else if (e.mood === 'somewhat_depressed') somewhat_depressed++;
      else if (e.mood === 'depressed') depressed++;
      else if (e.mood === 'severe_depressed') severe_depressed++;
    });
    const total = severe_elevated + elevated + somewhat_elevated + stable + somewhat_depressed + depressed + severe_depressed;
    return { severe_elevated, elevated, somewhat_elevated, stable, somewhat_depressed, depressed, severe_depressed, unregistered: 0, total, totalDays: total };
  })();


  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Single subtle background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(45_85%_55%/0.05)] blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto md:mx-0 px-5 md:px-8 pt-10 pb-24 animate-fade-in">
        {/* Compact hero: turtle badge inline with title */}
        <header className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-[hsl(45_85%_55%/0.25)] blur-md" />
              <TurtleLogo size="sm" animated={false} className="relative h-9 w-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Dina mönster
            </h1>
          </div>
          <p className="text-[14px] text-muted-foreground max-w-xl leading-relaxed">
            En sammanhängande läsning av det som återkommer — vad som kännetecknar dig,
            hur du rör dig mellan faser och vilka mönster AI:n hittar över tid.
          </p>
        </header>

        {/* Context line */}
        {isLoaded && (
          <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-[12px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(45_85%_55%)]" />
            {entries.length === 0
              ? 'Inga incheckningar ännu'
              : `${entries.length} incheckningar totalt · ${last30Count} de senaste 30 dagarna`}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-16">
          {isLoaded && (
            <div className="scroll-mt-20">
              <OverviewSummary
                stats={stats as any}
                entries={entries as any}
                periodLabel="Hela historiken"
                sleepBadDays={0}
                showSleep={false}
              />
            </div>
          )}

          {user?.id && (
            <div className="scroll-mt-20">
              <PatientCharacteristics
                patientId={user.id}
                latestMood={latestMood as any}
                isShared={true}
                checkinOnly
              />
            </div>
          )}

          <div className="scroll-mt-20">
            <MoodTransitions />
          </div>

          <div className="scroll-mt-20">
            <PatternInsightsSection />
          </div>

          <div className="scroll-mt-20">
            <ThoughtJournal />
          </div>
        </div>
      </div>
    </div>
  );
}

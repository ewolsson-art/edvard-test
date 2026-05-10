import { PatternInsightsSection } from '@/components/PatternInsightsSection';
import { TurtleLogo } from '@/components/TurtleLogo';
import { OverviewSummary } from '@/components/OverviewSummary';
import { useMoodData } from '@/hooks/useMoodData';

export default function Patterns() {
  const { entries, isLoaded } = useMoodData();

  // Build aggregate stats across all entries (used by OverviewSummary header).
  const stats = (() => {
    let severe_elevated = 0, elevated = 0, somewhat_elevated = 0, stable = 0,
        somewhat_depressed = 0, depressed = 0, severe_depressed = 0;
    entries.forEach(e => {
      switch (e.mood) {
        case 'severe_elevated': severe_elevated++; break;
        case 'elevated': elevated++; break;
        case 'somewhat_elevated': somewhat_elevated++; break;
        case 'stable': stable++; break;
        case 'somewhat_depressed': somewhat_depressed++; break;
        case 'depressed': depressed++; break;
        case 'severe_depressed': severe_depressed++; break;
      }
    });
    const total = severe_elevated + elevated + somewhat_elevated + stable + somewhat_depressed + depressed + severe_depressed;
    return { severe_elevated, elevated, somewhat_elevated, stable, somewhat_depressed, depressed, severe_depressed, unregistered: 0, total, totalDays: total };
  })();

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Lekfulla bakgrundsformer */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[hsl(280_70%_60%/0.10)] blur-3xl" />
        <div className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[hsl(45_85%_55%/0.10)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full bg-[hsl(190_75%_55%/0.08)] blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-24 space-y-10 animate-fade-in">
        {/* Hero */}
        <header className="space-y-4 text-center sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(45_85%_60%/0.4)] to-[hsl(280_70%_60%/0.3)] blur-xl" />
              <TurtleLogo size="lg" animated={false} className="relative h-16 w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Dina mönster
            </h1>
            <p className="text-[15px] text-muted-foreground max-w-md mx-auto sm:mx-0 leading-relaxed">
              AI:n läser hela din historik och letar efter återkommande sekvenser, triggers och cykler i hur du mår.
            </p>
          </div>
        </header>

        {/* Statistik flyttad från Översikt */}
        {isLoaded && (
          <section className="space-y-6">
            <EpisodeBands entries={entries} days={14} />
            <OverviewSummary
              stats={stats}
              entries={entries}
              periodLabel="Hela din historik"
              sleepBadDays={0}
              showSleep={false}
            />
          </section>
        )}

        {/* AI-mönster */}
        <PatternInsightsSection />
      </div>
    </div>
  );
}

import { CalendarDays, LineChart, Users } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';

/**
 * "Så funkar Toddy" – en lugn, varm intro som förklarar vad användaren kan
 * förvänta sig av appen efter onboarding. Tre konkreta löften med Toddy
 * som följeslagare.
 */
export const HowItWorksStep = () => {
  const items = [
    {
      icon: CalendarDays,
      title: '1 minut om dagen',
      desc: 'En liten incheckning – mående, sömn, kanske medicin. Mer behöver det inte vara.',
    },
    {
      icon: LineChart,
      title: 'Mönster över veckor',
      desc: 'Bipolär syns inte på en dag. Toddy visar dig episoderna över tid – innan de blir stora.',
    },
    {
      icon: Users,
      title: 'Du bestämmer vem som ser',
      desc: 'Bjud in läkare eller anhöriga när du vill. Din data är din – alltid.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <TurtleLogo size="sm" className="w-10 h-10 shrink-0" />
        <p className="text-sm text-white/60 leading-relaxed">
          Vi tar det lugnt, ett steg i taget. Här är vad som händer härnäst.
        </p>
      </div>

      <div className="space-y-2.5">
        {items.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]"
          >
            <div className="w-9 h-9 rounded-xl bg-[hsl(45_85%_55%/0.12)] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[hsl(45_85%_55%)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-white/30 text-center pt-1">
        Toddy ersätter inte vården – men hjälper dig och din läkare att se mönster.
      </p>
    </div>
  );
};

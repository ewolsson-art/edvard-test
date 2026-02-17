import { CalendarCheck, BarChart3, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    icon: CalendarCheck,
    title: "Checka in",
  },
  {
    icon: BarChart3,
    title: "Upptäck mönster",
  },
  {
    icon: Share2,
    title: "Dela med läkare och anhöriga",
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export function HowItWorksSection() {
  const { ref, visible } = useInView(0.1);

  return (
    <section className="relative z-10 bg-[hsl(225_30%_7%)] py-20 md:py-32 px-4 md:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <IntroBlock />

        <div ref={ref} className="mt-16 md:mt-24">
          {/* Desktop: horizontal */}
          <div className="hidden md:flex items-start justify-center gap-16">
            {steps.map((step, i) => (
              <StepCard key={step.title} step={step} index={i} visible={visible} />
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="flex md:hidden flex-col items-center gap-10">
            {steps.map((step, i) => (
              <div key={step.title} className="w-full">
                <StepCard step={step} index={i} visible={visible} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 md:mt-20 flex justify-center">
          <a
            href="/signup"
            className="px-10 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-semibold text-base tracking-wide shadow-[0_4px_20px_hsl(45_85%_55%/0.3)] hover:shadow-[0_6px_28px_hsl(45_85%_55%/0.45)] hover:scale-105 active:scale-[0.98] transition-all duration-200"
          >
            Prova på
          </a>
        </div>
      </div>
    </section>
  );
}

function IntroBlock() {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`text-center max-w-2xl mx-auto transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-6">
        Skapad av och för människor med bipolär sjukdom
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-white/70 leading-relaxed max-w-xl mx-auto">
        Toddy är din interaktiva och personliga stämningsdagbok som ger dig bättre koll på ditt mående
        och delar valfri data med läkare och anhöriga
      </p>
    </div>
  );
}

function StepCard({ step, index, visible }: { step: typeof steps[number]; index: number; visible: boolean }) {
  const delay = index * 200;

  return (
    <div
      className={`relative flex flex-col items-center text-center flex-1 max-w-xs mx-auto transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Glow ring */}
      <div
        className={`absolute w-20 h-20 rounded-full bg-[hsl(45_85%_55%/0.06)] blur-xl transition-all duration-1000 ${visible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
        style={{ transitionDelay: `${delay + 100}ms` }}
      />

      {/* Icon with number */}
      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[hsl(45_85%_55%/0.10)] border border-[hsl(45_85%_55%/0.18)] flex items-center justify-center relative mb-5 z-10">
        <step.icon className="w-7 h-7 text-[hsl(45_85%_55%)]" />
        <span className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] text-xs font-bold flex items-center justify-center shadow-lg">
          {index + 1}
        </span>
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-white">
        {step.title}
      </h3>
    </div>
  );
}

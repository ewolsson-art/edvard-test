import { CalendarCheck, BarChart3, Share2, SmilePlus, Moon, Utensils, Dumbbell, Pill, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    icon: CalendarCheck,
    title: "Checka in dagligen",
    description: "Svara på några enkla frågor om ditt mående, sömn och aktivitet. Det tar under en minut.",
    details: [
      { icon: SmilePlus, label: "Humör" },
      { icon: Moon, label: "Sömn" },
      { icon: Utensils, label: "Kost" },
      { icon: Dumbbell, label: "Träning" },
      { icon: Pill, label: "Medicin" },
      { icon: MessageSquare, label: "Anteckningar" },
    ],
  },
  {
    icon: BarChart3,
    title: "Se dina mönster",
    description: "Få visuella trender och AI-insikter som hjälper dig förstå ditt mående över tid.",
    details: null,
  },
  {
    icon: Share2,
    title: "Dela med din läkare",
    description: "Du bestämmer vilken data som delas – automatiskt och säkert inför nästa besök.",
    details: null,
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
  return (
    <section className="relative z-10 bg-[hsl(225_30%_7%)] py-16 md:py-24 px-4 md:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Intro text moved from hero */}
        <IntroBlock />

        {/* Steps - horizontal grid */}
        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <StepCard key={step.title} step={step} index={i} />
          ))}
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
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-4">
        Så här funkar det
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed">
        Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående
        och delar valfri data med din läkare
      </p>
    </div>
  );
}

function StepCard({ step, index }: { step: typeof steps[number]; index: number }) {
  const { ref, visible } = useInView(0.2);
  const delay = index * 150;

  return (
    <div
      ref={ref}
      className={`relative flex flex-col items-center text-center transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon with number */}
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[hsl(45_85%_55%/0.12)] border border-[hsl(45_85%_55%/0.2)] flex items-center justify-center relative mb-4">
        <step.icon className="w-6 h-6 text-[hsl(45_85%_55%)]" />
        <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-white mb-1.5">
        {step.title}
      </h3>
      <p className="text-sm md:text-base text-white/60 leading-relaxed mb-3">{step.description}</p>

      {/* Detail badges for step 1 */}
      {step.details && (
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {step.details.map((d, di) => (
            <div
              key={d.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: `${delay + 400 + di * 80}ms` }}
            >
              <d.icon className="w-3.5 h-3.5 text-[hsl(45_85%_55%/0.7)]" />
              {d.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

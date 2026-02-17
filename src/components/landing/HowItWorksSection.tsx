import { CalendarCheck, BarChart3, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    icon: CalendarCheck,
    title: "Checka in dagligen",
    description: "Svara på några enkla frågor om ditt mående, sömn och aktivitet. Det tar under en minut.",
  },
  {
    icon: BarChart3,
    title: "Se dina mönster",
    description: "Få visuella trender och AI-insikter som hjälper dig förstå ditt mående över tid.",
  },
  {
    icon: Share2,
    title: "Dela med din läkare",
    description: "Du bestämmer vilken data som delas – automatiskt och säkert inför nästa besök.",
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

function FlowConnector({ visible, delay }: { visible: boolean; delay: number }) {
  return (
    <div className="hidden md:flex items-center justify-center -mx-4 relative self-center">
      <svg viewBox="0 0 80 40" className="w-16 h-10" fill="none">
        <path d="M0 20 L80 20" stroke="hsl(45 85% 55% / 0.15)" strokeWidth="2" strokeDasharray="4 4" />
        <path
          d="M0 20 L80 20"
          stroke="hsl(45 85% 55% / 0.6)"
          strokeWidth="2"
          strokeDasharray="12 28"
          className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: `${delay}ms` }}
        >
          <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1.5s" repeatCount="indefinite" />
        </path>
        <path
          d="M68 14 L80 20 L68 26"
          stroke="hsl(45 85% 55% / 0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: `${delay + 200}ms` }}
        />
      </svg>
    </div>
  );
}

function MobileFlowConnector({ visible, delay }: { visible: boolean; delay: number }) {
  return (
    <div className="flex md:hidden items-center justify-center py-2">
      <svg viewBox="0 0 40 50" className="w-8 h-10" fill="none">
        <path d="M20 0 L20 50" stroke="hsl(45 85% 55% / 0.15)" strokeWidth="2" strokeDasharray="4 4" />
        <path
          d="M20 0 L20 50"
          stroke="hsl(45 85% 55% / 0.6)"
          strokeWidth="2"
          strokeDasharray="12 28"
          className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: `${delay}ms` }}
        >
          <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1.5s" repeatCount="indefinite" />
        </path>
        <path
          d="M14 38 L20 48 L26 38"
          stroke="hsl(45 85% 55% / 0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: `${delay + 200}ms` }}
        />
      </svg>
    </div>
  );
}

export function HowItWorksSection() {
  const { ref, visible } = useInView(0.1);

  return (
    <section className="relative z-10 bg-[hsl(225_30%_7%)] py-16 md:py-24 px-4 md:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <IntroBlock />

        <div ref={ref} className="mt-14 md:mt-20">
          {/* Desktop: horizontal with flow arrows */}
          <div className="hidden md:flex items-start justify-center">
            {steps.map((step, i) => (
              <div key={step.title} className="contents">
                <StepCard step={step} index={i} visible={visible} />
                {i < steps.length - 1 && (
                  <FlowConnector visible={visible} delay={300 + i * 250} />
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical with flow arrows */}
          <div className="flex md:hidden flex-col items-center">
            {steps.map((step, i) => (
              <div key={step.title} className="w-full">
                <StepCard step={step} index={i} visible={visible} />
                {i < steps.length - 1 && (
                  <MobileFlowConnector visible={visible} delay={300 + i * 250} />
                )}
              </div>
            ))}
          </div>

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
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[hsl(45_85%_55%/0.12)] border border-[hsl(45_85%_55%/0.2)] flex items-center justify-center relative mb-4 z-10">
        <step.icon className="w-6 h-6 text-[hsl(45_85%_55%)]" />
        <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-white mb-1.5">
        {step.title}
      </h3>
      <p className="text-sm md:text-base text-white/60 leading-relaxed">{step.description}</p>
    </div>
  );
}

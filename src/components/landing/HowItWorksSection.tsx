import { CalendarCheck, BarChart3, Share2, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import toddyPencil from "@/assets/toddy-pencil.png";
import toddyGraph from "@/assets/toddy-graph.png";
import toddyShare from "@/assets/toddy-share.png";

const stepIcons = [CalendarCheck, BarChart3, Share2];
const stepImages = [toddyPencil, toddyGraph, toddyShare];
const stepKeys = ['landing.step1', 'landing.step2', 'landing.step3'];

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
  const { t } = useTranslation();
  const { ref, visible } = useInView(0.1);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = stepKeys.map((key, i) => ({
    icon: stepIcons[i],
    image: stepImages[i],
    title: t(key),
  }));

  // Auto-cycling disabled — hover/tap to activate

  return (
    <section className="relative z-10 bg-[hsl(225_30%_7%)] py-14 md:py-32 px-5 md:px-8 overflow-hidden">
      {/* Ambient gradient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle at center, hsl(45 85% 55% / 0.08) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <IntroBlock />

        <div ref={ref} className="mt-12 md:mt-24">
          {/* Desktop: horizontal with connecting line */}
          <div className="hidden md:block relative">
            {/* Connector line removed */}

            <div
              className="flex items-start justify-center gap-16"
              onMouseLeave={() => setActiveStep(null)}
            >
              {steps.map((step, i) => (
                <StepCard
                  key={i}
                  step={step}
                  index={i}
                  visible={visible}
                  isActive={activeStep === i}
                  onHover={() => setActiveStep(i)}
                />
              ))}
            </div>
          </div>

          {/* Mobile: vertical with side connector */}
          <div className="flex md:hidden flex-col items-stretch gap-6 relative">
            <div className="absolute left-[44px] top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            {steps.map((step, i) => (
              <MobileStepCard
                key={i}
                step={step}
                index={i}
                visible={visible}
                isActive={activeStep === i}
                onTap={() => setActiveStep(i)}
              />
            ))}
          </div>
        </div>

        <div
          className={`mt-12 md:mt-20 flex justify-center transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '900ms' }}
        >
          <a
            href="/skapa-konto"
            className="group relative px-10 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-semibold text-base tracking-wide shadow-[0_4px_20px_hsl(45_85%_55%/0.35)] hover:shadow-[0_8px_32px_hsl(45_85%_55%/0.55)] hover:scale-[1.04] active:scale-[0.97] transition-all duration-300 ease-out overflow-hidden"
          >
            <span className="relative z-10">{t('landing.getStarted')}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </a>
        </div>
      </div>
    </section>
  );
}

function IntroBlock() {
  const { t } = useTranslation();
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`text-center max-w-2xl mx-auto transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-6 tracking-tight">
        {t('landing.sectionTitle')}
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-white/60 leading-relaxed max-w-xl mx-auto font-light">
        {t('landing.sectionSubtitle')}
      </p>
    </div>
  );
}

function StepCard({
  step,
  index,
  visible,
  isActive,
  onHover,
}: {
  step: { icon: any; image: string; title: string };
  index: number;
  visible: boolean;
  isActive: boolean;
  onHover: () => void;
}) {
  const delay = index * 180;

  return (
    <div
      onMouseEnter={onHover}
      className={`group relative flex flex-col items-center text-center flex-1 max-w-xs mx-auto cursor-pointer transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Glow halo — intensifies when active */}
      <div
        className={`absolute top-4 w-40 h-40 rounded-full blur-3xl transition-all duration-700 ${
          isActive
            ? 'bg-[hsl(45_85%_55%/0.28)] scale-110 opacity-100'
            : 'bg-[hsl(45_85%_55%/0.1)] scale-90 opacity-60 group-hover:opacity-90'
        }`}
      />

      {/* Mascot tile */}
      <div
        className={`relative z-10 flex-shrink-0 w-36 h-36 rounded-full flex items-center justify-center mb-7 transition-all duration-500 ease-out ${
          isActive ? 'scale-[1.06]' : 'group-hover:scale-[1.03]'
        }`}
      >
        <img
          src={step.image}
          alt={step.title}
          loading="lazy"
          width={512}
          height={512}
          className={`w-full h-full object-contain transition-all duration-500 ${
            isActive ? 'drop-shadow-[0_8px_24px_hsl(45_85%_55%/0.45)]' : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
          }`}
        />

        {/* Number badge */}
        <span
          className={`absolute -top-1 -left-1 w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-500 z-10 ${
            isActive
              ? 'bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] scale-110 shadow-[0_4px_16px_hsl(45_85%_55%/0.6)]'
              : 'bg-white/15 text-white/80 backdrop-blur-sm border border-white/15'
          }`}
        >
          {index + 1}
        </span>

        {/* Family/community heart badge — only on the sharing step */}
        {index === 2 && (
          <span
            className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-500 bg-gradient-to-br from-[hsl(345_85%_62%)] to-[hsl(15_85%_60%)] shadow-[0_4px_16px_hsl(345_85%_62%/0.5)] ${
              isActive ? 'scale-110' : 'scale-100'
            }`}
            aria-hidden="true"
          >
            <Heart className="w-4 h-4 text-white fill-white" strokeWidth={2.2} />
          </span>
        )}
      </div>

      <h3
        className={`text-lg md:text-xl font-semibold tracking-tight transition-colors duration-500 ${
          isActive ? 'text-white' : 'text-white/70 group-hover:text-white/90'
        }`}
      >
        {step.title}
      </h3>

      {/* Active indicator dot */}
      <span
        className={`mt-3 h-1 rounded-full bg-[hsl(45_85%_55%)] transition-all duration-500 ${
          isActive ? 'w-8 opacity-100' : 'w-1 opacity-30'
        }`}
      />
    </div>
  );
}

function MobileStepCard({
  step,
  index,
  visible,
  isActive,
  onTap,
}: {
  step: { icon: any; image: string; title: string };
  index: number;
  visible: boolean;
  isActive: boolean;
  onTap: () => void;
}) {
  const delay = index * 150;

  return (
    <button
      onClick={onTap}
      className={`relative flex items-center gap-5 text-left rounded-2xl p-4 transition-all duration-700 ease-out ${
        isActive ? 'bg-white/[0.04]' : 'bg-transparent active:bg-white/[0.02]'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative flex-shrink-0">
        {/* Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
            isActive ? 'bg-[hsl(45_85%_55%/0.35)] scale-110' : 'bg-[hsl(45_85%_55%/0.1)] scale-90'
          }`}
        />
        <div
          className={`relative w-[88px] h-[88px] rounded-full flex items-center justify-center transition-all duration-500 ${
            isActive ? 'scale-[1.04]' : ''
          }`}
        >
          <img
            src={step.image}
            alt={step.title}
            loading="lazy"
            width={512}
            height={512}
            className={`w-full h-full object-contain transition-all duration-500 ${
              isActive ? 'drop-shadow-[0_6px_18px_hsl(45_85%_55%/0.45)]' : 'drop-shadow-[0_3px_8px_rgba(0,0,0,0.3)]'
            }`}
          />
          <span
            className={`absolute -top-1 -left-1 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-500 z-10 ${
              isActive
                ? 'bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] shadow-[0_4px_12px_hsl(45_85%_55%/0.5)]'
                : 'bg-white/15 text-white/80 border border-white/15 backdrop-blur-sm'
            }`}
          >
            {index + 1}
          </span>
          {index === 2 && (
            <span
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all duration-500 bg-gradient-to-br from-[hsl(345_85%_62%)] to-[hsl(15_85%_60%)] shadow-[0_4px_12px_hsl(345_85%_62%/0.5)] ${
                isActive ? 'scale-110' : 'scale-100'
              }`}
              aria-hidden="true"
            >
              <Heart className="w-3.5 h-3.5 text-white fill-white" strokeWidth={2.2} />
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className={`text-[17px] font-semibold tracking-tight transition-colors duration-500 ${
            isActive ? 'text-white' : 'text-white/75'
          }`}
        >
          {step.title}
        </h3>
        <span
          className={`block mt-2 h-[3px] rounded-full bg-[hsl(45_85%_55%)] transition-all duration-500 ${
            isActive ? 'w-10 opacity-100' : 'w-1 opacity-30'
          }`}
        />
      </div>
    </button>
  );
}

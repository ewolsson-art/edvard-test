import { AuthNavbar } from "@/components/AuthNavbar";
import { DarkNightBackground } from "@/components/DarkNightBackground";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CalendarCheck, BarChart3, Share2, Brain, Shield, Bell, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const steps = [
  {
    icon: CalendarCheck,
    number: 1,
    title: "Checka in dagligen",
    description: "Logga ditt mående, sömn, kost, träning och medicin på under en minut. Det är enkelt, snabbt och helt på dina villkor.",
  },
  {
    icon: BarChart3,
    number: 2,
    title: "Upptäck dina mönster",
    description: "Toddy analyserar dina incheckningar och visar trender över tid — så att du kan förstå vad som påverkar just dig.",
  },
  {
    icon: Share2,
    number: 3,
    title: "Dela med vården och nära",
    description: "Välj själv vilken data du vill dela med läkare och anhöriga. Du har alltid full kontroll.",
  },
];

const features = [
  {
    icon: Brain,
    title: "AI-drivna insikter",
    description: "Få personliga observationer baserade på dina mönster — helt utan att dela data med tredje part.",
  },
  {
    icon: Shield,
    title: "Din data, dina regler",
    description: "All data krypteras och lagras säkert. Du bestämmer alltid vem som ser vad.",
  },
  {
    icon: Bell,
    title: "Smarta påminnelser",
    description: "Anpassningsbara notiser hjälper dig hålla rutinen utan att det blir påträngande.",
  },
];

const HowItWorks = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DarkNightBackground>
      <AuthNavbar />

      <div className="flex flex-col min-h-screen pt-16">
        {/* Hero */}
        <section className="px-5 md:px-8 pt-12 md:pt-20 pb-8 md:pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
              Så funkar Toddy
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              Tre enkla steg till bättre koll på ditt mående
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="px-5 md:px-8 pb-16 md:pb-24">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-10">
            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[hsl(260_60%_72%/0.10)] border border-[hsl(260_60%_72%/0.18)] flex items-center justify-center relative mb-5">
                  <step.icon className="w-9 h-9 md:w-11 md:h-11 text-[hsl(45_85%_55%)]" />
                  <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] text-sm font-bold flex items-center justify-center shadow-lg">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 md:px-8 pb-20 md:pb-28">
          <div className="max-w-md mx-auto text-center">
            <button
              onClick={() => navigate("/skapa-konto")}
              className="px-10 py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-semibold text-base tracking-wide shadow-[0_4px_20px_hsl(45_85%_55%/0.3)] hover:shadow-[0_6px_28px_hsl(45_85%_55%/0.45)] hover:scale-105 active:scale-[0.98] transition-all duration-200 group"
            >
              Kom igång
              <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        <LandingFooter />
      </div>
    </DarkNightBackground>
  );
};

export default HowItWorks;

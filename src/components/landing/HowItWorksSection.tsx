import { TurtleLogo } from "@/components/TurtleLogo";
import { CalendarCheck, BarChart3, Share2 } from "lucide-react";

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

export function HowItWorksSection() {
  return (
    <section className="relative z-10 bg-[hsl(225_30%_7%)] py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Turtle mascot */}
          <div className="flex-shrink-0 -mt-12 md:-mt-16">
            <TurtleLogo size="hero" animated={false} className="w-48 h-48 md:w-64 md:h-64" />
          </div>

          {/* Steps */}
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-10 text-center md:text-left">
              Så här funkar det
            </h2>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={step.title} className="flex gap-5 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[hsl(45_85%_55%/0.15)] flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-[hsl(45_85%_55%)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      <span className="text-[hsl(45_85%_55%)] mr-2">{i + 1}.</span>
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

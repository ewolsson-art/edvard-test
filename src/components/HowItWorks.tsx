import { CalendarCheck, TrendingUp, Share2 } from 'lucide-react';

const steps = [
  {
    icon: CalendarCheck,
    title: 'Checka in dagligen',
    description: 'Logga ditt mående, sömn, kost och träning med några enkla klick.',
  },
  {
    icon: TrendingUp,
    title: 'Följ din utveckling',
    description: 'Se trender och mönster över tid med tydliga grafer och statistik.',
  },
  {
    icon: Share2,
    title: 'Dela med din läkare',
    description: 'Skapa rapporter och dela valfri data säkert med din vårdgivare.',
  },
];

export const HowItWorks = () => {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-foreground mb-12">
          Så funkar det
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary mb-2">Steg {index + 1}</span>
              <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

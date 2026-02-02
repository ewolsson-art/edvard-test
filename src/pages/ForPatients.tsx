import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, TrendingUp, MessageSquare, Pill, Share2, ArrowRight } from 'lucide-react';

const ForPatients = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: 'Daglig incheckning',
      description: 'Logga ditt mående, sömn, kost och träning på under en minut varje dag.',
    },
    {
      icon: TrendingUp,
      title: 'Visualisera mönster',
      description: 'Se trender och mönster i ditt mående över veckor, månader och år.',
    },
    {
      icon: Pill,
      title: 'Medicinspårning',
      description: 'Håll koll på dina mediciner och se hur de påverkar ditt mående.',
    },
    {
      icon: MessageSquare,
      title: 'Chatta med din läkare',
      description: 'Kommunicera säkert med din vårdgivare direkt i appen.',
    },
    {
      icon: Share2,
      title: 'Dela på dina villkor',
      description: 'Du bestämmer vilken data som delas med din läkare och anhöriga.',
    },
    {
      icon: CheckCircle,
      title: 'Enkel & säker',
      description: 'Intuitiv design och bankgrad säkerhet för din trygghet.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              För <span className="text-primary">patienter</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Ta kontroll över ditt mående med ett verktyg designat för dig som lever med bipolär sjukdom.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">
              Allt du behöver för att må bättre
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="glass-card p-6 hover:shadow-lg transition-shadow">
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">Så fungerar det</h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Skapa ett konto</h3>
                  <p className="text-muted-foreground">
                    Registrera dig gratis och välj vilka kategorier du vill spåra (mående, sömn, kost, träning, mediciner).
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Checka in dagligen</h3>
                  <p className="text-muted-foreground">
                    Ta en minut varje dag för att logga hur du mår. Det tar mindre tid än att borsta tänderna!
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upptäck mönster</h3>
                  <p className="text-muted-foreground">
                    Se hur ditt mående utvecklas över tid och identifiera triggers och positiva faktorer.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Dela med din läkare</h3>
                  <p className="text-muted-foreground">
                    Bjud in din läkare och välj vilken data som ska delas för bättre vårdsamtal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">Redo att börja?</h2>
            <p className="text-muted-foreground mb-6">
              Skapa ett gratis konto och börja logga ditt mående idag.
            </p>
            <Button onClick={() => navigate('/skapa-konto')} size="lg" className="gap-2">
              Kom igång gratis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForPatients;

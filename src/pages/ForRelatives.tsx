import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, FileText, Bell, Shield, MessageCircle, ArrowRight } from 'lucide-react';

const ForRelatives = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Eye,
      title: 'Följ måendet',
      description: 'Se hur din närstående mår utan att behöva fråga varje dag.',
    },
    {
      icon: FileText,
      title: 'Generera rapporter',
      description: 'Skapa rapporter för att diskutera med vårdgivare.',
    },
    {
      icon: MessageCircle,
      title: 'Egna anteckningar',
      description: 'Lägg till dina egna observationer kopplade till specifika dagar.',
    },
    {
      icon: Bell,
      title: 'Håll dig uppdaterad',
      description: 'Få en känsla för mönster och trender över tid.',
    },
    {
      icon: Shield,
      title: 'Respekterar integritet',
      description: 'Du ser bara den data din närstående valt att dela.',
    },
    {
      icon: Heart,
      title: 'Stötta på rätt sätt',
      description: 'Bättre förståelse leder till bättre stöd.',
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
              För <span className="text-primary">anhöriga</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Var ett bättre stöd för din närstående genom att förstå hur de mår – på deras villkor.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">
              Verktyg för att stötta på bästa sätt
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

        {/* Understanding section */}
        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-8 text-center">Vi förstår</h2>
            <div className="glass-card p-8">
              <p className="text-muted-foreground mb-4">
                Att vara anhörig till någon med bipolär sjukdom kan vara utmanande. Man vill hjälpa, 
                men vet inte alltid hur – eller vill inte vara påträngande genom att ständigt fråga "hur mår du?".
              </p>
              <p className="text-muted-foreground mb-4">
                Med denna plattform kan din närstående välja att dela sitt mående med dig. 
                Du får insyn i hur de mår utan att behöva fråga, och kan vara ett bättre stöd 
                när det verkligen behövs.
              </p>
              <p className="text-muted-foreground">
                Du kan också lägga till egna anteckningar – kanske noterade du att din närstående 
                verkade ledsen vid ett samtal? Dessa observationer kan vara värdefulla för att 
                förstå mönster över tid.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">Så fungerar det</h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Skapa ett anhörigkonto</h3>
                  <p className="text-muted-foreground">
                    Registrera dig och ange att du är anhörig till en patient.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Bli inbjuden eller skicka förfrågan</h3>
                  <p className="text-muted-foreground">
                    Din närstående kan bjuda in dig, eller så kan du skicka en förfrågan till dem.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Följ deras mående</h3>
                  <p className="text-muted-foreground">
                    Se den data de valt att dela med dig – mående, sömn, kost, träning eller mediciner.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Lägg till egna observationer</h3>
                  <p className="text-muted-foreground">
                    Dubbelklicka på ett datum för att lägga till dina egna anteckningar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">Vill du stötta din närstående?</h2>
            <p className="text-muted-foreground mb-6">
              Skapa ett anhörigkonto idag och ta första steget mot bättre förståelse.
            </p>
            <Button onClick={() => navigate('/skapa-konto?role=relative')} size="lg" className="gap-2">
              Registrera som anhörig
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForRelatives;

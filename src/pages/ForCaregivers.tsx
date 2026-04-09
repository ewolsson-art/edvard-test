import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, FileText, MessageSquare, Clock, Shield, ArrowRight } from 'lucide-react';

const ForCaregivers = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Activity,
      title: 'Realtidsinsikter',
      description: 'Se användarens mående i realtid utan att vänta på nästa besök.',
    },
    {
      icon: FileText,
      title: 'Automatiska rapporter',
      description: 'Generera detaljerade rapporter inför möten.',
    },
    {
      icon: MessageSquare,
      title: 'Säker kommunikation',
      description: 'Chatta med användare på ett GDPR-säkert sätt.',
    },
    {
      icon: Users,
      title: 'Delegera uppgifter',
      description: 'Låt kollegor hjälpa till med att följa upp användare.',
    },
    {
      icon: Clock,
      title: 'Spara tid',
      description: 'Mindre administration, mer tid för vård.',
    },
    {
      icon: Shield,
      title: 'Användarkontroll',
      description: 'Användaren bestämmer alltid vilken data som delas.',
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
              För <span className="text-primary">vårdgivare</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Få bättre insikt i dina användares mående mellan besöken och förbättra vårdkvaliteten.
            </p>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">
              Verktyg för modern psykiatrisk vård
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="glass-card p-6 hover:shadow-lg transition-shadow">
                  <benefit.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works for doctors */}
        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">Så kommer du igång</h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Skapa ett vårdgivarkonto</h3>
                  <p className="text-muted-foreground">
                    Registrera dig som läkare och verifiera din identitet för säker åtkomst.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Bjud in eller ta emot användare</h3>
                  <p className="text-muted-foreground">
                    Skicka inbjudningar till användare eller acceptera förfrågningar från dem.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Följ användares mående</h3>
                  <p className="text-muted-foreground">
                    Se dagliga incheckningar, mönster och trender i en överskådlig dashboard.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Kommunicera vid behov</h3>
                  <p className="text-muted-foreground">
                    Använd den inbyggda chatten för att följa upp när det behövs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">Förbättra vården för dina användare</h2>
            <p className="text-muted-foreground mb-6">
              Skapa ett vårdgivarkonto och börja använda plattformen idag.
            </p>
            <Button onClick={() => navigate('/skapa-konto?role=doctor')} size="lg" className="gap-2">
              Registrera som vårdgivare
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForCaregivers;

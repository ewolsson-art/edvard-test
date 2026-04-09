import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Handshake, Building2, GraduationCap, Heart, Mail, ArrowRight } from 'lucide-react';

const Partners = () => {
  const navigate = useNavigate();

  const partnerTypes = [
    {
      icon: Building2,
      title: 'Vårdorganisationer',
      description: 'Integrera plattformen i er verksamhet för att ge användarna bättre verktyg och er bättre insikt.',
    },
    {
      icon: GraduationCap,
      title: 'Forskningsinstitut',
      description: 'Använd anonymiserad data för att driva forskningen inom bipolär sjukdom framåt.',
    },
    {
      icon: Heart,
      title: 'Brukarorganisationer',
      description: 'Erbjud era medlemmar ett modernt verktyg för att hantera sitt mående.',
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
              <span className="text-primary">Samarbets</span>partners
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tillsammans kan vi göra större skillnad för människor som lever med bipolär sjukdom.
            </p>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">
              Vilka vi samarbetar med
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {partnerTypes.map((type) => (
                <div key={type.title} className="glass-card p-8 text-center hover:shadow-lg transition-shadow">
                  <type.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{type.title}</h3>
                  <p className="text-muted-foreground">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why partner section */}
        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-8 text-center">
              Varför samarbeta med oss?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <Handshake className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Gemensam vision</h3>
                <p className="text-muted-foreground text-sm">
                  Vi delar målet att förbättra livet för människor med bipolär sjukdom och deras närstående.
                </p>
              </div>
              <div className="glass-card p-6">
                <Building2 className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Flexibla integrationer</h3>
                <p className="text-muted-foreground text-sm">
                  Vi anpassar oss efter era behov och kan integreras med befintliga system.
                </p>
              </div>
              <div className="glass-card p-6">
                <GraduationCap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Evidensbaserat</h3>
                <p className="text-muted-foreground text-sm">
                  Vår plattform är utvecklad i samarbete med forskare och kliniker.
                </p>
              </div>
              <div className="glass-card p-6">
                <Heart className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Användarfokus</h3>
                <p className="text-muted-foreground text-sm">
                  Allt vi gör utgår från användarens behov och integritet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Current partners placeholder */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-display font-semibold mb-8">Våra partners</h2>
            <div className="glass-card p-12">
              <p className="text-muted-foreground mb-4">
                Vi är alltid öppna för nya samarbeten och diskussioner om hur vi tillsammans kan 
                göra skillnad för människor med bipolär sjukdom.
              </p>
              <p className="text-sm text-muted-foreground">
                Kontakta oss för att diskutera möjliga samarbeten.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-semibold mb-4">Intresserad av samarbete?</h2>
            <p className="text-muted-foreground mb-6">
              Vi vill gärna höra från dig. Berätta om din organisation och hur du tror att vi kan samarbeta.
            </p>
            <Button onClick={() => navigate('/skapa-konto')} size="lg" className="gap-2">
              Kontakta oss
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Partners;

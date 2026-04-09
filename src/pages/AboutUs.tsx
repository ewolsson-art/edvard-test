import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Shield, Target, ArrowRight } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Om <span className="text-primary">oss</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Vi är ett team som brinner för att göra vardagen enklare för personer med bipolär sjukdom och deras nätverk.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-display font-semibold mb-6">Vår mission</h2>
                <p className="text-muted-foreground mb-4">
                  Att ge människor med bipolär sjukdom verktygen de behöver för att förstå och hantera sitt mående, 
                  samtidigt som vi underlättar kommunikationen med vårdgivare och anhöriga.
                </p>
                <p className="text-muted-foreground">
                  Vi tror på att transparens och insikt leder till bättre hälsa och livskvalitet.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 text-center">
                  <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Omsorg</h3>
                  <p className="text-sm text-muted-foreground">Varje funktion är designad med användaren i fokus</p>
                </div>
                <div className="glass-card p-6 text-center">
                  <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Trygghet</h3>
                  <p className="text-sm text-muted-foreground">Din data är skyddad och privat</p>
                </div>
                <div className="glass-card p-6 text-center">
                  <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Samarbete</h3>
                  <p className="text-sm text-muted-foreground">Byggt tillsammans med användare och experter</p>
                </div>
                <div className="glass-card p-6 text-center">
                  <Target className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Fokus</h3>
                  <p className="text-sm text-muted-foreground">Enkelhet och användbarhet i centrum</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-6 text-center">Vår historia</h2>
            <div className="glass-card p-8">
              <p className="text-muted-foreground mb-4">
                Idén till denna plattform föddes ur egen erfarenhet. Som personer som lever med eller nära någon med 
                bipolär sjukdom förstår vi utmaningarna med att hålla koll på mående och kommunicera effektivt med vården.
              </p>
              <p className="text-muted-foreground mb-4">
                Vi såg ett behov av ett enkelt, vackert verktyg som kunde hjälpa till att visualisera mönster, 
                spåra mediciner och dela relevant information med vårdteamet – allt på användarens villkor.
              </p>
              <p className="text-muted-foreground">
                Idag är vi stolta över att erbjuda en plattform som används av användare, läkare och anhöriga 
                för att tillsammans skapa bättre förutsättningar för god psykisk hälsa.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">Vill du veta mer?</h2>
            <p className="text-muted-foreground mb-6">
              Skapa ett konto idag och upptäck hur vi kan hjälpa dig.
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

export default AboutUs;

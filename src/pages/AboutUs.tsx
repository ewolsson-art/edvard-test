import { AuthNavbar } from '@/components/AuthNavbar';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Shield, Target, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutUs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      
      <main className="flex-1 pt-20">
        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              {t('aboutUsPage.heroTitle1')}<span className="text-primary">{t('aboutUsPage.heroTitle2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('aboutUsPage.heroDescription')}
            </p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-display font-semibold mb-6">{t('aboutUsPage.missionTitle')}</h2>
                <p className="text-muted-foreground mb-4">{t('aboutUsPage.missionP1')}</p>
                <p className="text-muted-foreground">{t('aboutUsPage.missionP2')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 text-center">
                  <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">{t('aboutUsPage.care')}</h3>
                  <p className="text-sm text-muted-foreground">{t('aboutUsPage.careDesc')}</p>
                </div>
                <div className="glass-card p-6 text-center">
                  <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">{t('aboutUsPage.safety')}</h3>
                  <p className="text-sm text-muted-foreground">{t('aboutUsPage.safetyDesc')}</p>
                </div>
                <div className="glass-card p-6 text-center">
                  <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">{t('aboutUsPage.collaboration')}</h3>
                  <p className="text-sm text-muted-foreground">{t('aboutUsPage.collaborationDesc')}</p>
                </div>
                <div className="glass-card p-6 text-center">
                  <Target className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">{t('aboutUsPage.focus')}</h3>
                  <p className="text-sm text-muted-foreground">{t('aboutUsPage.focusDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-6 text-center">{t('aboutUsPage.storyTitle')}</h2>
            <div className="glass-card p-8">
              <p className="text-muted-foreground mb-4">{t('aboutUsPage.storyP1')}</p>
              <p className="text-muted-foreground mb-4">{t('aboutUsPage.storyP2')}</p>
              <p className="text-muted-foreground">{t('aboutUsPage.storyP3')}</p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">{t('aboutUsPage.ctaTitle')}</h2>
            <p className="text-muted-foreground mb-6">{t('aboutUsPage.ctaDescription')}</p>
            <Button onClick={() => navigate('/skapa-konto')} size="lg" className="gap-2">
              {t('aboutUsPage.ctaButton')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;

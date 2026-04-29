import { AuthNavbar } from '@/components/AuthNavbar';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, FileText, Bell, Shield, MessageCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForRelatives = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: Eye, titleKey: 'feat1Title', descKey: 'feat1Desc' },
    { icon: FileText, titleKey: 'feat2Title', descKey: 'feat2Desc' },
    { icon: MessageCircle, titleKey: 'feat3Title', descKey: 'feat3Desc' },
    { icon: Bell, titleKey: 'feat4Title', descKey: 'feat4Desc' },
    { icon: Shield, titleKey: 'feat5Title', descKey: 'feat5Desc' },
    { icon: Heart, titleKey: 'feat6Title', descKey: 'feat6Desc' },
  ];

  const steps = [
    { titleKey: 'step1Title', descKey: 'step1Desc' },
    { titleKey: 'step2Title', descKey: 'step2Desc' },
    { titleKey: 'step3Title', descKey: 'step3Desc' },
    { titleKey: 'step4Title', descKey: 'step4Desc' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="För anhöriga – stötta din närstående med Toddy" description="Följ måendet, generera rapporter och få insikt över tid – för dig som är anhörig till någon med bipolär sjukdom." path="/for-anhoriga" />
      <AuthNavbar />
      <main className="flex-1 pt-20">
        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              {t('forRelativesPage.heroTitle1')}<span className="text-primary">{t('forRelativesPage.heroTitle2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('forRelativesPage.heroDescription')}
            </p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">{t('forRelativesPage.featuresTitle')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.titleKey} className="glass-card p-6 hover:shadow-lg transition-shadow">
                  <f.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t(`forRelativesPage.${f.titleKey}`)}</h3>
                  <p className="text-muted-foreground">{t(`forRelativesPage.${f.descKey}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-8 text-center">{t('forRelativesPage.understandTitle')}</h2>
            <div className="glass-card p-8">
              <p className="text-muted-foreground mb-4">{t('forRelativesPage.understandP1')}</p>
              <p className="text-muted-foreground mb-4">{t('forRelativesPage.understandP2')}</p>
              <p className="text-muted-foreground">{t('forRelativesPage.understandP3')}</p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">{t('forRelativesPage.howTitle')}</h2>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">{i + 1}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t(`forRelativesPage.${step.titleKey}`)}</h3>
                    <p className="text-muted-foreground">{t(`forRelativesPage.${step.descKey}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">{t('forRelativesPage.ctaTitle')}</h2>
            <p className="text-muted-foreground mb-6">{t('forRelativesPage.ctaDesc')}</p>
            <Button onClick={() => navigate('/skapa-konto?role=relative')} size="lg" className="gap-2">
              {t('forRelativesPage.ctaButton')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForRelatives;

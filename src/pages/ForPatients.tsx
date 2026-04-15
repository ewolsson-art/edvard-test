import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, TrendingUp, MessageSquare, Pill, Share2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForPatients = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: Calendar, titleKey: 'feat1Title', descKey: 'feat1Desc' },
    { icon: TrendingUp, titleKey: 'feat2Title', descKey: 'feat2Desc' },
    { icon: Pill, titleKey: 'feat3Title', descKey: 'feat3Desc' },
    { icon: MessageSquare, titleKey: 'feat4Title', descKey: 'feat4Desc' },
    { icon: Share2, titleKey: 'feat5Title', descKey: 'feat5Desc' },
    { icon: CheckCircle, titleKey: 'feat6Title', descKey: 'feat6Desc' },
  ];

  const steps = [
    { titleKey: 'step1Title', descKey: 'step1Desc' },
    { titleKey: 'step2Title', descKey: 'step2Desc' },
    { titleKey: 'step3Title', descKey: 'step3Desc' },
    { titleKey: 'step4Title', descKey: 'step4Desc' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      <main className="flex-1 pt-20">
        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              {t('forPatientsPage.heroTitle1')}<span className="text-primary">{t('forPatientsPage.heroTitle2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('forPatientsPage.heroDescription')}
            </p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">{t('forPatientsPage.featuresTitle')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.titleKey} className="glass-card p-6 hover:shadow-lg transition-shadow">
                  <f.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t(`forPatientsPage.${f.titleKey}`)}</h3>
                  <p className="text-muted-foreground">{t(`forPatientsPage.${f.descKey}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">{t('forPatientsPage.howTitle')}</h2>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">{i + 1}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t(`forPatientsPage.${step.titleKey}`)}</h3>
                    <p className="text-muted-foreground">{t(`forPatientsPage.${step.descKey}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">{t('forPatientsPage.ctaTitle')}</h2>
            <p className="text-muted-foreground mb-6">{t('forPatientsPage.ctaDesc')}</p>
            <Button onClick={() => navigate('/skapa-konto')} size="lg" className="gap-2">
              {t('forPatientsPage.ctaButton')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForPatients;

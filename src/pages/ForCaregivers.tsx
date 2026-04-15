import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, FileText, MessageSquare, Clock, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForCaregivers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const benefits = [
    { icon: Activity, title: t('forCaregivers.realtimeInsights'), description: t('forCaregivers.realtimeInsightsDesc') },
    { icon: FileText, title: t('forCaregivers.autoReports'), description: t('forCaregivers.autoReportsDesc') },
    { icon: MessageSquare, title: t('forCaregivers.secureCommunication'), description: t('forCaregivers.secureCommunicationDesc') },
    { icon: Users, title: t('forCaregivers.delegateTasks'), description: t('forCaregivers.delegateTasksDesc') },
    { icon: Clock, title: t('forCaregivers.saveTime'), description: t('forCaregivers.saveTimeDesc') },
    { icon: Shield, title: t('forCaregivers.userControl'), description: t('forCaregivers.userControlDesc') },
  ];

  const steps = [
    { title: t('forCaregivers.step1Title'), desc: t('forCaregivers.step1Desc') },
    { title: t('forCaregivers.step2Title'), desc: t('forCaregivers.step2Desc') },
    { title: t('forCaregivers.step3Title'), desc: t('forCaregivers.step3Desc') },
    { title: t('forCaregivers.step4Title'), desc: t('forCaregivers.step4Desc') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      <main className="flex-1 pt-20">
        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              {t('forCaregivers.title').split(' ').map((w, i, arr) => i === arr.length - 1 ? <span key={i} className="text-primary">{w}</span> : w + ' ')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t('forCaregivers.heroDesc')}</p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">{t('forCaregivers.toolsTitle')}</h2>
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

        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">{t('forCaregivers.howToGetStarted')}</h2>
            <div className="space-y-8">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">{i + 1}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                    <p className="text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">{t('forCaregivers.ctaTitle')}</h2>
            <p className="text-muted-foreground mb-6">{t('forCaregivers.ctaDesc')}</p>
            <Button onClick={() => navigate('/skapa-konto?role=doctor')} size="lg" className="gap-2">
              {t('forCaregivers.registerAsCaregiver')}<ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForCaregivers;

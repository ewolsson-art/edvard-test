import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Users, Eye, Bell, Shield, ArrowRight, ArrowLeft, 
  Stethoscope, MessageSquare, TrendingUp, CheckCircle2 
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const TOTAL_STEPS = 3;

const DoctorOnboarding = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DOCTOR_FEATURES = [
    { icon: Users, title: t('doctorOnboarding.manageUsers'), description: t('doctorOnboarding.manageUsersDesc') },
    { icon: TrendingUp, title: t('doctorOnboarding.realtimeOverview'), description: t('doctorOnboarding.realtimeOverviewDesc') },
    { icon: MessageSquare, title: t('doctorOnboarding.secureCommunication'), description: t('doctorOnboarding.secureCommunicationDesc') },
    { icon: Shield, title: t('doctorOnboarding.userControl'), description: t('doctorOnboarding.userControlDesc') },
  ];

  const WORKFLOW_STEPS = [
    { number: '1', title: t('doctorOnboarding.userInvitesYou'), description: t('doctorOnboarding.userInvitesYouDesc') },
    { number: '2', title: t('doctorOnboarding.youApproveConnection'), description: t('doctorOnboarding.youApproveConnectionDesc') },
    { number: '3', title: t('doctorOnboarding.followUserMood'), description: t('doctorOnboarding.followUserMoodDesc') },
  ];

  const handleNext = () => { if (step < TOTAL_STEPS) setStep(prev => prev + 1); };
  const handleBack = () => { if (step > 1) setStep(prev => prev - 1); };

  const handleGetStarted = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, onboarding_completed: true, include_mood: false, include_sleep: false, include_eating: false, include_exercise: false, include_medication: false }, { onConflict: 'user_id' });

    if (error) {
      toast({ title: t('doctorOnboarding.somethingWentWrong'), description: t('doctorOnboarding.couldNotComplete'), variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    toast({ title: t('doctorOnboarding.welcomeToToddy'), description: t('doctorOnboarding.dashboardReady') });
    window.location.href = '/lakare';
  };

  return (
    <DarkNightBackground>
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
            <span className="text-xs text-white/50 font-medium">
              {t('doctorOnboarding.stepOf', { step, total: TOTAL_STEPS })}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[hsl(45_85%_55%)] rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-3">
        <div className="w-full max-w-lg">
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">{t('doctorOnboarding.welcomeDoctor')}</h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('doctorOnboarding.toddyHelps')}</p>
              </div>
              <div className="glass-card p-4 mb-4">
                <h2 className="font-semibold text-sm mb-3">{t('doctorOnboarding.whatYouCanDo')}</h2>
                <div className="space-y-2.5">
                  {DOCTOR_FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
                        <div>
                          <h3 className="font-medium text-sm">{feature.title}</h3>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button onClick={handleNext} className="w-full" size="default">
                {t('doctorOnboarding.continue')}<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">{t('doctorOnboarding.howItWorks')}</h1>
                <p className="text-sm text-muted-foreground">{t('doctorOnboarding.easyToGetStarted')}</p>
              </div>
              <div className="space-y-2.5 mb-4">
                {WORKFLOW_STEPS.map((wfStep, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">{wfStep.number}</div>
                    <div>
                      <h3 className="font-medium text-sm">{wfStep.title}</h3>
                      <p className="text-xs text-muted-foreground">{wfStep.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{t('doctorOnboarding.usersFoundViaEmail')}</p>
                    <p className="text-xs text-muted-foreground">{t('doctorOnboarding.sameEmailAsRegistered')}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />{t('doctorOnboarding.back')}
                </Button>
                <Button onClick={handleNext} className="flex-1" size="default">
                  {t('doctorOnboarding.continue')}<ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">{t('doctorOnboarding.youAreReady')}</h1>
                <p className="text-sm text-muted-foreground">{t('doctorOnboarding.yourDashboardAwaits')}</p>
              </div>
              <div className="glass-card p-4 mb-4">
                <h2 className="font-semibold text-sm mb-3">{t('doctorOnboarding.nextSteps')}</h2>
                <ul className="space-y-2">
                  {[t('doctorOnboarding.nextStep1'), t('doctorOnboarding.nextStep2'), t('doctorOnboarding.nextStep3')].map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-xs">{text}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{t('doctorOnboarding.privacyFocus')}</span> {t('doctorOnboarding.privacyNote')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />{t('doctorOnboarding.back')}
                </Button>
                <Button onClick={handleGetStarted} className="flex-1" size="default" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Stethoscope className="w-4 h-4 mr-1" />}
                  {t('doctorOnboarding.openMyDashboard')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default DoctorOnboarding;

import { useState } from 'react';
import { z } from 'zod';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useRelativeConnections } from '@/hooks/useRelativeConnections';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, ArrowRight, UserPlus, Send, CheckCircle2, UserCheck, Share2, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

const RelativeOnboarding = () => {
  const { t } = useTranslation();
  const emailSchema = z.string().email({ message: t('relativeOnboarding.invalidEmail') });
  const { toast } = useToast();
  const { createPreferences } = useUserPreferences();
  const { requestPatientAccess, pendingFromPatients, isLoading, refetch } = useRelativeConnections();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);

  const finishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await createPreferences({ include_mood: false, include_sleep: false, include_eating: false, include_exercise: false, include_medication: false });
      if (error) {
        toast({ title: t('relativeOnboarding.somethingWentWrong'), description: t('relativeOnboarding.couldNotSave'), variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      window.location.href = '/anhorig';
    } catch {
      toast({ title: t('relativeOnboarding.somethingWentWrong'), description: t('relativeOnboarding.couldNotSave'), variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    setAcceptingId(connectionId);
    const { error } = await supabase.from('patient_relative_connections').update({ status: 'approved' }).eq('id', connectionId);
    if (error) { toast({ title: t('relativeOnboarding.couldNotAccept'), variant: 'destructive' }); setAcceptingId(null); return; }
    toast({ title: t('relativeOnboarding.requestAccepted') });
    await finishOnboarding();
  };

  const handleSendRequest = async () => {
    if (!emailSchema.safeParse(email).success) { toast({ title: t('relativeOnboarding.enterValidEmail'), variant: 'destructive' }); return; }
    setNotFoundEmail(null);
    setIsSending(true);
    const { success, error, notFound } = await requestPatientAccess(email);
    setIsSending(false);
    if (success) {
      toast({ title: t('relativeOnboarding.requestSent'), description: t('relativeOnboarding.invitationSent') });
      await finishOnboarding();
    } else if (notFound) { setNotFoundEmail(email); }
    else { toast({ title: t('relativeOnboarding.somethingWentWrong'), description: error || t('relativeOnboarding.couldNotSendRequest'), variant: 'destructive' }); }
  };

  const handleShareInvite = async () => {
    const shareUrl = `${window.location.origin}/skapa-konto`;
    const shareText = t('relativeOnboarding.inviteShareText', { defaultValue: 'Hej! Jag vill följa ditt mående via Toddy. Skapa ett konto här:' });
    if (navigator.share) { try { await navigator.share({ title: 'Toddy', text: shareText, url: shareUrl }); } catch {} }
    else { await navigator.clipboard.writeText(`${shareText} ${shareUrl}`); toast({ title: t('relativeOnboarding.linkCopied') }); }
  };

  const hasPendingInvites = pendingFromPatients.length > 0;

  if (isLoading) {
    return <DarkNightBackground><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[hsl(45_85%_55%)]" /></div></DarkNightBackground>;
  }

  return (
    <DarkNightBackground>
      <header className="p-3"><div className="max-w-lg mx-auto"><Logo className="[&_span]:!bg-none [&_span]:!text-white" /></div></header>
      <main className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-lg animate-fade-in text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4"><Users className="w-6 h-6 text-primary" /></div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">{t('relativeOnboarding.welcomeRelative')}</h1>
          <p className="text-sm text-muted-foreground mb-10">{t('relativeOnboarding.supportSomeone')}</p>

          {hasPendingInvites ? (
            <div className="text-left">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-[hsl(45_85%_55%)]" />
                <span className="text-sm font-medium">
                  {pendingFromPatients.length === 1 ? t('relativeOnboarding.pendingInvite') : t('relativeOnboarding.pendingInvites', { count: pendingFromPatients.length })}
                </span>
              </div>
              <div className="space-y-3 mb-8">
                {pendingFromPatients.map((conn) => {
                  const name = conn.patient_profile ? [conn.patient_profile.first_name, conn.patient_profile.last_name].filter(Boolean).join(' ') : null;
                  const displayName = name || conn.patient_email || t('relativeDashboard.unknownUser');
                  return (
                    <div key={conn.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{displayName}</p>
                        <p className="text-xs text-white/40 mt-0.5">{t('relativeOnboarding.wantsYouToFollow')}</p>
                      </div>
                      <button onClick={() => handleAcceptRequest(conn.id)} disabled={acceptingId === conn.id} className="shrink-0 h-9 px-4 rounded-xl bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] transition-colors disabled:opacity-40 flex items-center gap-1.5 text-sm font-semibold">
                        {acceptingId === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" />{t('relativeOnboarding.accept')}</>}
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={finishOnboarding} disabled={isSubmitting} className="w-full h-14 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] hover:shadow-[0_6px_28px_-4px_hsl(45_85%_55%/0.5)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('relativeOnboarding.continue')}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          ) : notFoundEmail ? (
            <div className="text-left animate-fade-in">
              <div className="p-5 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-[hsl(45_85%_55%)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">{t('relativeOnboarding.noUserFound')}</p>
                    <p className="text-xs text-white/40 mt-1">{t('relativeOnboarding.noAccountForEmail')} <span className="text-white/60">{notFoundEmail}</span></p>
                  </div>
                </div>
                <p className="text-sm text-white/50 mt-4 mb-4">{t('relativeOnboarding.correctEmail')}</p>
                <button onClick={handleShareInvite} className="w-full h-12 rounded-xl bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] transition-colors flex items-center justify-center gap-2 text-sm font-semibold">
                  <Share2 className="w-4 h-4" />{t('relativeOnboarding.shareInviteLink')}
                </button>
              </div>
              <button onClick={() => { setNotFoundEmail(null); setEmail(''); }} className="text-sm text-white/30 hover:text-white/50 transition-colors flex items-center justify-center gap-1.5 mx-auto mb-6">
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />{t('relativeOnboarding.tryAnotherEmail')}
              </button>
              <button onClick={finishOnboarding} disabled={isSubmitting} className="text-sm text-white/30 hover:text-white/50 transition-colors flex items-center justify-center gap-1.5 mx-auto py-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t('relativeOnboarding.skipDoLater')}<ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </div>
          ) : (
            <>
              <div className="text-left mb-4">
                <div className="flex items-center gap-2 mb-3"><UserPlus className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{t('relativeOnboarding.followFirstPerson')}</span></div>
                <div className="flex gap-2">
                  <Input type="email" placeholder={t('relativeOnboarding.enterPersonEmail')} value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30" onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()} />
                  <button onClick={handleSendRequest} disabled={isSending || sent || !email} className="shrink-0 h-10 px-4 rounded-lg bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] transition-colors disabled:opacity-40 flex items-center gap-1.5 text-sm font-semibold">
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" />{t('relativeOnboarding.send')}</>}
                  </button>
                </div>
                {sent && <p className="text-xs text-primary/70 mt-2">{t('relativeOnboarding.requestSentNote')}</p>}
              </div>
              {(!email || sent) && (
                <>
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30">{sent ? '' : t('relativeOnboarding.or')}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <button onClick={finishOnboarding} disabled={isSubmitting} className={sent ? "w-full h-14 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] shadow-[0_4px_20px_-4px_hsl(45_85%_55%/0.4)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50" : "text-sm text-white/30 hover:text-white/50 transition-colors flex items-center justify-center gap-1.5 mx-auto py-2 disabled:opacity-50"}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <>{t('relativeOnboarding.explore')}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></> : <>{t('relativeOnboarding.skipDoLater')}<ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default RelativeOnboarding;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useDoctorConnections, PatientConnection } from '@/hooks/useDoctorConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Clock, UserCheck, Eye, Loader2, UserPlus, Send, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const DoctorHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { firstName } = useProfile();
  const {
    approvedConnections,
    pendingConnections,
    pendingFromDoctor,
    isLoading,
    updateConnectionStatus,
    requestPatientAccess,
  } = useDoctorConnections();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const emailSchema = z.string().email();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 10) return t('doctorHome.goodMorning');
    if (hour < 18) return t('doctorHome.hello');
    return t('doctorHome.goodEvening');
  };

  const getPatientName = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name].filter(Boolean).join(' ');
    }
    return connection.patient_email || t('doctorHome.user');
  };

  const getPatientInitial = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name) return connection.patient_profile.first_name[0].toUpperCase();
    if (connection.patient_email) return connection.patient_email[0].toUpperCase();
    return 'A';
  };

  const handleSendRequest = async () => {
    if (!emailSchema.safeParse(patientEmail).success) {
      toast({ title: 'Ogiltig e-postadress', variant: 'destructive' });
      return;
    }
    setIsRequesting(true);
    const { success, error } = await requestPatientAccess(patientEmail.trim());
    setIsRequesting(false);
    if (success) {
      setPatientEmail('');
      setInviteOpen(false);
    } else if (error) {
      toast({ title: 'Kunde inte skicka förfrågan', description: error, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {greeting()}{firstName ? `, ${firstName}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">{t('doctorHome.welcomeToDashboard')}</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><UserCheck className="w-6 h-6 text-primary" /></div>
              <div>
                <p className="text-3xl font-bold">{approvedConnections.length}</p>
                <p className="text-muted-foreground text-sm">{approvedConnections.length === 1 ? t('doctorHome.activeUser') : t('doctorHome.activeUsers')}</p>
              </div>
            </div>
          </div>
          <div className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Clock className="w-6 h-6 text-primary" /></div>
              <div>
                <p className="text-3xl font-bold">{pendingConnections.length}</p>
                <p className="text-muted-foreground text-sm">{pendingConnections.length === 1 ? t('doctorHome.pendingRequest') : t('doctorHome.pendingRequests')}</p>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="font-display text-xl">Bjud in en patient</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Vi skickar en förfrågan i appen. Patienten väljer själv vilken data som delas med dig.
              </p>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="patientEmail" className="text-sm font-medium">Patientens e-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="patientEmail"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="namn@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendRequest();
                      }
                    }}
                    disabled={isRequesting}
                    className="pl-10 text-base"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.03]">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Patienten måste godkänna förfrågan innan du ser någon data. De kan när som helst dra tillbaka delningen.
                </p>
              </div>

              <Button
                onClick={handleSendRequest}
                disabled={isRequesting || !patientEmail.trim()}
                size="lg"
                className="w-full rounded-full font-semibold gap-2"
              >
                {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isRequesting ? 'Skickar…' : 'Skicka förfrågan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {pendingConnections.length > 0 && (
          <section className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">{t('doctorHome.pendingRequestsTitle')}</h2>
              <span className="bg-primary/15 text-primary text-xs font-medium px-2 py-1 rounded-full">{pendingConnections.length}</span>
            </div>
            <div className="space-y-3">
              {pendingConnections.map((connection) => {
                const sentByDoctor = pendingFromDoctor.some((c) => c.id === connection.id);
                return (
                  <div key={connection.id} className="flex items-center justify-between p-4 bg-foreground/[0.03] rounded-lg">
                    <div>
                      <p className="font-medium">{getPatientName(connection)}</p>
                      <p className="text-sm text-muted-foreground">
                        {sentByDoctor ? 'Väntar på patientens godkännande' : t('doctorHome.wantsToShareData')}
                      </p>
                    </div>
                    {!sentByDoctor && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateConnectionStatus(connection.id, 'approved')}>{t('doctorHome.approve')}</Button>
                        <Button size="sm" variant="outline" onClick={() => updateConnectionStatus(connection.id, 'rejected')}>{t('doctorHome.reject')}</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">{t('doctorHome.myUsers')}</h2>
            </div>
            {approvedConnections.length > 0 && (
              <Button
                onClick={() => setInviteOpen(true)}
                size="sm"
                className="rounded-full font-semibold gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Bjud in patient
              </Button>
            )}
          </div>

          {approvedConnections.length === 0 ? (
            <div className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('doctorHome.noUsersYet')}</h3>
              <p className="text-muted-foreground mb-6">{t('doctorHome.usersWillAppearHere')}</p>
              <Button
                onClick={() => setInviteOpen(true)}
                size="lg"
                className="rounded-full font-semibold gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Bjud in din första patient
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedConnections.map((connection) => (
                <div key={connection.id} className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-colors hover:bg-foreground/[0.05]" onClick={() => navigate(`/patient/${connection.patient_id}`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">{getPatientInitial(connection)}</span>
                    </div>
                    <Button size="sm" variant="ghost"><Eye className="w-4 h-4 mr-1" />{t('doctorHome.show')}</Button>
                  </div>
                  <h3 className="font-semibold mb-1">{getPatientName(connection)}</h3>
                  {connection.patient_email && connection.patient_profile?.first_name && (
                    <p className="text-xs text-muted-foreground mb-1 truncate">{connection.patient_email}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('doctorHome.connectedSince')} {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {connection.share_mood && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorHome.mood')}</span>}
                    {connection.share_sleep && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorHome.sleep')}</span>}
                    {connection.share_eating && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorHome.diet')}</span>}
                    {connection.share_exercise && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorHome.exercise')}</span>}
                    {connection.share_medication && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorHome.medication')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6">
          <h3 className="font-medium mb-2">{t('doctorHome.howItWorks')}</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• {t('doctorHome.howItWorksInfo1')}</li>
            <li>• {t('doctorHome.howItWorksInfo2')}</li>
            <li>• {t('doctorHome.howItWorksInfo3')}</li>
            <li>• {t('doctorHome.howItWorksInfo4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DoctorHome;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctorConnections, PatientConnection } from '@/hooks/useDoctorConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, UserCheck, Clock, Eye, UserPlus, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

import { usePatientsLatestStatus, STATUS_META } from '@/hooks/usePatientsLatestStatus';

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { approvedConnections, pendingFromPatients, pendingFromDoctor, isLoading, updateConnectionStatus, requestPatientAccess, cancelRequest } = useDoctorConnections();
  const { statuses } = usePatientsLatestStatus(approvedConnections.map(c => c.patient_id));
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const emailSchema = z.string().email();

  const handleRequestAccess = async () => {
    if (!emailSchema.safeParse(patientEmail).success) {
      toast({ title: t('doctorDashboard.invalidEmail'), variant: 'destructive' });
      return;
    }
    setIsRequesting(true);
    const { success, error } = await requestPatientAccess(patientEmail);
    setIsRequesting(false);
    if (success) { setPatientEmail(''); setRequestDialogOpen(false); }
    else if (error) toast({ title: t('doctorDashboard.couldNotSendRequest'), description: error, variant: 'destructive' });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const getPatientName = (c: PatientConnection) => {
    if (c.patient_profile?.first_name || c.patient_profile?.last_name) return [c.patient_profile.first_name, c.patient_profile.last_name].filter(Boolean).join(' ');
    return c.patient_email || t('doctorDashboard.user');
  };

  const getPatientInitial = (c: PatientConnection) => {
    if (c.patient_profile?.first_name) return c.patient_profile.first_name[0].toUpperCase();
    if (c.patient_email) return c.patient_email[0].toUpperCase();
    return 'A';
  };

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Mina patienter</h1>
            <p className="text-muted-foreground">Översikt över patienter som delar sin data med dig.</p>
          </div>
          <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="w-4 h-4" />{t('doctorDashboard.requestAccess')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bjud in användare att dela sin data med dig</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input id="patientEmail" type="email" placeholder="namn@example.com" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} disabled={isRequesting} className="text-base" />
                <Button onClick={handleRequestAccess} disabled={isRequesting} className="w-full gap-2">
                  {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('doctorDashboard.sendRequest')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {pendingFromPatients.length > 0 && (
          <section className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">{t('doctorDashboard.incomingRequests')}</h2>
              <span className="bg-primary/15 text-primary text-xs font-medium px-2 py-1 rounded-full">{pendingFromPatients.length}</span>
            </div>
            <div className="space-y-3">
              {pendingFromPatients.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-foreground/[0.03] rounded-lg">
                  <div>
                    <p className="font-medium">{getPatientName(c)}</p>
                    {(c.patient_profile?.first_name || c.patient_profile?.last_name) && c.patient_email && <p className="text-sm text-muted-foreground">{c.patient_email}</p>}
                    <p className="text-sm text-muted-foreground">{t('doctorDashboard.wantsToShareData')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateConnectionStatus(c.id, 'approved')}>{t('doctorDashboard.approve')}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateConnectionStatus(c.id, 'rejected')}>{t('doctorDashboard.reject')}</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pendingFromDoctor.length > 0 && (
          <section className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">{t('doctorDashboard.sentRequests')}</h2>
              <span className="bg-primary/15 text-primary text-xs font-medium px-2 py-1 rounded-full">{pendingFromDoctor.length}</span>
            </div>
            <div className="space-y-3">
              {pendingFromDoctor.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-foreground/[0.03] rounded-lg">
                  <div>
                    <p className="font-medium">{getPatientName(c)}</p>
                    {(c.patient_profile?.first_name || c.patient_profile?.last_name) && c.patient_email && <p className="text-sm text-muted-foreground">{c.patient_email}</p>}
                    <p className="text-sm text-muted-foreground">{t('doctorDashboard.waitingForResponse')}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => cancelRequest(c.id)}>
                    <X className="w-4 h-4" />{t('doctorDashboard.cancel')}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-3 mb-6">
            <UserCheck className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Patienter</h2>
            {approvedConnections.length > 0 && (
              <span className="text-sm text-muted-foreground">({approvedConnections.length})</span>
            )}
          </div>
          {approvedConnections.length === 0 ? (
            <div className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('doctorDashboard.noUsersYet')}</h3>
              <p className="text-muted-foreground">{t('doctorDashboard.requestAccessOrWait')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedConnections.map((c) => {
                const status = statuses[c.patient_id];
                const meta = status ? STATUS_META[status.status] : STATUS_META.unknown;
                const sinceLabel =
                  status?.daysSince === null || status?.daysSince === undefined
                    ? 'Ingen incheckning ännu'
                    : status.daysSince === 0
                    ? 'Incheckad idag'
                    : status.daysSince === 1
                    ? 'Incheckad igår'
                    : `${status.daysSince} dagar sedan`;
                return (
                  <div key={c.id} className="bg-foreground/[0.03] backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-colors hover:bg-foreground/[0.05]" onClick={() => navigate(`/patient/${c.patient_id}`)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">{getPatientInitial(c)}</span>
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background"
                          style={{ backgroundColor: meta.color }}
                          aria-label={meta.label}
                        />
                      </div>
                      <Button size="sm" variant="ghost"><Eye className="w-4 h-4 mr-1" />{t('doctorDashboard.show')}</Button>
                    </div>
                    <h3 className="font-semibold mb-1">{getPatientName(c)}</h3>
                    {c.patient_email && c.patient_profile?.first_name && (
                      <p className="text-xs text-muted-foreground mb-1 truncate">{c.patient_email}</p>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="font-medium" style={{ color: meta.color }}>{meta.label}</span>
                      {' · '}
                      <span className="text-muted-foreground">{sinceLabel}</span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.share_mood && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorDashboard.mood')}</span>}
                      {c.share_sleep && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorDashboard.sleep')}</span>}
                      {c.share_eating && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorDashboard.diet')}</span>}
                      {c.share_exercise && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorDashboard.exercise')}</span>}
                      {c.share_medication && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('doctorDashboard.medication')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DoctorDashboard;

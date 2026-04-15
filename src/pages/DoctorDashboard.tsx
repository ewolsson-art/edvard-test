import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctorConnections, PatientConnection } from '@/hooks/useDoctorConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, UserCheck, Clock, Eye, UserPlus, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
import { useTranslation } from 'react-i18next';
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const emailSchema = z.string().email({ message: "Ogiltig e-postadress" });

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    approvedConnections, 
    pendingFromPatients, 
    pendingFromDoctor,
    isLoading, 
    updateConnectionStatus,
    requestPatientAccess,
    cancelRequest,
  } = useDoctorConnections();

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAccess = async () => {
    const result = emailSchema.safeParse(patientEmail);
    if (!result.success) {
      toast({
        title: "Ogiltig e-postadress",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);
    const { success, error } = await requestPatientAccess(patientEmail);
    setIsRequesting(false);

    if (success) {
      setPatientEmail('');
      setRequestDialogOpen(false);
    } else if (error) {
      toast({
        title: "Kunde inte skicka förfrågan",
        description: error,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getPatientName = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    // Fall back to email if no name is set
    if (connection.patient_email) {
      return connection.patient_email;
    }
    return 'Användare';
  };

  const getPatientInitial = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name) {
      return connection.patient_profile.first_name[0].toUpperCase();
    }
    if (connection.patient_email) {
      return connection.patient_email[0].toUpperCase();
    }
    return 'A';
  };

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Mina användare
            </h1>
            <p className="text-muted-foreground">
              Se översikt över dina användares mående
            </p>
          </div>
          <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Begär åtkomst
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Begär åtkomst till användare</DialogTitle>
                <DialogDescription>
                  Ange användarens e-postadress för att skicka en förfrågan om att få tillgång till deras data.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="patientEmail">Användarens e-post</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    placeholder="namn@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    disabled={isRequesting}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Användaren kommer att kunna godkänna eller avvisa din förfrågan och välja vilken data som ska delas med dig.
                </p>

                <Button onClick={handleRequestAccess} disabled={isRequesting} className="w-full gap-2">
                  {isRequesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Skicka förfrågan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Pending requests FROM patients */}
        {pendingFromPatients.length > 0 && (
          <section className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="font-display text-xl font-semibold">Inkommande förfrågningar</h2>
              <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium px-2 py-1 rounded-full">
                {pendingFromPatients.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingFromPatients.map((connection) => {
                const hasName = connection.patient_profile?.first_name || connection.patient_profile?.last_name;
                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{getPatientName(connection)}</p>
                      {hasName && connection.patient_email && (
                        <p className="text-sm text-muted-foreground">{connection.patient_email}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Vill dela sin data med dig
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateConnectionStatus(connection.id, 'approved')}
                      >
                        Godkänn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                      >
                        Avvisa
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Pending requests sent BY doctor */}
        {pendingFromDoctor.length > 0 && (
          <section className="glass-card p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-5 h-5 text-blue-500" />
              <h2 className="font-display text-xl font-semibold">Skickade förfrågningar</h2>
              <span className="bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                {pendingFromDoctor.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingFromDoctor.map((connection) => {
                const hasName = connection.patient_profile?.first_name || connection.patient_profile?.last_name;
                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{getPatientName(connection)}</p>
                      {hasName && connection.patient_email && (
                        <p className="text-sm text-muted-foreground">{connection.patient_email}</p>
                      )}
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Väntar på svar
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => cancelRequest(connection.id)}
                    >
                      <X className="w-4 h-4" />
                      Avbryt
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Approved patients */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <UserCheck className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Godkända användare</h2>
          </div>

          {approvedConnections.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga användare ännu</h3>
              <p className="text-muted-foreground mb-4">
                Begär åtkomst till användare eller vänta på att de bjuder in dig.
              </p>
              <Button onClick={() => setRequestDialogOpen(true)} variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Begär åtkomst
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="glass-card p-6 cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => navigate(`/patient/${connection.patient_id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {getPatientInitial(connection)}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4 mr-1" />
                      Visa
                    </Button>
                  </div>
                  <h3 className="font-semibold mb-1">{getPatientName(connection)}</h3>
                  {connection.patient_email && connection.patient_profile?.first_name && (
                    <p className="text-xs text-muted-foreground mb-1 truncate">{connection.patient_email}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-3">
                    Kopplad sedan {new Date(connection.created_at).toLocaleDateString('sv-SE')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {connection.share_mood && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Mående</span>
                    )}
                    {connection.share_sleep && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Sömn</span>
                    )}
                    {connection.share_eating && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Kost</span>
                    )}
                    {connection.share_exercise && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Träning</span>
                    )}
                    {connection.share_medication && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Medicin</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DoctorDashboard;

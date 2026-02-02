import { useState } from 'react';
import { z } from 'zod';
import { useRelativeConnections } from '@/hooks/useRelativeConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Users, X, Send, Check, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const emailSchema = z.string().email({ message: "Ogiltig e-postadress" });

export const RelativePatientConnectionsSection = () => {
  const { 
    approvedConnections,
    pendingFromPatients,
    pendingFromRelative,
    isLoading, 
    requestPatientAccess,
    cancelRequest,
    refetch,
  } = useRelativeConnections();
  const { toast } = useToast();
  
  const [patientEmail, setPatientEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

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

  const getPatientName = (connection: typeof approvedConnections[0]) => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    if (connection.patient_email) {
      return connection.patient_email;
    }
    return 'Okänd patient';
  };

  const getPatientInitial = (connection: typeof approvedConnections[0]) => {
    if (connection.patient_profile?.first_name) {
      return connection.patient_profile.first_name[0].toUpperCase();
    }
    if (connection.patient_email) {
      return connection.patient_email[0].toUpperCase();
    }
    return 'P';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalPending = pendingFromPatients.length + pendingFromRelative.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mina närstående</h3>
          {totalPending > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {totalPending}
            </Badge>
          )}
        </div>
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <UserPlus className="h-4 w-4" />
              Begär åtkomst
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Begär åtkomst till närstående</DialogTitle>
              <DialogDescription>
                Ange din närståendes e-postadress för att skicka en förfrågan om att få se deras data.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Närståendes e-post</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  placeholder="narstående@example.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  disabled={isRequesting}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Din närstående kommer att kunna godkänna eller avvisa din förfrågan och välja vilken data du får se.
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
      </div>

      <p className="text-xs text-muted-foreground">Se och hantera dina kopplingar till närstående</p>

      {/* Pending requests sent by you */}
      {pendingFromRelative.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Send className="w-4 h-4" />
            Skickade förfrågningar
          </div>
          {pendingFromRelative.map((connection) => (
            <div key={connection.id} className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {getPatientInitial(connection)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{getPatientName(connection)}</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Väntar på svar</p>
                  </div>
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
            </div>
          ))}
        </div>
      )}

      {/* Approved connections */}
      {approvedConnections.length === 0 && pendingFromRelative.length === 0 ? (
        <div className="text-center py-6 bg-muted/50 rounded-xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Inga närstående kopplade ännu</p>
          <Button 
            onClick={() => setRequestDialogOpen(true)} 
            variant="link" 
            size="sm"
            className="mt-2"
          >
            Begär åtkomst till din första närstående
          </Button>
        </div>
      ) : approvedConnections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            Godkända kopplingar
          </div>
          {approvedConnections.map((connection) => (
            <div key={connection.id} className="p-4 rounded-xl border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {getPatientInitial(connection)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{getPatientName(connection)}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {connection.share_mood && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Mående</span>
                      )}
                      {connection.share_sleep && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Sömn</span>
                      )}
                      {connection.share_eating && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Kost</span>
                      )}
                      {connection.share_exercise && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Träning</span>
                      )}
                      {connection.share_medication && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Medicin</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  asChild
                >
                  <a href={`/patient/${connection.patient_id}`}>
                    <Eye className="w-4 h-4" />
                    Visa
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
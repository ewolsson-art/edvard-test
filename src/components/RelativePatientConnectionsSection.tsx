import { useState } from 'react';
import { z } from 'zod';
import { useRelativeConnections } from '@/hooks/useRelativeConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Users, X, Send, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    return 'Användare';
  };

  const getPatientInitial = (connection: typeof approvedConnections[0]) => {
    if (connection.patient_profile?.first_name) {
      return connection.patient_profile.first_name[0].toUpperCase();
    }
    if (connection.patient_email) {
      return connection.patient_email[0].toUpperCase();
    }
    return 'A';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = approvedConnections.length > 0;
  const hasPending = pendingFromRelative.length > 0;
  const isEmpty = !hasData && !hasPending;

  return (
    <div className="space-y-6">
      {/* Header — only show top-right CTA when there's existing data */}
      <div className="flex items-center justify-between">
        {hasData && (
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1.5"
            onClick={() => setRequestDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Begär åtkomst
          </Button>
        )}
      </div>

      {/* Pending requests — subtle list style */}
      {hasPending && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Väntande förfrågningar
          </p>
          {pendingFromRelative.map((connection) => (
            <div 
              key={connection.id} 
              className="flex items-center justify-between py-3 px-4 rounded-xl bg-foreground/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {getPatientInitial(connection)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">{getPatientName(connection)}</span>
                  <p className="text-xs text-muted-foreground">Väntar på svar</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                onClick={() => cancelRequest(connection.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — the hero moment */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-14 h-14 rounded-full bg-foreground/[0.04] flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground/60" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-base font-medium text-muted-foreground">Inga kopplingar ännu</p>
            <p className="text-sm text-muted-foreground/60 max-w-[260px]">
              Begär åtkomst till någon du bryr dig om för att följa deras mående
            </p>
          </div>
          <Button 
            onClick={() => setRequestDialogOpen(true)} 
            className="gap-2 mt-2 h-11 px-6 text-sm font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
          >
            <UserPlus className="w-4 h-4" />
            Begär åtkomst
          </Button>
        </div>
      )}

      {/* Only pending, no approved — show smaller CTA below */}
      {hasPending && !hasData && (
        <div className="flex justify-center pt-2">
        <Button 
            onClick={() => setRequestDialogOpen(true)} 
            className="gap-2 rounded-full bg-[hsl(45,85%,55%)] hover:bg-[hsl(45,85%,50%)] text-black font-semibold shadow-[0_0_20px_hsl(45,85%,55%,0.15)]"
          >
            <UserPlus className="w-4 h-4" />
            Följ fler personer
          </Button>
        </div>
      )}

      {/* Approved connections */}
      {hasData && (
        <div className="space-y-1">
          {approvedConnections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-foreground/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {getPatientInitial(connection)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-sm">{getPatientName(connection)}</h4>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {connection.share_mood && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Mående</span>
                    )}
                    {connection.share_sleep && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Sömn</span>
                    )}
                    {connection.share_eating && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Kost</span>
                    )}
                    {connection.share_exercise && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Träning</span>
                    )}
                    {connection.share_medication && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Medicin</span>
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
          ))}
        </div>
      )}

      {/* Request dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Begär åtkomst</DialogTitle>
            <DialogDescription>
              Ange e-postadressen till personen du vill följa för att skicka en förfrågan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="patientEmail">E-postadress</Label>
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
              Personen kommer att kunna godkänna eller avvisa din förfrågan och välja vilken data du får se.
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
  );
};

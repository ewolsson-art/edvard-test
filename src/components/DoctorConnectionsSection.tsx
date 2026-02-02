import { useState } from 'react';
import { z } from 'zod';
import { usePatientConnections } from '@/hooks/usePatientConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, Users, Trash2, Settings, Stethoscope, Check, X, Bell } from 'lucide-react';
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

export const DoctorConnectionsSection = () => {
  const { 
    connections, 
    pendingFromDoctors,
    isLoading, 
    inviteDoctor, 
    updateShareSettings, 
    removeConnection,
    respondToRequest,
  } = usePatientConnections();
  const { toast } = useToast();
  
  const [doctorEmail, setDoctorEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    share_mood: true,
    share_sleep: true,
    share_eating: true,
    share_exercise: true,
    share_medication: true,
    share_comments: false,
    share_ai_insights: false,
  });

  const handleInvite = async () => {
    const result = emailSchema.safeParse(doctorEmail);
    if (!result.success) {
      toast({
        title: "Ogiltig e-postadress",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    const { success, error } = await inviteDoctor(doctorEmail, shareSettings);
    setIsInviting(false);

    if (success) {
      setDoctorEmail('');
      setInviteDialogOpen(false);
    } else if (error) {
      toast({
        title: "Kunde inte bjuda in",
        description: error,
        variant: "destructive",
      });
    }
  };

  const handleRespondToRequest = async (approved: boolean) => {
    if (!selectedRequest) return;
    setIsResponding(true);
    
    const success = await respondToRequest(
      selectedRequest, 
      approved, 
      approved ? shareSettings : undefined
    );
    
    setIsResponding(false);
    if (success) {
      setRespondDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  const openRespondDialog = (connectionId: string) => {
    setSelectedRequest(connectionId);
    setShareSettings({
      share_mood: true,
      share_sleep: true,
      share_eating: true,
      share_exercise: true,
      share_medication: true,
      share_comments: false,
      share_ai_insights: false,
    });
    setRespondDialogOpen(true);
  };

  const getDoctorName = (connection: typeof connections[0]) => {
    if (connection.doctor_profile?.first_name || connection.doctor_profile?.last_name) {
      return [connection.doctor_profile.first_name, connection.doctor_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    if (connection.doctor_email) {
      return connection.doctor_email;
    }
    return 'Okänd läkare';
  };

  const getStatusLabel = (status: string, initiatedBy: string) => {
    if (status === 'pending') {
      return initiatedBy === 'doctor' ? 'Väntar på ditt svar' : 'Väntar på svar';
    }
    switch (status) {
      case 'approved': return 'Godkänd';
      case 'rejected': return 'Avvisad';
      default: return status;
    }
  };

  const getStatusColor = (status: string, initiatedBy: string) => {
    if (status === 'pending' && initiatedBy === 'doctor') {
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    }
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'approved': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const selectedRequestData = connections.find(c => c.id === selectedRequest);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mina läkare</h3>
          {pendingFromDoctors.length > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {pendingFromDoctors.length}
            </Badge>
          )}
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <UserPlus className="h-4 w-4" />
              Bjud in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bjud in en läkare</DialogTitle>
              <DialogDescription>
                Ange läkarens e-postadress och välj vilken data du vill dela.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="doctorEmail">Läkarens e-post</Label>
                <Input
                  id="doctorEmail"
                  type="email"
                  placeholder="lakare@example.com"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>

              <div className="space-y-4">
                <Label>Dela följande data</Label>
                <div className="space-y-3">
                  {[
                    { key: 'share_mood', label: 'Mående' },
                    { key: 'share_sleep', label: 'Sömn' },
                    { key: 'share_eating', label: 'Kost' },
                    { key: 'share_exercise', label: 'Träning' },
                    { key: 'share_medication', label: 'Mediciner' },
                    { key: 'share_comments', label: 'Kommentarer' },
                    { key: 'share_ai_insights', label: 'AI-insikter' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <Switch
                        checked={shareSettings[key as keyof typeof shareSettings]}
                        onCheckedChange={(checked) =>
                          setShareSettings(prev => ({ ...prev, [key]: checked }))
                        }
                        disabled={isInviting}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleInvite} disabled={isInviting} className="w-full">
                {isInviting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Skicka inbjudan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-muted-foreground">Hantera vilka läkare som har tillgång till din data</p>

      {/* Pending requests from doctors */}
      {pendingFromDoctors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Bell className="w-4 h-4" />
            Inkommande förfrågningar
          </div>
          {pendingFromDoctors.map((connection) => (
            <div key={connection.id} className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{getDoctorName(connection)}</h4>
                    {connection.doctor_profile?.clinic_name && (
                      <p className="text-xs text-muted-foreground">{connection.doctor_profile.clinic_name}</p>
                    )}
                    <p className="text-xs text-blue-600 dark:text-blue-400">Vill ha tillgång till din data</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => removeConnection(connection.id)}
                  >
                    <X className="w-4 h-4" />
                    Avvisa
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => openRespondDialog(connection.id)}
                  >
                    <Check className="w-4 h-4" />
                    Godkänn
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Godkänn åtkomst</DialogTitle>
            <DialogDescription>
              Välj vilken data du vill dela med {selectedRequestData ? getDoctorName(selectedRequestData) : 'läkaren'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <Label>Dela följande data</Label>
              <div className="space-y-3">
                {[
                  { key: 'share_mood', label: 'Mående' },
                  { key: 'share_sleep', label: 'Sömn' },
                  { key: 'share_eating', label: 'Kost' },
                  { key: 'share_exercise', label: 'Träning' },
                  { key: 'share_medication', label: 'Mediciner' },
                  { key: 'share_comments', label: 'Kommentarer' },
                  { key: 'share_ai_insights', label: 'AI-insikter' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={shareSettings[key as keyof typeof shareSettings]}
                      onCheckedChange={(checked) =>
                        setShareSettings(prev => ({ ...prev, [key]: checked }))
                      }
                      disabled={isResponding}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleRespondToRequest(false)} 
                disabled={isResponding}
                className="flex-1"
              >
                Avvisa
              </Button>
              <Button 
                onClick={() => handleRespondToRequest(true)} 
                disabled={isResponding}
                className="flex-1"
              >
                {isResponding && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Godkänn
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing connections */}
      {connections.filter(c => !(c.status === 'pending' && c.initiated_by === 'doctor')).length === 0 && pendingFromDoctors.length === 0 ? (
        <div className="text-center py-6 bg-muted/50 rounded-xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Inga läkare kopplade ännu</p>
          <Button 
            onClick={() => setInviteDialogOpen(true)} 
            variant="link" 
            size="sm"
            className="mt-2"
          >
            Bjud in din första läkare
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.filter(c => !(c.status === 'pending' && c.initiated_by === 'doctor')).map((connection) => (
            <div key={connection.id} className="p-4 rounded-xl border bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {(connection.doctor_profile?.first_name?.[0] || 'L').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{getDoctorName(connection)}</h4>
                    {connection.doctor_profile?.clinic_name && (
                      <p className="text-xs text-muted-foreground">{connection.doctor_profile.clinic_name}</p>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(connection.status, connection.initiated_by)}`}>
                      {getStatusLabel(connection.status, connection.initiated_by)}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => removeConnection(connection.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>

              {connection.status === 'approved' && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Delad data</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'share_mood', label: 'Mående' },
                      { key: 'share_sleep', label: 'Sömn' },
                      { key: 'share_eating', label: 'Kost' },
                      { key: 'share_exercise', label: 'Träning' },
                      { key: 'share_medication', label: 'Mediciner' },
                      { key: 'share_comments', label: 'Kommentarer' },
                      { key: 'share_ai_insights', label: 'AI-insikter' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between bg-background rounded-lg px-2 py-1.5">
                        <span className="text-xs">{label}</span>
                        <Switch
                          checked={connection[key as keyof typeof connection] as boolean}
                          onCheckedChange={(checked) =>
                            updateShareSettings(connection.id, { [key]: checked })
                          }
                          className="scale-75"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

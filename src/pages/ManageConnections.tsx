import { useState } from 'react';
import { z } from 'zod';
import { usePatientConnections } from '@/hooks/usePatientConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, Users, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const emailSchema = z.string().email({ message: "Ogiltig e-postadress" });

const ManageConnections = () => {
  const { connections, isLoading, inviteDoctor, updateShareSettings, removeConnection } = usePatientConnections();
  const { toast } = useToast();
  
  const [doctorEmail, setDoctorEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    share_mood: true,
    share_sleep: true,
    share_eating: true,
    share_exercise: true,
    share_medication: true,
    share_comments: false,
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

  const getDoctorName = (connection: typeof connections[0]) => {
    if (connection.doctor_profile?.first_name || connection.doctor_profile?.last_name) {
      return [connection.doctor_profile.first_name, connection.doctor_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    return 'Okänd läkare';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Väntar på godkännande';
      case 'approved': return 'Godkänd';
      case 'rejected': return 'Avvisad';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'approved': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Mina läkare
            </h1>
            <p className="text-muted-foreground">
              Hantera vilka läkare som har tillgång till din data
            </p>
          </div>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Bjud in läkare
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
        </header>

        {connections.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Inga kopplingar ännu</h3>
            <p className="text-muted-foreground mb-6">
              Bjud in en läkare för att dela din data.
            </p>
            <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Bjud in läkare
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {(connection.doctor_profile?.first_name?.[0] || 'L').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{getDoctorName(connection)}</h3>
                      {connection.doctor_profile?.clinic_name && (
                        <p className="text-sm text-muted-foreground">{connection.doctor_profile.clinic_name}</p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(connection.status)}`}>
                        {getStatusLabel(connection.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeConnection(connection.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {connection.status === 'approved' && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Delad data</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'share_mood', label: 'Mående' },
                        { key: 'share_sleep', label: 'Sömn' },
                        { key: 'share_eating', label: 'Kost' },
                        { key: 'share_exercise', label: 'Träning' },
                        { key: 'share_medication', label: 'Mediciner' },
                        { key: 'share_comments', label: 'Kommentarer' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                          <span className="text-sm">{label}</span>
                          <Switch
                            checked={connection[key as keyof typeof connection] as boolean}
                            onCheckedChange={(checked) =>
                              updateShareSettings(connection.id, { [key]: checked })
                            }
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
    </div>
  );
};

export default ManageConnections;

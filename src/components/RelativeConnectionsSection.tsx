import { useState } from 'react';
import { z } from 'zod';
import { usePatientRelativeConnections } from '@/hooks/usePatientRelativeConnections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, Users, Trash2, Settings, Check, X, Bell } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';

const emailSchema = z.string().email({ message: "Ogiltig e-postadress" });

export const RelativeConnectionsSection = () => {
  const { t } = useTranslation();
  const { 
    connections, 
    pendingFromRelatives,
    isLoading, 
    inviteRelative, 
    updateShareSettings, 
    removeConnection,
    respondToRequest,
  } = usePatientRelativeConnections();
  const { toast } = useToast();
  
  const [relativeEmail, setRelativeEmail] = useState('');
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
    share_characteristics: false,
    notify_low_mood: false,
  });

  const handleInvite = async () => {
    const result = emailSchema.safeParse(relativeEmail);
    if (!result.success) {
      toast({
        title: "Ogiltig e-postadress",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    const { success, error } = await inviteRelative(relativeEmail, shareSettings);
    setIsInviting(false);

    if (success) {
      setRelativeEmail('');
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
      share_characteristics: false,
      notify_low_mood: false,
    });
    setRespondDialogOpen(true);
  };

  const getRelativeName = (connection: typeof connections[0]) => {
    if (connection.relative_profile?.first_name || connection.relative_profile?.last_name) {
      return [connection.relative_profile.first_name, connection.relative_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    if (connection.relative_email) {
      return connection.relative_email;
    }
    return 'Okänd anhörig';
  };

  const getStatusLabel = (status: string, initiatedBy: string) => {
    if (status === 'pending') {
      return initiatedBy === 'relative' ? 'Väntar på ditt svar' : 'Väntar på svar';
    }
    switch (status) {
      case 'approved': return 'Godkänd';
      case 'rejected': return 'Avvisad';
      default: return status;
    }
  };

  const getStatusColor = (status: string, initiatedBy: string) => {
    if (status === 'pending' && initiatedBy === 'relative') {
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

  const shareOptions = [
    { key: 'share_mood', label: 'Mående' },
    { key: 'share_sleep', label: 'Sömn' },
    { key: 'share_eating', label: 'Kost' },
    { key: 'share_exercise', label: 'Träning' },
    { key: 'share_medication', label: 'Mediciner' },
    { key: 'share_comments', label: 'Kommentarer' },
    { key: 'share_characteristics', label: 'Kännetecken' },
  ];

  const notificationOptions = [
    { key: 'notify_low_mood', label: 'Notis vid mycket lågt mående', description: 'Anhörig får en notis om du checkar in som "Mycket låg"' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mina anhöriga</h3>
          {pendingFromRelatives.length > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {pendingFromRelatives.length}
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
              <DialogTitle>Bjud in en anhörig</DialogTitle>
              <DialogDescription>
                Ange den anhörigas e-postadress och välj vilken data du vill dela.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="relativeEmail">Anhörigs e-post</Label>
                <Input
                  id="relativeEmail"
                  type="email"
                  placeholder="anhörig@example.com"
                  value={relativeEmail}
                  onChange={(e) => setRelativeEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>

              <div className="space-y-4">
                <Label>Dela följande data</Label>
                <div className="space-y-3">
                  {shareOptions.map(({ key, label }) => (
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

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notiser
                </Label>
                <div className="space-y-3">
                  {notificationOptions.map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">{label}</span>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
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

      <p className="text-xs text-muted-foreground">Hantera vilka anhöriga som har tillgång till din data</p>

      {pendingFromRelatives.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Bell className="w-4 h-4" />
            Inkommande förfrågningar
          </div>
          {pendingFromRelatives.map((connection) => (
            <div key={connection.id} className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{getRelativeName(connection)}</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Vill se din data</p>
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

      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Godkänn åtkomst</DialogTitle>
            <DialogDescription>
              Välj vilken data du vill dela med {selectedRequestData ? getRelativeName(selectedRequestData) : 'anhörig'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <Label>Dela följande data</Label>
              <div className="space-y-3">
                {shareOptions.map(({ key, label }) => (
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

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notiser
              </Label>
              <div className="space-y-3">
                {notificationOptions.map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm">{label}</span>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
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

      {connections.filter(c => !(c.status === 'pending' && c.initiated_by === 'relative')).length === 0 && pendingFromRelatives.length === 0 ? (
        <div className="text-center py-6 bg-muted/50 rounded-xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Inga anhöriga kopplade ännu</p>
          <Button 
            onClick={() => setInviteDialogOpen(true)} 
            variant="link" 
            size="sm"
            className="mt-2"
          >
            Bjud in din första anhöriga
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.filter(c => !(c.status === 'pending' && c.initiated_by === 'relative')).map((connection) => (
            <div key={connection.id} className="p-4 rounded-xl border bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {(connection.relative_profile?.first_name?.[0] || 'A').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{getRelativeName(connection)}</h4>
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
                    {shareOptions.map(({ key, label }) => (
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
                  <div className="col-span-2 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Notiser</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-lg px-2 py-1.5">
                      <div>
                        <span className="text-xs">Notis vid mycket lågt mående</span>
                      </div>
                      <Switch
                        checked={connection.notify_low_mood as boolean}
                        onCheckedChange={(checked) =>
                          updateShareSettings(connection.id, { notify_low_mood: checked })
                        }
                        className="scale-75"
                      />
                    </div>
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

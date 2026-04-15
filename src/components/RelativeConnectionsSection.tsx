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

const emailSchema = z.string().email();

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
        title: t("relativeConnections.invalidEmail"),
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
        title: t("relativeConnections.couldNotInvite"),
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
    return t("relativeConnections.unknownRelative");
  };

   const getStatusLabel = (status: string, initiatedBy: string) => {
     if (status === 'pending') {
       return initiatedBy === 'relative' ? t("relativeConnections.waitingForYourResponse") : t("relativeConnections.waitingForResponse");
     }
     switch (status) {
       case 'approved': return t("relativeConnections.approved");
       case 'rejected': return t("relativeConnections.rejected");
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
     { key: 'share_mood', label: t("relativeConnections.mood") },
     { key: 'share_sleep', label: t("relativeConnections.sleep") },
     { key: 'share_eating', label: t("relativeConnections.eating") },
     { key: 'share_exercise', label: t("relativeConnections.exercise") },
     { key: 'share_medication', label: t("relativeConnections.medication") },
     { key: 'share_comments', label: t("relativeConnections.comments") },
     { key: 'share_characteristics', label: t("relativeConnections.characteristics") },
   ];

   const notificationOptions = [
     { key: 'notify_low_mood', label: t("relativeConnections.notifyLowMood"), description: t("relativeConnections.notifyLowMoodDesc") },
   ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("relativeConnections.myRelatives")}</h3>
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
               {t("relativeConnections.invite")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
               <DialogTitle>{t("relativeConnections.inviteRelative")}</DialogTitle>
               <DialogDescription>
                 {t("relativeConnections.inviteDesc")}
               </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="relativeEmail">{t("relativeConnections.relativeEmail")}</Label>
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
                 <Label>{t("relativeConnections.shareFollowingData")}</Label>
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
                   {t("relativeConnections.notifications")}
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
                {t("relativeConnections.sendInvitation")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-muted-foreground">{t("relativeConnections.manageAccess")}</p>

      {pendingFromRelatives.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Bell className="w-4 h-4" />
            {t("relativeConnections.incomingRequests")}
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
                    <p className="text-xs text-blue-600 dark:text-blue-400">{t("relativeConnections.wantsToSeeData")}</p>
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
                     {t("relativeConnections.reject")}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => openRespondDialog(connection.id)}
                  >
                    <Check className="w-4 h-4" />
                     {t("relativeConnections.approve")}
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
             <DialogTitle>{t("relativeConnections.approveAccess")}</DialogTitle>
             <DialogDescription>
               {t("relativeConnections.approveAccessDesc")} {selectedRequestData ? getRelativeName(selectedRequestData) : t("relativeConnections.theRelative")}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <Label>{t("relativeConnections.shareFollowingData")}</Label>
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
                 {t("relativeConnections.notifications")}
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
                {t("relativeConnections.reject")}
              </Button>
              <Button 
                onClick={() => handleRespondToRequest(true)} 
                disabled={isResponding}
                className="flex-1"
              >
                {isResponding && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t("relativeConnections.approve")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {connections.filter(c => !(c.status === 'pending' && c.initiated_by === 'relative')).length === 0 && pendingFromRelatives.length === 0 ? (
        <div className="text-center py-6 bg-muted/50 rounded-xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
           <p className="text-sm text-muted-foreground">{t("relativeConnections.noRelativesYet")}</p>
           <Button 
             onClick={() => setInviteDialogOpen(true)} 
             variant="link" 
             size="sm"
             className="mt-2"
           >
             {t("relativeConnections.inviteFirstRelative")}
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
                    <span className="text-xs font-medium text-muted-foreground">{t("relativeConnections.sharedData")}</span>
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
                      <span className="text-xs font-medium text-muted-foreground">{t("relativeConnections.notifications")}</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-lg px-2 py-1.5">
                      <div>
                        <span className="text-xs">{t("relativeConnections.lowMoodNotification")}</span>
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

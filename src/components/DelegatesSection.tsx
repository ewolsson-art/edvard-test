import { useState } from 'react';
import { useDoctorDelegates, DoctorDelegate } from '@/hooks/useDoctorDelegates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, Plus, Mail, Trash2, Eye, MessageSquare, Loader2, CheckCircle, Clock } from 'lucide-react';

export function DelegatesSection() {
  const { delegates, isLoading, addDelegate, updateDelegate, removeDelegate } = useDoctorDelegates();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [canRead, setCanRead] = useState(true);
  const [canSend, setCanSend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDelegate = async () => {
    if (!newEmail.trim()) return;
    
    setIsSubmitting(true);
    const { error } = await addDelegate(newEmail, newName, canRead, canSend);
    setIsSubmitting(false);
    
    if (!error) {
      setNewEmail('');
      setNewName('');
      setCanRead(true);
      setCanSend(false);
      setIsAddDialogOpen(false);
    }
  };

  const getStatusBadge = (delegate: DoctorDelegate) => {
    if (delegate.status === 'approved' && delegate.delegate_id) {
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aktivt
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
        <Clock className="w-3 h-3 mr-1" />
        Väntar på registrering
      </Badge>
    );
  };

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
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Ombud</h3>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Lägg till ombud
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till ombud</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Lägg till en assistent eller sköterska som kan hantera meddelanden åt dig.
                Om personen inte har ett konto ännu aktiveras ombudet automatiskt när de registrerar sig.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="delegate-name">Namn</Label>
                <Input
                  id="delegate-name"
                  placeholder="Anna Andersson"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delegate-email">E-postadress</Label>
                <Input
                  id="delegate-email"
                  type="email"
                  placeholder="assistent@klinik.se"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-4 pt-2">
                <h4 className="font-medium text-sm">Behörigheter</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="can-read" className="font-normal">Kan läsa meddelanden</Label>
                  </div>
                  <Switch
                    id="can-read"
                    checked={canRead}
                    onCheckedChange={setCanRead}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="can-send" className="font-normal">Kan skicka meddelanden</Label>
                  </div>
                  <Switch
                    id="can-send"
                    checked={canSend}
                    onCheckedChange={setCanSend}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Avbryt</Button>
              </DialogClose>
              <Button onClick={handleAddDelegate} disabled={!newEmail.trim() || isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Lägg till
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {delegates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Du har inga ombud ännu.</p>
          <p className="text-sm">Lägg till en assistent eller sköterska för att dela meddelanden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {delegates.map((delegate) => (
            <div
              key={delegate.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-card/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">
                    {delegate.delegate_name || delegate.delegate_email}
                  </span>
                  {getStatusBadge(delegate)}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{delegate.delegate_email}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {delegate.can_read_messages && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Läsa
                    </span>
                  )}
                  {delegate.can_send_messages && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Skicka
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={delegate.can_read_messages}
                      onCheckedChange={(checked) => updateDelegate(delegate.id, { can_read_messages: checked })}
                      aria-label="Kan läsa"
                    />
                    <Switch
                      checked={delegate.can_send_messages}
                      onCheckedChange={(checked) => updateDelegate(delegate.id, { can_send_messages: checked })}
                      aria-label="Kan skicka"
                    />
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ta bort ombud?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {delegate.delegate_name || delegate.delegate_email} kommer inte längre kunna se eller svara på meddelanden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeDelegate(delegate.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ta bort
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

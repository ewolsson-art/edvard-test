import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, Check, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const TYPE_CONFIG: Record<string, { icon: typeof Bell; colorClass: string; bgClass: string }> = {
  forum_reply: { icon: MessageCircle, colorClass: 'text-blue-400', bgClass: 'bg-blue-400/10' },
  forum_like: { icon: Heart, colorClass: 'text-red-400', bgClass: 'bg-red-400/10' },
  connection_request: { icon: UserPlus, colorClass: 'text-primary', bgClass: 'bg-primary/10' },
  connection_approved: { icon: UserCheck, colorClass: 'text-mood-stable', bgClass: 'bg-mood-stable/10' },
  low_mood_alert: { icon: AlertTriangle, colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || { icon: Bell, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/20' };
}

function ConnectionRequestActions({ notification, onHandled }: {
  notification: AppNotification;
  onHandled: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRespond = async (approved: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.reference_id) return;
    setIsLoading(true);

    const table = notification.reference_type === 'doctor_connection'
      ? 'patient_doctor_connections'
      : 'patient_relative_connections';

    const { error } = await supabase
      .from(table)
      .update({ status: approved ? 'approved' : 'rejected' })
      .eq('id', notification.reference_id);

    setIsLoading(false);

    if (error) {
      toast({ title: 'Kunde inte uppdatera', variant: 'destructive' });
    } else {
      toast({ title: approved ? 'Förfrågan godkänd' : 'Förfrågan avvisad' });
      onHandled();
    }
  };

  return (
    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs rounded-xl flex-1"
        disabled={isLoading}
        onClick={(e) => handleRespond(false, e)}
      >
        Avvisa
      </Button>
      <Button
        size="sm"
        className="h-8 text-xs rounded-xl flex-1"
        disabled={isLoading}
        onClick={(e) => handleRespond(true, e)}
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Godkänn'}
      </Button>
    </div>
  );
}

function NotificationItem({ notification, onRead, onDelete, onNavigate, onHandled }: {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (n: AppNotification) => void;
  onHandled: (id: string) => void;
}) {
  const config = getConfig(notification.type);
  const Icon = config.icon;
  const [handled, setHandled] = useState(false);
  const isConnectionRequest = notification.type === 'connection_request' && !handled;

  return (
    <button
      onClick={() => { onRead(notification.id); onNavigate(notification); }}
      className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.99] ${
        notification.read
          ? 'bg-card/30 border-border/20'
          : 'bg-card/60 border-border/40'
      }`}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-medium leading-snug ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                {notification.title}
              </p>
              {notification.actor_name && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">av {notification.actor_name}</p>
              )}
            </div>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          {notification.body && (
            <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{notification.body}</p>
          )}

          {isConnectionRequest && (
            <ConnectionRequestActions
              notification={notification}
              onHandled={() => { setHandled(true); onHandled(notification.id); }}
            />
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground/40">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: sv })}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
              className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </button>
  );
}

const Notifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleNavigate = (n: AppNotification) => {
    if (n.reference_type === 'community_post' && n.reference_id) {
      navigate(`/forum/${n.reference_id}`);
    }
    // Connection requests are handled inline — no redirect needed
  };

  const handleConnectionHandled = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  if (isLoading) {
    return (
      <div className="p-5 md:p-8 max-w-2xl md:mx-0">
        <h1 className="font-display text-3xl font-bold mb-2">Notiser</h1>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl md:mx-0 pb-24">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl font-bold">Notiser</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-muted-foreground gap-1.5 rounded-full"
          >
            <Check className="w-3.5 h-3.5" />
            Markera alla som lästa
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Håll koll på aktivitet kring dina inlägg och kopplingar.
      </p>

      {notifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Inga notiser ännu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={markAsRead}
              onDelete={deleteNotification}
              onNavigate={handleNavigate}
              onHandled={handleConnectionHandled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

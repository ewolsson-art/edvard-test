import { useState } from 'react';
import { usePatientRelativeConnections } from '@/hooks/usePatientRelativeConnections';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export const CharacteristicsSharingSection = () => {
  const { 
    connections, 
    isLoading, 
    updateShareSettings,
  } = usePatientRelativeConnections();
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const approvedConnections = connections.filter(c => c.status === 'approved');

  const handleToggleSharing = async (connectionId: string, currentValue: boolean) => {
    setUpdatingId(connectionId);
    await updateShareSettings(connectionId, { share_characteristics: !currentValue });
    setUpdatingId(null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-foreground/20" />
      </div>
    );
  }

  if (approvedConnections.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-[13px] font-medium text-foreground/30 uppercase tracking-wide mb-3">
        Dela med anhöriga
      </h2>
      <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden divide-y divide-border/20">
        {approvedConnections.map((connection) => (
          <div 
            key={connection.id} 
            className="flex items-center justify-between px-4 py-4 hover:bg-foreground/[0.04] transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <span className="text-[13px] font-medium text-foreground/40">
                  {(connection.relative_profile?.first_name?.[0] || 'A').toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-foreground/80 truncate">
                  {getRelativeName(connection)}
                </p>
                <p className="text-[11px] text-foreground/20">
                  {connection.share_characteristics ? 'Delad' : 'Inte delad'}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 ml-3">
              {updatingId === connection.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-foreground/20" />
              ) : (
                <Switch
                  checked={connection.share_characteristics}
                  onCheckedChange={() => handleToggleSharing(connection.id, connection.share_characteristics)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

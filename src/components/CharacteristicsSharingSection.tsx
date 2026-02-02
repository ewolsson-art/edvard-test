import { useState } from 'react';
import { usePatientRelativeConnections } from '@/hooks/usePatientRelativeConnections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Users, Loader2, Lock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      <Card className="border-muted">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (approvedConnections.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Dela med anhöriga</CardTitle>
              <CardDescription className="text-sm">
                Du har inga godkända anhöriga att dela med
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bjud in anhöriga via din profilsida för att kunna dela dina kännetecken med dem.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sharedCount = approvedConnections.filter(c => c.share_characteristics).length;

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Dela med anhöriga</CardTitle>
              <CardDescription className="text-sm">
                Välj vilka anhöriga som får se dina kännetecken
              </CardDescription>
            </div>
          </div>
          {sharedCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              {sharedCount} delar
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {approvedConnections.map((connection) => (
          <div 
            key={connection.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {(connection.relative_profile?.first_name?.[0] || 'A').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{getRelativeName(connection)}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {connection.share_characteristics ? (
                    <>
                      <Unlock className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 dark:text-green-400">Delad</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Inte delad</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {updatingId === connection.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Switch
                  checked={connection.share_characteristics}
                  onCheckedChange={() => handleToggleSharing(connection.id, connection.share_characteristics)}
                />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

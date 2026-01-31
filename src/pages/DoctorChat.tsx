import { useState } from 'react';
import { MessageSquare, User, ArrowLeft } from 'lucide-react';
import { useDoctorConnections, PatientConnection } from '@/hooks/useDoctorConnections';
import { DoctorPatientChat } from '@/components/DoctorPatientChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const DoctorChat = () => {
  const { approvedConnections, isLoading } = useDoctorConnections();
  const [selectedConnection, setSelectedConnection] = useState<PatientConnection | null>(null);

  const getPatientName = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    return connection.patient_email || 'Okänd patient';
  };

  // Filter to only show connections with chat enabled
  const chatEnabledConnections = approvedConnections.filter(c => c.chat_enabled);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold">Patientchatt</h1>
          <p className="text-muted-foreground">
            Chatta med dina patienter
          </p>
        </header>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Patient list */}
          <div className={cn(
            "glass-card flex flex-col",
            selectedConnection ? "hidden md:flex md:w-80" : "w-full md:w-80"
          )}>
            <div className="p-4 border-b">
              <h2 className="font-semibold">Patienter</h2>
              <p className="text-xs text-muted-foreground">
                {chatEnabledConnections.length} med chatt aktiverad
              </p>
            </div>
            <ScrollArea className="flex-1">
              {chatEnabledConnections.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Ingen chatt aktiverad</h3>
                  <p className="text-sm text-muted-foreground">
                    Aktivera chatt för en patient via deras översiktssida.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {chatEnabledConnections.map((connection) => (
                    <button
                      key={connection.id}
                      onClick={() => setSelectedConnection(connection)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        selectedConnection?.id === connection.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {getPatientName(connection)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {connection.patient_email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div className={cn(
            "flex-1 glass-card flex flex-col min-h-0",
            selectedConnection ? "flex" : "hidden md:flex"
          )}>
            {selectedConnection ? (
              <>
                {/* Mobile back button */}
                <div className="md:hidden p-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConnection(null)}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tillbaka
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <DoctorPatientChat
                    connectionId={selectedConnection.id}
                    otherPartyName={getPatientName(selectedConnection)}
                    isDoctor={true}
                    chatEnabled={selectedConnection.chat_enabled}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Välj en patient</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Välj en patient från listan för att starta eller fortsätta en konversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorChat;

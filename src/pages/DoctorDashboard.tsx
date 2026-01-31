import { useState } from 'react';
import { useDoctorConnections, PatientConnection } from '@/hooks/useDoctorConnections';
import { Button } from '@/components/ui/button';
import { Loader2, Users, UserCheck, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const DoctorDashboard = () => {
  const { approvedConnections, pendingConnections, isLoading, updateConnectionStatus } = useDoctorConnections();
  const [selectedPatient, setSelectedPatient] = useState<PatientConnection | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getPatientName = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    // Fall back to email if no name is set
    if (connection.patient_email) {
      return connection.patient_email;
    }
    return 'Patient';
  };

  const getPatientInitial = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name) {
      return connection.patient_profile.first_name[0].toUpperCase();
    }
    if (connection.patient_email) {
      return connection.patient_email[0].toUpperCase();
    }
    return 'P';
  };

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Mina patienter
          </h1>
          <p className="text-muted-foreground">
            Se översikt över dina patienters mående
          </p>
        </header>

        {/* Pending requests */}
        {pendingConnections.length > 0 && (
          <section className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="font-display text-xl font-semibold">Väntande förfrågningar</h2>
              <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium px-2 py-1 rounded-full">
                {pendingConnections.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{getPatientName(connection)}</p>
                    <p className="text-sm text-muted-foreground">
                      Vill dela sin data med dig
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateConnectionStatus(connection.id, 'approved')}
                    >
                      Godkänn
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                    >
                      Avvisa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Approved patients */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <UserCheck className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Godkända patienter</h2>
          </div>

          {approvedConnections.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga patienter ännu</h3>
              <p className="text-muted-foreground">
                När patienter bjuder in dig kommer de att visas här.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className={cn(
                    "glass-card p-6 cursor-pointer transition-all hover:shadow-lg",
                    selectedPatient?.id === connection.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedPatient(connection)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {getPatientInitial(connection)}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4 mr-1" />
                      Visa
                    </Button>
                  </div>
                  <h3 className="font-semibold mb-1">{getPatientName(connection)}</h3>
                  {connection.patient_email && connection.patient_profile?.first_name && (
                    <p className="text-xs text-muted-foreground mb-1 truncate">{connection.patient_email}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-3">
                    Kopplad sedan {new Date(connection.created_at).toLocaleDateString('sv-SE')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {connection.share_mood && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Mående</span>
                    )}
                    {connection.share_sleep && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Sömn</span>
                    )}
                    {connection.share_eating && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Kost</span>
                    )}
                    {connection.share_exercise && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Träning</span>
                    )}
                    {connection.share_medication && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Medicin</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Patient detail view placeholder */}
        {selectedPatient && (
          <section className="glass-card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">
              Översikt för {getPatientName(selectedPatient)}
            </h2>
            <p className="text-muted-foreground">
              Patientens detaljerade statistik kommer visas här.
            </p>
            {/* TODO: Implement patient overview component */}
          </section>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;

import { useNavigate } from 'react-router-dom';
import { useRelativeConnections, PatientConnection } from '@/hooks/useRelativeConnections';
import { Loader2, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RelativeDashboard = () => {
  const navigate = useNavigate();
  const { approvedConnections, isLoading } = useRelativeConnections();

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
    if (connection.patient_email) {
      return connection.patient_email;
    }
    return 'Användare';
  };

  const getPatientInitial = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name) {
      return connection.patient_profile.first_name[0].toUpperCase();
    }
    if (connection.patient_email) {
      return connection.patient_email[0].toUpperCase();
    }
    return 'A';
  };

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Personer du följer
          </h1>
          <p className="text-muted-foreground">
            Se översikt över deras mående
          </p>
        </header>

        {approvedConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-medium">Inga personer ännu</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Gå till din profil för att begära åtkomst till någon du vill följa.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate('/profil')}
            >
              Gå till profil
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedConnections.map((connection) => (
              <div
                key={connection.id}
                className="glass-card p-6 cursor-pointer transition-all hover:shadow-lg rounded-2xl"
                onClick={() => navigate(`/patient/${connection.patient_id}`)}
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
                  {connection.share_characteristics && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Kännetecken</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelativeDashboard;

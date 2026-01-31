import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useDoctorConnections } from '@/hooks/useDoctorConnections';
import { Users, Clock, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DoctorHome = () => {
  const { firstName } = useProfile();
  const { approvedConnections, pendingConnections, isLoading } = useDoctorConnections();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 10) return 'God morgon';
    if (hour < 18) return 'Hej';
    return 'God kväll';
  };

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {greeting()}{firstName ? `, ${firstName}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Välkommen till din läkardashboard
          </p>
        </header>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {isLoading ? '–' : approvedConnections.length}
                </p>
                <p className="text-muted-foreground text-sm">
                  {approvedConnections.length === 1 ? 'Aktiv patient' : 'Aktiva patienter'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {isLoading ? '–' : pendingConnections.length}
                </p>
                <p className="text-muted-foreground text-sm">
                  {pendingConnections.length === 1 ? 'Väntande förfrågan' : 'Väntande förfrågningar'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending requests alert */}
        {pendingConnections.length > 0 && (
          <div className="glass-card p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium">Du har väntande patientförfrågningar</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingConnections.length} {pendingConnections.length === 1 ? 'patient' : 'patienter'} väntar på ditt godkännande
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/mina-patienter">
                  Hantera
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Main action */}
        <div className="glass-card p-8 text-center">
          <Users className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold mb-2">
            Mina patienter
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Se översikt över dina patienters mående, hantera förfrågningar och följ deras framsteg.
          </p>
          <Button asChild size="lg">
            <Link to="/mina-patienter">
              Visa patienter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Info card */}
        <div className="glass-card p-6 bg-muted/30">
          <h3 className="font-medium mb-2">Hur det fungerar</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Patienter bjuder in dig genom att ange din e-postadress</li>
            <li>• Du godkänner eller avvisar förfrågningar under "Mina patienter"</li>
            <li>• När en koppling är godkänd kan du se patientens delade data</li>
            <li>• Patienten styr vilken data som delas med dig</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DoctorHome;

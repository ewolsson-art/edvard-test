import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorConnections } from '@/hooks/useDoctorConnections';
import { PatientOverview } from '@/components/PatientOverview';
import { Loader2 } from 'lucide-react';

const PatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { approvedConnections, isLoading } = useDoctorConnections();

  const connection = approvedConnections.find(c => c.patient_id === patientId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Patient hittades inte</h2>
          <p className="text-muted-foreground">Patienten finns inte eller är inte kopplad till dig.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6">
          <PatientOverview 
            connection={connection} 
            onBack={() => navigate('/lakare')} 
          />
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;

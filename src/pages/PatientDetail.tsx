import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorConnections } from '@/hooks/useDoctorConnections';
import { useRelativeConnections } from '@/hooks/useRelativeConnections';
import { useUserRole } from '@/hooks/useUserRole';
import { PatientOverview } from '@/components/PatientOverview';
import { Loader2 } from 'lucide-react';

const PatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { isDoctor, isRelative, isLoading: roleLoading } = useUserRole();
  
  const { 
    approvedConnections: doctorConnections, 
    isLoading: doctorLoading
  } = useDoctorConnections();
  
  const { 
    approvedConnections: relativeConnections, 
    isLoading: relativeLoading 
  } = useRelativeConnections();

  const isLoading = roleLoading || (isDoctor && doctorLoading) || (isRelative && relativeLoading);

  // Find connection based on role
  const connection = isDoctor 
    ? doctorConnections.find(c => c.patient_id === patientId)
    : isRelative 
      ? relativeConnections.find(c => c.patient_id === patientId)
      : null;

  // Convert relative connection to match doctor connection format for PatientOverview
  const normalizedConnection = connection ? {
    ...connection,
    patient_profile: connection.patient_profile,
    patient_email: connection.patient_email,
  } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!normalizedConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Användare hittades inte</h2>
          <p className="text-muted-foreground">Användaren finns inte eller är inte kopplad till dig.</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (isDoctor) {
      navigate('/lakare');
    } else if (isRelative) {
      navigate('/anhorig');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6">
          <PatientOverview 
            connection={normalizedConnection as any} 
            onBack={handleBack}
            hideExtras={isRelative}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;

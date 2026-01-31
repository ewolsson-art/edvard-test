import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  skipOnboardingCheck?: boolean;
}

export function ProtectedRoute({ children, skipOnboardingCheck = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: prefsLoading } = useUserPreferences();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  // Wait for all loading states to complete
  if (authLoading || prefsLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Doctors don't need onboarding and should go to their dashboard
  // This check runs BEFORE any onboarding checks
  if (isDoctor) {
    const patientOnlyPaths = ['/', '/oversikt', '/mediciner', '/chatt', '/onboarding'];
    if (patientOnlyPaths.includes(location.pathname)) {
      return <Navigate to="/lakare" replace />;
    }
    // Allow doctors to access doctor-specific and shared pages
    return <>{children}</>;
  }

  // Patients: Redirect to onboarding if user hasn't completed it
  if (!skipOnboardingCheck && needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect patients away from doctor-specific pages
  const doctorOnlyPaths = ['/lakare', '/mina-patienter'];
  if (doctorOnlyPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

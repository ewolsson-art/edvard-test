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
  const { isDoctor, isRelative, isLoading: roleLoading } = useUserRole();
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

  // Check if user needs to complete their profile (OTP signup flow)
  const profileCompleted = user.user_metadata?.profile_completed;
  if (!profileCompleted && !user.user_metadata?.first_name && location.pathname !== '/slutfor-profil') {
    return <Navigate to="/slutfor-profil" replace />;
  }

  // Doctors: Redirect to doctor onboarding if they haven't completed it
  if (isDoctor) {
    // Check if doctor needs onboarding (no preferences record or not completed)
    if (!skipOnboardingCheck && needsOnboarding && location.pathname !== '/lakare-onboarding') {
      return <Navigate to="/lakare-onboarding" replace />;
    }
    
    const patientOnlyPaths = ['/', '/oversikt', '/mediciner', '/chatt', '/onboarding', '/anhorig'];
    if (patientOnlyPaths.includes(location.pathname)) {
      return <Navigate to="/lakare" replace />;
    }
    // Allow doctors to access shared pages like forum and notifications
    // Allow doctors to access doctor-specific and shared pages
    return <>{children}</>;
  }

  // Relatives: Redirect to relative dashboard, they can only view patient data
  if (isRelative) {
    // Check if relative needs onboarding
    if (!skipOnboardingCheck && needsOnboarding && location.pathname !== '/anhorig-onboarding') {
      return <Navigate to="/anhorig-onboarding" replace />;
    }
    
    // Relatives can only access their dashboard, profile, reports, and patient detail views (no chat)
    const relativeAllowedPaths = ['/anhorig', '/profil', '/anhorig-onboarding', '/anhorig-rapporter', '/forum', '/community', '/notiser', '/installningar'];
    const isPatientDetailPath = location.pathname.startsWith('/patient/');
    const isForumThread = location.pathname.startsWith('/forum/') || location.pathname.startsWith('/community/');
    
    if (!relativeAllowedPaths.includes(location.pathname) && !isPatientDetailPath && !isForumThread) {
      return <Navigate to="/anhorig" replace />;
    }
    
    return <>{children}</>;
  }

  // Patients: Redirect to onboarding if user hasn't completed it
  if (!skipOnboardingCheck && needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect patients away from doctor-specific and relative-specific pages
  const restrictedPaths = ['/lakare', '/mina-patienter', '/anhorig'];
  if (restrictedPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  skipOnboardingCheck?: boolean;
}

export function ProtectedRoute({ children, skipOnboardingCheck = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: prefsLoading } = useUserPreferences();
  const { role, isDoctor, isRelative, isLoading: roleLoading } = useUserRole();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();
  const isOAuthAccount = Boolean(user?.app_metadata?.provider || user?.user_metadata?.provider_id || user?.user_metadata?.iss);
  const isDemo = Boolean(user?.user_metadata?.is_demo);

  // Wait for all loading states to complete
  if (authLoading || prefsLoading || roleLoading || profileLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user needs to complete their profile (OTP signup flow)
  // Skip if user already has a profile with a first_name in the profiles table
  const profileCompleted = user.user_metadata?.profile_completed;
  const hasProfileInDb = profile?.first_name;
  if (!isOAuthAccount && !profileCompleted && !user.user_metadata?.first_name && !hasProfileInDb && location.pathname !== '/slutfor-profil') {
    return <Navigate to="/slutfor-profil" replace />;
  }

  // Doctors: No onboarding step — patients invite doctors, not the other way around
  if (isDoctor) {
    // If a doctor lands on the old onboarding route, send them home
    if (location.pathname === '/lakare-onboarding') {
      return <Navigate to="/lakare" replace />;
    }
    
    const patientOnlyPaths = ['/', '/oversikt', '/mediciner', '/onboarding', '/anhorig'];
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
    if (!isDemo && !skipOnboardingCheck && needsOnboarding && location.pathname !== '/anhorig-onboarding') {
      return <Navigate to="/anhorig-onboarding" replace />;
    }
    
    // Relatives can only access their dashboard, profile, reports, and patient detail views
    const relativeAllowedPaths = ['/anhorig', '/profil', '/anhorig-onboarding', '/anhorig-rapporter', '/notiser', '/installningar'];
    const isPatientDetailPath = location.pathname.startsWith('/patient/');
    
    if (!relativeAllowedPaths.includes(location.pathname) && !isPatientDetailPath) {
      return <Navigate to="/anhorig" replace />;
    }
    
    return <>{children}</>;
  }

  // Patients: Redirect to onboarding if user hasn't completed it
  if (!isOAuthAccount && !skipOnboardingCheck && needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect patients away from doctor-specific and relative-specific pages
  const restrictedPaths = ['/lakare', '/mina-patienter', '/anhorig'];
  if (restrictedPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

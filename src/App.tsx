import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SkipToContent } from "@/components/SkipToContent";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationSchedulerProvider } from "@/components/NotificationSchedulerProvider";
import { BottomTabBar } from "@/components/native/BottomTabBar";
import { NativeShellInit } from "@/components/native/NativeShellInit";
import { NativeAppGate } from "@/components/native/NativeAppGate";
import { useAuth } from "@/hooks/useAuth";

import { preloadCriticalRoutes } from "@/lib/routePreload";

// Preload critical chunks on idle so navigation is instant.
const preloadDashboard = () => {
  preloadCriticalRoutes();
  import("./hooks/useMoodData");
  import("./hooks/useMedications");
};
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadDashboard, { timeout: 2500 });
  } else {
    setTimeout(preloadDashboard, 1200);
  }
}

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorks"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Overview = lazy(() => import("./pages/Overview"));
const Settings = lazy(() => import("./pages/Settings"));
const Medications = lazy(() => import("./pages/Medications"));
const MedicationCategory = lazy(() => import("./pages/MedicationCategory"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ForPatients = lazy(() => import("./pages/ForPatients"));
const ForCaregivers = lazy(() => import("./pages/ForCaregivers"));
const ForRelatives = lazy(() => import("./pages/ForRelatives"));
const Partners = lazy(() => import("./pages/Partners"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const DoctorOnboarding = lazy(() => import("./pages/DoctorOnboarding"));
const RelativeOnboarding = lazy(() => import("./pages/RelativeOnboarding"));
const RelativeDashboard = lazy(() => import("./pages/RelativeDashboard"));
const RelativeReports = lazy(() => import("./pages/RelativeReports"));
const Following = lazy(() => import("./pages/Following"));
const Profile = lazy(() => import("./pages/Profile"));
const DoctorHome = lazy(() => import("./pages/DoctorHome"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const ManageConnections = lazy(() => import("./pages/ManageConnections"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SharedReport = lazy(() => import("./pages/SharedReport"));
const Reports = lazy(() => import("./pages/Reports"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Characteristics = lazy(() => import("./pages/Characteristics"));
const CharacteristicDetail = lazy(() => import("./pages/CharacteristicDetail"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const Community = lazy(() => import("./pages/Community"));
const CommunityThread = lazy(() => import("./pages/CommunityThread"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Insights = lazy(() => import("./pages/Insights"));
const BadDay = lazy(() => import("./pages/BadDay"));
const Diagnoses = lazy(() => import("./pages/Diagnoses"));
const AskToddy = lazy(() => import("./pages/AskToddy"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — avoid refetching on every navigation
      gcTime: 30 * 60 * 1000,     // 30 min — keep cached data in memory longer
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      retry: 1,                   // Retry once on failure
    },
  },
});

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <SkipToContent />
    <div className="min-h-screen flex w-full">
      {/* Desktop: keep sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <main
        id="main-content"
        className="flex-1 relative pb-tabbar md:pb-0"
        role="main"
        aria-label="Huvudinnehåll"
      >
        {children}
      </main>
    </div>
    {/* Mobile: bottom tab bar */}
    <BottomTabBar />
  </SidebarProvider>
);

// Root: show landing page (Auth) for logged-out, dashboard (Index) for logged-in.
const RootRoute = () => {
  const { useAuth } = require('@/hooks/useAuth');
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
      </div>
    );
  }
  if (!user) return <Auth />;
  return (
    <ProtectedRoute>
      <AppLayout><Index /></AppLayout>
    </ProtectedRoute>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
    <TooltipProvider>
      <AuthProvider>
        <NotificationSchedulerProvider>
          <NativeShellInit />
          <Toaster />
          <Sonner />
          <NativeAppGate>
          <BrowserRouter>
            <div className="min-h-screen" role="application" aria-label="Toddy - Moodtracker">
            <Suspense fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
              </div>
            }>
            <Routes>
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/sa-funkar-det" element={<HowItWorksPage />} />
            <Route path="/om-oss" element={<AboutUs />} />
            <Route path="/for-anvandare" element={<ForPatients />} />
            <Route path="/for-patienter" element={<Navigate to="/for-anvandare" replace />} />
            <Route path="/for-vardgivare" element={<ForCaregivers />} />
            <Route path="/for-anhoriga" element={<ForRelatives />} />
            <Route path="/samarbetspartners" element={<Partners />} />
            <Route path="/blogg" element={<Blog />} />
            <Route path="/blogg/:slug" element={<BlogPost />} />
            <Route path="/integritet" element={<PrivacyPolicy />} />
            <Route path="/villkor" element={<TermsOfService />} />
            <Route path="/logga-in" element={<Login />} />
            <Route path="/skapa-konto" element={<Signup />} />
            <Route path="/glomt-losenord" element={<ForgotPassword />} />
            <Route path="/aterstall-losenord" element={<ResetPassword />} />
            <Route path="/slutfor-profil" element={<CompleteProfile />} />
            <Route path="/onboarding" element={
              <ProtectedRoute skipOnboardingCheck>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/lakare-onboarding" element={
              <ProtectedRoute skipOnboardingCheck>
                <DoctorOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/anhorig-onboarding" element={
              <ProtectedRoute skipOnboardingCheck>
                <RelativeOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/anhorig" element={
              <ProtectedRoute>
                <AppLayout><RelativeDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/foljer" element={
              <ProtectedRoute>
                <AppLayout><Following /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/anhorig-rapporter" element={
              <ProtectedRoute>
                <AppLayout><RelativeReports /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/" element={<RootRoute />} />
            <Route path="/oversikt" element={
              <ProtectedRoute>
                <AppLayout><Overview /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kannetecken" element={
              <ProtectedRoute>
                <AppLayout><Characteristics /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kannetecken/:moodType" element={
              <ProtectedRoute>
                <AppLayout><CharacteristicDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/community" element={<Navigate to="/forum" replace />} />
            <Route path="/community/:threadId" element={<Navigate to="/forum/:threadId" replace />} />
            <Route path="/forum" element={
              <ProtectedRoute>
                <AppLayout><Community /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/forum/:threadId" element={
              <ProtectedRoute>
                <AppLayout><CommunityThread /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/mediciner" element={
              <ProtectedRoute>
                <AppLayout><Medications /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/mediciner/:category" element={
              <ProtectedRoute>
                <AppLayout><MedicationCategory /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/diagnoser" element={
              <ProtectedRoute>
                <AppLayout><Diagnoses /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/rapporter" element={
              <ProtectedRoute>
                <AppLayout><Reports /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profil" element={
              <ProtectedRoute>
                <AppLayout><Profile /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/installningar" element={
              <ProtectedRoute>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/lakare" element={
              <ProtectedRoute>
                <AppLayout><DoctorHome /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/mina-patienter" element={
              <ProtectedRoute>
                <AppLayout><DoctorDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/notiser" element={
              <ProtectedRoute>
                <AppLayout><Notifications /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/fraga" element={
              <ProtectedRoute>
                <AppLayout><AskToddy /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/:patientId" element={
              <ProtectedRoute>
                <AppLayout><PatientDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/mina-lakare" element={
              <ProtectedRoute>
                <AppLayout><ManageConnections /></AppLayout>
              </ProtectedRoute>
            } />
              <Route path="/rapport/:shareKey" element={<SharedReport />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </div>
          </BrowserRouter>
          </NativeAppGate>
        </NotificationSchedulerProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

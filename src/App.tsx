import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SkipToContent } from "@/components/SkipToContent";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationSchedulerProvider } from "@/components/NotificationSchedulerProvider";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorks"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Overview = lazy(() => import("./pages/Overview"));
const Settings = lazy(() => import("./pages/Settings"));
const Medications = lazy(() => import("./pages/Medications"));
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

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <SkipToContent />
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main id="main-content" className="flex-1 relative" role="main" aria-label="Huvudinnehåll">
        <header className="sticky top-0 z-40 h-12 sm:h-14 flex items-center px-3 sm:px-4 bg-background/90 backdrop-blur-xl border-b border-border/50 md:hidden" role="banner">
          <SidebarTrigger className="h-10 w-10 hover:bg-muted/50 [&_svg.default-icon]:hidden" aria-label="Öppna navigeringsmeny" />
        </header>
        <div className="md:pt-0">
          {children}
        </div>
      </main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
    <TooltipProvider>
      <AuthProvider>
        <NotificationSchedulerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen" role="application" aria-label="Toddy - Moodtracker">
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/sa-funkar-det" element={<HowItWorksPage />} />
            <Route path="/om-oss" element={<AboutUs />} />
            <Route path="/for-patienter" element={<ForPatients />} />
            <Route path="/for-vardgivare" element={<ForCaregivers />} />
            <Route path="/for-anhoriga" element={<ForRelatives />} />
            <Route path="/samarbetspartners" element={<Partners />} />
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
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout><Index /></AppLayout>
              </ProtectedRoute>
            } />
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
        </NotificationSchedulerProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SkipToContent } from "@/components/SkipToContent";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationSchedulerProvider } from "@/components/NotificationSchedulerProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Overview from "./pages/Overview";
import Settings from "./pages/Settings";


import Medications from "./pages/Medications";
import AboutUs from "./pages/AboutUs";
import ForPatients from "./pages/ForPatients";
import ForCaregivers from "./pages/ForCaregivers";
import ForRelatives from "./pages/ForRelatives";
import Partners from "./pages/Partners";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import Onboarding from "./pages/Onboarding";
import DoctorOnboarding from "./pages/DoctorOnboarding";
import RelativeOnboarding from "./pages/RelativeOnboarding";
import RelativeDashboard from "./pages/RelativeDashboard";
import RelativeReports from "./pages/RelativeReports";
import Profile from "./pages/Profile";
import DoctorHome from "./pages/DoctorHome";
import DoctorDashboard from "./pages/DoctorDashboard";

import PatientDetail from "./pages/PatientDetail";
import ManageConnections from "./pages/ManageConnections";
import NotFound from "./pages/NotFound";
import SharedReport from "./pages/SharedReport";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Characteristics from "./pages/Characteristics";
import CharacteristicDetail from "./pages/CharacteristicDetail";
import Insights from "./pages/Insights";

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
            <div className="min-h-screen" role="application" aria-label="Friendly - Moodtracker">
            <Routes>
            <Route path="/auth" element={<Auth />} />
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
            <Route path="/insikter" element={
              <ProtectedRoute>
                <AppLayout><Insights /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/mediciner" element={
              <ProtectedRoute>
                <AppLayout><Medications /></AppLayout>
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
            </div>
          </BrowserRouter>
        </NotificationSchedulerProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

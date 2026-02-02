import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationSchedulerProvider } from "@/components/NotificationSchedulerProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Overview from "./pages/Overview";
import Reports from "./pages/Reports";
import Chat from "./pages/Chat";
import Medications from "./pages/Medications";
import AboutUs from "./pages/AboutUs";
import ForPatients from "./pages/ForPatients";
import ForCaregivers from "./pages/ForCaregivers";
import ForRelatives from "./pages/ForRelatives";
import Partners from "./pages/Partners";

import Onboarding from "./pages/Onboarding";
import DoctorOnboarding from "./pages/DoctorOnboarding";
import RelativeOnboarding from "./pages/RelativeOnboarding";
import RelativeDashboard from "./pages/RelativeDashboard";
import RelativeReports from "./pages/RelativeReports";
import Profile from "./pages/Profile";
import DoctorHome from "./pages/DoctorHome";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorChat from "./pages/DoctorChat";
import PatientDetail from "./pages/PatientDetail";
import ManageConnections from "./pages/ManageConnections";
import NotFound from "./pages/NotFound";
import SharedReport from "./pages/SharedReport";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 relative">
        <header className="sticky top-0 z-10 h-14 flex items-center px-4 bg-background/80 backdrop-blur-sm border-b border-border/50 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-lg bg-card border border-border shadow-sm hover:bg-muted" />
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
    <TooltipProvider>
      <AuthProvider>
        <NotificationSchedulerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/om-oss" element={<AboutUs />} />
            <Route path="/for-patienter" element={<ForPatients />} />
            <Route path="/for-vardgivare" element={<ForCaregivers />} />
            <Route path="/for-anhoriga" element={<ForRelatives />} />
            <Route path="/samarbetspartners" element={<Partners />} />
            <Route path="/logga-in" element={<Login />} />
            <Route path="/skapa-konto" element={<Signup />} />
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
            <Route path="/rapporter" element={
              <ProtectedRoute>
                <AppLayout><Reports /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/chatt" element={
              <ProtectedRoute>
                <AppLayout><Chat /></AppLayout>
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
            <Route path="/lakare-chatt" element={
              <ProtectedRoute>
                <AppLayout><DoctorChat /></AppLayout>
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
          </BrowserRouter>
        </NotificationSchedulerProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

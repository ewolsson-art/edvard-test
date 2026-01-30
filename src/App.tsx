import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Overview from "./pages/Overview";
import Chat from "./pages/Chat";
import Medications from "./pages/Medications";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 relative">
        <header className="absolute top-4 left-4 z-10">
          <SidebarTrigger className="h-10 w-10 rounded-lg bg-card border border-border shadow-sm hover:bg-muted" />
        </header>
        {children}
      </main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
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
            <Route path="/rapporter" element={
              <ProtectedRoute>
                <AppLayout><Reports /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

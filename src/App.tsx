import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import MonthlyOverview from "./pages/MonthlyOverview";
import YearlyOverview from "./pages/YearlyOverview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1 relative">
              <header className="absolute top-4 left-4 z-10">
                <SidebarTrigger className="h-10 w-10 rounded-lg bg-card border border-border shadow-sm hover:bg-muted" />
              </header>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/manad" element={<MonthlyOverview />} />
                <Route path="/ar" element={<YearlyOverview />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

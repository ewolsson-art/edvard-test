import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, HeartPulse } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";
import { AnimatedMoodBackground } from "@/components/AnimatedMoodBackground";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      <div className="flex-1 relative overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, hsl(220 25% 12%), hsl(230 20% 16%), hsl(210 22% 14%))'
        }}>

        <AnimatedMoodBackground />

        {/* Hero Section */}
        <section className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 pt-20">
          <div className="max-w-3xl mx-auto w-full text-center space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight"
              style={{ color: 'hsl(40 30% 92%)' }}>
              Följ ditt mående med{" "}
              <span style={{ color: 'hsl(45 85% 70%)' }}>bättre insikt</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(220 15% 70%)' }}>
              Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående
              och delar valfri data med din läkare
            </p>
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ backgroundColor: 'hsl(220 20% 18%)', color: 'hsl(220 15% 65%)' }}>
                <HeartPulse className="w-4 h-4" style={{ color: 'hsl(45 85% 70%)' }} />
                <span>Skapad av och för människor med bipolär sjukdom</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 py-3 px-4 border-t border-border/40 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2025 Friendly. Alla rättigheter förbehållna.</span>
          <div className="flex items-center gap-4">
            <Link to="/integritet" className="hover:text-foreground transition-colors">
              Integritetspolicy
            </Link>
            <Link to="/villkor" className="hover:text-foreground transition-colors">
              Användarvillkor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;

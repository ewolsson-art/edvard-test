import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, HeartPulse } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";
import { cn } from "@/lib/utils";
import platformIllustration from "@/assets/platform-illustration.png";

// Animated Cloud Component
const Cloud = ({
  className,
  delay = 0,
  duration = 20
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <div
    className={cn("absolute opacity-20", className)}
    style={{
      animation: `cloud-float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  >
    <svg viewBox="0 0 100 50" className="w-full h-full fill-primary/30">
      <ellipse cx="30" cy="35" rx="20" ry="15" />
      <ellipse cx="50" cy="30" rx="25" ry="18" />
      <ellipse cx="70" cy="35" rx="18" ry="13" />
      <ellipse cx="45" cy="38" rx="22" ry="12" />
    </svg>
  </div>
);

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
    <>
      <AuthNavbar />
      <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background flex flex-col">
        {/* Animated clouds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Cloud className="w-48 h-24 top-[10%] left-[5%]" delay={0} duration={25} />
          <Cloud className="w-64 h-32 top-[20%] right-[10%]" delay={3} duration={30} />
          <Cloud className="w-40 h-20 top-[60%] left-[15%]" delay={5} duration={22} />
          <Cloud className="w-56 h-28 bottom-[15%] right-[5%]" delay={8} duration={28} />
          <Cloud className="w-36 h-18 top-[40%] left-[60%]" delay={2} duration={20} />
          <Cloud className="w-52 h-26 bottom-[30%] left-[40%]" delay={6} duration={24} />

          {/* Gradient orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left side - Text */}
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
                  Följ ditt mående med{" "}
                  <span className="text-primary">bättre insikt</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående
                  och delar valfri data med din läkare
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm">
                    <HeartPulse className="w-4 h-4 text-primary" />
                    <span>Skapad av och för människor med bipolär sjukdom</span>
                  </div>
                </div>
              </div>

              {/* Right side - Illustration */}
              <div className="flex justify-center md:justify-end animate-fade-in">
                <img
                  src={platformIllustration}
                  alt="Friendly plattformsillustration"
                  className="w-full max-w-md rounded-2xl shadow-2xl shadow-primary/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 py-3 px-4 border-t border-border/40">
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
    </>
  );
};

export default Auth;

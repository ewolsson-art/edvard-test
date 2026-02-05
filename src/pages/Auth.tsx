import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, HeartPulse } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";
import { TurtleHammock } from "@/components/TurtleHammock";
import { cn } from "@/lib/utils";

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
      <div className="flex-1 relative overflow-hidden flex flex-col" style={{
        background: 'linear-gradient(to bottom, hsl(210 35% 14%), hsl(220 28% 20%), hsl(200 25% 16%))'
      }}>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white star-twinkle"
              style={{
                width: `${1 + Math.random() * 2.5}px`,
                height: `${1 + Math.random() * 2.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                opacity: 0.2 + Math.random() * 0.6,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Moon */}
        <div className="absolute top-[10%] right-[12%] pointer-events-none">
          <div className="relative w-14 h-14 md:w-20 md:h-20">
            <div className="absolute inset-0 rounded-full shadow-[0_0_40px_15px_rgba(253,224,71,0.12)]" style={{
              background: 'radial-gradient(circle at 35% 40%, hsl(48 90% 92%), hsl(45 80% 78%))'
            }} />
            <div className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full top-[28%] left-[55%]" style={{ backgroundColor: 'hsl(45 60% 75%)' }} />
            <div className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full top-[55%] left-[32%]" style={{ backgroundColor: 'hsl(45 50% 78%)' }} />
          </div>
        </div>

        {/* Distant city silhouette */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1200 160" className="w-full h-auto" preserveAspectRatio="xMidYMax meet">
            <g fill="hsl(220 25% 10%)" opacity="0.5">
              <rect x="30" y="90" width="22" height="70" />
              <rect x="55" y="70" width="18" height="90" />
              <rect x="78" y="95" width="28" height="65" />
              <rect x="115" y="60" width="20" height="100" />
              <rect x="140" y="80" width="16" height="80" />
              <rect x="160" y="65" width="24" height="95" />
              {/* Windows */}
              <rect x="120" y="72" width="3" height="3" fill="hsl(45 75% 60%)" opacity="0.5" />
              <rect x="128" y="88" width="3" height="3" fill="hsl(45 75% 60%)" opacity="0.3" />
              <rect x="62" y="82" width="2" height="2" fill="hsl(45 75% 60%)" opacity="0.4" />

              <rect x="1000" y="85" width="22" height="75" />
              <rect x="1025" y="65" width="18" height="95" />
              <rect x="1048" y="90" width="30" height="70" />
              <rect x="1085" y="55" width="20" height="105" />
              <rect x="1110" y="75" width="20" height="85" />
              <rect x="1135" y="60" width="25" height="100" />
              <rect x="1090" y="65" width="3" height="3" fill="hsl(45 75% 60%)" opacity="0.5" />
              <rect x="1032" y="78" width="2" height="2" fill="hsl(45 75% 60%)" opacity="0.4" />
            </g>
            {/* Ground/horizon */}
            <rect x="0" y="150" width="1200" height="10" fill="hsl(150 20% 8%)" />
            {/* Distant trees */}
            <g fill="hsl(150 25% 10%)" opacity="0.6">
              <ellipse cx="300" cy="140" rx="50" ry="30" />
              <ellipse cx="370" cy="138" rx="40" ry="28" />
              <ellipse cx="500" cy="142" rx="55" ry="25" />
              <ellipse cx="600" cy="140" rx="45" ry="28" />
              <ellipse cx="700" cy="138" rx="50" ry="30" />
              <ellipse cx="800" cy="142" rx="40" ry="25" />
              <ellipse cx="900" cy="140" rx="48" ry="28" />
            </g>
          </svg>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 pt-20">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex flex-col items-center gap-6 md:gap-8">
              {/* Text - centered above */}
              <div className="text-center space-y-4 animate-fade-in max-w-2xl">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight"
                  style={{ color: 'hsl(40 30% 92%)' }}>
                  Följ ditt mående med{" "}
                  <span style={{ color: 'hsl(45 85% 70%)' }}>bättre insikt</span>
                </h1>
                <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'hsl(220 15% 65%)' }}>
                  Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående
                  och delar valfri data med din läkare
                </p>
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                    style={{ backgroundColor: 'hsl(220 20% 16%)', color: 'hsl(220 15% 60%)' }}>
                    <HeartPulse className="w-4 h-4" style={{ color: 'hsl(45 85% 70%)' }} />
                    <span>Skapad av och för människor med bipolär sjukdom</span>
                  </div>
                </div>
              </div>

              {/* Turtle in hammock scene */}
              <div className="w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <TurtleHammock size="hero" animated={true} className="mx-auto" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
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

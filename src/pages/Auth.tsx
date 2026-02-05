import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, HeartPulse } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";
import { OwlLogo } from "@/components/OwlLogo";
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
        background: 'linear-gradient(to bottom, hsl(220 30% 10%), hsl(230 25% 18%), hsl(220 20% 12%))'
      }}>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white star-twinkle"
              style={{
                width: `${1 + Math.random() * 2.5}px`,
                height: `${1 + Math.random() * 2.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 55}%`,
                opacity: 0.3 + Math.random() * 0.7,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Moon */}
        <div className="absolute top-[12%] right-[15%] pointer-events-none">
          <div className="relative w-16 h-16 md:w-24 md:h-24">
            <div className="absolute inset-0 rounded-full bg-yellow-100 shadow-[0_0_40px_15px_rgba(253,224,71,0.15)]" />
            <div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle at 35% 40%, hsl(48 90% 90%), hsl(45 80% 80%))'
            }} />
            {/* Moon craters */}
            <div className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-yellow-200/30 top-[25%] left-[55%]" />
            <div className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-200/20 top-[55%] left-[30%]" />
          </div>
        </div>

        {/* City silhouette */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1200 300" className="w-full h-auto" preserveAspectRatio="xMidYMax meet">
            {/* Distant city buildings */}
            <g fill="hsl(220 25% 8%)" opacity="0.7">
              <rect x="50" y="160" width="30" height="140" />
              <rect x="85" y="130" width="25" height="170" />
              <rect x="115" y="170" width="35" height="130" />
              <rect x="160" y="100" width="28" height="200" />
              <rect x="195" y="140" width="22" height="160" />
              <rect x="222" y="120" width="32" height="180" />
              <rect x="260" y="155" width="26" height="145" />
              {/* Windows (tiny yellow dots) */}
              <rect x="165" y="115" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.6" />
              <rect x="175" y="130" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.4" />
              <rect x="165" y="145" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.5" />
              <rect x="230" y="135" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.5" />
              <rect x="240" y="155" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.3" />
              <rect x="93" y="145" width="3" height="3" fill="hsl(45 80% 65%)" opacity="0.4" />
              <rect x="93" y="165" width="3" height="3" fill="hsl(45 80% 65%)" opacity="0.6" />
            </g>

            {/* More buildings right side */}
            <g fill="hsl(220 25% 8%)" opacity="0.7">
              <rect x="900" y="140" width="30" height="160" />
              <rect x="935" y="110" width="25" height="190" />
              <rect x="965" y="150" width="40" height="150" />
              <rect x="1010" y="90" width="28" height="210" />
              <rect x="1045" y="130" width="22" height="170" />
              <rect x="1072" y="160" width="35" height="140" />
              <rect x="1115" y="120" width="30" height="180" />
              {/* Windows */}
              <rect x="1016" y="105" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.5" />
              <rect x="1016" y="125" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.4" />
              <rect x="1025" y="115" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.6" />
              <rect x="940" y="125" width="3" height="3" fill="hsl(45 80% 65%)" opacity="0.5" />
              <rect x="940" y="150" width="3" height="3" fill="hsl(45 80% 65%)" opacity="0.3" />
              <rect x="1120" y="135" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.4" />
            </g>

            {/* Trees - background layer */}
            <g fill="hsl(150 30% 12%)">
              {/* Left forest */}
              <ellipse cx="350" cy="240" rx="40" ry="55" />
              <ellipse cx="390" cy="245" rx="35" ry="50" />
              <ellipse cx="430" cy="238" rx="45" ry="58" />
              <ellipse cx="310" cy="248" rx="30" ry="45" />
              {/* Right forest */}
              <ellipse cx="770" cy="242" rx="38" ry="52" />
              <ellipse cx="810" cy="238" rx="42" ry="56" />
              <ellipse cx="850" cy="245" rx="35" ry="48" />
              <ellipse cx="880" cy="250" rx="30" ry="42" />
            </g>

            {/* Trees - foreground layer */}
            <g fill="hsl(150 25% 8%)">
              <ellipse cx="370" cy="250" rx="35" ry="48" />
              <ellipse cx="415" cy="248" rx="40" ry="50" />
              <ellipse cx="790" cy="250" rx="38" ry="48" />
              <ellipse cx="835" cy="252" rx="32" ry="44" />
            </g>

            {/* Ground */}
            <rect x="0" y="290" width="1200" height="20" fill="hsl(150 20% 8%)" />

            {/* Central tree (where the owl sits) - trunk */}
            <rect x="585" y="140" width="30" height="160" rx="4" fill="hsl(25 35% 20%)" />
            {/* Central tree - branches */}
            <path d="M600 180 Q560 160 530 170" stroke="hsl(25 35% 20%)" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M600 180 Q640 155 670 165" stroke="hsl(25 35% 20%)" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M600 220 Q555 205 535 215" stroke="hsl(25 35% 20%)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M600 220 Q645 210 665 218" stroke="hsl(25 35% 20%)" strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* Central tree - foliage */}
            <ellipse cx="600" cy="140" rx="70" ry="60" fill="hsl(150 30% 14%)" />
            <ellipse cx="570" cy="155" rx="40" ry="35" fill="hsl(150 25% 11%)" />
            <ellipse cx="635" cy="150" rx="38" ry="35" fill="hsl(150 28% 12%)" />
            <ellipse cx="600" cy="120" rx="50" ry="40" fill="hsl(150 32% 16%)" />
          </svg>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 pt-20">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left side - Text */}
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight"
                  style={{ color: 'hsl(40 30% 92%)' }}>
                  Följ ditt mående med{" "}
                  <span style={{ color: 'hsl(45 85% 70%)' }}>bättre insikt</span>
                </h1>
                <p className="text-lg md:text-xl max-w-xl leading-relaxed" style={{ color: 'hsl(220 15% 70%)' }}>
                  Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående
                  och delar valfri data med din läkare
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: 'hsl(220 20% 18%)', color: 'hsl(220 15% 65%)' }}>
                    <HeartPulse className="w-4 h-4" style={{ color: 'hsl(45 85% 70%)' }} />
                    <span>Skapad av och för människor med bipolär sjukdom</span>
                  </div>
                </div>
              </div>

              {/* Right side - Owl in the night */}
              <div className="flex justify-center md:justify-end animate-fade-in">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-3xl scale-125"
                    style={{ backgroundColor: 'hsl(45 60% 50% / 0.08)' }} />
                  <OwlLogo size="hero" animated={true} />
                </div>
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

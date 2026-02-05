import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, HeartPulse } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";

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
          {Array.from({ length: 45 }).map((_, i) => (
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
            <div className="absolute inset-0 rounded-full shadow-[0_0_40px_15px_rgba(253,224,71,0.15)]" style={{
              background: 'radial-gradient(circle at 35% 40%, hsl(48 90% 90%), hsl(45 80% 80%))'
            }} />
            <div className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full top-[25%] left-[55%]" style={{ backgroundColor: 'hsl(45 60% 78%)' }} />
            <div className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full top-[55%] left-[30%]" style={{ backgroundColor: 'hsl(45 50% 80%)' }} />
          </div>
        </div>

        {/* City silhouette */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1200 300" className="w-full h-auto" preserveAspectRatio="xMidYMax meet">
            {/* Left buildings - taller */}
            <g fill="hsl(220 25% 8%)" opacity="0.7">
              <rect x="50" y="80" width="30" height="220" />
              <rect x="85" y="50" width="25" height="250" />
              <rect x="115" y="100" width="35" height="200" />
              <rect x="160" y="30" width="28" height="270" />
              <rect x="195" y="70" width="22" height="230" />
              <rect x="222" y="40" width="32" height="260" />
              <rect x="260" y="85" width="26" height="215" />
              <rect x="165" y="45" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.6" />
              <rect x="175" y="60" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.4" />
              <rect x="165" y="80" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.5" />
              <rect x="230" y="55" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.5" />
              <rect x="93" y="70" width="3" height="3" fill="hsl(45 80% 65%)" opacity="0.4" />
              <rect x="175" y="100" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.3" />
              <rect x="230" y="90" width="4" height="4" fill="hsl(45 80% 65%)" opacity="0.4" />
              <rect x="60" y="110" width="3" height="3" fill="hsl(45 80% 65%)" opacity="0.3" />
            </g>
            {/* Right buildings - taller */}
            <g fill="hsl(220 25% 8%)" opacity="0.7">
              <rect x="300" y="100" width="25" height="200" />
              <rect x="330" y="70" width="20" height="230" />
              <rect x="355" y="110" width="28" height="190" />
            </g>
            {/* Bush/shrub groups */}
            <g fill="hsl(150 30% 12%)">
              <ellipse cx="350" cy="240" rx="40" ry="55" />
              <ellipse cx="390" cy="245" rx="35" ry="50" />
              <ellipse cx="430" cy="238" rx="45" ry="58" />
              <ellipse cx="310" cy="248" rx="30" ry="45" />
              <ellipse cx="770" cy="242" rx="38" ry="52" />
            </g>
            <g fill="hsl(150 25% 8%)">
              <ellipse cx="370" cy="250" rx="35" ry="48" />
              <ellipse cx="415" cy="248" rx="40" ry="50" />
            </g>
            <rect x="0" y="290" width="1200" height="20" fill="hsl(150 20% 8%)" />

            {/* === First tree (taller) === */}
            <rect x="850" y="60" width="30" height="240" rx="4" fill="hsl(25 35% 20%)" />
            <path d="M865 100 Q825 80 795 90" stroke="hsl(25 35% 20%)" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M865 100 Q905 75 935 85" stroke="hsl(25 35% 20%)" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M865 150 Q820 135 800 145" stroke="hsl(25 35% 20%)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M865 150 Q910 140 930 148" stroke="hsl(25 35% 20%)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <ellipse cx="865" cy="60" rx="70" ry="55" fill="hsl(150 30% 14%)" />
            <ellipse cx="835" cy="75" rx="40" ry="32" fill="hsl(150 25% 11%)" />
            <ellipse cx="900" cy="70" rx="38" ry="32" fill="hsl(150 28% 12%)" />
            <ellipse cx="865" cy="40" rx="50" ry="38" fill="hsl(150 32% 16%)" />

            {/* === Owl's tree (taller) === */}
            <rect x="990" y="40" width="22" height="255" rx="3" fill="hsl(25 35% 20%)" />
            <path d="M990 290 Q975 282 965 295" stroke="hsl(25 35% 18%)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M1012 290 Q1025 280 1035 293" stroke="hsl(25 35% 18%)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M992 130 Q960 120 935 125" stroke="hsl(25 35% 20%)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M1010 100 Q1040 88 1065 92" stroke="hsl(25 35% 20%)" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* Branch where owl sits */}
            <path d="M992 170 Q955 162 930 166" stroke="hsl(25 35% 20%)" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            {/* Foliage - round like the other tree */}
            <ellipse cx="1001" cy="40" rx="70" ry="55" fill="hsl(150 30% 14%)" />
            <ellipse cx="971" cy="55" rx="40" ry="32" fill="hsl(150 25% 11%)" />
            <ellipse cx="1036" cy="50" rx="38" ry="32" fill="hsl(150 28% 12%)" />
            <ellipse cx="1001" cy="20" rx="50" ry="38" fill="hsl(150 32% 16%)" />

            {/* === Small owl on branch (no blink) === */}
            <g transform="translate(950, 140)">
              <ellipse cx="0" cy="8" rx="8" ry="10" fill="hsl(25 55% 38%)" />
              <ellipse cx="0" cy="10" rx="5" ry="7" fill="hsl(38 50% 78%)" />
              <circle cx="0" cy="-4" r="8" fill="hsl(25 55% 38%)" />
              <ellipse cx="-5" cy="-10" rx="2.5" ry="4" fill="hsl(22 50% 33%)" transform="rotate(-10 -5 -10)" />
              <ellipse cx="5" cy="-10" rx="2.5" ry="4" fill="hsl(22 50% 33%)" transform="rotate(10 5 -10)" />
              <ellipse cx="0" cy="-2" rx="6" ry="5.5" fill="hsl(32 40% 62%)" opacity="0.4" />
              {/* Eyes - no blink */}
              <circle cx="-3" cy="-4" r="3" fill="white" />
              <circle cx="-3" cy="-3.8" r="2" fill="hsl(45 90% 50%)" />
              <circle cx="-3" cy="-3.5" r="1" fill="hsl(20 18% 12%)" />
              <circle cx="-1.8" cy="-5.2" r="0.8" fill="white" opacity="0.9" />
              <circle cx="3" cy="-4" r="3" fill="white" />
              <circle cx="3" cy="-3.8" r="2" fill="hsl(45 90% 50%)" />
              <circle cx="3" cy="-3.5" r="1" fill="hsl(20 18% 12%)" />
              <circle cx="4.2" cy="-5.2" r="0.8" fill="white" opacity="0.9" />
              <path d="M-1 0 L0 2.5 L1 0 Z" fill="hsl(38 90% 55%)" />
              <path d="M-2 3 Q0 4.5 2 3" stroke="hsl(25 35% 35%)" strokeWidth="0.5" strokeLinecap="round" fill="none" />
              <ellipse cx="-6.5" cy="-1" rx="1.5" ry="1" fill="hsl(350 55% 72%)" opacity="0.3" />
              <ellipse cx="6.5" cy="-1" rx="1.5" ry="1" fill="hsl(350 55% 72%)" opacity="0.3" />
              <path d="M-3 17 L-5 20 M-3 17 L-3 20.5 M-3 17 L-1 20" stroke="hsl(38 80% 50%)" strokeWidth="1" strokeLinecap="round" />
              <path d="M3 17 L1 20 M3 17 L3 20.5 M3 17 L5 20" stroke="hsl(38 80% 50%)" strokeWidth="1" strokeLinecap="round" />
              <rect x="-7" y="10" width="14" height="6" rx="1" fill="hsl(215 50% 32%)" />
              <rect x="-5.5" y="11" width="4.5" height="4" rx="0.5" fill="hsl(42 50% 90%)" />
              <rect x="1.5" y="11" width="4.5" height="4" rx="0.5" fill="hsl(42 45% 88%)" />
            </g>
          </svg>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 pt-20">
          <div className="max-w-6xl mx-auto w-full">
            <div className="space-y-6 animate-fade-in max-w-xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight"
                style={{ color: 'hsl(40 30% 92%)' }}>
                Följ ditt mående med{" "}
                <span style={{ color: 'hsl(45 85% 70%)' }}>bättre insikt</span>
              </h1>
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'hsl(220 15% 70%)' }}>
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

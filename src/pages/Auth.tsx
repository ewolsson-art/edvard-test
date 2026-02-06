import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, HeartPulse } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";
import { TurtleLogo } from "@/components/TurtleLogo";
import { cn } from "@/lib/utils";

// Fluffy cloud SVG
const Cloud = ({
  className,
  delay = 0,
  duration = 20,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <div
    className={cn("absolute", className)}
    style={{
      animation: `cloud-float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    <svg viewBox="0 0 120 50" className="w-full h-full">
      <ellipse cx="35" cy="35" rx="22" ry="15" fill="white" opacity="0.9" />
      <ellipse cx="55" cy="28" rx="28" ry="20" fill="white" opacity="0.95" />
      <ellipse cx="80" cy="34" rx="20" ry="14" fill="white" opacity="0.9" />
      <ellipse cx="55" cy="38" rx="26" ry="12" fill="white" opacity="0.85" />
    </svg>
  </div>
);

// Bubble
const Bubble = ({ className, delay = 0, duration = 6 }: { className?: string; delay?: number; duration?: number }) => (
  <div
    className={cn("absolute rounded-full border border-white/20 bg-white/5", className)}
    style={{
      animation: `bubble-rise ${duration}s ease-in infinite`,
      animationDelay: `${delay}s`,
    }}
  />
);

// Jellyfish
const Jellyfish = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div
    className={cn("absolute opacity-30", className)}
    style={{ animation: `jellyfish-drift 12s ease-in-out infinite`, animationDelay: `${delay}s` }}
  >
    <svg viewBox="0 0 40 50" className="w-full h-full">
      <ellipse cx="20" cy="15" rx="14" ry="12" fill="hsl(280 50% 65%)" opacity="0.6" />
      <ellipse cx="20" cy="15" rx="10" ry="8" fill="hsl(280 40% 75%)" opacity="0.4" />
      {[12, 16, 20, 24, 28].map((x, i) => (
        <path key={i} d={`M${x} 25 Q${x + (i % 2 === 0 ? 3 : -3)} 38 ${x} 48`} stroke="hsl(280 45% 60%)" strokeWidth="1" fill="none" opacity="0.5" />
      ))}
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* === DEEP OCEAN background === */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220_45%_6%)] via-[hsl(215_50%_10%)] to-[hsl(200_45%_14%)]" />

      {/* Moon */}
      <div className="absolute top-[8%] right-[12%] w-16 h-16 md:w-24 md:h-24 rounded-full bg-[hsl(45_30%_85%)] shadow-[0_0_50px_15px_hsl(45_30%_85%/0.2)]" />
      {/* Moon crater hint */}
      <div className="absolute top-[10%] right-[13%] w-4 h-4 md:w-5 md:h-5 rounded-full bg-[hsl(45_20%_75%)] opacity-30" />

      {/* Stars / light particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          "top-[5%] left-[10%] w-1 h-1", "top-[15%] left-[45%] w-1.5 h-1.5",
          "top-[8%] right-[20%] w-1 h-1", "top-[25%] left-[70%] w-1 h-1",
          "top-[12%] left-[25%] w-0.5 h-0.5", "top-[20%] right-[40%] w-1 h-1",
        ].map((pos, i) => (
          <div key={i} className={`absolute rounded-full bg-white/40 ${pos}`} style={{ animation: `twinkle 3s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
        ))}
      </div>

      {/* Bubbles */}
      <Bubble className="w-3 h-3 bottom-[20%] left-[15%]" delay={0} duration={7} />
      <Bubble className="w-2 h-2 bottom-[25%] left-[35%]" delay={2} duration={5} />
      <Bubble className="w-4 h-4 bottom-[15%] right-[25%]" delay={4} duration={8} />
      <Bubble className="w-2 h-2 bottom-[30%] right-[40%]" delay={1} duration={6} />
      <Bubble className="w-3 h-3 bottom-[10%] left-[55%]" delay={3} duration={7} />

      {/* Jellyfish */}
      <Jellyfish className="w-10 h-12 top-[40%] left-[8%]" delay={0} />
      <Jellyfish className="w-8 h-10 top-[50%] right-[15%]" delay={4} />

      {/* === OCEAN FLOOR === */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] md:h-[25%]">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 350" preserveAspectRatio="none">
          {/* Sandy bottom */}
          <ellipse cx="720" cy="280" rx="900" ry="100" fill="hsl(35 30% 25%)" />
          <rect x="0" y="280" width="1440" height="70" fill="hsl(35 25% 20%)" />

          {/* Seaweed */}
          {[80, 200, 400, 650, 900, 1100, 1300].map((x, i) => (
            <g key={i}>
              <path
                d={`M${x} 280 Q${x + 10} 230 ${x - 5} 180 Q${x + 8} 150 ${x} ${130 - (i % 3) * 15}`}
                stroke={i % 2 === 0 ? "hsl(140 45% 30%)" : "hsl(160 40% 25%)"}
                strokeWidth="5"
                fill="none"
                opacity="0.7"
                style={{ animation: `seaweed-sway 4s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
              />
              <path
                d={`M${x + 12} 280 Q${x + 20} 240 ${x + 8} 200 Q${x + 18} 175 ${x + 14} ${155 - (i % 2) * 10}`}
                stroke={i % 2 === 0 ? "hsl(150 40% 28%)" : "hsl(145 35% 22%)"}
                strokeWidth="4"
                fill="none"
                opacity="0.5"
                style={{ animation: `seaweed-sway 3.5s ease-in-out infinite`, animationDelay: `${i * 0.5 + 0.2}s` }}
              />
            </g>
          ))}

          {/* Coral */}
          <ellipse cx="350" cy="275" rx="30" ry="15" fill="hsl(350 50% 40%)" opacity="0.6" />
          <ellipse cx="340" cy="260" rx="12" ry="18" fill="hsl(350 45% 45%)" opacity="0.5" />
          <ellipse cx="360" cy="258" rx="10" ry="16" fill="hsl(15 50% 45%)" opacity="0.5" />

          <ellipse cx="1000" cy="278" rx="25" ry="12" fill="hsl(30 50% 40%)" opacity="0.5" />
          <ellipse cx="990" cy="265" rx="10" ry="15" fill="hsl(340 45% 42%)" opacity="0.5" />
          <ellipse cx="1010" cy="262" rx="8" ry="14" fill="hsl(20 55% 48%)" opacity="0.4" />

          {/* Small rocks */}
          <ellipse cx="550" cy="290" rx="20" ry="10" fill="hsl(220 10% 30%)" opacity="0.4" />
          <ellipse cx="780" cy="295" rx="15" ry="8" fill="hsl(220 10% 25%)" opacity="0.35" />
          <ellipse cx="1200" cy="288" rx="18" ry="9" fill="hsl(220 8% 28%)" opacity="0.4" />
        </svg>
      </div>

      <AuthNavbar />

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 pb-[15%] md:pb-[10%]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left side - Text */}
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
                Följ ditt mående med{" "}
                <span className="text-[hsl(180_60%_70%)]">bättre insikt</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-xl leading-relaxed drop-shadow-sm">
                Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående
                och delar valfri data med din läkare
              </p>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white">
                  <HeartPulse className="w-4 h-4" />
                  <span>Skapad av och för människor med bipolär sjukdom</span>
                </div>
              </div>
            </div>

            {/* Right side - Turtle on a little hill */}
            <div className="flex justify-center md:justify-end animate-fade-in">
              <div className="relative">
                <TurtleLogo size="hero" animated={false} className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-3 px-4 bg-[hsl(220_35%_8%/0.8)] backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
          <span>© 2025 Friendly. Alla rättigheter förbehållna.</span>
          <div className="flex items-center gap-4">
            <Link to="/integritet" className="hover:text-white transition-colors">
              Integritetspolicy
            </Link>
            <Link to="/villkor" className="hover:text-white transition-colors">
              Användarvillkor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;

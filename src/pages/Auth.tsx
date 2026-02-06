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

// Small flower
const Flower = ({ cx, cy, color }: { cx: number; cy: number; color: string }) => (
  <g>
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse
        key={angle}
        cx={cx}
        cy={cy}
        rx="3"
        ry="6"
        fill={color}
        opacity="0.8"
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    ))}
    <circle cx={cx} cy={cy} r="2.5" fill="hsl(45 90% 65%)" />
  </g>
);

// Butterfly
const Butterfly = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div
    className={cn("absolute", className)}
    style={{
      animation: `butterfly-flutter 8s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    <svg viewBox="0 0 30 20" className="w-full h-full">
      <ellipse cx="11" cy="10" rx="7" ry="5" fill="hsl(280 60% 70%)" opacity="0.7"
        style={{ animation: "wing-flap 0.4s ease-in-out infinite alternate" }} />
      <ellipse cx="19" cy="10" rx="7" ry="5" fill="hsl(320 60% 70%)" opacity="0.7"
        style={{ animation: "wing-flap 0.4s ease-in-out infinite alternate-reverse" }} />
      <rect x="14.5" y="7" width="1" height="7" rx="0.5" fill="hsl(220 20% 30%)" />
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
      {/* === SKY background === */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200_70%_72%)] via-[hsl(200_60%_80%)] to-[hsl(160_40%_55%)]" />

      {/* Sun */}
      <div className="absolute top-[8%] right-[12%] w-20 h-20 md:w-28 md:h-28 rounded-full bg-[hsl(45_95%_70%)] shadow-[0_0_60px_20px_hsl(45_95%_70%/0.4)] animate-pulse" />

      {/* Clouds */}
      <Cloud className="w-36 h-16 top-[6%] left-[3%]" delay={0} duration={25} />
      <Cloud className="w-48 h-20 top-[12%] left-[30%]" delay={4} duration={30} />
      <Cloud className="w-40 h-18 top-[4%] right-[25%]" delay={2} duration={22} />
      <Cloud className="w-32 h-14 top-[18%] right-[8%]" delay={7} duration={28} />
      <Cloud className="w-28 h-12 top-[22%] left-[60%]" delay={5} duration={20} />

      {/* Butterflies */}
      <Butterfly className="w-8 h-6 top-[30%] left-[20%]" delay={0} />
      <Butterfly className="w-6 h-4 top-[25%] right-[30%]" delay={3} />

      {/* === GRASS / GROUND === */}
      <div className="absolute bottom-0 left-0 right-0 h-[35%] md:h-[30%]">
        {/* Rolling hills */}
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
          {/* Far hill */}
          <ellipse cx="400" cy="420" rx="600" ry="180" fill="hsl(130 35% 50%)" opacity="0.6" />
          <ellipse cx="1100" cy="430" rx="500" ry="160" fill="hsl(135 35% 48%)" opacity="0.5" />
          {/* Main ground */}
          <rect x="0" y="200" width="1440" height="200" fill="hsl(120 40% 42%)" />
          <ellipse cx="720" cy="200" rx="900" ry="80" fill="hsl(125 45% 48%)" />
          {/* Front grass tufts */}
          <ellipse cx="200" cy="190" rx="250" ry="40" fill="hsl(120 42% 52%)" />
          <ellipse cx="800" cy="195" rx="300" ry="35" fill="hsl(130 40% 50%)" />
          <ellipse cx="1300" cy="188" rx="200" ry="38" fill="hsl(125 38% 48%)" />

          {/* Pond */}
          <ellipse cx="1050" cy="300" rx="160" ry="50" fill="hsl(200 55% 60%)" opacity="0.7" />
          <ellipse cx="1050" cy="295" rx="140" ry="40" fill="hsl(200 60% 70%)" opacity="0.5" />
          <ellipse cx="1030" cy="290" rx="50" ry="15" fill="white" opacity="0.15" />

          {/* Flowers scattered */}
          <Flower cx={120} cy={210} color="hsl(340 70% 65%)" />
          <Flower cx={300} cy={230} color="hsl(45 80% 60%)" />
          <Flower cx={500} cy={215} color="hsl(280 60% 70%)" />
          <Flower cx={680} cy={225} color="hsl(340 65% 60%)" />
          <Flower cx={880} cy={210} color="hsl(200 60% 65%)" />
          <Flower cx={1280} cy={220} color="hsl(45 75% 60%)" />
          <Flower cx={1380} cy={235} color="hsl(340 70% 70%)" />

          {/* Grass blades */}
          {[50, 150, 260, 380, 470, 560, 650, 750, 850, 950, 1100, 1200, 1350].map((x, i) => (
            <path
              key={i}
              d={`M${x} 200 Q${x + (i % 2 === 0 ? 5 : -5)} ${175 - (i % 3) * 5} ${x + (i % 2 === 0 ? 3 : -3)} ${165 - (i % 4) * 3}`}
              stroke="hsl(120 50% 38%)"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
          ))}
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
                <span className="text-[hsl(45_95%_75%)]">bättre insikt</span>
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
                <TurtleLogo size="hero" animated={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-3 px-4 bg-[hsl(120_30%_25%/0.6)] backdrop-blur-sm border-t border-white/10">
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

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

// Lamppost
const Lamppost = ({ x, glowDelay = 0 }: { x: string; glowDelay?: number }) => (
  <div className={`absolute bottom-[22%] md:bottom-[18%] ${x}`}>
    <svg viewBox="0 0 20 80" className="w-4 h-16 md:w-5 md:h-20">
      {/* Pole */}
      <rect x="8" y="20" width="4" height="60" fill="hsl(220 15% 20%)" />
      {/* Lamp head */}
      <rect x="3" y="15" width="14" height="8" rx="2" fill="hsl(220 15% 25%)" />
      {/* Light glow */}
      <ellipse cx="10" cy="23" rx="12" ry="15" fill="hsl(45 80% 70%)" opacity="0.15"
        style={{ animation: `twinkle 4s ease-in-out infinite`, animationDelay: `${glowDelay}s` }} />
      <rect x="5" y="22" width="10" height="2" fill="hsl(45 70% 65%)" opacity="0.6" />
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
      {/* === DARK NIGHT SKY === */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(230_30%_5%)] via-[hsl(225_35%_8%)] to-[hsl(220_30%_12%)]" />

      {/* Moon */}
      <div className="absolute top-[6%] right-[10%] w-14 h-14 md:w-20 md:h-20 rounded-full bg-[hsl(45_25%_82%)] shadow-[0_0_40px_12px_hsl(45_25%_82%/0.15)]" />
      <div className="absolute top-[7.5%] right-[10.5%] w-3 h-3 md:w-4 md:h-4 rounded-full bg-[hsl(45_15%_72%)] opacity-25" />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          "top-[3%] left-[8%] w-1 h-1", "top-[10%] left-[30%] w-1.5 h-1.5",
          "top-[5%] right-[25%] w-1 h-1", "top-[18%] left-[55%] w-1 h-1",
          "top-[7%] left-[70%] w-0.5 h-0.5", "top-[14%] right-[35%] w-1 h-1",
          "top-[2%] left-[50%] w-0.5 h-0.5", "top-[12%] left-[15%] w-1 h-1",
          "top-[20%] right-[15%] w-0.5 h-0.5", "top-[9%] right-[50%] w-1 h-1",
        ].map((pos, i) => (
          <div key={i} className={`absolute rounded-full bg-white/50 ${pos}`} style={{ animation: `twinkle 3s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>

      {/* === CITY SKYLINE === */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] md:h-[40%] pointer-events-none">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 500" preserveAspectRatio="none">
          {/* Far buildings (darker, background layer) */}
          <rect x="50" y="180" width="80" height="320" fill="hsl(225 25% 10%)" />
          <rect x="140" y="220" width="60" height="280" fill="hsl(225 20% 11%)" />
          <rect x="220" y="150" width="90" height="350" fill="hsl(228 25% 9%)" />
          <rect x="330" y="200" width="70" height="300" fill="hsl(225 22% 10%)" />
          <rect x="420" y="170" width="100" height="330" fill="hsl(230 25% 8%)" />
          <rect x="540" y="240" width="60" height="260" fill="hsl(225 20% 11%)" />
          <rect x="620" y="160" width="85" height="340" fill="hsl(228 22% 9%)" />
          <rect x="730" y="210" width="70" height="290" fill="hsl(225 25% 10%)" />
          <rect x="820" y="140" width="110" height="360" fill="hsl(230 28% 8%)" />
          <rect x="950" y="190" width="75" height="310" fill="hsl(225 22% 10%)" />
          <rect x="1040" y="230" width="60" height="270" fill="hsl(228 20% 11%)" />
          <rect x="1120" y="165" width="95" height="335" fill="hsl(225 25% 9%)" />
          <rect x="1240" y="200" width="70" height="300" fill="hsl(230 22% 10%)" />
          <rect x="1330" y="250" width="80" height="250" fill="hsl(225 20% 11%)" />

          {/* Building windows (tiny yellow/warm dots) */}
          {[
            [70, 200], [85, 220], [100, 250], [70, 270], [100, 290],
            [240, 170], [270, 190], [240, 220], [270, 250], [280, 280],
            [445, 190], [475, 210], [445, 240], [490, 260], [460, 300],
            [640, 180], [665, 200], [640, 230], [680, 260], [650, 290],
            [845, 160], [875, 180], [845, 210], [900, 230], [860, 260], [890, 300],
            [970, 210], [985, 240], [970, 270],
            [1140, 185], [1170, 205], [1140, 235], [1185, 260], [1155, 290],
            [1260, 220], [1275, 250], [1260, 280],
          ].map(([wx, wy], i) => (
            <rect key={i} x={wx} y={wy} width="5" height="6" rx="1"
              fill={i % 3 === 0 ? "hsl(45 70% 65%)" : i % 3 === 1 ? "hsl(35 60% 55%)" : "hsl(200 30% 40%)"}
              opacity={i % 4 === 0 ? 0.7 : 0.4}
              style={i % 5 === 0 ? { animation: `twinkle 5s ease-in-out infinite`, animationDelay: `${i * 0.3}s` } : undefined}
            />
          ))}

          {/* Rooftop details */}
          <polygon points="220,150 265,120 310,150" fill="hsl(225 25% 11%)" />
          <polygon points="820,140 875,105 930,140" fill="hsl(228 28% 10%)" />
          <rect x="860" y="110" width="8" height="30" fill="hsl(225 20% 12%)" /> {/* Antenna */}
          <rect x="460" y="155" width="6" height="15" fill="hsl(225 18% 12%)" /> {/* Antenna */}

          {/* Ground / street level */}
          <rect x="0" y="460" width="1440" height="40" fill="hsl(220 20% 8%)" />
          {/* Sidewalk */}
          <rect x="0" y="455" width="1440" height="8" fill="hsl(220 12% 18%)" />

          {/* Road markings */}
          {[100, 300, 500, 700, 900, 1100, 1300].map((rx, i) => (
            <rect key={i} x={rx} y="478" width="40" height="3" rx="1" fill="hsl(45 20% 40%)" opacity="0.3" />
          ))}

          {/* Trees (dark silhouettes) */}
          {[160, 580, 770, 1080, 1380].map((tx, i) => (
            <g key={i}>
              <rect x={tx - 3} y="430" width="6" height="25" fill="hsl(220 15% 10%)" />
              <ellipse cx={tx} cy="420" rx="18" ry="22" fill="hsl(150 25% 10%)" />
            </g>
          ))}
        </svg>
      </div>

      {/* Lampposts */}
      <Lamppost x="left-[10%]" glowDelay={0} />
      <Lamppost x="left-[40%]" glowDelay={1.5} />
      <Lamppost x="right-[20%]" glowDelay={3} />

      <AuthNavbar />

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col justify-center px-4 md:px-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Text content */}
          <div className="space-y-6 animate-fade-in max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
              Följ ditt mående med{" "}
              <span className="text-[hsl(180_60%_70%)]">bättre insikt</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-sm">
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
        </div>

        {/* Turtle lying down near the bottom/street level */}
        <div className="absolute bottom-[18%] md:bottom-[15%] right-[5%] md:right-[10%] z-20 animate-fade-in">
          <TurtleLogo size="hero" animated={false} className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80" />
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

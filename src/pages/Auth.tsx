import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, HeartPulse } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";
import { TurtleLogo } from "@/components/TurtleLogo";

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
      {/* === LIGHT SKY === */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(205_75%_72%)] via-[hsl(200_60%_82%)] to-[hsl(195_45%_90%)]" />

      {/* Sun */}
      <div className="absolute top-[6%] right-[10%] w-16 h-16 md:w-24 md:h-24 rounded-full bg-[hsl(45_95%_70%)] shadow-[0_0_80px_20px_hsl(45_90%_70%/0.4)]" />

      {/* Clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "8%", left: "5%", w: "w-32 md:w-44", delay: 0 },
          { top: "12%", left: "35%", w: "w-40 md:w-56", delay: 3 },
          { top: "5%", left: "65%", w: "w-28 md:w-40", delay: 6 },
          { top: "18%", left: "15%", w: "w-24 md:w-36", delay: 9 },
          { top: "15%", left: "80%", w: "w-20 md:w-32", delay: 12 },
        ].map((cloud, i) => (
          <div
            key={i}
            className={`absolute ${cloud.w}`}
            style={{
              top: cloud.top,
              left: cloud.left,
              animation: `cloud-float ${20 + i * 4}s ease-in-out infinite`,
              animationDelay: `${cloud.delay}s`,
            }}
          >
            <svg viewBox="0 0 120 50" className="w-full h-full">
              <ellipse cx="35" cy="35" rx="22" ry="15" fill="white" opacity="0.85" />
              <ellipse cx="55" cy="28" rx="28" ry="20" fill="white" opacity="0.9" />
              <ellipse cx="80" cy="34" rx="20" ry="14" fill="white" opacity="0.85" />
              <ellipse cx="55" cy="38" rx="26" ry="12" fill="white" opacity="0.8" />
            </svg>
          </div>
        ))}
      </div>

      {/* === CITY SKYLINE (light version) === */}
      <div className="absolute bottom-0 left-0 right-0 h-[55%] md:h-[50%] pointer-events-none">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 600" preserveAspectRatio="none">

          {/* === BACK ROW - tall buildings (light pastels) === */}
          <rect x="30" y="120" width="70" height="480" fill="hsl(220 20% 82%)" />
          <rect x="110" y="80" width="55" height="520" fill="hsl(215 22% 78%)" />
          <rect x="180" y="140" width="90" height="460" fill="hsl(210 18% 84%)" />
          <rect x="285" y="60" width="65" height="540" fill="hsl(225 20% 80%)" />
          <rect x="365" y="130" width="80" height="470" fill="hsl(218 16% 83%)" />
          <rect x="460" y="90" width="100" height="510" fill="hsl(222 22% 77%)" />
          <rect x="575" y="150" width="55" height="450" fill="hsl(210 18% 82%)" />
          <rect x="645" y="70" width="85" height="530" fill="hsl(220 20% 79%)" />
          <rect x="745" y="110" width="70" height="490" fill="hsl(215 18% 82%)" />
          <rect x="830" y="50" width="110" height="550" fill="hsl(222 22% 76%)" />
          <rect x="955" y="100" width="75" height="500" fill="hsl(218 20% 81%)" />
          <rect x="1045" y="140" width="60" height="460" fill="hsl(210 18% 84%)" />
          <rect x="1120" y="75" width="95" height="525" fill="hsl(220 20% 79%)" />
          <rect x="1230" y="130" width="70" height="470" fill="hsl(215 18% 82%)" />
          <rect x="1315" y="90" width="80" height="510" fill="hsl(218 16% 83%)" />

          {/* Rooftop details */}
          <polygon points="180,140 225,105 270,140" fill="hsl(210 18% 86%)" />
          <polygon points="645,70 688,35 730,70" fill="hsl(220 20% 81%)" />
          <polygon points="830,50 885,15 940,50" fill="hsl(222 22% 78%)" />
          <polygon points="1120,75 1168,40 1215,75" fill="hsl(220 20% 81%)" />

          {/* Antennas */}
          <rect x="310" y="35" width="5" height="25" fill="hsl(220 15% 70%)" />
          <circle cx="312" cy="35" r="3" fill="hsl(0 60% 55%)" opacity="0.5" />
          <rect x="880" y="0" width="6" height="50" fill="hsl(220 15% 70%)" />
          <circle cx="883" cy="0" r="3" fill="hsl(0 60% 55%)" opacity="0.5" />

          {/* === BUILDING WINDOWS === */}
          {[
            [45,140],[55,165],[45,190],[55,215],[45,240],[55,265],[45,300],[55,330],
            [120,100],[132,125],[120,150],[132,175],[120,200],[132,230],
            [200,160],[220,185],[240,160],[200,210],[220,235],[240,210],[200,260],[220,285],
            [295,80],[310,105],[295,130],[310,155],[295,180],[310,210],[295,240],
            [380,150],[400,175],[415,150],[380,200],[400,225],[415,200],[380,260],
            [480,110],[500,135],[520,110],[480,160],[500,185],[520,160],[480,215],[500,240],[520,215],
            [590,170],[605,195],[590,220],[605,250],
            [660,90],[680,115],[700,90],[660,140],[680,165],[700,140],[660,195],[680,220],
            [760,130],[775,155],[760,180],[775,210],[760,240],
            [850,70],[870,95],[895,70],[910,95],[850,125],[870,150],[895,125],[910,150],[850,180],[870,210],
            [970,120],[985,145],[970,175],[985,205],[970,235],
            [1060,160],[1075,185],[1060,215],[1075,245],
            [1140,95],[1160,120],[1180,95],[1140,150],[1160,175],[1180,150],[1140,210],[1160,235],
            [1245,150],[1260,175],[1245,200],[1260,230],[1245,260],
            [1330,110],[1350,135],[1370,110],[1330,165],[1350,190],[1370,165],[1330,220],
          ].map(([wx, wy], i) => (
            <rect key={`w${i}`} x={wx} y={wy} width="6" height="7" rx="1"
              fill={i % 4 === 0 ? "hsl(200 30% 92%)" : i % 4 === 1 ? "hsl(195 25% 88%)" : i % 4 === 2 ? "hsl(210 20% 95%)" : "hsl(190 28% 90%)"}
              opacity={0.9}
            />
          ))}

          {/* === FRONT ROW - smaller houses === */}
          <rect x="0" y="400" width="100" height="200" fill="hsl(30 35% 85%)" />
          <polygon points="0,400 50,365 100,400" fill="hsl(15 45% 55%)" />
          <rect x="350" y="410" width="80" height="190" fill="hsl(40 30% 88%)" />
          <polygon points="350,410 390,375 430,410" fill="hsl(10 40% 58%)" />
          <rect x="700" y="395" width="90" height="205" fill="hsl(35 32% 86%)" />
          <polygon points="700,395 745,355 790,395" fill="hsl(15 45% 55%)" />
          <rect x="1050" y="405" width="75" height="195" fill="hsl(45 28% 87%)" />
          <polygon points="1050,405 1088,370 1125,405" fill="hsl(10 40% 58%)" />

          {/* Front house windows */}
          {[
            [20,420],[50,420],[20,455],[50,455],
            [370,425],[400,425],[370,455],[400,455],
            [720,415],[750,415],[720,445],[750,445],
            [1068,420],[1095,420],[1068,452],[1095,452],
          ].map(([wx, wy], i) => (
            <rect key={`fw${i}`} x={wx} y={wy} width="8" height="10" rx="1"
              fill="hsl(200 40% 90%)" opacity={0.8}
            />
          ))}

          {/* Front house doors */}
          <rect x="38" y="470" width="16" height="24" rx="3" fill="hsl(25 50% 40%)" />
          <rect x="378" y="475" width="14" height="22" rx="3" fill="hsl(15 45% 42%)" />
          <rect x="730" y="472" width="15" height="23" rx="3" fill="hsl(20 48% 40%)" />
          <rect x="1078" y="474" width="14" height="21" rx="3" fill="hsl(25 45% 42%)" />

          {/* === GROUND === */}
          {/* Sidewalk */}
          <rect x="0" y="530" width="1440" height="12" fill="hsl(35 20% 78%)" />
          {/* Road */}
          <rect x="0" y="542" width="1440" height="58" fill="hsl(220 8% 72%)" />
          {/* Road center line */}
          {[40, 160, 280, 400, 520, 640, 760, 880, 1000, 1120, 1240, 1360].map((rx, i) => (
            <rect key={`r${i}`} x={rx} y="568" width="50" height="4" rx="2" fill="hsl(45 50% 70%)" opacity="0.6" />
          ))}
          {/* Curb */}
          <rect x="0" y="528" width="1440" height="3" fill="hsl(35 15% 72%)" />

          {/* === TREES (lush green) === */}
          {[
            [60, 510, 22, 28], [150, 505, 28, 35], [280, 512, 20, 25], [430, 508, 25, 30],
            [530, 515, 18, 22], [660, 505, 30, 38], [800, 510, 24, 30], [920, 512, 20, 26],
            [1000, 507, 26, 32], [1150, 510, 22, 28], [1280, 505, 28, 35], [1400, 512, 20, 25],
          ].map(([tx, ty, rx, ry], i) => (
            <g key={`t${i}`}>
              <rect x={tx - 3} y={ty} width="6" height={530 - ty} fill="hsl(25 30% 40%)" />
              <ellipse cx={tx} cy={ty - 5} rx={rx} ry={ry} fill={i % 3 === 0 ? "hsl(130 45% 40%)" : i % 3 === 1 ? "hsl(140 40% 35%)" : "hsl(125 42% 38%)"} />
              <ellipse cx={tx - 4} cy={ty - 10} rx={rx * 0.7} ry={ry * 0.6} fill={i % 2 === 0 ? "hsl(130 50% 48%)" : "hsl(140 45% 42%)"} />
            </g>
          ))}

          {/* === BUSHES === */}
          {[
            [25, 528, 18, 10], [110, 526, 22, 12], [200, 528, 16, 9], [320, 526, 20, 11],
            [470, 528, 15, 8], [580, 526, 24, 13], [730, 528, 18, 10], [850, 526, 20, 11],
            [960, 528, 16, 9], [1100, 526, 22, 12], [1220, 528, 18, 10], [1350, 526, 20, 11],
          ].map(([bx, by, rx, ry], i) => (
            <ellipse key={`b${i}`} cx={bx} cy={by} rx={rx} ry={ry}
              fill={i % 3 === 0 ? "hsl(135 40% 38%)" : i % 3 === 1 ? "hsl(125 35% 35%)" : "hsl(145 42% 40%)"}
            />
          ))}

          {/* === FLOWER BOXES on front houses === */}
          {[15, 45, 365, 395, 715, 745, 1063, 1090].map((fx, i) => (
            <g key={`fb${i}`}>
              <rect x={fx} y={435 + (i % 4) * 2} width="12" height="4" rx="1" fill="hsl(25 40% 45%)" />
              <circle cx={fx + 3} cy={433 + (i % 4) * 2} r="2.5" fill={i % 3 === 0 ? "hsl(340 65% 60%)" : i % 3 === 1 ? "hsl(50 65% 55%)" : "hsl(280 55% 60%)"} opacity="0.8" />
              <circle cx={fx + 9} cy={433 + (i % 4) * 2} r="2" fill={i % 2 === 0 ? "hsl(350 60% 62%)" : "hsl(45 70% 58%)"} opacity="0.7" />
            </g>
          ))}

          {/* Park benches */}
          <rect x="240" y="520" width="30" height="3" rx="1" fill="hsl(25 30% 45%)" />
          <rect x="243" y="523" width="3" height="7" fill="hsl(25 28% 40%)" />
          <rect x="264" y="523" width="3" height="7" fill="hsl(25 28% 40%)" />
          <rect x="240" y="515" width="3" height="8" fill="hsl(25 28% 40%)" />
          <rect x="267" y="515" width="3" height="8" fill="hsl(25 28% 40%)" />

          <rect x="1180" y="520" width="30" height="3" rx="1" fill="hsl(25 30% 45%)" />
          <rect x="1183" y="523" width="3" height="7" fill="hsl(25 28% 40%)" />
          <rect x="1204" y="523" width="3" height="7" fill="hsl(25 28% 40%)" />
          <rect x="1180" y="515" width="3" height="8" fill="hsl(25 28% 40%)" />
          <rect x="1207" y="515" width="3" height="8" fill="hsl(25 28% 40%)" />
        </svg>
      </div>

      {/* Lampposts */}
      {["left-[7%]", "left-[25%]", "left-[50%]", "right-[25%]", "right-[8%]"].map((x, i) => (
        <div key={i} className={`absolute bottom-[22%] md:bottom-[18%] ${x}`}>
          <svg viewBox="0 0 20 80" className="w-4 h-16 md:w-5 md:h-20">
            <rect x="8" y="20" width="4" height="60" fill="hsl(220 10% 45%)" />
            <rect x="3" y="15" width="14" height="8" rx="2" fill="hsl(220 10% 40%)" />
            <rect x="5" y="22" width="10" height="2" fill="hsl(45 30% 75%)" opacity="0.4" />
          </svg>
        </div>
      ))}

      <AuthNavbar />

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col justify-end px-4 md:px-8 pb-6 md:pb-[12%]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="space-y-4 md:space-y-6 animate-fade-in max-w-xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-[hsl(220_25%_18%)] leading-[1.1] tracking-tight drop-shadow-sm">
              Följ ditt mående med{" "}
              <span className="text-[hsl(45_85%_42%)]">bättre insikt</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[hsl(220_20%_30%)] leading-relaxed">
              Din interaktiva och personliga stämningsdagbok ger dig bättre koll på ditt mående
              och delar valfri data med din läkare
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[hsl(220_25%_18%/0.12)] backdrop-blur-sm text-[hsl(220_25%_18%)]">
                <HeartPulse className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Skapad av och för människor med bipolär sjukdom</span>
              </div>
            </div>
          </div>

          {/* Turtle: stacked on mobile */}
          <div className="flex justify-center mt-6 md:hidden animate-fade-in">
            <TurtleLogo size="hero" animated={false} className="w-40 h-40 sm:w-56 sm:h-56" />
          </div>
        </div>

        {/* Desktop turtle */}
        <div className="hidden md:block absolute bottom-[10%] right-[3%] lg:right-[8%] z-20 animate-fade-in">
          <TurtleLogo size="hero" animated={false} className="w-96 h-96 lg:w-[29rem] lg:h-[29rem]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-3 px-4 bg-[hsl(220_20%_95%/0.85)] backdrop-blur-sm border-t border-[hsl(220_15%_80%/0.5)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[hsl(220_20%_40%)]">
          <span>© 2025 Friendly. Alla rättigheter förbehållna.</span>
          <div className="flex items-center gap-4">
            <Link to="/integritet" className="hover:text-[hsl(220_25%_18%)] transition-colors">
              Integritetspolicy
            </Link>
            <Link to="/villkor" className="hover:text-[hsl(220_25%_18%)] transition-colors">
              Användarvillkor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;

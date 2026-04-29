import { Link } from "react-router-dom";
import { TurtleLogo } from "@/components/TurtleLogo";
import { useTranslation } from 'react-i18next';

function FooterSkyline() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 1440 180"
        className="w-full h-auto"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 180 L0 120 Q120 70 240 100 Q360 60 480 90 Q600 50 720 80 Q840 55 960 85 Q1080 60 1200 95 Q1320 70 1440 110 L1440 180 Z" fill="hsl(225 30% 6%)" />
        <path d="M0 180 L0 140 Q180 110 360 130 Q540 100 720 125 Q900 105 1080 128 Q1260 108 1440 135 L1440 180 Z" fill="hsl(225 28% 5%)" />
        <rect x="0" y="155" width="1440" height="25" fill="hsl(225 25% 4%)" />
        {[80, 220, 400, 580, 750, 950, 1100, 1300].map((x, i) => {
          const h = 18 + (i % 3) * 8;
          const w = 12 + (i % 2) * 6;
          return (
            <g key={`ft${i}`}>
              <rect x={x - 1.5} y={155 - h * 0.4} width="3" height={h * 0.4} fill="hsl(225 20% 8%)" />
              <ellipse cx={x} cy={155 - h * 0.5} rx={w} ry={h * 0.6} fill={i % 3 === 0 ? "hsl(150 20% 7%)" : i % 3 === 1 ? "hsl(140 18% 6%)" : "hsl(145 22% 8%)"} />
            </g>
          );
        })}
        {[[100, 30], [300, 15], [500, 40], [700, 20], [900, 35], [1100, 10], [1300, 45], [200, 55], [600, 60], [1000, 50]].map(([cx, cy], i) => (
          <circle key={`fs${i}`} cx={cx} cy={cy} r={i % 3 === 0 ? 1.2 : 0.8} fill="white" opacity={0.15 + (i % 4) * 0.08} style={{ animation: `twinkle ${3 + i % 2}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
        ))}
        <circle cx="1350" cy="25" r="12" fill="hsl(45 25% 82%)" opacity="0.2" />
      </svg>
    </div>
  );
}

export function LandingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="relative z-10 bg-[hsl(225_30%_5%)] pt-20 pb-6 overflow-hidden">
      <FooterSkyline />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 mb-12">
          <div className="flex flex-col items-center md:items-start gap-4 max-w-xs">
            <div className="flex items-center gap-3">
              <TurtleLogo size="sm" className="w-8 h-8" />
              <span className="text-lg font-display font-bold text-white">Toddy</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed text-center md:text-left">
              {t('footer.tagline')}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Link to="/integritet" className="text-sm text-white/50 hover:text-white transition-colors">
              {t('footer.privacyPolicy')}
            </Link>
            <Link to="/villkor" className="text-sm text-white/50 hover:text-white transition-colors">
              {t('footer.termsOfService')}
            </Link>
            <Link to="/om-oss" className="text-sm text-white/50 hover:text-white transition-colors">
              {t('footer.aboutUs')}
            </Link>
            <Link to="/for-anvandare" className="text-sm text-white/50 hover:text-white transition-colors">
              {t('footer.forUsers')}
            </Link>
            <Link to="/blogg" className="text-sm text-white/50 hover:text-white transition-colors">
              Blogg
            </Link>
          </div>
        </div>
        <div className="h-px bg-white/[0.06] mb-5" />
        <div className="flex items-center justify-center text-xs text-white/30">
          <span>© {new Date().getFullYear()} Toddy. {t('footer.allRightsReserved')}</span>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Menu, X } from "lucide-react";

const AppleLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256.6 113c30-35.6 27.3-68 26.4-79.7-26.5 1.5-57.2 18-74.7 38.3-19.3 21.8-30.6 48.7-28.2 78.9 28.6 2.2 54.7-12.5 76.5-37.5z"/>
  </svg>
);
import { TurtleLogo } from "@/components/TurtleLogo";
import { SEO } from "@/components/seo/SEO";

// App Store-länken sätts när appen är publicerad.
const APP_STORE_URL = "https://apps.apple.com/app/toddy"; // TODO: uppdatera efter App Store-godkännande
const PLAY_STORE_URL = ""; // Android kommer senare

const NAV_LINKS = [
  { label: "Så funkar det", to: "/sa-funkar-det" },
  { label: "Om oss", to: "/om-oss" },
  { label: "För användare", to: "/for-anvandare" },
  { label: "För vårdgivare", to: "/for-vardgivare" },
  { label: "För anhöriga", to: "/for-anhoriga" },
  { label: "Blogg", to: "/blogg" },
];

const FOOTER_LINKS = [
  { label: "Integritet", to: "/integritet" },
  { label: "Villkor", to: "/villkor" },
  { label: "Samarbetspartners", to: "/samarbetspartners" },
];

function HamburgerHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="relative z-20 px-5 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="max-w-md mx-auto flex items-center justify-between h-14">
          <Link to="/ladda-ner" className="flex items-center gap-2.5" aria-label="Toddy startsida">
            <TurtleLogo size="sm" className="w-8 h-8" />
            <span className="text-lg font-display font-bold text-white tracking-tight">Toddy</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Öppna meny"
            className="h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in">
          <div className="px-5 pt-[max(env(safe-area-inset-top),0.75rem)]">
            <div className="flex items-center justify-between h-14">
              <Link
                to="/ladda-ner"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5"
              >
                <TurtleLogo size="sm" className="w-8 h-8" />
                <span className="text-lg font-display font-bold text-white tracking-tight">Toddy</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Stäng meny"
                className="h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <nav className="flex-1 flex flex-col px-8 pt-10 overflow-y-auto">
            <ul className="space-y-5">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="block text-3xl font-display font-bold text-white tracking-tight hover:text-[hsl(45_85%_60%)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-8 pb-[max(env(safe-area-inset-bottom),2rem)] pt-6 border-t border-white/10 space-y-3">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block text-base text-white/50 hover:text-white/80 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function PageFooter() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/10 bg-[hsl(225_30%_5%)]">
      <div className="max-w-md mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <TurtleLogo size="sm" className="w-8 h-8" />
          <span className="text-lg font-display font-bold text-white">Toddy</span>
        </div>
        <p className="text-sm text-white/50 leading-relaxed mb-8">
          En digital stämningsdagbok för dig som lever med bipolär sjukdom.
        </p>

        <nav aria-label="Sidfot — navigation" className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8">
          {[...NAV_LINKS, ...FOOTER_LINKS].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="h-px bg-white/[0.06] mb-5" />
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} Toddy. Alla rättigheter förbehållna.
        </p>
      </div>
    </footer>
  );
}

/**
 * /ladda-ner — landningssida för mobila webbesökare.
 * Helt egen header med hamburgarmeny och footer — INTE en popup.
 * Inloggning/registrering är inte tillgängligt via mobil webb;
 * användare måste ladda ner appen.
 */
export default function DownloadApp() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Ladda ner Toddy-appen | iPhone & Android"
        description="Toddy finns nu som app i App Store. Din egna stämningsdagbok – alltid med dig i fickan."
      />

      {/* Bakgrundsglow */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(45 60% 12% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(45 50% 10% / 0.4), transparent 60%)",
        }}
      />

      <HamburgerHeader />

      <main className="relative z-10 px-5 pt-6 pb-8 max-w-md mx-auto flex flex-col items-center text-center">
        {/* Mascot med golden halo */}
        <div className="relative mb-8 mt-4">
          <div
            aria-hidden
            className="absolute inset-0 -m-10 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(45 90% 55% / 0.3), transparent 70%)",
            }}
          />
          <TurtleLogo
            size="hero"
            animated
            className="relative w-36 h-36 drop-shadow-[0_8px_40px_hsl(45_90%_55%/0.35)]"
          />
        </div>

        <p className="text-sm font-light tracking-[0.3em] uppercase text-[hsl(45_30%_75%/0.7)] mb-3">
          Nu i App Store
        </p>

        <h1
          className="text-5xl font-display font-bold tracking-tight leading-[1.05] mb-4"
          style={{
            textShadow:
              "0 2px 32px hsl(45 90% 55% / 0.25), 0 0 60px hsl(45 80% 50% / 0.1)",
          }}
        >
          Ta Toddy med dig
        </h1>

        <p className="text-base text-white/70 leading-relaxed max-w-sm mb-10">
          Toddy är gjord för mobilen. Ladda ner appen och få full upplevelse —
          check-ins, påminnelser och insikter direkt i fickan.
        </p>

        {/* App Store CTA */}
        <a
          href={APP_STORE_URL}
          className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.4)] hover:bg-[hsl(45_85%_62%)] active:scale-[0.98] transition-all mb-3"
        >
          <AppleLogo className="h-5 w-5" />
          Ladda ner i App Store
        </a>

        {/* Android — kommer senare */}
        <div className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-full bg-white/[0.04] text-white/40 font-medium text-sm tracking-wide ring-1 ring-white/10 mb-10">
          <Smartphone className="h-5 w-5" />
          Android — kommer snart
        </div>

        <p className="text-sm text-white/50 max-w-sm">
          Toddy är en mobilapp. För att logga in eller skapa konto behöver du
          ladda ner appen.
        </p>
      </main>

      <PageFooter />
    </div>
  );
}

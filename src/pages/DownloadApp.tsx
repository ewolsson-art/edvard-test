import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Apple, Smartphone, Sparkles, Shield, Heart } from "lucide-react";
import { TurtleLogo } from "@/components/TurtleLogo";
import { SEO } from "@/components/seo/SEO";

// App Store-länken sätts när appen är publicerad. Tills dess länkar vi till
// en "coming soon"-ankarpunkt så användaren inte hamnar i en bruten flow.
const APP_STORE_URL = "https://apps.apple.com/app/toddy"; // TODO: uppdatera med riktig URL efter App Store-godkännande
const PLAY_STORE_URL = ""; // Android kommer senare

/**
 * /ladda-ner — landningssida för mobila webbesökare.
 * Marknadsför native-appen och länkar till App Store. Designen följer
 * Toddys mörka tema med gyllene primärfärg och turtle-mascot.
 */
export default function DownloadApp() {
  useEffect(() => {
    // Säkerställ mörk bakgrund även när sidan laddas direkt
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

      {/* Tillbaka-länk */}
      <div className="relative z-10 px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Till webbplatsen
        </Link>
      </div>

      <main className="relative z-10 px-5 pt-6 pb-[max(env(safe-area-inset-bottom),2rem)] max-w-md mx-auto flex flex-col items-center text-center">
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
          <Apple className="h-5 w-5" fill="currentColor" />
          Ladda ner i App Store
        </a>

        {/* Android — kommer senare */}
        <div className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-full bg-white/[0.04] text-white/40 font-medium text-sm tracking-wide ring-1 ring-white/10 mb-10">
          <Smartphone className="h-5 w-5" />
          Android — kommer snart
        </div>

        {/* Funktioner */}
        <ul className="w-full space-y-4 text-left mb-10">
          {[
            {
              icon: Heart,
              title: "Följ ditt mående",
              desc: "Enkla check-ins varje dag — utan press.",
            },
            {
              icon: Sparkles,
              title: "AI-drivna insikter",
              desc: "Upptäck mönster i sömn, energi och stämning.",
            },
            {
              icon: Shield,
              title: "Privat och säkert",
              desc: "Din data tillhör dig — alltid krypterad.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]"
            >
              <div className="shrink-0 h-10 w-10 rounded-xl bg-[hsl(45_85%_55%/0.12)] flex items-center justify-center">
                <Icon className="h-5 w-5 text-[hsl(45_85%_60%)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-0.5">{title}</h3>
                <p className="text-sm text-white/60 leading-snug">{desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/40 max-w-xs">
          Toddy är en mobilapp. För att logga in eller skapa konto behöver du
          ladda ner appen.
        </p>
      </main>
    </div>
  );
}

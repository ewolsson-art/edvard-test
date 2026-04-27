import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { AuthNavbar } from "@/components/AuthNavbar";
import { TurtleLogo } from "@/components/TurtleLogo";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { NightCityscape } from "@/components/NightCityscape";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { NativeAuthLanding } from "@/components/native/NativeAuthLanding";

const TODDY_GREETINGS = [
  "Hej! Jag är Toddy 👋",
  "Redo att checka in?",
  "Jag följer dig hela vägen",
  "Vi tar det en dag i taget",
  "Skönt att se dig här",
  "En liten stund — stor skillnad",
];

function ToddySpeechBubble() {
  const greeting = useMemo(
    () => TODDY_GREETINGS[Math.floor(Math.random() * TODDY_GREETINGS.length)],
    []
  );

  return (
    <div
      className="absolute top-2 -left-40 lg:-left-48 z-20 opacity-0 animate-toddy-bubble-in pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative bg-white/95 backdrop-blur-sm text-[hsl(225_30%_15%)] px-4 py-2.5 rounded-2xl rounded-br-sm shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <p className="text-sm font-medium leading-snug whitespace-nowrap">
          {greeting}
        </p>
        <span className="absolute -bottom-1.5 right-3 w-3 h-3 bg-white/95 rotate-45" />
      </div>
    </div>
  );
}


const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isNative } = useNativePlatform();

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

  // Native iOS/Android app gets a focused, professional onboarding screen
  // — not the marketing landing page used on the web.
  if (isNative) {
    return <NativeAuthLanding />;
  }

  return (
    <div className="flex flex-col">
      {/* === HERO WITH NIGHT SKY === */}
      <div className="min-h-[100svh] flex flex-col relative overflow-hidden">
        <NightCityscape />
        <AuthNavbar />

        {/* Hero Section */}
        <section className="relative z-10 flex-1 flex flex-col justify-center md:justify-end px-5 md:px-8 pb-[18%] md:pb-[12%] pt-20 md:pt-0">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex items-end gap-6 md:gap-10 animate-fade-in">
              <div className="space-y-3 md:space-y-6 max-w-xl">
                <h1 className="text-[1.75rem] sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.15] tracking-tight drop-shadow-lg">
                  {t('landing.heroTitle')}{" "}
                  <span className="text-[hsl(45_85%_55%)]">{t('landing.heroHighlight')}</span>
                </h1>
                <p className="text-[0.95rem] sm:text-lg md:text-xl text-white/80 leading-relaxed">
                  {t('landing.heroSubtitle')}
                </p>
                <div className="flex flex-col gap-3 pt-2 md:pt-4">
                  <button
                    className="px-10 md:px-14 py-3.5 md:py-4 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base md:text-lg tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:shadow-[0_8px_32px_hsl(45_85%_55%/0.5)] hover:bg-[hsl(45_85%_62%)] hover:scale-105 active:scale-[0.98] transition-all duration-200 w-fit"
                    onClick={() => navigate("/skapa-konto")}
                  >
                    {t('nav.getStarted')}
                  </button>
                </div>
              </div>
              <div className="hidden md:block flex-shrink-0 ml-6 lg:ml-12 self-end mb-4 relative">
                {/* Talbubbla med roterande personlig hälsning */}
                <ToddySpeechBubble />
                <div className="turtle-still -scale-x-100 turtle-breathe">
                  <TurtleLogo size="hero" animated className="w-44 h-44 lg:w-56 lg:h-56" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <HowItWorksSection />
      <LandingFooter />
    </div>
  );
};

export default Auth;

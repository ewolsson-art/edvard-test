import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TurtleLogo } from "@/components/TurtleLogo";
import { useHaptics } from "@/hooks/useHaptics";

/**
 * Native app landing screen — shown only inside the iOS/Android app shell.
 * World-class app design: generous negative space, hero mascot with ambient glow,
 * one primary CTA (golden), one ghost secondary. Inspired by Duolingo / Linear / Things.
 */
export function NativeAuthLanding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tap } = useHaptics();

  const handlePrimary = () => {
    tap();
    navigate("/skapa-konto");
  };

  const handleSecondary = () => {
    tap();
    navigate("/logga-in");
  };

  return (
    <div className="min-h-screen-safe flex flex-col bg-[hsl(225_30%_5%)] relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 35%, hsl(45 85% 55% / 0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Hero — centered turtle + brand */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pt-safe">
        <div className="animate-scale-in" style={{ animationDuration: "0.6s" }}>
          {/* Soft halo behind logo */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -m-8 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(45 85% 55% / 0.25), transparent 70%)",
              }}
            />
            <TurtleLogo size="hero" animated className="relative w-44 h-44" />
          </div>
        </div>

        <div
          className="mt-10 text-center animate-fade-in"
          style={{ animationDelay: "0.15s", animationFillMode: "both" }}
        >
          <h1 className="text-[2.75rem] font-display font-bold text-white tracking-tight leading-none">
            Toddy
          </h1>
          <p className="mt-3 text-base text-white/60 leading-relaxed max-w-[18rem] mx-auto">
            {t("landing.heroSubtitle")}
          </p>
        </div>
      </div>

      {/* CTA stack — bottom, thumb-zone optimized */}
      <div
        className="relative z-10 px-6 pb-safe animate-fade-in"
        style={{ animationDelay: "0.3s", animationFillMode: "both" }}
      >
        <div className="pb-8 pt-4 space-y-3">
          <button
            onClick={handlePrimary}
            className="w-full h-[56px] rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-[17px] tracking-wide shadow-[0_8px_24px_hsl(45_85%_55%/0.3)] active:scale-[0.97] transition-transform duration-150"
          >
            {t("nav.createAccount")}
          </button>

          <button
            onClick={handleSecondary}
            className="w-full h-[56px] rounded-full bg-white/[0.06] text-white font-semibold text-[17px] border border-white/10 active:scale-[0.97] active:bg-white/[0.10] transition-all duration-150"
          >
            {t("nav.login")}
          </button>

          <p className="text-center text-xs text-white/35 pt-3 px-4 leading-relaxed">
            Genom att fortsätta godkänner du våra villkor och vår integritetspolicy.
          </p>
        </div>
      </div>
    </div>
  );
}

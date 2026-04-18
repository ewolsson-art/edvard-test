import { useEffect, useState } from "react";
import { TurtleLogo } from "@/components/TurtleLogo";
import { NightCityscape } from "@/components/NightCityscape";

interface NativeSplashIntroProps {
  /** Called when the intro has fully faded out and parent should render the next screen. */
  onComplete: () => void;
  /** How long the splash stays fully visible before fading out. Defaults to 2000ms. */
  holdMs?: number;
}

/**
 * Native app splash intro — Headspace/Duolingo-style calm welcome.
 *
 * The mascot breathes in with a soft scale-in + halo, the wordmark fades up,
 * we hold for ~2s, then the whole layer cross-fades out so the auth landing
 * appears underneath. Uses NightCityscape so the transition into the marketing
 * background feels seamless.
 */
export function NativeSplashIntro({ onComplete, holdMs = 2000 }: NativeSplashIntroProps) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => setPhase("out"), holdMs);
    // 700ms matches the fade-out duration below
    const completeTimer = setTimeout(() => onComplete(), holdMs + 700);
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [holdMs, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        opacity: phase === "out" ? 0 : 1,
        transition: "opacity 700ms ease-in-out",
        pointerEvents: phase === "out" ? "none" : "auto",
      }}
      aria-hidden={phase === "out"}
    >
      {/* Same cityscape as the website hero — seamless handoff to NativeAuthLanding */}
      <NightCityscape />

      {/* Soft golden halo behind the mascot */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 45%, hsl(45 85% 55% / 0.22), transparent 70%)",
        }}
      />

      {/* Mascot — breathing scale-in */}
      <div
        className="relative z-10 animate-scale-in"
        style={{ animationDuration: "1.2s", animationTimingFunction: "ease-out" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 -m-12 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(45 85% 55% / 0.3), transparent 70%)",
          }}
        />
        <TurtleLogo size="hero" animated className="relative w-56 h-56 md:w-64 md:h-64" />
      </div>

      {/* Wordmark — fades up after the turtle settles */}
      <div
        className="relative z-10 mt-10 text-center px-8 animate-fade-in"
        style={{
          animationDelay: "0.6s",
          animationDuration: "0.9s",
          animationFillMode: "both",
        }}
      >
        <p className="text-base text-white/70 font-light tracking-wide">
          Välkommen till
        </p>
        <h1 className="mt-2 text-5xl font-display font-bold text-white tracking-tight leading-none drop-shadow-[0_2px_24px_hsl(45_85%_55%/0.25)]">
          Toddy
        </h1>
      </div>
    </div>
  );
}

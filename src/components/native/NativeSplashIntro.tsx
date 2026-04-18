import { useEffect, useState } from "react";
import { TurtleLogo } from "@/components/TurtleLogo";

interface NativeSplashIntroProps {
  /** Called when the intro has fully faded out and parent should render the next screen. */
  onComplete: () => void;
  /** How long the splash stays fully visible before fading out. Defaults to 3800ms. */
  holdMs?: number;
}

/**
 * Native app splash intro — Headspace/Apple-grade calm welcome.
 *
 * Choreography (total ~5s):
 *   0.0s  Deep black with subtle radial vignette fades in
 *   0.4s  Golden halo blooms behind center
 *   0.8s  Turtle scales in with breath, perfectly centered
 *   1.6s  "Välkommen till" fades up
 *   2.1s  "Toddy" wordmark scales + fades in with glow
 *   2.8s  Slogan fades up underneath
 *   3.8s  Whole layer cross-fades out (900ms)
 */
export function NativeSplashIntro({ onComplete, holdMs = 3800 }: NativeSplashIntroProps) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    console.log("[SPLASH_V3] mounted, will hold for", holdMs, "ms");
    const fadeOutTimer = setTimeout(() => {
      console.log("[SPLASH_V3] starting fade-out");
      setPhase("out");
    }, holdMs);
    const completeTimer = setTimeout(() => {
      console.log("[SPLASH_V3] complete");
      onComplete();
    }, holdMs + 900);
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [holdMs, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        opacity: phase === "out" ? 0 : 1,
        transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: phase === "out" ? "none" : "auto",
        backgroundColor: "#050505",
      }}
      aria-hidden={phase === "out"}
    >
      {/* Deep black canvas with subtle layered vignettes for depth */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 50%, hsl(45 60% 12% / 0.55), transparent 70%), radial-gradient(ellipse 120% 80% at 50% 50%, #0a0805 0%, #030303 60%, #000 100%)",
        }}
      />

      {/* Soft golden halo behind the mascot — slow bloom */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none animate-fade-in"
        style={{
          animationDelay: "0.4s",
          animationDuration: "2s",
          animationFillMode: "both",
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, hsl(45 90% 55% / 0.18), hsl(45 80% 45% / 0.08) 40%, transparent 70%)",
        }}
      />

      {/* Centered stack — turtle + text grouped, perfectly centered */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8">
        {/* Mascot — breathing scale-in, perfectly centered */}
        <div
          className="relative animate-scale-in"
          style={{
            animationDelay: "0.8s",
            animationDuration: "1.4s",
            animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            animationFillMode: "both",
          }}
        >
          {/* Inner glow tight to the turtle */}
          <div
            aria-hidden
            className="absolute inset-0 -m-16 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(45 90% 55% / 0.28), hsl(45 80% 45% / 0.1) 40%, transparent 70%)",
            }}
          />
          <TurtleLogo
            size="hero"
            animated
            className="relative w-52 h-52 md:w-60 md:h-60 drop-shadow-[0_8px_40px_hsl(45_90%_55%/0.3)]"
          />
        </div>

        {/* "Välkommen till" — small, refined */}
        <p
          className="mt-12 text-sm font-light tracking-[0.3em] uppercase animate-fade-in"
          style={{
            color: "hsl(45 30% 75% / 0.7)",
            animationDelay: "1.6s",
            animationDuration: "1s",
            animationFillMode: "both",
          }}
        >
          Välkommen till
        </p>

        {/* "Toddy" wordmark — hero, with golden glow */}
        <h1
          className="mt-3 text-6xl md:text-7xl font-display font-bold tracking-tight leading-none animate-scale-in"
          style={{
            color: "#fff",
            textShadow:
              "0 2px 32px hsl(45 90% 55% / 0.35), 0 0 60px hsl(45 80% 50% / 0.15)",
            animationDelay: "2.1s",
            animationDuration: "1.2s",
            animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            animationFillMode: "both",
          }}
        >
          Toddy
        </h1>

        {/* Tagline */}
        <p
          className="mt-5 text-base font-light tracking-wide text-center max-w-xs animate-fade-in"
          style={{
            color: "hsl(45 25% 82% / 0.85)",
            animationDelay: "2.8s",
            animationDuration: "1.1s",
            animationFillMode: "both",
          }}
        >
          Din egna stämningsdagbok
        </p>

        {/* Bullet list — fades in last, staggered */}
        <ul className="mt-8 space-y-3 text-left">
          {[
            { text: "Få bättre koll på ditt mående", delay: "3.4s" },
            { text: "AI-drivna hjälpmedel", delay: "3.8s" },
          ].map((item) => (
            <li
              key={item.text}
              className="flex items-center gap-3 animate-fade-in"
              style={{
                animationDelay: item.delay,
                animationDuration: "0.9s",
                animationFillMode: "both",
              }}
            >
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: "hsl(45 90% 60%)",
                  boxShadow: "0 0 12px hsl(45 90% 55% / 0.7)",
                }}
              />
              <span
                className="text-sm font-light tracking-wide"
                style={{ color: "hsl(45 20% 88% / 0.9)" }}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Subtle bottom vignette for depth */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
        }}
      />
    </div>
  );
}

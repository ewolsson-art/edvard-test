import { useEffect, useState } from "react";
import { TurtleLogo } from "@/components/TurtleLogo";
import {
  DEMO_TRANSITION_COMPLETE_EVENT,
  DEMO_TRANSITION_START_EVENT,
  type DemoTransitionState,
} from "@/lib/demoTransition";

export function DemoTransitionOverlay() {
  const [state, setState] = useState<DemoTransitionState | null>(null);

  useEffect(() => {
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent<DemoTransitionState>).detail;
      setState(detail);
    };
    const onComplete = () => {
      setState((current) => {
        if (!current) return null;
        const remaining = Math.max(0, current.minDurationMs - (Date.now() - current.startedAt));
        window.setTimeout(() => setState(null), remaining + 250);
        return current;
      });
    };
    window.addEventListener(DEMO_TRANSITION_START_EVENT, onStart);
    window.addEventListener(DEMO_TRANSITION_COMPLETE_EVENT, onComplete);
    return () => {
      window.removeEventListener(DEMO_TRANSITION_START_EVENT, onStart);
      window.removeEventListener(DEMO_TRANSITION_COMPLETE_EVENT, onComplete);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    if (!state.autoHide) return;
    const remaining = Math.max(0, state.minDurationMs - (Date.now() - state.startedAt));
    const t = setTimeout(() => setState(null), remaining);
    return () => clearTimeout(t);
  }, [state]);

  if (!state) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[hsl(230_30%_5%)] animate-fade-in px-6 overflow-hidden">
      {/* Subtle drifting aurora glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 45%, hsl(45 85% 55% / 0.18), transparent 70%)",
          animation: "demo-aurora 9s ease-in-out infinite",
        }}
      />
      {/* Faint star/dot field */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Slow rising sparks */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {[
          { left: "18%", delay: "0s",   dur: "11s", size: 3 },
          { left: "32%", delay: "3s",   dur: "13s", size: 2 },
          { left: "55%", delay: "1.5s", dur: "10s", size: 2 },
          { left: "72%", delay: "5s",   dur: "14s", size: 3 },
          { left: "86%", delay: "2.2s", dur: "12s", size: 2 },
        ].map((s, i) => (
          <span
            key={i}
            className="absolute bottom-[-10px] rounded-full bg-[hsl(45_85%_70%)]"
            style={{
              left: s.left,
              width: s.size,
              height: s.size,
              animation: `demo-spark ${s.dur} linear ${s.delay} infinite`,
              boxShadow: "0 0 8px hsl(45 85% 60% / 0.6)",
            }}
          />
        ))}
      </div>

      <div className="relative">
        {/* Pulsing halo behind turtle */}
        <div
          aria-hidden
          className="absolute inset-0 -m-10 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, hsl(45 85% 55% / 0.35), transparent 70%)",
            animation: "demo-halo 3.2s ease-in-out infinite",
          }}
        />
        <div
          className="relative animate-scale-in"
          style={{ animation: "demo-float 4.5s ease-in-out infinite" }}
        >
          <TurtleLogo
            size="hero"
            animated
            className="w-44 h-44 md:w-56 md:h-56 drop-shadow-[0_12px_48px_hsl(45_85%_55%/0.4)]"
          />
        </div>
      </div>
      <p className="relative mt-8 text-xl md:text-2xl font-semibold text-white tracking-tight text-center font-display">
        {state.role === "login" ? "Loggar in" : "Sätter upp ditt demokonto"}
      </p>
      <p className="relative mt-3 text-sm md:text-base text-white/55 max-w-sm text-center leading-relaxed">
        {state.role === "login"
          ? "Toddy gör i ordning din översikt."
          : "Toddy förbereder ett tillfälligt demokonto åt dig."}
      </p>
      <div className="relative mt-8 w-56 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-[hsl(45_85%_55%)] rounded-full animate-[demo-progress_3.5s_ease-out_forwards]"
          style={{ width: "0%" }}
        />
      </div>
      <div className="relative mt-5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[hsl(45_85%_55%)] animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-[hsl(45_85%_55%)] animate-pulse" style={{ animationDelay: "200ms" }} />
        <span className="w-2 h-2 rounded-full bg-[hsl(45_85%_55%)] animate-pulse" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}

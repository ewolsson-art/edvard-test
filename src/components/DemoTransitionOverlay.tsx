import { useEffect, useState } from "react";
import { TurtleLogo } from "@/components/TurtleLogo";

type DemoRole = "setup" | "patient" | "relative" | "doctor";

interface State {
  role: DemoRole;
  startedAt: number;
  minDurationMs: number;
  autoHide: boolean;
}

const DURATION_MS = 3500;
const START_EVENT = "toddy:demo-transition:start";
const COMPLETE_EVENT = "toddy:demo-transition:complete";

/**
 * Show the playful turtle loader from the moment the user picks a demo role
 * until the destination page is mounted. Lives at App level so it survives the
 * route change that ProtectedRoute triggers when the role flips — otherwise
 * the overlay would die together with the Onboarding component.
 */
export function startDemoTransition(
  role: DemoRole,
  options: { minDurationMs?: number; autoHide?: boolean } = {}
) {
  const detail: State = {
    role,
    startedAt: Date.now(),
    minDurationMs: options.minDurationMs ?? DURATION_MS,
    autoHide: options.autoHide ?? true,
  };
  window.dispatchEvent(new CustomEvent<State>(START_EVENT, { detail }));
}

export function completeDemoTransition() {
  window.dispatchEvent(new Event(COMPLETE_EVENT));
}

export function DemoTransitionOverlay() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent<State>).detail;
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
    window.addEventListener(START_EVENT, onStart);
    window.addEventListener(COMPLETE_EVENT, onComplete);
    return () => {
      window.removeEventListener(START_EVENT, onStart);
      window.removeEventListener(COMPLETE_EVENT, onComplete);
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[hsl(230_30%_5%)]/95 backdrop-blur-xl animate-fade-in px-6">
      <div className="animate-scale-in">
        <TurtleLogo
          size="hero"
          animated
          className="w-44 h-44 md:w-56 md:h-56 drop-shadow-[0_12px_48px_hsl(45_85%_55%/0.4)]"
        />
      </div>
      <p className="mt-8 text-xl md:text-2xl font-semibold text-white tracking-tight text-center font-display">
        {state.role === "doctor" && "Förbereder läkarvyn"}
        {state.role === "relative" && "Kopplar dig till personerna du följer"}
        {state.role === "patient" && "Hämtar ditt mående"}
      </p>
      <p className="mt-3 text-sm md:text-base text-white/55 max-w-sm text-center leading-relaxed">
        {state.role === "doctor" && "Vi laddar in dina demo-användare och deras senaste mående."}
        {state.role === "relative" && "Vi sätter upp tre fejk-användare som du följer som anhörig."}
        {state.role === "patient" && "Vi laddar in 90 dagars demo-historik åt dig."}
      </p>
      <div className="mt-8 w-56 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-[hsl(45_85%_55%)] rounded-full animate-[demo-progress_3.5s_ease-out_forwards]"
          style={{ width: "0%" }}
        />
      </div>
      <div className="mt-5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[hsl(45_85%_55%)] animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-[hsl(45_85%_55%)] animate-pulse" style={{ animationDelay: "200ms" }} />
        <span className="w-2 h-2 rounded-full bg-[hsl(45_85%_55%)] animate-pulse" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}

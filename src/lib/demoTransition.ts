export type DemoTransitionRole = "setup" | "patient" | "relative" | "doctor" | "login";

export interface DemoTransitionState {
  role: DemoTransitionRole;
  startedAt: number;
  minDurationMs: number;
  autoHide: boolean;
}

export const DEMO_TRANSITION_DURATION_MS = 3500;
export const DEMO_TRANSITION_START_EVENT = "toddy:demo-transition:start";
export const DEMO_TRANSITION_COMPLETE_EVENT = "toddy:demo-transition:complete";

export function startDemoTransition(
  role: DemoTransitionRole,
  options: { minDurationMs?: number; autoHide?: boolean } = {}
) {
  const detail: DemoTransitionState = {
    role,
    startedAt: Date.now(),
    minDurationMs: options.minDurationMs ?? DEMO_TRANSITION_DURATION_MS,
    autoHide: options.autoHide ?? true,
  };
  window.dispatchEvent(new CustomEvent<DemoTransitionState>(DEMO_TRANSITION_START_EVENT, { detail }));
}

export function completeDemoTransition() {
  window.dispatchEvent(new Event(DEMO_TRANSITION_COMPLETE_EVENT));
}
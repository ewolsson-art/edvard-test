import { useEffect, useState } from "react";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { NativeSplashIntro } from "@/components/native/NativeSplashIntro";

const SESSION_KEY = "toddy_splash_shown_v2";

/**
 * Decides whether the splash should play.
 *
 * Cold-start signal:
 *   sessionStorage is per-tab/per-app-process. It survives HMR (so the
 *   splash doesn't replay on every code edit during dev), but is wiped
 *   when the iOS app is force-quit + reopened — which is exactly the
 *   "cold start" definition we want.
 *
 * Eligibility:
 *   - Native shell (Capacitor) → always
 *   - Web preview with ?splash=1 in URL → for testing without iPhone
 */
function shouldPlaySplash(isNative: boolean): boolean {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(SESSION_KEY) === "1") return false;

  if (isNative) return true;

  // Allow forcing splash in web preview for visual verification
  const params = new URLSearchParams(window.location.search);
  if (params.get("splash") === "1") return true;

  return false;
}

/**
 * App-root wrapper that shows the native splash intro ONCE per cold start,
 * before mounting the rest of the app. Visible regardless of auth state
 * or current route — this is the very first thing the user sees.
 */
export function NativeAppGate({ children }: { children: React.ReactNode }) {
  const { isNative } = useNativePlatform();
  const [splashDone, setSplashDone] = useState(() => !shouldPlaySplash(isNative));

  useEffect(() => {
    console.log(
      "[SPLASH_V3] gate mounted. isNative=",
      isNative,
      "splashDone=",
      splashDone,
      "sessionFlag=",
      typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : "n/a"
    );
  }, [isNative, splashDone]);

  // If isNative becomes true after first render (Capacitor bridge ready late),
  // re-evaluate eligibility once.
  useEffect(() => {
    if (splashDone && shouldPlaySplash(isNative)) {
      console.log("[SPLASH_V3] late native detection — replaying splash");
      setSplashDone(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative]);

  return (
    <>
      {children}
      {!splashDone && (
        <NativeSplashIntro
          onComplete={() => {
            try {
              sessionStorage.setItem(SESSION_KEY, "1");
            } catch {
              /* ignore quota / private mode */
            }
            setSplashDone(true);
          }}
        />
      )}
    </>
  );
}

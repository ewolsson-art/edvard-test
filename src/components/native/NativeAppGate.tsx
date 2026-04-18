import { useEffect, useState } from "react";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { NativeSplashIntro } from "@/components/native/NativeSplashIntro";

// Module-level flag: ensures splash only shows on cold app-start,
// not on every React remount/HMR.
let splashAlreadyShown = false;

/**
 * App-root wrapper that shows the native splash intro ONCE per cold start,
 * before mounting the rest of the app. Visible regardless of auth state
 * or current route — this is the very first thing the user sees.
 */
export function NativeAppGate({ children }: { children: React.ReactNode }) {
  const { isNative } = useNativePlatform();
  const shouldShow = isNative && !splashAlreadyShown;
  const [splashDone, setSplashDone] = useState(!shouldShow);

  useEffect(() => {
    console.log("[SPLASH_V2] gate mounted. isNative=", isNative, "shouldShow=", shouldShow);
  }, [isNative, shouldShow]);

  return (
    <>
      {children}
      {!splashDone && (
        <NativeSplashIntro
          onComplete={() => {
            splashAlreadyShown = true;
            setSplashDone(true);
          }}
        />
      )}
    </>
  );
}

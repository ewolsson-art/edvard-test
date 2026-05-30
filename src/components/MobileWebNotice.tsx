import { useEffect, useState } from "react";
import { Apple, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useNativePlatform } from "@/hooks/useNativePlatform";

const STORAGE_KEY = "toddy_mobile_web_notice_dismissed_v2";

/**
 * Shown only to users visiting the web version on a phone-sized screen
 * (not inside the native Capacitor app). Promotes the native app download
 * and links to /ladda-ner. Dismissible per browser, and hidden on the
 * download page itself to avoid recursion.
 */
export function MobileWebNotice() {
  const { isNative } = useNativePlatform();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isNative) return;
    if (typeof window === "undefined") return;

    const check = () => {
      const dismissed = sessionStorage.getItem(STORAGE_KEY) === "1";
      const isPhone = window.matchMedia("(max-width: 767px)").matches;
      setOpen(!dismissed && isPhone);
    };

    check();
    const mql = window.matchMedia("(max-width: 767px)");
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, [isNative]);

  // Don't show on the download page itself or on auth callbacks / shared reports
  const suppressedRoutes = ["/ladda-ner", "/auth/callback", "/rapport", "/unsubscribe"];
  const isSuppressed = suppressedRoutes.some((r) => pathname.startsWith(r));

  if (isNative || !open || isSuppressed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-web-notice-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-6 animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[hsl(225_30%_10%)] ring-1 ring-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] p-7 text-center">
        <button
          onClick={dismiss}
          aria-label="Stäng"
          className="absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-[hsl(45_85%_55%/0.12)] flex items-center justify-center shadow-[0_8px_30px_-8px_hsl(45_85%_55%/0.4)]">
          <Apple className="h-8 w-8 text-[hsl(45_85%_55%)]" fill="currentColor" />
        </div>

        <h2
          id="mobile-web-notice-title"
          className="text-2xl font-display font-bold text-white mb-3"
        >
          Toddy finns som app
        </h2>
        <p className="text-base text-white/70 leading-relaxed mb-6">
          Du får en mycket bättre upplevelse i vår iPhone-app. Ladda ner den
          gratis i App Store — det tar bara några sekunder.
        </p>

        <Link
          to="/ladda-ner"
          onClick={dismiss}
          className="w-full inline-block py-3.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-base tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:bg-[hsl(45_85%_62%)] active:scale-[0.98] transition-all mb-3"
        >
          Ladda ner appen
        </Link>

        <button
          onClick={dismiss}
          className="w-full py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          Fortsätt i webbläsaren
        </button>
      </div>
    </div>
  );
}

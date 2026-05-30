import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNativePlatform } from "@/hooks/useNativePlatform";

/**
 * På mobil-webben är Toddy inte tänkt att användas — appen är hemmet.
 * Den här komponenten redirectar alla mobila webbesökare till /ladda-ner
 * (utom på ett fåtal tillåtna rutter som delade rapporter och auth-callbacks).
 * Inloggning/registrering är därmed inte tillgängligt via mobil webb.
 */
const ALLOWED_MOBILE_ROUTES = [
  "/ladda-ner",
  "/auth/callback",
  "/rapport",
  "/unsubscribe",
  "/integritet",
  "/villkor",
];

export function MobileWebNotice() {
  const { isNative } = useNativePlatform();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isNative) return;
    if (typeof window === "undefined") return;

    const isAllowed = ALLOWED_MOBILE_ROUTES.some((r) => pathname.startsWith(r));
    if (isAllowed) return;

    const check = () => {
      const isPhone = window.matchMedia("(max-width: 767px)").matches;
      if (isPhone) {
        navigate("/ladda-ner", { replace: true });
      }
    };

    check();
    const mql = window.matchMedia("(max-width: 767px)");
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, [isNative, pathname, navigate]);

  return null;
}

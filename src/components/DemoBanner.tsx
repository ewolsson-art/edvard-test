import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isDemoUser } from "@/lib/demoMode";

/**
 * Floating CTA-pill för demo-användare. Sitter nere till höger på desktop
 * och precis ovanför bottom tab bar på mobil.
 */
export const DemoBanner = () => {
  const { user } = useAuth();
  if (!isDemoUser(user)) return null;

  return (
    <Link
      to="/signup"
      aria-label="Skapa eget konto"
      className="fixed z-40 right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] md:bottom-6 inline-flex items-center gap-2 h-12 px-5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] text-sm font-semibold hover:bg-[hsl(45_85%_65%)] active:scale-[0.97] transition-all shadow-[0_8px_28px_-6px_hsl(45_85%_55%/0.55)] ring-1 ring-[hsl(45_85%_55%/0.3)]"
    >
      Skapa eget konto
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
};

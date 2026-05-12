import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isDemoUser } from "@/lib/demoMode";

/**
 * Persistent banner som syns i hela appen för demo-användare.
 * Tydlig CTA som leder till riktig signup. Datan i demo sparas inte.
 */
export const DemoBanner = () => {
  const { user } = useAuth();
  if (!isDemoUser(user)) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-[hsl(45_85%_55%/0.08)] backdrop-blur-md border-b border-[hsl(45_85%_55%/0.2)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(45_85%_55%/0.15)] shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[hsl(45_85%_55%)]" />
          </span>
          <p className="text-[13px] sm:text-sm text-white/80 truncate">
            <span className="font-semibold text-white">Demoläge</span>
            <span className="text-white/50"> · datan är påhittad och sparas inte</span>
          </p>
        </div>
        <Link
          to="/signup"
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] text-[13px] sm:text-sm font-semibold hover:bg-[hsl(45_85%_65%)] active:scale-[0.97] transition-all shadow-[0_2px_12px_-2px_hsl(45_85%_55%/0.5)]"
        >
          Skapa konto
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useDiagnoses } from "@/hooks/useDiagnoses";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslation } from "react-i18next";

const DISMISS_KEY = "diagnosis_prompt_dismissed_at";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Soft, dismissable banner shown on Home for patients who haven't added a diagnosis yet.
 * The diagnosis step was intentionally moved out of onboarding to reduce friction —
 * this nudges users to enrich their profile once they're already in the app.
 */
export function DiagnosisPromptBanner() {
  const { t } = useTranslation();
  const { diagnoses, isLoading } = useDiagnoses();
  const { isDoctor, isRelative, isLoading: roleLoading } = useUserRole();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < COOLDOWN_MS;
  });

  if (isLoading || roleLoading) return null;
  if (isDoctor || isRelative) return null;
  if (diagnoses.length > 0) return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div className="px-5 pt-3">
      <div className="relative flex items-center gap-3 rounded-2xl bg-[hsl(45_85%_55%/0.08)] ring-1 ring-[hsl(45_85%_55%/0.2)] px-4 py-3 animate-fade-in">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[hsl(45_85%_55%/0.15)] flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-[hsl(45_85%_55%)]" />
        </div>
        <Link to="/diagnoser" className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight">
            {t("home.diagnosisPromptTitle")}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {t("home.diagnosisPromptDesc")}
          </p>
        </Link>
        <button
          onClick={handleDismiss}
          aria-label={t("common.dismiss")}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

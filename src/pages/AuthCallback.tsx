import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const splitDisplayName = (name?: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || null,
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
};

const ensureGoogleAccountCanEnterApp = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const { first_name, last_name } = splitDisplayName(fullName);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      first_name,
      last_name,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    });
  }

  await supabase.rpc("assign_initial_role", { _role: "patient" });

  const { data: existingPreferences } = await supabase
    .from("user_preferences")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingPreferences) {
    await supabase
    .from("user_preferences")
    .insert({
      user_id: user.id,
      include_mood: true,
      include_sleep: false,
      include_eating: false,
      include_exercise: false,
      include_medication: false,
      quick_include_sleep: false,
      quick_include_eating: false,
      quick_include_exercise: false,
      quick_include_medication: false,
      onboarding_completed: true,
    });
  }

  if (!user.user_metadata?.profile_completed) {
    await supabase.auth.updateUser({ data: { profile_completed: true } });
  }
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const completeSignIn = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");
      // Validate `next` to prevent open redirect: only allow same-origin paths starting with "/"
      // (and not "//" which browsers treat as a protocol-relative URL).
      const rawNext = searchParams.get("next") || "/oversikt";
      const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/oversikt";

      if (errorCode === "otp_expired" || errorDescription) {
        const msg = errorCode === "otp_expired"
          ? "Bekräftelselänken har gått ut eller redan använts. Begär en ny inloggningslänk."
          : errorDescription || "Inloggningen misslyckades.";
        navigate(`/logga-in?error=${encodeURIComponent(msg)}`, { replace: true });
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) throw error;
      } else if (searchParams.get("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(searchParams.get("code")!);
        if (error) throw error;
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Only auto-complete profile for OAuth flows (Google/Apple) where the
          // user already has a display name. For email magic-link signups
          // (next=/slutfor-profil), let CompleteProfile collect name + password.
          if (next !== "/slutfor-profil") {
            await ensureGoogleAccountCanEnterApp();
          }
          window.history.replaceState({}, document.title, "/auth/callback");
          navigate(next, { replace: true });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      navigate("/logga-in?error=session_missing", { replace: true });
    };

    completeSignIn().catch(() => {
      navigate("/logga-in?error=callback_failed", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallback;
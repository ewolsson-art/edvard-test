import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");

      if (errorDescription) {
        navigate(`/logga-in?error=${encodeURIComponent(errorDescription)}`, { replace: true });
        return;
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else if (searchParams.get("code")) {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.history.replaceState({}, document.title, "/auth/callback");
          navigate("/oversikt", { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallback;
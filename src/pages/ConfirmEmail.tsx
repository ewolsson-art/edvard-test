import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DarkNightBackground } from "@/components/DarkNightBackground";
import { Logo } from "@/components/Logo";

type EmailOtpType =
  | "signup"
  | "magiclink"
  | "recovery"
  | "invite"
  | "email_change"
  | "email";

const ALLOWED_TYPES: EmailOtpType[] = [
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
  "email",
];

const ConfirmEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tokenHash = params.get("token_hash") || params.get("token");
  const typeParam = (params.get("type") || "signup") as EmailOtpType;
  const next = params.get("next") || "/slutfor-profil";

  useEffect(() => {
    if (!tokenHash) {
      navigate(
        `/logga-in?error=${encodeURIComponent(
          "Länken saknar verifieringskod. Begär en ny inloggningslänk."
        )}`,
        { replace: true }
      );
      return;
    }

    let cancelled = false;
    const run = async () => {
      setStatus("verifying");
      const type = ALLOWED_TYPES.includes(typeParam) ? typeParam : "signup";
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (cancelled) return;

      if (error) {
        const friendly =
          error.message?.toLowerCase().includes("expired") ||
          error.message?.toLowerCase().includes("invalid")
            ? "Bekräftelselänken har gått ut eller redan använts. Begär en ny inloggningslänk."
            : error.message || "Något gick fel. Försök igen.";
        setStatus("error");
        setErrorMsg(friendly);
        return;
      }

      let session = data.session;
      if (!session) {
        for (let i = 0; i < 20; i++) {
          const { data: s } = await supabase.auth.getSession();
          if (s.session) { session = s.session; break; }
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      const target = type === "recovery" ? "/aterstall-losenord" : next;
      navigate(target, { replace: true });
    };

    run();
    return () => { cancelled = true; };
  }, [tokenHash, typeParam, next, navigate]);

  return (
    <DarkNightBackground>
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[hsl(45_85%_55%)]/10 mb-4">
            {status === "error" ? (
              <MailCheck className="w-6 h-6 text-[hsl(45_85%_55%)]" />
            ) : (
              <Loader2 className="w-6 h-6 text-[hsl(45_85%_55%)] animate-spin" />
            )}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
            {status === "error" ? "Något gick fel" : "Bekräftar din e-post…"}
          </h1>
          <p className="text-sm text-white/60 mb-8">
            {status === "error"
              ? "Vi kunde inte slutföra bekräftelsen."
              : "Ett ögonblick, du loggas in automatiskt."}
          </p>

          {status === "error" && errorMsg && (
            <div className="mt-2 p-4 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-left">
              <p className="text-sm text-white/80">{errorMsg}</p>
              <button
                onClick={() => navigate("/logga-in")}
                className="mt-3 text-sm text-[hsl(45_85%_55%)] hover:text-[hsl(45_85%_65%)] font-medium"
              >
                Gå till inloggning →
              </button>
            </div>
          )}
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default ConfirmEmail;

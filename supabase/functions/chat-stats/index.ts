// Edge function: chat-stats
// Streaming AI chat that has access to the authenticated user's mood/medication/diagnosis data.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MOOD_LABELS: Record<string, string> = {
  severe_elevated: "Mycket upp (svår mani)",
  elevated: "Upp (mani/hypomani)",
  somewhat_elevated: "Lite upp",
  stable: "Stabilt / normalt",
  somewhat_depressed: "Lite ner",
  depressed: "Ner (deprimerad)",
  severe_depressed: "Mycket ner (svår depression)",
};

function buildContext(args: {
  firstName: string | null;
  todayStr: string;
  moodEntries: any[];
  medications: any[];
  diagnoses: any[];
}): string {
  const { firstName, todayStr, moodEntries, medications, diagnoses } = args;

  // Most recent first; cap at 180 days for token budget.
  const sortedEntries = [...moodEntries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 180);

  const compactEntries = sortedEntries.map((e) => {
    const parts: string[] = [`${e.date}: ${MOOD_LABELS[e.mood] ?? e.mood}`];
    if (e.energy_level) parts.push(`energi=${e.energy_level}`);
    if (e.sleep_quality) parts.push(`sömn=${e.sleep_quality}`);
    if (e.eating_quality) parts.push(`ätande=${e.eating_quality}`);
    if (e.exercised !== null && e.exercised !== undefined) {
      parts.push(`tränat=${e.exercised ? "ja" : "nej"}`);
    }
    if (Array.isArray(e.tags) && e.tags.length > 0) parts.push(`taggar=[${e.tags.join(",")}]`);
    if (e.comment) parts.push(`kommentar="${String(e.comment).replace(/\n/g, " ").slice(0, 140)}"`);
    return parts.join(", ");
  });

  const medsActive = medications.filter((m) => (m.status ?? "current") !== "previous");
  const medsPrev = medications.filter((m) => m.status === "previous");

  const fmtMed = (m: any) => {
    const parts: string[] = [`${m.name} (${m.dosage})`];
    if (m.indication) parts.push(`mot ${m.indication}`);
    if (m.started_at) parts.push(`startad ${m.started_at}`);
    if (m.stopped_at) parts.push(`avslutad ${m.stopped_at}`);
    if (m.effectiveness) parts.push(`effekt=${m.effectiveness}`);
    if (Array.isArray(m.side_effects) && m.side_effects.length > 0) {
      parts.push(`biverkningar=[${m.side_effects.join(",")}]`);
    }
    if (m.stop_reason) parts.push(`avslutsorsak="${m.stop_reason}"`);
    return parts.join(", ");
  };

  const diagLines = diagnoses.map(
    (d) => `- ${d.name}${d.diagnosed_at ? ` (sedan ${d.diagnosed_at})` : ""}`,
  );

  const lines: string[] = [];
  lines.push(`Dagens datum: ${todayStr}`);
  if (firstName) lines.push(`Användarens förnamn: ${firstName}`);

  lines.push("");
  lines.push("=== DIAGNOSER ===");
  lines.push(diagLines.length ? diagLines.join("\n") : "(inga registrerade)");

  lines.push("");
  lines.push("=== AKTUELLA MEDICINER ===");
  lines.push(medsActive.length ? medsActive.map((m) => `- ${fmtMed(m)}`).join("\n") : "(inga)");

  if (medsPrev.length > 0) {
    lines.push("");
    lines.push("=== TIDIGARE TESTADE MEDICINER ===");
    lines.push(medsPrev.map((m) => `- ${fmtMed(m)}`).join("\n"));
  }

  lines.push("");
  lines.push(`=== INCHECKNINGAR (senaste ${compactEntries.length} dagar, nyast först) ===`);
  lines.push(compactEntries.length ? compactEntries.join("\n") : "(inga incheckningar)");

  return lines.join("\n");
}

const SYSTEM_PROMPT = (context: string) => `Du är "Toddy", en empatisk AI-assistent som hjälper en person med bipolär sjukdom att förstå sin egen mående-statistik.

REGLER:
- Du har **endast** tillgång till data nedan. Hitta inte på siffror, datum eller mediciner som inte finns där.
- Svara på svenska, varmt och kortfattat. Använd markdown (rubriker, listor, **fetstil**) för tydlighet.
- När användaren frågar "hur länge sen var jag X?" — räkna noggrant från dagens datum mot incheckningarna och svara med konkret antal dagar och datum.
- Om data saknas: säg det rakt ut och föreslå att checka in mer.
- Du är **inte** läkare. Vid akut psykisk ohälsa (självmordstankar, mani med riskbeteende): hänvisa till 1177, 112 eller psykiatrisk akutmottagning.
- Stigmatisera aldrig. Var stödjande men ärlig kring mönster du ser.
- Om användaren bara vill prata: lyssna och bekräfta känslan innan du går in på data.

ANVÄNDARENS DATA:
${context}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => null) as { messages?: ChatMessage[] } | null;
    const messages = Array.isArray(body?.messages) ? body!.messages : [];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Cap conversation length & message size
    const safeMessages = messages
      .slice(-30)
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    // Fetch user data (using service role; we trust userId verified above)
    const [moodRes, medsRes, diagRes, profRes] = await Promise.all([
      admin.from("mood_entries").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(400),
      admin.from("medications").select("*").eq("user_id", userId),
      admin.from("diagnoses").select("*").eq("user_id", userId),
      admin.from("profiles").select("first_name").eq("user_id", userId).maybeSingle(),
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const context = buildContext({
      firstName: profRes.data?.first_name ?? null,
      todayStr,
      moodEntries: moodRes.data ?? [],
      medications: medsRes.data ?? [],
      diagnoses: diagRes.data ?? [],
    });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT(context) },
          ...safeMessages,
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många frågor just nu, försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-krediter slut. Lägg till krediter i Lovable Cloud." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI-fel" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-stats error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Edge function: analyze-patterns
// Analyserar all historisk data (mood_entries, medication_logs, characteristics, sleep, eating)
// och upptäcker personliga mönster, övergångar, triggers, cykler m.m. via Lovable AI.
// Sparar resultat i pattern_insights-tabellen.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MOOD_LABELS: Record<string, string> = {
  severe_elevated: "kraftigt uppvarvad",
  elevated: "uppvarvad",
  somewhat_elevated: "lite uppvarvad",
  stable: "stabil",
  somewhat_depressed: "lite nedstämd",
  depressed: "nedstämd",
  severe_depressed: "kraftigt nedstämd",
};

const SLEEP_LABELS: Record<string, string> = {
  very_little: "mycket lite sömn",
  little: "lite sömn",
  normal: "normal sömn",
  much: "mycket sömn",
  very_much: "väldigt mycket sömn",
};

const EATING_LABELS: Record<string, string> = {
  very_little: "åt mycket lite",
  little: "åt lite",
  normal: "åt normalt",
  good: "åt bra",
  very_good: "åt mycket",
};

const MIN_ENTRIES_FOR_ANALYSIS = 14;
// Cache: kör om analysen max 1×/dygn
const RERUN_COOLDOWN_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return json({ error: "AI service not configured" }, 500);
    }

    // Auth: hämta inloggad user via inkommande JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUser = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // Parse body (force flag tillåter att ignorera cooldown)
    let force = false;
    try {
      const body = await req.json();
      force = !!body?.force;
    } catch {
      // no body is fine
    }

    // Service-role klient för all data-access
    const sb = createClient(supabaseUrl, serviceKey);

    // Cooldown-check
    if (!force) {
      const { data: lastRun } = await sb
        .from("pattern_analysis_runs")
        .select("last_run_at, status")
        .eq("user_id", userId)
        .maybeSingle();

      if (lastRun?.last_run_at && lastRun.status === "success") {
        const ageHours =
          (Date.now() - new Date(lastRun.last_run_at).getTime()) / 3_600_000;
        if (ageHours < RERUN_COOLDOWN_HOURS) {
          return json({ status: "cached", ageHours: Math.round(ageHours) });
        }
      }
    }

    // Hämta hela historiken
    const [moodRes, medRes, medLogRes, charRes, diagRes] = await Promise.all([
      sb
        .from("mood_entries")
        .select(
          "date, mood, energy_level, sleep_quality, eating_quality, exercised, comment, tags, medication_side_effects",
        )
        .eq("user_id", userId)
        .order("date", { ascending: true }),
      sb
        .from("medications")
        .select("id, name, dosage, started_at, stopped_at, status")
        .eq("user_id", userId),
      sb
        .from("medication_logs")
        .select("date, medication_id, taken")
        .eq("user_id", userId),
      sb
        .from("characteristics")
        .select("name, mood_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      sb
        .from("diagnoses")
        .select("name")
        .eq("user_id", userId),
    ]);

    const moodEntries = moodRes.data ?? [];
    const medications = medRes.data ?? [];
    const medLogs = medLogRes.data ?? [];
    const characteristics = charRes.data ?? [];
    const diagnoses = diagRes.data ?? [];

    if (moodEntries.length < MIN_ENTRIES_FOR_ANALYSIS) {
      await sb.from("pattern_analysis_runs").upsert(
        {
          user_id: userId,
          last_run_at: new Date().toISOString(),
          entries_analyzed: moodEntries.length,
          patterns_found: 0,
          status: "insufficient_data",
        },
        { onConflict: "user_id" },
      );
      return json({
        status: "insufficient_data",
        entries: moodEntries.length,
        required: MIN_ENTRIES_FOR_ANALYSIS,
      });
    }

    // Bygg kompakt analys-kontext för AI:n
    const medById = new Map(medications.map((m: any) => [m.id, m.name]));

    // Per-dag-sammanfattning (max ~180 dagar för token-budget)
    const recentMoodEntries = moodEntries.slice(-180);
    const dailyLines = recentMoodEntries.map((e: any) => {
      const sleep = e.sleep_quality ? `, sömn: ${SLEEP_LABELS[e.sleep_quality] ?? e.sleep_quality}` : "";
      const eat = e.eating_quality ? `, mat: ${EATING_LABELS[e.eating_quality] ?? e.eating_quality}` : "";
      const energy = e.energy_level ? `, energi: ${e.energy_level}` : "";
      const ex = e.exercised ? ", tränade" : "";
      const tags = e.tags?.length ? `, taggar: [${e.tags.join(", ")}]` : "";
      const side = e.medication_side_effects?.length
        ? `, biverk: [${e.medication_side_effects.join(", ")}]`
        : "";
      const note = e.comment?.trim() ? `, tanke: "${e.comment.trim().slice(0, 140)}"` : "";
      return `${e.date}: ${MOOD_LABELS[e.mood] ?? e.mood}${energy}${sleep}${eat}${ex}${tags}${side}${note}`;
    });

    // Medicin-event (start/stopp)
    const medEvents = medications
      .map((m: any) => {
        const parts: string[] = [];
        if (m.started_at) parts.push(`${m.started_at}: startade ${m.name} (${m.dosage ?? ""})`);
        if (m.stopped_at) parts.push(`${m.stopped_at}: slutade ${m.name}`);
        return parts.join("\n");
      })
      .filter(Boolean)
      .join("\n");

    // Missade medicindagar
    const recentMedLogs = medLogs.slice(-200);
    const missedMedDays = recentMedLogs
      .filter((l: any) => l.taken === false)
      .map((l: any) => `${l.date}: missade ${medById.get(l.medication_id) ?? "medicin"}`)
      .slice(-30);

    // Karaktäristika över tid
    const charLines = characteristics.slice(-60).map(
      (c: any) =>
        `${c.created_at?.split("T")[0]}: "${c.name}" (${c.mood_type})`,
    );

    const diagnosisStr = diagnoses.map((d: any) => d.name).join(", ") || "ingen angiven";

    const systemPrompt = `Du är en personlig mönsteranalytiker som hjälper EN person förstå sitt eget mående.
Du är INTE läkare, INTE terapeut. Du beskriver vad datan visar — och rustar personen att agera.

VAD DU LETAR EFTER (och bara detta):
  1) TRIGGERS — vad som föregår en svängning (sömn, mat, träning, karaktäristika, säsong, veckodag)
  2) ÅTERKOMMANDE ÖVERGÅNGAR — sekvenser som upprepats, t.ex. "3 gånger har du gått från uppvarvad direkt till nedstämd inom 2 dagar"
  3) CYKLER / TYPISK FÖRLOPPSKEDJA — vanligaste rytmen, t.ex. "Ditt mående följer oftast: nedstämd → uppvarvad → stabil"

HÅRDA KRAV PÅ VARJE MÖNSTER:
- MÅSTE ha hänt ≥ 2 gånger. Engångshändelser FÅR INTE returneras. occurrences ≥ 2.
- Title: kort konstaterande direkt till personen ("Du går ofta från X till Y", "Korta sömnnätter före uppvarvning"). Max 60 tecken.
- description: 1–2 meningar. Räkna upprepningar konkret ("X gånger", "i N av M fall"). Skriv "du", inte "personen".
- why_it_matters: EN mening. Förklara vad mönstret betyder PRAKTISKT för personen ("Det är då du oftast börjar sova sämre", "Det här brukar vara starten på en längre nedåtperiod"). INTE klinisk teori.
- what_to_do: EN mening. Konkret handling personen kan göra NÄSTA gång det börjar ("Prioritera 7+ h sömn de kommande nätterna", "Hör av dig till någon nära", "Ring 1177 om tankarna förvärras"). Vid suicidsignaler: nämn alltid 1177/112/90101.

FÖRBJUDET SPRÅK (skriv aldrig dessa ord):
- "instabilt tillstånd", "blandat tillstånd", "blandepisod", "manisk", "deprimerad", "patient", "diagnos", "klinisk", "prodrom", "affektiv", "psykiatrisk".
- Använd istället: "uppvarvad", "nedstämd", "den här kombinationen", "den här svängningen", "du".

KONFIDENS:
- 0.5–0.7 om syns 2–3 ggr. 0.7–0.9 om 4+. > 0.9 endast vid mycket tydligt återkommande sekvens.

SEVERITY:
- "info": neutrala cykler/sekvenser.
- "attention": triggers att vara vaksam på (lite sömn → uppvarvning).
- "warning": ENDAST vid återkommande tecken på hög energi + nedstämdhet samtidigt, mycket snabba svängningar, eller suicidsignaler.

UTESLUT MEDICIN:
- Returnera ALDRIG mönster av typen "medication". Nämn inte mediciner i title/description. Medicin är bara bakgrundskontext.

Returnera 3–6 mönster. Hellre färre starka än många svaga. ENBART giltig JSON, ingen markdown.`;

    const userPrompt = `DIAGNOSER: ${diagnosisStr}
ANTAL CHECK-INS: ${moodEntries.length} (visar senaste ${recentMoodEntries.length})

DAGLIGA CHECK-INS (kronologiskt):
${dailyLines.join("\n")}

${medEvents ? `MEDICIN-EVENT:\n${medEvents}\n` : ""}
${missedMedDays.length ? `MISSADE MEDICINDAGAR (senaste):\n${missedMedDays.join("\n")}\n` : ""}
${charLines.length ? `KARAKTÄRISTIKA (kronologiskt):\n${charLines.join("\n")}\n` : ""}

Returnera JSON:
{
  "patterns": [
    {
      "pattern_type": "trigger|transition|cycle",
      "title": "Kort konstaterande till personen (max 60 tecken)",
      "description": "1–2 meningar som räknar upprepningar konkret med 'du'.",
      "why_it_matters": "EN mening: vad mönstret betyder praktiskt för dig.",
      "what_to_do": "EN konkret handling att göra nästa gång det börjar.",
      "confidence": 0.0-1.0,
      "severity": "info|attention|warning",
      "supporting_dates": ["YYYY-MM-DD", ...],
      "occurrences": minst 2,
      "first_seen": "YYYY-MM-DD",
      "last_seen": "YYYY-MM-DD"
    }
  ]
}`;

    // Anropa Lovable AI Gateway
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500;
      await sb.from("pattern_analysis_runs").upsert(
        {
          user_id: userId,
          last_run_at: new Date().toISOString(),
          entries_analyzed: moodEntries.length,
          patterns_found: 0,
          status: "error",
          error_message: `AI ${aiResp.status}: ${errText.slice(0, 300)}`,
        },
        { onConflict: "user_id" },
      );
      return json(
        {
          error: status === 429 ? "Rate limit" : status === 402 ? "Credits exhausted" : "AI error",
        },
        status,
      );
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content ?? "{}";
    let parsed: { patterns?: any[] } = {};
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      parsed = { patterns: [] };
    }
    const BANNED = /(instabil|blandat tillstånd|blandepisod|manisk|deprimerad|patient|diagnos|klinisk|prodrom|affektiv|psykiatrisk)/i;
    const patterns = (Array.isArray(parsed.patterns) ? parsed.patterns : [])
      .filter((p: any) => String(p?.pattern_type ?? "").toLowerCase() !== "medication")
      .filter((p: any) => (Number(p?.occurrences) || 0) >= 2)
      .filter((p: any) => {
        const txt = `${p?.title ?? ""} ${p?.description ?? ""} ${p?.why_it_matters ?? ""} ${p?.what_to_do ?? ""}`;
        return !BANNED.test(txt);
      });

    // Wipe gamla insikter och skriv nya
    await sb.from("pattern_insights").delete().eq("user_id", userId);

    if (patterns.length > 0) {
      const rows = patterns.slice(0, 20).map((p: any) => ({
        user_id: userId,
        pattern_type: String(p.pattern_type ?? "general").slice(0, 50),
        title: String(p.title ?? "Mönster").slice(0, 200),
        description: String(p.description ?? "").slice(0, 1000),
        confidence: Math.max(0, Math.min(1, Number(p.confidence) || 0.5)),
        severity: ["info", "attention", "warning"].includes(p.severity) ? p.severity : "info",
        supporting_dates: Array.isArray(p.supporting_dates)
          ? p.supporting_dates.filter((d: any) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 30)
          : [],
        supporting_data: {
          why_it_matters: typeof p.why_it_matters === "string" ? p.why_it_matters.slice(0, 400) : null,
          what_to_do: typeof p.what_to_do === "string" ? p.what_to_do.slice(0, 400) : null,
        },
        occurrences: Math.max(2, Number(p.occurrences) || 2),
        first_seen_at: /^\d{4}-\d{2}-\d{2}$/.test(p.first_seen) ? p.first_seen : null,
        last_seen_at: /^\d{4}-\d{2}-\d{2}$/.test(p.last_seen) ? p.last_seen : null,
      }));
      await sb.from("pattern_insights").insert(rows);
    }

    await sb.from("pattern_analysis_runs").upsert(
      {
        user_id: userId,
        last_run_at: new Date().toISOString(),
        entries_analyzed: moodEntries.length,
        patterns_found: patterns.length,
        status: "success",
        error_message: null,
      },
      { onConflict: "user_id" },
    );

    return json({
      status: "success",
      patterns_found: patterns.length,
      entries_analyzed: moodEntries.length,
    });
  } catch (err) {
    console.error("analyze-patterns error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

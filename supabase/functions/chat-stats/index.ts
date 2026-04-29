// Edge function: chat-stats
// Streaming AI chat that has access to the authenticated user's mood/medication/diagnosis data.
// Supports tool calling so Toddy can register side effects on medications and add
// characteristics for mood states (uppvarvad/stabil/nedstämd) on the user's behalf.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any;
  tool_call_id?: string;
  name?: string;
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
  characteristics: any[];
}): string {
  const { firstName, todayStr, moodEntries, medications, diagnoses, characteristics } = args;

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
    const parts: string[] = [`id=${m.id} | ${m.name} (${m.dosage})`];
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

  const charsByType: Record<string, string[]> = { elevated: [], stable: [], depressed: [] };
  for (const c of characteristics) {
    if (charsByType[c.mood_type]) charsByType[c.mood_type].push(c.name);
  }

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
  lines.push("=== KÄNNETECKEN ===");
  lines.push(`Uppvarvad: ${charsByType.elevated.join(", ") || "(inga)"}`);
  lines.push(`Stabil: ${charsByType.stable.join(", ") || "(inga)"}`);
  lines.push(`Nedstämd: ${charsByType.depressed.join(", ") || "(inga)"}`);

  lines.push("");
  lines.push(`=== INCHECKNINGAR (senaste ${compactEntries.length} dagar, nyast först) ===`);
  lines.push(compactEntries.length ? compactEntries.join("\n") : "(inga incheckningar)");

  return lines.join("\n");
}

const SYSTEM_PROMPT = (context: string) => `Du är "Toddy", en assistent för en person som loggar sitt mående. Du har två syften:

1) **Statistik & översikt** — svara på faktafrågor om användarens egen registrerade data.
2) **Registrering** — hjälpa användaren att lägga till biverkningar på mediciner och kännetecken för stämningslägen via verktyg (tools).

REGISTRERING — VERKTYG:
- När användaren vill **lägga till biverkningar** för en medicin (t.ex. "lägg till illamående som biverkning på Lamictal"), använd verktyget \`add_medication_side_effects\`. Identifiera medicinen via dess id i listan ovan. Om flera mediciner matchar eller namnet är otydligt — fråga först. Lägg bara till biverkningar som användaren tydligt nämnt.
- När användaren vill **lägga till ett kännetecken** för uppvarvad / stabil / nedstämd (t.ex. "lägg till 'pratar mycket' som kännetecken när jag är uppvarvad"), använd \`add_characteristic\`. mood_type måste vara exakt "elevated" (uppvarvad), "stable" (stabil) eller "depressed" (nedstämd).
- Bekräfta kort efteråt vad du har lagt till. Hitta inte på saker — använd bara det användaren faktiskt sagt.
- Svenska terminologi: använd "uppvarvad" (inte mani) och "nedstämdhet" (inte depression) i svar till användaren.

VAD DU FÅR GÖRA I ÖVRIGT:
- Räkna, summera och beskriva mönster i användarens incheckningar, mediciner och diagnoser.
- Beskriva **historiska mönster** baserat på registrerad data: t.ex. genomsnittlig längd på tidigare uppvarvade/nedstämda perioder, hur länge nuvarande period pågått hittills, och hur den jämför sig med tidigare perioder ("Dina nedstämda perioder har historiskt varit i snitt X dagar. Den nuvarande har pågått i Y dagar.").
- Formulera detta som **observationer av det förflutna**, inte som förutsägelser. Säg "har brukat vara" / "har historiskt varat" — inte "kommer att vara" eller "borde vara".
- Svara på svenska, **kort och konkret** — helst 1–3 meningar. Använd markdown bara när det gör svaret tydligare.
- Var **personlig och varm**: börja gärna med en kort hälsning eller bekräftelse ("Hej!", "Tack för att du loggar idag", "Vad bra att du hör av dig"), och avsluta gärna med en kort uppmuntrande mening ("Fortsätt så", "Du gör ett bra jobb med att hålla koll", "Skönt att du fångar mönstret"). Håll det enkelt och äkta — aldrig överdrivet, aldrig terapeutiskt, aldrig som en livscoach.
- Uppmuntran får ALDRIG bli råd, tolkning eller bedömning av måendet ("det låter som att…", "du borde…", "försök att…" är förbjudet).
- Om data saknas eller är för tunn för att se mönster: säg det rakt ut. Hitta aldrig på siffror, datum eller mediciner.

VAD DU INTE FÅR GÖRA:
- Ge inga **prognoser** eller förutsägelser om hur länge en period kommer att vara, när den tar slut, eller hur användaren kommer att må.
- Ge inga medicinska råd, ingen terapi, ingen tolkning av känslor, inga rekommendationer om vad användaren bör göra.
- Uttala dig inte om mediciners effekt, dos eller om byte av behandling.
- Spekulera inte om orsaker till mående.
- Svara inte på allmänna frågor om bipolär sjukdom, psykiatri eller livsstil.
- Vid tecken på akut psykisk ohälsa eller suicidtankar: hänvisa kort till 1177, 112 eller 90101.

ANVÄNDARENS DATA (din enda informationskälla för statistik, och referens för id:n vid registrering):
${context}`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_medication_side_effects",
      description:
        "Lägg till en eller flera biverkningar på en av användarens mediciner. Befintliga biverkningar bevaras; dubbletter ignoreras.",
      parameters: {
        type: "object",
        properties: {
          medication_id: {
            type: "string",
            description: "UUID för medicinen (från listan ANVÄNDARENS DATA).",
          },
          side_effects: {
            type: "array",
            items: { type: "string" },
            description: "Biverkningar att lägga till, t.ex. ['illamående', 'huvudvärk'].",
            minItems: 1,
          },
        },
        required: ["medication_id", "side_effects"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_characteristic",
      description:
        "Lägg till ett kännetecken för ett stämningsläge (uppvarvad, stabil eller nedstämd).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Kort beskrivning, t.ex. 'pratar mycket'." },
          mood_type: {
            type: "string",
            enum: ["elevated", "stable", "depressed"],
            description: "elevated=uppvarvad, stable=stabil, depressed=nedstämd",
          },
        },
        required: ["name", "mood_type"],
        additionalProperties: false,
      },
    },
  },
];

async function executeTool(
  admin: any,
  userId: string,
  name: string,
  args: any,
): Promise<{ ok: boolean; message: string }> {
  try {
    if (name === "add_medication_side_effects") {
      const medId = String(args?.medication_id ?? "");
      const newEffects = Array.isArray(args?.side_effects)
        ? args.side_effects.map((s: any) => String(s).trim()).filter(Boolean)
        : [];
      if (!medId || newEffects.length === 0) {
        return { ok: false, message: "Ogiltiga argument." };
      }
      const { data: med, error: medErr } = await admin
        .from("medications")
        .select("id, name, side_effects, user_id")
        .eq("id", medId)
        .eq("user_id", userId)
        .maybeSingle();
      if (medErr || !med) {
        return { ok: false, message: "Medicinen hittades inte." };
      }
      const existing: string[] = Array.isArray(med.side_effects) ? med.side_effects : [];
      const lower = new Set(existing.map((s) => s.toLowerCase()));
      const added: string[] = [];
      for (const e of newEffects) {
        if (!lower.has(e.toLowerCase())) {
          added.push(e);
          lower.add(e.toLowerCase());
        }
      }
      const merged = [...existing, ...added];
      const { error: updErr } = await admin
        .from("medications")
        .update({ side_effects: merged })
        .eq("id", medId)
        .eq("user_id", userId);
      if (updErr) return { ok: false, message: `DB-fel: ${updErr.message}` };
      return {
        ok: true,
        message:
          added.length === 0
            ? `Inga nya biverkningar tillagda på ${med.name} (alla fanns redan).`
            : `La till [${added.join(", ")}] på ${med.name}. Aktuella biverkningar: [${merged.join(", ")}].`,
      };
    }

    if (name === "add_characteristic") {
      const cname = String(args?.name ?? "").trim();
      const moodType = String(args?.mood_type ?? "");
      if (!cname || !["elevated", "stable", "depressed"].includes(moodType)) {
        return { ok: false, message: "Ogiltiga argument." };
      }
      // Avoid duplicates (case-insensitive) within same mood_type
      const { data: existing } = await admin
        .from("characteristics")
        .select("id, name")
        .eq("user_id", userId)
        .eq("mood_type", moodType);
      if (
        Array.isArray(existing) &&
        existing.some((c: any) => c.name.toLowerCase() === cname.toLowerCase())
      ) {
        return { ok: true, message: `"${cname}" finns redan som kännetecken.` };
      }
      const { error: insErr } = await admin
        .from("characteristics")
        .insert({ user_id: userId, name: cname, mood_type: moodType });
      if (insErr) return { ok: false, message: `DB-fel: ${insErr.message}` };
      const label =
        moodType === "elevated" ? "uppvarvad" : moodType === "stable" ? "stabil" : "nedstämd";
      return { ok: true, message: `La till "${cname}" som kännetecken för ${label}.` };
    }

    return { ok: false, message: `Okänt verktyg: ${name}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Fel vid verktygsexekvering." };
  }
}

// Helper: stream a plain text chunk in OpenAI-compatible SSE delta format.
function sseDelta(text: string): string {
  const payload = {
    choices: [{ delta: { content: text }, index: 0, finish_reason: null }],
  };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

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

    const body = (await req.json().catch(() => null)) as { messages?: ChatMessage[] } | null;
    const messages = Array.isArray(body?.messages) ? body!.messages : [];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const safeMessages = messages
      .slice(-30)
      .filter(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    // Build initial context (will be rebuilt after any tool call so model sees fresh data)
    const buildPromptMessages = async () => {
      const [moodRes, medsRes, diagRes, profRes, charRes] = await Promise.all([
        admin
          .from("mood_entries")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(400),
        admin.from("medications").select("*").eq("user_id", userId),
        admin.from("diagnoses").select("*").eq("user_id", userId),
        admin.from("profiles").select("first_name").eq("user_id", userId).maybeSingle(),
        admin.from("characteristics").select("*").eq("user_id", userId),
      ]);
      const todayStr = new Date().toISOString().slice(0, 10);
      const context = buildContext({
        firstName: profRes.data?.first_name ?? null,
        todayStr,
        moodEntries: moodRes.data ?? [],
        medications: medsRes.data ?? [],
        diagnoses: diagRes.data ?? [],
        characteristics: charRes.data ?? [],
      });
      return [{ role: "system", content: SYSTEM_PROMPT(context) }, ...safeMessages] as any[];
    };

    let convo = await buildPromptMessages();

    // Tool-calling loop: do up to N non-streaming rounds; final round streams.
    const MAX_TOOL_ROUNDS = 4;
    const callAI = async (stream: boolean, msgs: any[]) => {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream,
          messages: msgs,
          tools: TOOLS,
        }),
      });
    };

    const handleAiError = (status: number, txt: string) => {
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "För många frågor just nu, försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-krediter slut. Lägg till krediter i Lovable Cloud." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("AI gateway error:", status, txt);
      return new Response(JSON.stringify({ error: "AI-fel" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const aiResp = await callAI(false, convo);
      if (!aiResp.ok) {
        const txt = await aiResp.text().catch(() => "");
        return handleAiError(aiResp.status, txt);
      }
      const data = await aiResp.json();
      const choice = data?.choices?.[0];
      const msg = choice?.message;
      const toolCalls = msg?.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        // No tool call — stream the final answer back. We already have the text;
        // emit it as a single SSE delta + [DONE].
        const finalText: string = msg?.content ?? "";
        const stream = new ReadableStream({
          start(controller) {
            const enc = new TextEncoder();
            // Emit in reasonable chunks so UI feels responsive.
            const chunkSize = 80;
            for (let i = 0; i < finalText.length; i += chunkSize) {
              controller.enqueue(enc.encode(sseDelta(finalText.slice(i, i + chunkSize))));
            }
            if (finalText.length === 0) {
              controller.enqueue(enc.encode(sseDelta("")));
            }
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Execute tool calls and append results.
      convo.push({
        role: "assistant",
        content: msg?.content ?? "",
        tool_calls: toolCalls,
      });
      let anyChange = false;
      for (const tc of toolCalls) {
        const fnName = tc?.function?.name;
        let parsedArgs: any = {};
        try {
          parsedArgs = tc?.function?.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          parsedArgs = {};
        }
        const result = await executeTool(admin, userId, fnName, parsedArgs);
        if (result.ok) anyChange = true;
        convo.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      // After mutations, rebuild context so model sees fresh data on next round.
      if (anyChange) {
        const fresh = await buildPromptMessages();
        // Replace system message; keep the rest of convo (assistant tool_calls + tool results + user msgs)
        const restAfterSystem = convo.slice(1);
        convo = [fresh[0], ...fresh.slice(1), ...restAfterSystem.slice(safeMessages.length)];
      }
    }

    // Safety fallback if loop didn't terminate.
    return new Response(JSON.stringify({ error: "För många verktygsanrop." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-stats error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

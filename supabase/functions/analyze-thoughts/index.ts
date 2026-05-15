import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Sentiment + theme extraction for a user's daily comments, plus
// trigger correlation: themes that consistently appear 1-3 days BEFORE
// a mood drop are saved as `pattern_insights` of type 'trigger'.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ThoughtItem { date: string; comment: string; }
interface AIThoughtResult { date: string; sentiment: number; themes: string[]; }

const ELEVATED = new Set(["severe_elevated", "elevated", "somewhat_elevated"]);
const DEPRESSED = new Set(["severe_depressed", "depressed", "somewhat_depressed"]);

function moodScore(mood: string): number {
  if (ELEVATED.has(mood)) return 1;
  if (DEPRESSED.has(mood)) return -1;
  return 0;
}

async function callAI(items: ThoughtItem[]): Promise<AIThoughtResult[]> {
  const list = items
    .map((i, idx) => `${idx + 1}. [${i.date}] "${i.comment.slice(0, 280).replace(/"/g, "'")}"`)
    .join("\n");

  const system = `Du är en svensk klinisk psykolog som analyserar dagliga tankar.
För varje tanke, returnera:
- sentiment: ett tal mellan -1 (mycket mörk/förtvivlad) och +1 (mycket ljus/hoppfull). 0 är neutralt.
- themes: 1-3 korta nyckelteman på svenska, småbokstäver, max 2 ord vardera (t.ex. "jobbet", "mamma", "sömnen", "festen"). Inga generella ord som "känslor" eller "dagen".
Svara EXAKT med en JSON-array med samma längd och ordning som indata. Inga andra ord.
Format: [{"date":"YYYY-MM-DD","sentiment":-0.5,"themes":["jobbet","sömn"]}, ...]`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: list },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI error ${resp.status}: ${t}`);
  }
  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content ?? "[]";
  // The model may wrap the array in a top-level object; try both.
  let parsed: unknown;
  try { parsed = JSON.parse(content); }
  catch { parsed = []; }
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>)?.results)
    ? (parsed as { results: unknown[] }).results
    : Array.isArray((parsed as Record<string, unknown>)?.thoughts)
    ? (parsed as { thoughts: unknown[] }).thoughts
    : [];
  return (arr as AIThoughtResult[])
    .filter((r) => r && typeof r.date === "string")
    .map((r) => ({
      date: r.date,
      sentiment: Math.max(-1, Math.min(1, Number(r.sentiment) || 0)),
      themes: Array.isArray(r.themes) ? r.themes.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 3) : [],
    }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "no auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch last 60 days of mood entries with comments
    const since = new Date();
    since.setDate(since.getDate() - 60);
    const { data: entries, error: entriesErr } = await admin
      .from("mood_entries")
      .select("date, mood, comment")
      .eq("user_id", userId)
      .gte("date", since.toISOString().slice(0, 10))
      .order("date", { ascending: true });

    if (entriesErr) throw entriesErr;

    const withComments = (entries ?? [])
      .filter((e) => e.comment && String(e.comment).trim().length > 4)
      .map((e) => ({ date: e.date as string, comment: String(e.comment), mood: e.mood as string }));

    if (withComments.length === 0) {
      return new Response(JSON.stringify({ analyzed: 0, triggers_found: 0, message: "No comments to analyze" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip dates already analyzed (only re-analyze recent 7 days for fresh sentiment)
    const { data: existing } = await admin
      .from("thought_analysis")
      .select("date")
      .eq("user_id", userId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const skipDates = new Set(
      (existing ?? [])
        .filter((r) => new Date(r.date as string).getTime() < sevenDaysAgo.getTime())
        .map((r) => r.date as string),
    );
    const toAnalyze = withComments.filter((e) => !skipDates.has(e.date));

    let analyzed = 0;
    if (toAnalyze.length > 0) {
      // Batch in chunks of 15 to keep prompt size sane
      for (let i = 0; i < toAnalyze.length; i += 15) {
        const chunk = toAnalyze.slice(i, i + 15);
        const results = await callAI(chunk);
        const upserts = results.map((r) => {
          const orig = chunk.find((c) => c.date === r.date);
          return {
            user_id: userId,
            date: r.date,
            sentiment: r.sentiment,
            themes: r.themes,
            comment_excerpt: orig?.comment.slice(0, 200) ?? null,
            analyzed_at: new Date().toISOString(),
          };
        });
        if (upserts.length > 0) {
          const { error: upErr } = await admin
            .from("thought_analysis")
            .upsert(upserts, { onConflict: "user_id,date" });
          if (upErr) console.error("upsert error", upErr);
          else analyzed += upserts.length;
        }
      }
    }

    // -------- Trigger correlation --------
    // For each unique theme, check if mood drops 1-3 days later happen significantly often.
    const { data: allAnalyses } = await admin
      .from("thought_analysis")
      .select("date, themes")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    const moodByDate = new Map<string, number>();
    (entries ?? []).forEach((e) => moodByDate.set(e.date as string, moodScore(e.mood as string)));

    const themeOccurrences: Record<string, { total: number; followedByDrop: number; dates: string[] }> = {};
    (allAnalyses ?? []).forEach((row) => {
      const themes = (row.themes as string[]) ?? [];
      const date = row.date as string;
      themes.forEach((theme) => {
        if (!themeOccurrences[theme]) themeOccurrences[theme] = { total: 0, followedByDrop: 0, dates: [] };
        themeOccurrences[theme].total++;
        themeOccurrences[theme].dates.push(date);
        // Check next 1..3 days
        for (let d = 1; d <= 3; d++) {
          const futureDate = new Date(date);
          futureDate.setDate(futureDate.getDate() + d);
          const key = futureDate.toISOString().slice(0, 10);
          const score = moodByDate.get(key);
          if (score !== undefined && score < 0) {
            themeOccurrences[theme].followedByDrop++;
            break;
          }
        }
      });
    });

    let triggersFound = 0;
    // Clear previous AI-generated trigger insights to avoid stale data
    await admin
      .from("pattern_insights")
      .delete()
      .eq("user_id", userId)
      .eq("pattern_type", "trigger")
      .like("description", "%[auto-tanke]%");

    for (const [theme, stats] of Object.entries(themeOccurrences)) {
      if (stats.total < 3) continue; // need at least 3 mentions
      const ratio = stats.followedByDrop / stats.total;
      if (ratio < 0.5) continue; // need at least half followed by mood drop
      const confidence = Math.min(0.95, 0.4 + ratio * 0.5 + Math.min(0.2, stats.total / 50));
      const severity = ratio >= 0.75 ? "warning" : "attention";
      const { error: insErr } = await admin.from("pattern_insights").insert({
        user_id: userId,
        pattern_type: "trigger",
        title: `"${theme}" verkar påverka ditt mående`,
        description: `Du nämner "${theme}" ofta i dina tankar. Av ${stats.total} gånger följdes ${stats.followedByDrop} (${Math.round(ratio * 100)}%) av en sämre dag inom 1–3 dagar. [auto-tanke]`,
        confidence,
        severity,
        supporting_dates: stats.dates.slice(-10),
        supporting_data: {
          why_it_matters: `Återkommande mönster där "${theme}" föregår nedstämda dagar är värt att uppmärksamma.`,
          what_to_do: `Notera nästa gång du nämner "${theme}" och planera in extra återhämtning de följande dagarna.`,
        },
        occurrences: stats.total,
      });
      if (!insErr) triggersFound++;
    }

    return new Response(
      JSON.stringify({ analyzed, triggers_found: triggersFound, total_with_comments: withComments.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-thoughts error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

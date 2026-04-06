import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { moodType } = await req.json();
    if (!["elevated", "stable", "depressed"].includes(moodType)) {
      return new Response(JSON.stringify({ error: "Invalid mood type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map mood types for query
    const moodValues = moodType === "elevated"
      ? ["elevated", "somewhat_elevated"]
      : moodType === "depressed"
      ? ["depressed", "somewhat_depressed"]
      : ["stable"];

    // Get entries with comments for this mood type
    const { data: entries } = await supabase
      .from("mood_entries")
      .select("mood, comment, sleep_comment, eating_comment, exercise_comment, medication_comment, energy_level, sleep_quality, eating_quality, exercised, date")
      .eq("user_id", user.id)
      .in("mood", moodValues)
      .order("date", { ascending: false })
      .limit(100);

    // Get existing characteristics to avoid duplicates
    const { data: existing } = await supabase
      .from("characteristics")
      .select("name")
      .eq("user_id", user.id)
      .eq("mood_type", moodType);

    const existingNames = (existing || []).map(c => c.name.toLowerCase());

    // Collect all comments
    const comments: string[] = [];
    (entries || []).forEach(e => {
      if (e.comment) comments.push(e.comment);
      if (e.sleep_comment) comments.push(`Sömn: ${e.sleep_comment}`);
      if (e.eating_comment) comments.push(`Mat: ${e.eating_comment}`);
      if (e.exercise_comment) comments.push(`Träning: ${e.exercise_comment}`);
      if (e.medication_comment) comments.push(`Medicin: ${e.medication_comment}`);
    });

    // Build behavioral patterns
    const patterns: string[] = [];
    const totalEntries = (entries || []).length;
    if (totalEntries > 0) {
      const sleepBad = (entries || []).filter(e => e.sleep_quality === "bad").length;
      const sleepGood = (entries || []).filter(e => e.sleep_quality === "good").length;
      const exercised = (entries || []).filter(e => e.exercised).length;
      const eatingBad = (entries || []).filter(e => e.eating_quality === "bad").length;
      const energyHigh = (entries || []).filter(e => e.energy_level === "high").length;
      const energyLow = (entries || []).filter(e => e.energy_level === "low").length;

      if (sleepBad / totalEntries > 0.4) patterns.push("Sover ofta dåligt under dessa perioder");
      if (sleepGood / totalEntries > 0.6) patterns.push("Sover generellt bra under dessa perioder");
      if (exercised / totalEntries > 0.5) patterns.push("Tränar ofta under dessa perioder");
      if (exercised / totalEntries < 0.1) patterns.push("Tränar sällan under dessa perioder");
      if (eatingBad / totalEntries > 0.4) patterns.push("Äter ofta dåligt under dessa perioder");
      if (energyHigh / totalEntries > 0.5) patterns.push("Har ofta hög energi");
      if (energyLow / totalEntries > 0.5) patterns.push("Har ofta låg energi");
    }

    if (comments.length === 0 && patterns.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const moodLabel = moodType === "elevated" ? "uppvarvad/förhöjd"
      : moodType === "depressed" ? "nedstämd/sänkt"
      : "stabil";

    const prompt = `Analysera dessa dagboksanteckningar och beteendemönster från en person med bipolär sjukdom under ${moodLabel} perioder.

KOMMENTARER (${comments.length} st):
${comments.slice(0, 30).join("\n")}

BETEENDEMÖNSTER:
${patterns.join("\n") || "Inga tydliga mönster ännu."}

REDAN SPARADE KÄNNETECKEN (ignorera dessa):
${existingNames.join(", ") || "Inga"}

Ge 3-6 korta förslag på kännetecken som beskriver hur personen är under ${moodLabel} perioder. Varje förslag ska vara 1-4 ord. Basera på verkliga mönster i datan - inte generella antaganden.

Svara ENBART med en JSON-array av strängar, t.ex.: ["Sover lite", "Mer social"]`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du är en klinisk assistent som analyserar dagboksdata för bipolär sjukdom. Svara alltid på svenska. Svara ENBART med en JSON-array av strängar." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response (handle markdown code blocks)
    let suggestions: string[] = [];
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = [];
    }

    // Filter out existing
    suggestions = suggestions.filter(
      (s: string) => typeof s === "string" && s.length > 0 && !existingNames.includes(s.toLowerCase())
    );

    return new Response(JSON.stringify({ suggestions, patternsFound: patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-characteristics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

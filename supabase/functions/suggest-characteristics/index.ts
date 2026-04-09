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

    const moodValues = moodType === "elevated"
      ? ["elevated", "somewhat_elevated"]
      : moodType === "depressed"
      ? ["depressed", "somewhat_depressed"]
      : ["stable"];

    const { data: entries } = await supabase
      .from("mood_entries")
      .select("mood, comment, sleep_comment, eating_comment, exercise_comment, medication_comment, energy_level, sleep_quality, eating_quality, exercised, tags, date")
      .eq("user_id", user.id)
      .in("mood", moodValues)
      .order("date", { ascending: false })
      .limit(200);

    const { data: existing } = await supabase
      .from("characteristics")
      .select("name")
      .eq("user_id", user.id)
      .eq("mood_type", moodType);

    const existingNames = (existing || []).map(c => c.name.toLowerCase());

    // Collect tags and their frequency
    const tagCounts: Record<string, number> = {};
    (entries || []).forEach(e => {
      if (e.tags && Array.isArray(e.tags)) {
        for (const tag of e.tags) {
          const normalized = tag.toLowerCase().trim();
          if (!existingNames.includes(normalized)) {
            tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
          }
        }
      }
    });

    const frequentTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Collect comments
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

    if (comments.length === 0 && patterns.length === 0 && frequentTags.length === 0) {
      return new Response(JSON.stringify({ 
        suggestions: [],
        message: "Inte tillräckligt med data ännu. Fortsätt checka in dagligen."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const moodLabel = moodType === "elevated" ? "uppvarvad/förhöjd"
      : moodType === "depressed" ? "nedstämd/sänkt"
      : "stabil";

    const tagSection = frequentTags.length > 0
      ? `\nVANLIGASTE TAGGARNA (valda vid incheckning steg 2):\n${frequentTags.map(([tag, count]) => `- "${tag}" (${count} gånger)`).join("\n")}`
      : "";

    const prompt = `Analysera denna data från en persons dagliga incheckningar under ${moodLabel} perioder (${totalEntries} incheckningar totalt).
${tagSection}

KOMMENTARER (${comments.length} st):
${comments.slice(0, 25).join("\n")}

BETEENDEMÖNSTER:
${patterns.join("\n") || "Inga tydliga mönster ännu."}

REDAN SPARADE KÄNNETECKEN (ignorera dessa):
${existingNames.join(", ") || "Inga"}

Baserat på taggarna och kommentarerna ovan, föreslå 3-5 korta kännetecken som beskriver hur personen brukar vara under ${moodLabel} perioder.
Prioritera taggar som valts ofta – de visar tydligt beteende.
Varje förslag ska vara 1-4 ord, på svenska.
Inkludera en kort förklaring till varje förslag.

Svara ENBART med JSON: [{"name": "...", "reason": "Baserat på att du valde X i Y incheckningar"}]`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du är en hälsoanalytiker som hjälper användare förstå sina beteendemönster. Svara alltid på svenska. Svara ENBART med JSON." },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar. Försök igen om en stund." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    let suggestions: { name: string; reason: string }[] = [];
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      // Handle both formats: array of strings or array of objects
      suggestions = parsed.map((s: any) => 
        typeof s === 'string' 
          ? { name: s, reason: '' } 
          : { name: s.name || s, reason: s.reason || '' }
      );
    } catch {
      suggestions = [];
    }

    // Filter out existing
    suggestions = suggestions.filter(
      s => typeof s.name === "string" && s.name.length > 0 && !existingNames.includes(s.name.toLowerCase())
    );

    return new Response(JSON.stringify({ suggestions, totalEntries }), {
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Fetch all mood entries
    const { data: entries } = await supabase
      .from('mood_entries')
      .select('date, mood, sleep_quality, eating_quality, exercised, comment, exercise_comment, sleep_comment, eating_comment, medication_comment, medication_side_effects')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    // Fetch diagnoses, characteristics, medications
    const [diagRes, charRes, medRes] = await Promise.all([
      supabase.from('diagnoses').select('name, diagnosed_at').eq('user_id', userId),
      supabase.from('characteristics').select('name, mood_type').eq('user_id', userId),
      supabase.from('medications').select('name, dosage, frequency, active, started_at').eq('user_id', userId),
    ]);

    const moodEntries = entries || [];
    const diagnoses = diagRes.data || [];
    const characteristics = charRes.data || [];
    const medications = medRes.data || [];

    if (moodEntries.length < 3) {
      return new Response(
        JSON.stringify({ error: "insufficient_data", message: "Du behöver minst 3 dagars data för att få AI-insikter." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build comprehensive data summary
    const totalDays = moodEntries.length;
    const firstDate = moodEntries[0]?.date;
    const lastDate = moodEntries[moodEntries.length - 1]?.date;
    const moodCounts = { elevated: 0, stable: 0, depressed: 0 };
    const sleepCounts = { good: 0, bad: 0, unknown: 0 };
    let exerciseDays = 0;
    const comments: string[] = [];

    for (const e of moodEntries) {
      if (e.mood === 'elevated' || e.mood === 'somewhat_elevated') moodCounts.elevated++;
      else if (e.mood === 'depressed' || e.mood === 'somewhat_depressed') moodCounts.depressed++;
      else moodCounts.stable++;
      if (e.sleep_quality === 'good') sleepCounts.good++;
      else if (e.sleep_quality === 'bad') sleepCounts.bad++;
      else sleepCounts.unknown++;
      if (e.exercised) exerciseDays++;
      if (e.comment) comments.push(`${e.date}: ${e.comment}`);
    }

    // Recent data
    const last7 = moodEntries.slice(-7);
    const last30 = moodEntries.slice(-30);
    const recent7Moods = last7.map(e => e.mood);
    const recent30Moods = last30.map(e => e.mood);

    // Sleep-mood correlation
    let badSleepThenDepressed = 0;
    let goodSleepThenStable = 0;
    for (let i = 0; i < moodEntries.length - 1; i++) {
      if (moodEntries[i].sleep_quality === 'bad' && (moodEntries[i + 1].mood === 'depressed' || moodEntries[i + 1].mood === 'somewhat_depressed')) badSleepThenDepressed++;
      if (moodEntries[i].sleep_quality === 'good' && (moodEntries[i + 1].mood === 'stable' || moodEntries[i + 1].mood === 'elevated' || moodEntries[i + 1].mood === 'somewhat_elevated')) goodSleepThenStable++;
    }

    // Mood transitions
    const transitions: string[] = [];
    for (let i = 0; i < moodEntries.length - 1; i++) {
      if (moodEntries[i].mood !== moodEntries[i + 1].mood) {
        transitions.push(`${moodEntries[i].mood} → ${moodEntries[i + 1].mood}`);
      }
    }

    // Streak
    let currentMood = moodEntries[moodEntries.length - 1]?.mood;
    let streak = 0;
    for (let i = moodEntries.length - 1; i >= 0; i--) {
      if (moodEntries[i].mood === currentMood) streak++;
      else break;
    }

    const dateRange = `${firstDate} till ${lastDate}`;
    const calendarDays = firstDate && lastDate
      ? Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : totalDays;
    const missingDays = calendarDays - totalDays;

    const prompt = `Analysera följande data och svara ENBART med giltig JSON (inget annat).

VIKTIGT: Basera analysen ENBART på de ${totalDays} dagar som användaren faktiskt har checkat in.${missingDays > 0 ? ` Det finns ${missingDays} dagar utan incheckning – ignorera dessa.` : ''}

📊 DATA (${totalDays} incheckade dagar, ${dateRange}):
- Uppvarvad: ${moodCounts.elevated} dagar (${Math.round(moodCounts.elevated / totalDays * 100)}%)
- Stabil: ${moodCounts.stable} dagar (${Math.round(moodCounts.stable / totalDays * 100)}%)
- Nedstämd: ${moodCounts.depressed} dagar (${Math.round(moodCounts.depressed / totalDays * 100)}%)
🛌 Sömn: ${sleepCounts.good} bra, ${sleepCounts.bad} dåliga
🏋️ Träning: ${exerciseDays} av ${totalDays} dagar
📈 Senaste 7: ${recent7Moods.join(', ')}
📈 Senaste 30: ${recent30Moods.join(', ')}
🔄 Streak: ${streak} dagar ${currentMood}
🔗 Dålig sömn → nedstämd: ${badSleepThenDepressed}x | Bra sömn → stabil: ${goodSleepThenStable}x
🔄 Övergångar: ${transitions.slice(-15).join(', ')}
${diagnoses.length > 0 ? `🏥 Diagnoser: ${diagnoses.map(d => d.name).join(', ')}` : ''}
${characteristics.length > 0 ? `🔍 Kännetecken: ${characteristics.map(c => `${c.mood_type}: ${c.name}`).join(', ')}` : ''}
${medications.length > 0 ? `💊 Mediciner: ${medications.map(m => `${m.name} ${m.dosage}`).join(', ')}` : ''}
${comments.length > 0 ? `💬 Kommentarer: ${comments.slice(-5).join(' | ')}` : ''}

Svara med EXAKT denna JSON-struktur (på svenska):
{
  "status": "good" | "warning" | "alert",
  "statusLabel": "kort etikett, t.ex. 'Stabilt läge' eller 'Var uppmärksam'",
  "statusDescription": "en mening som sammanfattar nuläget",
  "trendDirection": "improving" | "declining" | "stable" | "fluctuating",
  "trendLabel": "kort beskrivning av trendriktningen",
  "patterns": [
    { "icon": "sleep" | "exercise" | "mood" | "correlation", "label": "kort mönsterbeskrivning", "impact": "positive" | "negative" | "neutral" }
  ],
  "prognosis": {
    "shortTerm": "prognos för kommande veckan, en mening",
    "longTerm": "prognos för kommande månaden, en mening",
    "confidence": "low" | "medium" | "high"
  },
  "strengths": ["styrka 1", "styrka 2"],
  "warnings": ["varning 1"]
}

Ge max 3 patterns, max 3 strengths, max 2 warnings. Var varm och empatisk i tonen.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Du är en empatisk hälsoanalytiker som svarar ENBART med giltig JSON. Du analyserar humördata observationellt. Du ger ALDRIG medicinsk rådgivning. Svara alltid på svenska.`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limited", message: "För många förfrågningar. Försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "credits_exhausted", message: "AI-krediter slut." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle markdown code blocks)
    let structured;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      structured = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      structured = null;
    }

    return new Response(
      JSON.stringify({
        structured,
        analysis: rawContent,
        stats: {
          totalDays,
          dateRange,
          moodCounts,
          sleepCounts,
          exerciseDays,
          currentStreak: streak,
          currentMood,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate analysis" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

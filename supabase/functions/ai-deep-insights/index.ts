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

    // Build comprehensive data summary - only based on actual check-in days
    const totalDays = moodEntries.length;
    const firstDate = moodEntries[0]?.date;
    const lastDate = moodEntries[moodEntries.length - 1]?.date;
    const sleepCounts = { good: 0, bad: 0, unknown: 0 };
    const eatingCounts = { good: 0, bad: 0, okay: 0, unknown: 0 };
    let exerciseDays = 0;
    const comments: string[] = [];

    for (const e of moodEntries) {
      moodCounts[e.mood as keyof typeof moodCounts]++;
      if (e.sleep_quality === 'good') sleepCounts.good++;
      else if (e.sleep_quality === 'bad') sleepCounts.bad++;
      else sleepCounts.unknown++;
      if (e.eating_quality === 'good') eatingCounts.good++;
      else if (e.eating_quality === 'bad') eatingCounts.bad++;
      else if (e.eating_quality === 'okay') eatingCounts.okay++;
      else eatingCounts.unknown++;
      if (e.exercised) exerciseDays++;
      if (e.comment) comments.push(`${e.date}: ${e.comment}`);
    }

    // Detect patterns
    const last7 = moodEntries.slice(-7);
    const last30 = moodEntries.slice(-30);
    const recent7Moods = last7.map(e => e.mood);
    const recent30Moods = last30.map(e => e.mood);

    // Sleep-mood correlation
    let badSleepThenDepressed = 0;
    let goodSleepThenStable = 0;
    for (let i = 0; i < moodEntries.length - 1; i++) {
      if (moodEntries[i].sleep_quality === 'bad' && moodEntries[i + 1].mood === 'depressed') badSleepThenDepressed++;
      if (moodEntries[i].sleep_quality === 'good' && (moodEntries[i + 1].mood === 'stable' || moodEntries[i + 1].mood === 'elevated')) goodSleepThenStable++;
    }

    // Mood transitions
    const transitions: string[] = [];
    for (let i = 0; i < moodEntries.length - 1; i++) {
      if (moodEntries[i].mood !== moodEntries[i + 1].mood) {
        transitions.push(`${moodEntries[i].mood} → ${moodEntries[i + 1].mood}`);
      }
    }

    // Streak detection
    let currentMood = moodEntries[moodEntries.length - 1]?.mood;
    let streak = 0;
    for (let i = moodEntries.length - 1; i >= 0; i--) {
      if (moodEntries[i].mood === currentMood) streak++;
      else break;
    }

    const dateRange = `${firstDate} till ${lastDate}`;

    // Calculate calendar days between first and last entry
    const calendarDays = firstDate && lastDate
      ? Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : totalDays;
    const missingDays = calendarDays - totalDays;

    const prompt = `Analysera följande data noggrant och ge en djupgående insikt om personens mående, bakgrund och prognos.

VIKTIGT: Basera din analys ENBART på de ${totalDays} dagar som användaren faktiskt har checkat in. Dra inga slutsatser om dagar utan data.${missingDays > 0 ? ` Det finns ${missingDays} dagar utan incheckning under perioden – nämn inte detta som ett problem, det är normalt.` : ''}

📊 DATAÖVERSIKT (${totalDays} incheckade dagar under perioden ${dateRange}):
- Uppvarvad: ${moodCounts.elevated} dagar (${Math.round(moodCounts.elevated / totalDays * 100)}%)
- Stabil: ${moodCounts.stable} dagar (${Math.round(moodCounts.stable / totalDays * 100)}%)
- Nedstämd: ${moodCounts.depressed} dagar (${Math.round(moodCounts.depressed / totalDays * 100)}%)

🛌 Sömn: ${sleepCounts.good} bra, ${sleepCounts.bad} dåliga (av ${totalDays} incheckningar)
🍽️ Mat: ${eatingCounts.good} bra, ${eatingCounts.bad} dåliga (av ${totalDays} incheckningar)
🏋️ Träning: ${exerciseDays} av ${totalDays} incheckade dagar

📈 SENASTE 7 INCHECKNINGARNA: ${recent7Moods.join(', ')}
📈 SENASTE 30 INCHECKNINGARNA: ${recent30Moods.join(', ')}
🔄 Nuvarande streak: ${streak} dagar ${currentMood}

🔗 KORRELATIONER (baserat på incheckad data):
- Dålig sömn följt av nedstämdhet: ${badSleepThenDepressed} gånger
- Bra sömn följt av stabilt/uppvarvat: ${goodSleepThenStable} gånger
- Humörövergångar: ${transitions.slice(-20).join(', ')}

${diagnoses.length > 0 ? `🏥 DIAGNOSER: ${diagnoses.map(d => d.name).join(', ')}` : 'Inga registrerade diagnoser.'}
${characteristics.length > 0 ? `🔍 KÄNNETECKEN:\n${characteristics.map(c => `- ${c.mood_type}: ${c.name}`).join('\n')}` : ''}
${medications.length > 0 ? `💊 MEDICINER: ${medications.map(m => `${m.name} ${m.dosage} (${m.active ? 'aktiv' : 'avslutad'})`).join(', ')}` : ''}
${comments.length > 0 ? `💬 EGNA KOMMENTARER (senaste):\n${comments.slice(-10).join('\n')}` : ''}

Svara med följande struktur i vanlig text (INTE markdown/JSON):

SAMMANFATTNING:
(2-3 meningar som sammanfattar personens mående-mönster baserat på incheckad data)

BAKGRUND & ANALYS:
(Beskriv identifierade mönster, korrelationer mellan sömn/mat/träning och mående. Nämn eventuella cykliska mönster. Basera ALLT på faktisk incheckad data.)

STYRKOR:
(Vad gör personen bra? Vilka positiva mönster finns i den incheckade datan?)

VARNINGSSIGNALER:
(Vilka mönster bör personen vara uppmärksam på? Basera på historisk incheckad data.)

PROGNOS:
(Baserat på nuvarande trend och historiska mönster i incheckningarna, vad kan förväntas den närmaste veckan/månaden?)

REKOMMENDATIONER:
(3-5 konkreta, empatiska förslag baserade på incheckad data. Aldrig medicinsk rådgivning.)`;

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
            content: `Du är en empatisk och intelligent hälsoanalytiker specialiserad på mönsterigenkänning för personer med humörsvängningar. Du analyserar data observationellt och ger insikter utan att vara dömande. Du ger ALDRIG medicinsk rådgivning men kan uppmuntra kontakt med vårdgivare. Svara alltid på svenska. Var varm och stödjande i tonen.`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2500,
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
    const analysis = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({
        analysis,
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

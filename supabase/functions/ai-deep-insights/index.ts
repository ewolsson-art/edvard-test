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
      .select('date, mood, sleep_quality, eating_quality, exercised, exercise_types, comment, exercise_comment, sleep_comment, eating_comment, medication_comment, medication_side_effects, tags')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    // Fetch diagnoses, characteristics, medications, medication_logs
    const [diagRes, charRes, medRes, medLogRes] = await Promise.all([
      supabase.from('diagnoses').select('name, diagnosed_at').eq('user_id', userId),
      supabase.from('characteristics').select('name, mood_type').eq('user_id', userId),
      supabase.from('medications').select('name, dosage, frequency, active, started_at').eq('user_id', userId),
      supabase.from('medication_logs').select('date, medication_id, taken').eq('user_id', userId),
    ]);

    const moodEntries = entries || [];
    const diagnoses = diagRes.data || [];
    const characteristics = charRes.data || [];
    const medications = medRes.data || [];
    const medicationLogs = medLogRes.data || [];

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

    const totalDays = moodEntries.length;
    const firstDate = moodEntries[0]?.date;
    const lastDate = moodEntries[moodEntries.length - 1]?.date;
    const calendarDays = firstDate && lastDate
      ? Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : totalDays;
    const missingDays = calendarDays - totalDays;

    // Mood counts
    const moodCounts = { elevated: 0, stable: 0, depressed: 0 };
    const sleepCounts = { good: 0, bad: 0 };
    const eatingCounts = { good: 0, bad: 0 };
    let exerciseDays = 0;
    const exerciseTypes: Record<string, number> = {};
    const comments: string[] = [];
    const dayOfWeekMoods: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (const e of moodEntries) {
      // Mood
      if (e.mood === 'elevated' || e.mood === 'somewhat_elevated') moodCounts.elevated++;
      else if (e.mood === 'depressed' || e.mood === 'somewhat_depressed') moodCounts.depressed++;
      else moodCounts.stable++;

      // Sleep & eating
      if (e.sleep_quality === 'good') sleepCounts.good++;
      else if (e.sleep_quality === 'bad') sleepCounts.bad++;
      if (e.eating_quality === 'good') eatingCounts.good++;
      else if (e.eating_quality === 'bad') eatingCounts.bad++;

      // Exercise
      if (e.exercised) {
        exerciseDays++;
        if (e.exercise_types) {
          for (const t of e.exercise_types) {
            exerciseTypes[t] = (exerciseTypes[t] || 0) + 1;
          }
        }
      }

      // Day of week patterns
      const dow = new Date(e.date).getDay();
      dayOfWeekMoods[dow].push(e.mood);

      // Comments (all of them for context)
      if (e.comment) comments.push(`${e.date}: ${e.comment}`);
      if (e.sleep_comment) comments.push(`${e.date} (sömn): ${e.sleep_comment}`);
      if (e.eating_comment) comments.push(`${e.date} (kost): ${e.eating_comment}`);
      if (e.exercise_comment) comments.push(`${e.date} (träning): ${e.exercise_comment}`);
      if (e.medication_comment) comments.push(`${e.date} (medicin): ${e.medication_comment}`);
    }

    // Episode analysis (consecutive days in same state)
    const episodes: { mood: string; days: number; start: string; end: string }[] = [];
    let epStart = 0;
    for (let i = 1; i <= moodEntries.length; i++) {
      const prevMood = moodEntries[epStart].mood;
      const prevGroup = (prevMood === 'elevated' || prevMood === 'somewhat_elevated') ? 'elevated'
        : (prevMood === 'depressed' || prevMood === 'somewhat_depressed') ? 'depressed' : 'stable';
      
      let curGroup = '';
      if (i < moodEntries.length) {
        const curMood = moodEntries[i].mood;
        curGroup = (curMood === 'elevated' || curMood === 'somewhat_elevated') ? 'elevated'
          : (curMood === 'depressed' || curMood === 'somewhat_depressed') ? 'depressed' : 'stable';
      }

      if (i === moodEntries.length || curGroup !== prevGroup) {
        episodes.push({
          mood: prevGroup,
          days: i - epStart,
          start: moodEntries[epStart].date,
          end: moodEntries[i - 1].date,
        });
        epStart = i;
      }
    }

    // Average episode lengths
    const episodesByMood: Record<string, number[]> = { elevated: [], stable: [], depressed: [] };
    for (const ep of episodes) {
      episodesByMood[ep.mood]?.push(ep.days);
    }
    const avgEpisodes: Record<string, number> = {};
    for (const [mood, lengths] of Object.entries(episodesByMood)) {
      avgEpisodes[mood] = lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length * 10) / 10 : 0;
    }
    const longestEpisodes: Record<string, number> = {};
    for (const [mood, lengths] of Object.entries(episodesByMood)) {
      longestEpisodes[mood] = lengths.length > 0 ? Math.max(...lengths) : 0;
    }

    // Correlations
    let badSleepThenDepressed = 0;
    let goodSleepThenStable = 0;
    let exerciseThenGoodMood = 0;
    let noExerciseThenBadMood = 0;
    let badEatingThenDepressed = 0;
    for (let i = 0; i < moodEntries.length - 1; i++) {
      const nextMoodGroup = (moodEntries[i + 1].mood === 'depressed' || moodEntries[i + 1].mood === 'somewhat_depressed') ? 'depressed'
        : (moodEntries[i + 1].mood === 'elevated' || moodEntries[i + 1].mood === 'somewhat_elevated') ? 'elevated' : 'stable';
      
      if (moodEntries[i].sleep_quality === 'bad' && nextMoodGroup === 'depressed') badSleepThenDepressed++;
      if (moodEntries[i].sleep_quality === 'good' && nextMoodGroup !== 'depressed') goodSleepThenStable++;
      if (moodEntries[i].exercised && nextMoodGroup !== 'depressed') exerciseThenGoodMood++;
      if (moodEntries[i].exercised === false && nextMoodGroup === 'depressed') noExerciseThenBadMood++;
      if (moodEntries[i].eating_quality === 'bad' && nextMoodGroup === 'depressed') badEatingThenDepressed++;
    }

    // Current streak
    let currentMood = moodEntries[moodEntries.length - 1]?.mood;
    const currentGroup = (currentMood === 'elevated' || currentMood === 'somewhat_elevated') ? 'elevated'
      : (currentMood === 'depressed' || currentMood === 'somewhat_depressed') ? 'depressed' : 'stable';
    let streak = 0;
    for (let i = moodEntries.length - 1; i >= 0; i--) {
      const g = (moodEntries[i].mood === 'elevated' || moodEntries[i].mood === 'somewhat_elevated') ? 'elevated'
        : (moodEntries[i].mood === 'depressed' || moodEntries[i].mood === 'somewhat_depressed') ? 'depressed' : 'stable';
      if (g === currentGroup) streak++;
      else break;
    }

    // Recent windows
    const last7 = moodEntries.slice(-7);
    const last14 = moodEntries.slice(-14);
    const last30 = moodEntries.slice(-30);

    const windowSummary = (window: typeof moodEntries) => {
      const m = { elevated: 0, stable: 0, depressed: 0 };
      let sleep_good = 0, sleep_bad = 0, exercise = 0, eat_good = 0, eat_bad = 0;
      for (const e of window) {
        if (e.mood === 'elevated' || e.mood === 'somewhat_elevated') m.elevated++;
        else if (e.mood === 'depressed' || e.mood === 'somewhat_depressed') m.depressed++;
        else m.stable++;
        if (e.sleep_quality === 'good') sleep_good++;
        else if (e.sleep_quality === 'bad') sleep_bad++;
        if (e.exercised) exercise++;
        if (e.eating_quality === 'good') eat_good++;
        else if (e.eating_quality === 'bad') eat_bad++;
      }
      return { total: window.length, mood: m, sleep_good, sleep_bad, exercise, eat_good, eat_bad };
    };

    // Day-of-week analysis
    const dowNames = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
    const dowSummary = Object.entries(dayOfWeekMoods).map(([dow, moods]) => {
      const dep = moods.filter(m => m === 'depressed' || m === 'somewhat_depressed').length;
      const elev = moods.filter(m => m === 'elevated' || m === 'somewhat_elevated').length;
      return `${dowNames[Number(dow)]}: ${moods.length}d (${dep} nedstämd, ${elev} uppvarvad)`;
    }).join(', ');

    // Medication adherence
    const activeMeds = medications.filter(m => m.active);
    const medAdherence = activeMeds.length > 0
      ? `${activeMeds.length} aktiva mediciner. Loggade doser: ${medicationLogs.filter(l => l.taken).length} av ${medicationLogs.length} totalt.`
      : 'Inga aktiva mediciner.';

    // Side effects
    const allSideEffects = moodEntries
      .filter(e => e.medication_side_effects && e.medication_side_effects.length > 0)
      .flatMap(e => e.medication_side_effects || []);
    const sideEffectCounts: Record<string, number> = {};
    for (const se of allSideEffects) {
      sideEffectCounts[se] = (sideEffectCounts[se] || 0) + 1;
    }

    // Build the last 5 episodes for context
    const recentEpisodes = episodes.slice(-5).map(ep => 
      `${ep.mood} ${ep.days}d (${ep.start}–${ep.end})`
    ).join(' → ');

    const dateRange = `${firstDate} till ${lastDate}`;
    const w7 = windowSummary(last7);
    const w14 = windowSummary(last14);
    const w30 = windowSummary(last30);

    const prompt = `Analysera följande patientdata och svara ENBART med giltig JSON.

VIKTIGT: Basera analysen ENBART på de ${totalDays} incheckade dagarna av ${calendarDays} kalenderdagar (${dateRange}).

📊 TOTALT (${totalDays} dagar):
Uppvarvad: ${moodCounts.elevated} (${Math.round(moodCounts.elevated / totalDays * 100)}%)
Stabil: ${moodCounts.stable} (${Math.round(moodCounts.stable / totalDays * 100)}%)
Nedstämd: ${moodCounts.depressed} (${Math.round(moodCounts.depressed / totalDays * 100)}%)
Sömn: ${sleepCounts.good} bra / ${sleepCounts.bad} dåliga
Kost: ${eatingCounts.good} bra / ${eatingCounts.bad} dåliga
Träning: ${exerciseDays} av ${totalDays} dagar${Object.keys(exerciseTypes).length > 0 ? ` (${Object.entries(exerciseTypes).map(([t, c]) => `${t}: ${c}`).join(', ')})` : ''}

📈 SENASTE 7 DAGAR: ${JSON.stringify(w7)}
📈 SENASTE 14 DAGAR: ${JSON.stringify(w14)}
📈 SENASTE 30 DAGAR: ${JSON.stringify(w30)}

🔄 EPISODER (senaste 5): ${recentEpisodes}
📏 Genomsnittlig episodlängd: uppvarvad ${avgEpisodes.elevated}d, stabil ${avgEpisodes.stable}d, nedstämd ${avgEpisodes.depressed}d
📏 Längsta episod: uppvarvad ${longestEpisodes.elevated}d, stabil ${longestEpisodes.stable}d, nedstämd ${longestEpisodes.depressed}d
🔥 Nuvarande streak: ${streak} dagar ${currentGroup}

🔗 KORRELATIONER:
Dålig sömn → nedstämd nästa dag: ${badSleepThenDepressed}x
Bra sömn → stabil/uppvarvad: ${goodSleepThenStable}x
Träning → bra humör nästa dag: ${exerciseThenGoodMood}x
Ingen träning → nedstämd: ${noExerciseThenBadMood}x
Dålig kost → nedstämd: ${badEatingThenDepressed}x

📅 VECKODAGSMÖNSTER: ${dowSummary}

💊 MEDICIN: ${medAdherence}
${Object.keys(sideEffectCounts).length > 0 ? `Biverkningar: ${Object.entries(sideEffectCounts).map(([se, c]) => `${se} (${c}x)`).join(', ')}` : ''}

${diagnoses.length > 0 ? `🏥 Diagnoser: ${diagnoses.map(d => `${d.name}${d.diagnosed_at ? ` (${d.diagnosed_at})` : ''}`).join(', ')}` : ''}
${characteristics.length > 0 ? `🔍 Kännetecken: ${characteristics.map(c => `${c.mood_type}: ${c.name}`).join(', ')}` : ''}
${comments.length > 0 ? `💬 Senaste kommentarer: ${comments.slice(-10).join(' | ')}` : ''}

Svara med EXAKT denna JSON-struktur (på svenska). Använd SPECIFIKA siffror och procent istället för vaga beskrivningar:
{
  "status": "good" | "warning" | "alert",
  "statusLabel": "2-3 ord, t.ex. 'Stabilt läge'",
  "statusDescription": "EN kort mening med siffror",
  "trendDirection": "improving" | "declining" | "stable" | "fluctuating",
  "trendLabel": "kort med siffror, t.ex. '3 av 7 dagar stabila'",
  "keyNumbers": [
    { "value": "siffra eller %", "label": "kort etikett (2-3 ord)", "type": "positive" | "negative" | "neutral" }
  ],
  "patterns": [
    { "icon": "sleep" | "exercise" | "mood" | "eating" | "correlation" | "calendar", "label": "kort mönster MED siffra", "impact": "positive" | "negative" | "neutral", "detail": "en extra detalj-mening" }
  ],
  "prognosis": {
    "shortTerm": "en mening med konkret förväntan",
    "longTerm": "en mening med konkret förväntan",
    "confidence": "low" | "medium" | "high"
  },
  "riskLevel": 0-100,
  "strengths": ["kort styrka med siffra"],
  "warnings": ["kort varning med siffra"]
}

Ge 3-5 keyNumbers (de viktigaste nyckeltalen). Ge 3-5 patterns. Max 3 strengths, max 2 warnings. Var specifik med siffror. Kort och koncist.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du är en datadriven hälsoanalytiker. Svara ENBART med giltig JSON. Basera allt på faktiska siffror. Ge ALDRIG medicinsk rådgivning. Svara på svenska. Var specifik – använd procent och antal istället för ord som "ofta" eller "ibland".`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
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
          calendarDays,
          dateRange,
          moodCounts,
          sleepCounts,
          eatingCounts,
          exerciseDays,
          currentStreak: streak,
          currentMood: currentGroup,
          avgEpisodes,
          registrationRate: Math.round((totalDays / calendarDays) * 100),
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

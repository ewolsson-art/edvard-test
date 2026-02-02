import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SummaryData {
  period: string;
  viewType: string;
  totalDaysWithData: number;
  moodCounts: { elevated: number; stable: number; depressed: number };
  sleepCounts: { good: number; bad: number };
  eatingCounts: { good: number; bad: number };
  exerciseDays: number;
  consecutivePatterns: string[];
  sleepMoodCorrelation: { badSleepDepressed: number; goodSleepStable: number };
  stats: { elevated: number; stable: number; depressed: number; total: number };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - no token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user's JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Generating insights for user: ${userId}`);

    const { summaryData } = await req.json() as { summaryData: SummaryData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      // Fallback to local insights if no API key
      const localInsights = generateLocalInsights(summaryData);
      return new Response(
        JSON.stringify({ insights: localInsights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(summaryData);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Du är en stödjande hälsoassistent som analyserar mönster i dagliga incheckningar för att hantera bipolär sjukdom. Svara alltid på svenska. Var empatisk och konstruktiv. Ge aldrig medicinsk rådgivning.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status, await response.text());
      const localInsights = generateLocalInsights(summaryData);
      return new Response(
        JSON.stringify({ insights: localInsights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || generateLocalInsights(summaryData);

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate insights" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPrompt(data: SummaryData): string {
  return `Analysera följande data för ${data.viewType} (${data.period}) och ge personliga insikter:

📊 MÅENDE:
- Förhöjt: ${data.moodCounts.elevated} dagar
- Stabilt: ${data.moodCounts.stable} dagar  
- Sänkt: ${data.moodCounts.depressed} dagar
- Totalt loggade dagar: ${data.totalDaysWithData}

😴 SÖMN:
- Bra sömn: ${data.sleepCounts.good} dagar
- Dålig sömn: ${data.sleepCounts.bad} dagar

🍽️ KOST:
- Bra matvanor: ${data.eatingCounts.good} dagar
- Sämre matvanor: ${data.eatingCounts.bad} dagar

🏃 TRÄNING:
- Träningsdagar: ${data.exerciseDays}

📈 MÖNSTER:
${data.consecutivePatterns.length > 0 ? data.consecutivePatterns.join('\n') : 'Inga tydliga mönster'}

🔗 KORRELATIONER:
- Dagar med dålig sömn och sänkt mående: ${data.sleepMoodCorrelation.badSleepDepressed}
- Dagar med bra sömn och stabilt/förhöjt mående: ${data.sleepMoodCorrelation.goodSleepStable}

INSTRUKTIONER:
1. Börja med en kort, positiv observation
2. Identifiera 2-3 nyckelinsikter eller mönster
3. Ge 1-2 konkreta tips baserade på datan
4. Avsluta med uppmuntran

Håll svaret kort (max 200 ord), använd emoji sparsamt, och var stödjande utan att ge medicinsk rådgivning. Använd markdown för formatering.`;
}

function generateLocalInsights(data: SummaryData): string {
  const insights: string[] = [];
  const totalMood = data.moodCounts.elevated + data.moodCounts.stable + data.moodCounts.depressed;
  
  // Opening observation
  if (data.moodCounts.stable > totalMood * 0.5) {
    insights.push("✨ **Bra jobbat!** Majoriteten av dina dagar har varit stabila denna period.");
  } else if (data.moodCounts.depressed > data.moodCounts.elevated) {
    insights.push("💙 Du har haft en del tuffare dagar. Det är okej – varje dag du loggar är ett steg framåt.");
  } else {
    insights.push("📊 Tack för att du har loggat regelbundet!");
  }

  // Sleep correlation
  if (data.sleepMoodCorrelation.goodSleepStable > 2) {
    insights.push("\n\n**Mönster upptäckt:** Det verkar finnas ett samband mellan bra sömn och stabilt mående hos dig. Fortsätt prioritera din sömn!");
  }
  
  if (data.sleepMoodCorrelation.badSleepDepressed > 2) {
    insights.push("\n\n**Observation:** Sämre sömn verkar hänga ihop med sänkt mående. Fundera på om det finns sätt att förbättra din sömnrutin.");
  }

  // Exercise insight
  if (data.exerciseDays > 3 && data.viewType === 'vecka') {
    insights.push("\n\n🏃 **Träning:** Du har tränat " + data.exerciseDays + " dagar – fysisk aktivitet kan ha positiv effekt på humöret!");
  } else if (data.exerciseDays < 2 && data.viewType === 'vecka') {
    insights.push("\n\n💡 **Tips:** Även korta promenader kan hjälpa humöret. Försök att röra på dig lite varje dag.");
  }

  // Consecutive patterns
  if (data.consecutivePatterns.length > 0) {
    insights.push("\n\n**Trender:** " + data.consecutivePatterns[0] + ". Att vara medveten om dessa mönster kan hjälpa dig att agera tidigt.");
  }

  // Closing
  insights.push("\n\n---\n*Fortsätt logga dagligen – ju mer data, desto bättre insikter!* 💪");

  return insights.join("");
}

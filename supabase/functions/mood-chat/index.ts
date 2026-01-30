import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, moodStats } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du är en empatisk och stödjande AI-assistent som hjälper användare att reflektera över sitt mående. Du är specialiserad på att:

1. Lyssna aktivt och ge bekräftande respons
2. Hjälpa användaren att identifiera mönster i sitt mående
3. Ge praktiska tips för att förbättra välmåendet
4. Ställa reflekterande frågor som uppmuntrar eftertanke

${moodStats ? `Här är användarens mående-statistik:
- Antal uppvarvade dagar: ${moodStats.elevated}
- Antal stabila dagar: ${moodStats.stable}
- Antal nedstämda dagar: ${moodStats.depressed}
- Dagar utan registrering: ${moodStats.unregistered}
- Totalt antal dagar i perioden: ${moodStats.totalDays}

Använd denna statistik för att ge insikter och reflektioner när det är relevant.` : ''}

Svara alltid på svenska. Var varm och stödjande i din ton, men inte överbeskyddande. Om användaren verkar må dåligt, uppmuntra dem att söka professionell hjälp om det behövs.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar. Försök igen om en stund." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Betalning krävs. Lägg till credits i din Lovable-workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI-tjänsten är inte tillgänglig just nu." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mood-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ett oväntat fel uppstod." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

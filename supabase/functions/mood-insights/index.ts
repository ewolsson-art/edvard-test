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
 
 interface MoodEntry {
   date: string;
   mood: 'elevated' | 'stable' | 'depressed';
   sleep_quality: 'good' | 'bad' | null;
   eating_quality: 'good' | 'bad' | null;
   exercised: boolean | null;
   comment: string | null;
 }
 
 interface HistoricalPattern {
   trigger: string;
   consequence: string;
   occurrences: number;
   averageDaysToConsequence: number;
   lastOccurred: string | null;
 }
 
 interface CurrentWarning {
   type: 'sleep' | 'mood' | 'exercise' | 'eating';
   message: string;
   severity: 'low' | 'medium' | 'high';
   historicalContext: string | null;
 }
 
interface StructuredInsight {
  summary: {
    status: 'good' | 'warning' | 'alert';
    title: string;
    description: string;
  };
  moodTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    dominantMood: 'elevated' | 'stable' | 'depressed';
  };
  riskIndicators: {
    type: 'sleep' | 'exercise' | 'eating' | 'mood';
    label: string;
    currentStreak: number;
    riskLevel: number; // 0-100
    historicalImpact: string | null;
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    icon: 'sleep' | 'exercise' | 'food' | 'warning' | 'calendar' | 'heart';
    title: string;
    description: string;
  }[];
  weeklyComparison: {
    metric: string;
    current: number;
    previous: number;
    change: number;
  }[];
}

 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
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
 
     const token = authHeader.replace("Bearer ", "");
     const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
     
     if (claimsError || !claimsData?.claims) {
       return new Response(
         JSON.stringify({ error: "Unauthorized - invalid token" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const userId = claimsData.claims.sub;
     console.log(`Generating predictive insights for user: ${userId}`);
 
     const { summaryData } = await req.json() as { summaryData: SummaryData };
     
     // Fetch ALL historical mood entries for pattern analysis
     const { data: allEntries, error: entriesError } = await supabase
       .from('mood_entries')
       .select('date, mood, sleep_quality, eating_quality, exercised, comment')
       .eq('user_id', userId)
       .order('date', { ascending: true });
     
     if (entriesError) {
       console.error('Error fetching entries:', entriesError);
     }
     
     const historicalEntries: MoodEntry[] = allEntries || [];
     
     // Analyze historical patterns
     const historicalPatterns = analyzeHistoricalPatterns(historicalEntries);
     const currentWarnings = detectCurrentWarnings(historicalEntries, historicalPatterns);
     
     // Fetch user's characteristics
     const { data: characteristics } = await supabase
       .from('characteristics')
       .select('name, mood_type')
       .eq('user_id', userId);
     
     // Fetch user's diagnoses
     const { data: diagnoses } = await supabase
       .from('diagnoses')
       .select('name')
       .eq('user_id', userId);
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
 
     if (!LOVABLE_API_KEY) {
       const localInsights = generateLocalInsights(summaryData, historicalPatterns, currentWarnings);
        const structuredData = buildStructuredInsights(summaryData, historicalPatterns, currentWarnings, historicalEntries);
       return new Response(
          JSON.stringify({ 
            insights: localInsights, 
            warnings: currentWarnings, 
            patternsDetected: historicalPatterns.length,
            structured: structuredData
          }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const prompt = buildPrompt(summaryData, historicalPatterns, currentWarnings, characteristics || [], diagnoses || [], historicalEntries.length);
     
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           {
             role: "system",
             content: `Du är en intelligent hälsoassistent specialiserad på mönsterigenkänning för personer med humörstörningar.
 
 Din uppgift är att:
 1. Identifiera varningssignaler baserat på historiska mönster
 2. Jämföra nuvarande beteenden med tidigare perioder som ledde till humörsvängningar
 3. Ge tidiga varningar när du ser mönster som tidigare lett till uppvarvade eller nedstämda perioder
 4. Vara stödjande och empatisk, men tydlig med varningar
 
 Svara alltid på svenska. Ge aldrig medicinsk rådgivning, men uppmuntra att kontakta vårdgivare vid behov.`,
           },
           { role: "user", content: prompt },
         ],
         max_tokens: 1500,
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("AI API error:", response.status, errorText);
       
       if (response.status === 429) {
         return new Response(
           JSON.stringify({ error: "För många förfrågningar. Vänta en stund och försök igen." }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (response.status === 402) {
         return new Response(
           JSON.stringify({ error: "AI-krediter slut. Kontakta support." }),
           { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       
       const localInsights = generateLocalInsights(summaryData, historicalPatterns, currentWarnings);
       return new Response(
         JSON.stringify({ insights: localInsights, warnings: currentWarnings }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const data = await response.json();
     const insights = data.choices?.[0]?.message?.content || generateLocalInsights(summaryData, historicalPatterns, currentWarnings);
      const structuredData = buildStructuredInsights(summaryData, historicalPatterns, currentWarnings, historicalEntries);
 
     return new Response(
        JSON.stringify({ 
          insights, 
          warnings: currentWarnings, 
          patternsDetected: historicalPatterns.length,
          structured: structuredData
        }),
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
 
 function analyzeHistoricalPatterns(entries: MoodEntry[]): HistoricalPattern[] {
   const patterns: HistoricalPattern[] = [];
   if (entries.length < 14) return patterns;
   
   patterns.push(...findSleepToMoodPatterns(entries));
   patterns.push(...findMoodTransitionPatterns(entries));
   patterns.push(...findExercisePatterns(entries));
   
   return patterns;
 }
 
 function findSleepToMoodPatterns(entries: MoodEntry[]): HistoricalPattern[] {
   const patterns: HistoricalPattern[] = [];
   let badSleepStreak = 0;
   let badSleepToElevatedCount = 0;
   let badSleepToDepressedCount = 0;
   let daysToElevatedSum = 0;
   let daysToDepressedSum = 0;
   let lastElevatedDate: string | null = null;
   let lastDepressedDate: string | null = null;
   
   for (let i = 0; i < entries.length; i++) {
     const entry = entries[i];
     
     if (entry.sleep_quality === 'bad') {
       badSleepStreak++;
     } else {
       if (badSleepStreak >= 3) {
         for (let j = i; j < Math.min(i + 7, entries.length); j++) {
           if (entries[j].mood === 'elevated') {
             badSleepToElevatedCount++;
             daysToElevatedSum += (j - i);
             lastElevatedDate = entries[j].date;
             break;
           }
           if (entries[j].mood === 'depressed') {
             badSleepToDepressedCount++;
             daysToDepressedSum += (j - i);
             lastDepressedDate = entries[j].date;
             break;
           }
         }
       }
       badSleepStreak = 0;
     }
   }
   
   if (badSleepToElevatedCount >= 2) {
     patterns.push({
       trigger: 'Dålig sömn i flera dagar',
       consequence: 'Uppvarvad/förhöjd period',
       occurrences: badSleepToElevatedCount,
       averageDaysToConsequence: Math.round(daysToElevatedSum / badSleepToElevatedCount),
       lastOccurred: lastElevatedDate,
     });
   }
   
   if (badSleepToDepressedCount >= 2) {
     patterns.push({
       trigger: 'Dålig sömn i flera dagar',
       consequence: 'Nedstämd period',
       occurrences: badSleepToDepressedCount,
       averageDaysToConsequence: Math.round(daysToDepressedSum / badSleepToDepressedCount),
       lastOccurred: lastDepressedDate,
     });
   }
   
   return patterns;
 }
 
 function findMoodTransitionPatterns(entries: MoodEntry[]): HistoricalPattern[] {
   const patterns: HistoricalPattern[] = [];
   let stableStreak = 0;
   let stableToElevatedCount = 0;
   let daysInStableBeforeElevated: number[] = [];
   let depressedToElevatedCount = 0;
   
   for (let i = 0; i < entries.length - 1; i++) {
     const current = entries[i];
     const next = entries[i + 1];
     
     if (current.mood === 'stable') {
       stableStreak++;
     } else if (current.mood === 'depressed' && next.mood === 'elevated') {
       depressedToElevatedCount++;
     }
     
     if (current.mood === 'stable' && next.mood === 'elevated') {
       stableToElevatedCount++;
       daysInStableBeforeElevated.push(stableStreak);
       stableStreak = 0;
     } else if (current.mood !== 'stable') {
       stableStreak = 0;
     }
   }
   
   if (stableToElevatedCount >= 2 && daysInStableBeforeElevated.length > 0) {
     const avgDays = Math.round(daysInStableBeforeElevated.reduce((a, b) => a + b, 0) / daysInStableBeforeElevated.length);
     patterns.push({
       trigger: `Stabil period (genomsnitt ${avgDays} dagar)`,
       consequence: 'Övergång till uppvarvad period',
       occurrences: stableToElevatedCount,
       averageDaysToConsequence: avgDays,
       lastOccurred: null,
     });
   }
   
   if (depressedToElevatedCount >= 2) {
     patterns.push({
       trigger: 'Snabb övergång från nedstämd',
       consequence: 'Uppvarvad period (möjlig rapid cycling)',
       occurrences: depressedToElevatedCount,
       averageDaysToConsequence: 1,
       lastOccurred: null,
     });
   }
   
   return patterns;
 }
 
 function findExercisePatterns(entries: MoodEntry[]): HistoricalPattern[] {
   const patterns: HistoricalPattern[] = [];
   let noExerciseStreak = 0;
   let noExerciseToDepressedCount = 0;
   
   for (let i = 0; i < entries.length; i++) {
     if (!entries[i].exercised) {
       noExerciseStreak++;
     } else {
       if (noExerciseStreak >= 5) {
         let depressedInPeriod = 0;
         for (let j = Math.max(0, i - noExerciseStreak); j < i; j++) {
           if (entries[j].mood === 'depressed') depressedInPeriod++;
         }
         if (depressedInPeriod >= noExerciseStreak * 0.4) {
           noExerciseToDepressedCount++;
         }
       }
       noExerciseStreak = 0;
     }
   }
   
   if (noExerciseToDepressedCount >= 2) {
     patterns.push({
       trigger: 'Ingen träning på 5+ dagar',
       consequence: 'Ökat antal nedstämda dagar',
       occurrences: noExerciseToDepressedCount,
       averageDaysToConsequence: 5,
       lastOccurred: null,
     });
   }
   
   return patterns;
 }
 
 function detectCurrentWarnings(entries: MoodEntry[], patterns: HistoricalPattern[]): CurrentWarning[] {
   const warnings: CurrentWarning[] = [];
   if (entries.length < 3) return warnings;
   
   const recentEntries = entries.slice(-7);
   
   // Check current sleep streak
   let currentBadSleepStreak = 0;
   for (let i = recentEntries.length - 1; i >= 0; i--) {
     if (recentEntries[i].sleep_quality === 'bad') {
       currentBadSleepStreak++;
     } else {
       break;
     }
   }
   
   const sleepPattern = patterns.find(p => p.trigger.includes('sömn'));
   if (currentBadSleepStreak >= 3 && sleepPattern) {
     warnings.push({
       type: 'sleep',
       message: `Du har haft dålig sömn ${currentBadSleepStreak} dagar i rad`,
       severity: currentBadSleepStreak >= 5 ? 'high' : 'medium',
       historicalContext: `Förra gången detta hände (${sleepPattern.occurrences} gånger tidigare) ledde det till ${sleepPattern.consequence.toLowerCase()} inom ca ${sleepPattern.averageDaysToConsequence} dagar.`,
     });
   } else if (currentBadSleepStreak >= 3) {
     warnings.push({
       type: 'sleep',
       message: `Du har haft dålig sömn ${currentBadSleepStreak} dagar i rad`,
       severity: 'medium',
       historicalContext: null,
     });
   }
   
   // Check no exercise streak
   let noExerciseStreak = 0;
   for (let i = recentEntries.length - 1; i >= 0; i--) {
     if (!recentEntries[i].exercised) {
       noExerciseStreak++;
     } else {
       break;
     }
   }
   
   const exercisePattern = patterns.find(p => p.trigger.includes('träning'));
   if (noExerciseStreak >= 5 && exercisePattern) {
     warnings.push({
       type: 'exercise',
       message: `Ingen träning på ${noExerciseStreak} dagar`,
       severity: 'medium',
       historicalContext: `Tidigare har brist på träning lett till ${exercisePattern.consequence.toLowerCase()}.`,
     });
   }
   
   // Check mood trend
   const recentMoods = recentEntries.map(e => e.mood);
   const elevatedCount = recentMoods.filter(m => m === 'elevated').length;
   const depressedCount = recentMoods.filter(m => m === 'depressed').length;
   
   if (elevatedCount >= 3) {
     warnings.push({
       type: 'mood',
       message: `${elevatedCount} av de senaste 7 dagarna har varit uppvarvade`,
       severity: elevatedCount >= 5 ? 'high' : 'medium',
       historicalContext: 'Var uppmärksam på sömnbehov och aktivitetsnivå.',
     });
   }
   
   if (depressedCount >= 4) {
     warnings.push({
       type: 'mood',
       message: `${depressedCount} av de senaste 7 dagarna har varit nedstämda`,
       severity: depressedCount >= 5 ? 'high' : 'medium',
       historicalContext: 'Överväg att kontakta din vårdgivare om trenden fortsätter.',
     });
   }
   
   return warnings;
 }
 
 function buildPrompt(
   data: SummaryData, 
   patterns: HistoricalPattern[], 
   warnings: CurrentWarning[],
   characteristics: { name: string; mood_type: string }[],
   diagnoses: { name: string }[],
   totalHistoricalDays: number
 ): string {
   const diagnosisText = diagnoses.length > 0 
     ? `Diagnoser: ${diagnoses.map(d => d.name).join(', ')}`
     : 'Inga registrerade diagnoser';
   
   const characteristicsText = characteristics.length > 0
     ? `\nPersonliga kännetecken:\n${characteristics.map(c => `- ${c.mood_type}: ${c.name}`).join('\n')}`
     : '';
   
   const patternsText = patterns.length > 0
     ? `\n📊 IDENTIFIERADE HISTORISKA MÖNSTER (baserat på ${totalHistoricalDays} dagars data):\n${patterns.map(p => 
         `- "${p.trigger}" → "${p.consequence}" (inträffat ${p.occurrences} gånger, genomsnitt ${p.averageDaysToConsequence} dagar)`
       ).join('\n')}`
     : '\nInga tydliga historiska mönster identifierade ännu (mer data behövs).';
   
   const warningsText = warnings.length > 0
     ? `\n⚠️ AKTIVA VARNINGAR:\n${warnings.map(w => 
         `- [${w.severity.toUpperCase()}] ${w.message}${w.historicalContext ? ` - ${w.historicalContext}` : ''}`
       ).join('\n')}`
     : '\nInga aktiva varningar just nu.';
 
   return `Analysera följande data för ${data.viewType} (${data.period}) och ge prediktiva insikter:
 
 👤 PATIENTPROFIL:
 ${diagnosisText}${characteristicsText}
 
 📊 MÅENDE DENNA PERIOD:
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
 ${patternsText}
 ${warningsText}
 
 🔗 KORRELATIONER:
 - Dagar med dålig sömn och sänkt mående: ${data.sleepMoodCorrelation.badSleepDepressed}
 - Dagar med bra sömn och stabilt/förhöjt mående: ${data.sleepMoodCorrelation.goodSleepStable}
 
 INSTRUKTIONER:
 1. OM det finns aktiva varningar: Börja med en tydlig men empatisk varning som refererar till historiska mönster
 2. Referera till specifika historiska mönster när du ger råd (t.ex. "Förra gången du hade dålig sömn 5 dagar i rad ledde det till...")
 3. Identifiera tidiga varningssignaler och vad de historiskt sett har lett till
 4. Ge 2-3 konkreta, förebyggande åtgärder
 5. Om inga varningar finns: Bekräfta vad som går bra och uppmuntra till fortsatt loggning
 
 Håll svaret kort (max 300 ord), använd emoji sparsamt, och var stödjande men tydlig med varningar. Använd markdown för formatering.`;
 }
 
 function generateLocalInsights(data: SummaryData, patterns: HistoricalPattern[], warnings: CurrentWarning[]): string {
   const insights: string[] = [];
   
   if (warnings.length > 0) {
     const highWarnings = warnings.filter(w => w.severity === 'high');
     const mediumWarnings = warnings.filter(w => w.severity === 'medium');
     
     if (highWarnings.length > 0) {
       insights.push("⚠️ **Viktigt att vara uppmärksam:**\n");
       highWarnings.forEach(w => {
         insights.push(`- ${w.message}`);
         if (w.historicalContext) insights.push(`  *${w.historicalContext}*`);
       });
       insights.push("");
     }
     
     if (mediumWarnings.length > 0 && highWarnings.length === 0) {
       insights.push("📊 **Observation:**\n");
       mediumWarnings.forEach(w => {
         insights.push(`- ${w.message}`);
         if (w.historicalContext) insights.push(`  *${w.historicalContext}*`);
       });
       insights.push("");
     }
   }
   
   if (patterns.length > 0) {
     insights.push("**Mönster i din historik:**\n");
     patterns.slice(0, 3).forEach(p => {
       insights.push(`- ${p.trigger} har tidigare lett till ${p.consequence.toLowerCase()} (${p.occurrences} gånger)`);
     });
     insights.push("");
   }
   
   const totalMood = data.moodCounts.elevated + data.moodCounts.stable + data.moodCounts.depressed;
   if (totalMood > 0) {
     if (data.moodCounts.stable > totalMood * 0.5) {
       insights.push("✨ Majoriteten av dina dagar har varit stabila denna period.\n");
     } else if (data.moodCounts.depressed > data.moodCounts.elevated) {
       insights.push("💙 Du har haft en del tuffare dagar. Varje dag du loggar hjälper dig att förstå dina mönster.\n");
     }
   }
   
   if (data.sleepMoodCorrelation.badSleepDepressed > 2) {
     insights.push("**Samband:** Sämre sömn verkar hänga ihop med sänkt mående hos dig.\n");
   }
   
   if (warnings.length === 0) {
     insights.push("---\n*Inga varningssignaler just nu. Fortsätt logga dagligen!* 💪");
   } else {
     insights.push("---\n*Var uppmärksam på dessa signaler och tveka inte att kontakta din vårdgivare vid behov.*");
   }
   
   return insights.join("\n");
 }

function buildStructuredInsights(
  data: SummaryData, 
  patterns: HistoricalPattern[], 
  warnings: CurrentWarning[],
  entries: MoodEntry[]
): StructuredInsight {
  const recentEntries = entries.slice(-7);
  const previousEntries = entries.slice(-14, -7);
  
  // Calculate mood trend
  const totalMood = data.moodCounts.elevated + data.moodCounts.stable + data.moodCounts.depressed;
  let dominantMood: 'elevated' | 'stable' | 'depressed' = 'stable';
  let dominantPercentage = 0;
  
  if (totalMood > 0) {
    if (data.moodCounts.elevated >= data.moodCounts.stable && data.moodCounts.elevated >= data.moodCounts.depressed) {
      dominantMood = 'elevated';
      dominantPercentage = Math.round((data.moodCounts.elevated / totalMood) * 100);
    } else if (data.moodCounts.depressed > data.moodCounts.stable) {
      dominantMood = 'depressed';
      dominantPercentage = Math.round((data.moodCounts.depressed / totalMood) * 100);
    } else {
      dominantMood = 'stable';
      dominantPercentage = Math.round((data.moodCounts.stable / totalMood) * 100);
    }
  }
  
  // Determine mood direction
  const recentElevated = recentEntries.filter(e => e.mood === 'elevated').length;
  const previousElevated = previousEntries.filter(e => e.mood === 'elevated').length;
  const recentDepressed = recentEntries.filter(e => e.mood === 'depressed').length;
  const previousDepressed = previousEntries.filter(e => e.mood === 'depressed').length;
  
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (recentElevated > previousElevated + 1) direction = 'up';
  else if (recentDepressed > previousDepressed + 1) direction = 'down';
  
  // Build risk indicators
  const riskIndicators: StructuredInsight['riskIndicators'] = [];
  
  // Sleep risk
  let badSleepStreak = 0;
  for (let i = recentEntries.length - 1; i >= 0; i--) {
    if (recentEntries[i].sleep_quality === 'bad') badSleepStreak++;
    else break;
  }
  
  const sleepPattern = patterns.find(p => p.trigger.includes('sömn'));
  riskIndicators.push({
    type: 'sleep',
    label: 'Sömnkvalitet',
    currentStreak: badSleepStreak,
    riskLevel: Math.min(100, badSleepStreak * 20),
    historicalImpact: sleepPattern 
      ? `Historiskt har ${sleepPattern.occurrences} perioder med dålig sömn lett till ${sleepPattern.consequence.toLowerCase()}`
      : null
  });
  
  // Exercise risk
  let noExerciseStreak = 0;
  for (let i = recentEntries.length - 1; i >= 0; i--) {
    if (!recentEntries[i].exercised) noExerciseStreak++;
    else break;
  }
  
  const exercisePattern = patterns.find(p => p.trigger.includes('träning'));
  riskIndicators.push({
    type: 'exercise',
    label: 'Fysisk aktivitet',
    currentStreak: noExerciseStreak,
    riskLevel: Math.min(100, noExerciseStreak * 15),
    historicalImpact: exercisePattern
      ? `Brist på träning har tidigare lett till ${exercisePattern.consequence.toLowerCase()}`
      : null
  });
  
  // Eating risk
  let badEatingStreak = 0;
  for (let i = recentEntries.length - 1; i >= 0; i--) {
    if (recentEntries[i].eating_quality === 'bad') badEatingStreak++;
    else break;
  }
  
  riskIndicators.push({
    type: 'eating',
    label: 'Matvanor',
    currentStreak: badEatingStreak,
    riskLevel: Math.min(100, badEatingStreak * 15),
    historicalImpact: null
  });
  
  // Mood stability risk
  const moodChanges = recentEntries.reduce((acc, entry, i) => {
    if (i > 0 && entry.mood !== recentEntries[i-1].mood) acc++;
    return acc;
  }, 0);
  
  riskIndicators.push({
    type: 'mood',
    label: 'Humörstabilitet',
    currentStreak: moodChanges,
    riskLevel: Math.min(100, moodChanges * 25),
    historicalImpact: moodChanges >= 3 ? 'Frekventa humörsvängningar kan indikera instabilitet' : null
  });
  
  // Build recommendations
  const recommendations: StructuredInsight['recommendations'] = [];
  
  const highWarnings = warnings.filter(w => w.severity === 'high');
  const mediumWarnings = warnings.filter(w => w.severity === 'medium');
  
  if (badSleepStreak >= 2) {
    recommendations.push({
      priority: badSleepStreak >= 4 ? 'high' : 'medium',
      icon: 'sleep',
      title: 'Sömn att bevaka',
      description: badSleepStreak >= 4 
        ? `Du har angett dålig sömn ${badSleepStreak} dagar i rad. Sömnen brukar påverka ditt mående.`
        : `${badSleepStreak} dagar med sämre sömn. Värt att hålla koll på.`
    });
  }
  
  if (noExerciseStreak >= 3) {
    recommendations.push({
      priority: noExerciseStreak >= 5 ? 'high' : 'medium',
      icon: 'exercise',
      title: 'Träning',
      description: `Ingen träning loggad på ${noExerciseStreak} dagar. Fysisk aktivitet brukar hjälpa ditt mående.`
    });
  }
  
  if (dominantMood === 'elevated' && dominantPercentage > 50) {
    recommendations.push({
      priority: dominantPercentage > 70 ? 'high' : 'medium',
      icon: 'warning',
      title: 'Förhöjt mående',
      description: `Du har angett förhöjt mående ${dominantPercentage}% av dagarna. Håll lite koll på det.`
    });
  }
  
  if (dominantMood === 'depressed' && dominantPercentage > 50) {
    recommendations.push({
      priority: dominantPercentage > 70 ? 'high' : 'medium',
      icon: 'heart',
      title: 'Sänkt mående',
      description: `Du har angett sänkt mående ${dominantPercentage}% av dagarna. Det kan vara värt att prata med någon.`
    });
  }
  
  // Add eating recommendation if streak
  if (badEatingStreak >= 2) {
    recommendations.push({
      priority: 'low',
      icon: 'food',
      title: 'Matvanor',
      description: `${badEatingStreak} dagar med sämre matvanor loggade.`
    });
  }
  
  // Add mood stability observation
  if (moodChanges >= 3) {
    recommendations.push({
      priority: 'medium',
      icon: 'warning',
      title: 'Humörvariation',
      description: 'Ditt mående har varierat en del senaste veckan. Fortsätt logga för att se mönster.'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      icon: 'calendar',
      title: 'Fortsätt logga',
      description: 'Inga tydliga varningssignaler just nu. Bra jobbat med loggningen!'
    });
  }
  
  // Weekly comparison
  const weeklyComparison: StructuredInsight['weeklyComparison'] = [];
  
  const currentSleep = recentEntries.filter(e => e.sleep_quality === 'good').length;
  const previousSleep = previousEntries.filter(e => e.sleep_quality === 'good').length;
  weeklyComparison.push({
    metric: 'Bra sömn',
    current: currentSleep,
    previous: previousSleep,
    change: previousSleep > 0 ? Math.round(((currentSleep - previousSleep) / previousSleep) * 100) : 0
  });
  
  const currentExercise = recentEntries.filter(e => e.exercised).length;
  const previousExercise = previousEntries.filter(e => e.exercised).length;
  weeklyComparison.push({
    metric: 'Träning',
    current: currentExercise,
    previous: previousExercise,
    change: previousExercise > 0 ? Math.round(((currentExercise - previousExercise) / previousExercise) * 100) : 0
  });
  
  const currentStable = recentEntries.filter(e => e.mood === 'stable').length;
  const previousStable = previousEntries.filter(e => e.mood === 'stable').length;
  weeklyComparison.push({
    metric: 'Stabila dagar',
    current: currentStable,
    previous: previousStable,
    change: previousStable > 0 ? Math.round(((currentStable - previousStable) / previousStable) * 100) : 0
  });
  
  // Build summary
  let status: 'good' | 'warning' | 'alert' = 'good';
  let title = 'Stabilt läge';
  let description = 'Inga varningssignaler just nu. Fortsätt med dina rutiner.';
  
  if (highWarnings.length > 0) {
    status = 'alert';
    title = 'Var uppmärksam';
    description = highWarnings[0].message + (highWarnings[0].historicalContext ? '. ' + highWarnings[0].historicalContext : '');
  } else if (mediumWarnings.length > 0) {
    status = 'warning';
    title = 'Observation';
    description = mediumWarnings[0].message;
  } else if (dominantMood === 'stable' && dominantPercentage > 60) {
    status = 'good';
    title = 'Bra period';
    description = `${dominantPercentage}% stabila dagar. Dina rutiner fungerar.`;
  }
  
  return {
    summary: { status, title, description },
    moodTrend: { direction, percentage: dominantPercentage, dominantMood },
    riskIndicators,
    recommendations,
    weeklyComparison
  };
}
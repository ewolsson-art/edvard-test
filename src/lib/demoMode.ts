import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

/**
 * Demo-läge: skapar ett anonymt konto via Supabase och seedar ~90 dagars
 * realistisk historik så användaren direkt ser översikt, kalender, mönster
 * och insikter. Inga uppgifter, en knapptryckning.
 */

const MOODS = [
  "very_depressed",
  "depressed",
  "somewhat_depressed",
  "stable",
  "somewhat_elevated",
  "elevated",
  "very_elevated",
] as const;

type Mood = typeof MOODS[number];

// Deterministisk pseudo-random så varje demo-konto ser likadant ut
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type DayEntry = {
  mood: Mood;
  energy: "low" | "normal" | "high";
  sleep: "very_poor" | "poor" | "ok" | "good" | "very_good";
  eating: "very_low" | "low" | "normal" | "high" | "very_high";
  exercised: boolean;
  exercise_types: string[];
  tags: string[];
  comment: string | null;
  side_effects: string[];
};

// Skapar 90 dagar: två milda hypomani-perioder, en längre nedstämd period,
// resten stabilt. Återspeglar typ II-mönster utan att bli dramatiskt.
function buildScript(days: number): DayEntry[] {
  const rand = mulberry32(42);
  const script: DayEntry[] = [];

  // Definiera "episodfönster" (relativa dag-index från start)
  const lowStart = days - 75; // ~2 veckor nedstämd
  const lowEnd = lowStart + 14;
  const hypoStart = days - 50;
  const hypoEnd = hypoStart + 8;
  const hypo2Start = days - 20;
  const hypo2End = hypo2Start + 5;

  const positiveTags = ["Lugn", "Fokuserad", "Tacksam", "Närvarande", "Glad"];
  const elevatedTags = ["Energisk", "Social", "Kreativ", "Tankeflöde", "Pratsam", "Lite för mycket"];
  const lowTags = ["Trött", "Nedstämd", "Tung", "Isolerad", "Stress", "Orolig"];
  const exerciseTypes = ["Promenad", "Yoga", "Styrka", "Löpning", "Cykling"];
  const sideEffects = ["Trötthet", "Muntorrhet", "Yrsel"];

  for (let i = 0; i < days; i++) {
    let mood: Mood;
    let baseTags: string[];
    let energyBias: number; // 0 low ... 1 high

    if (i >= lowStart && i < lowEnd) {
      const r = rand();
      mood = r < 0.25 ? "depressed" : r < 0.85 ? "somewhat_depressed" : "stable";
      baseTags = lowTags;
      energyBias = 0.15;
    } else if ((i >= hypoStart && i < hypoEnd) || (i >= hypo2Start && i < hypo2End)) {
      const r = rand();
      mood = r < 0.2 ? "elevated" : r < 0.85 ? "somewhat_elevated" : "stable";
      baseTags = elevatedTags;
      energyBias = 0.85;
    } else {
      const r = rand();
      mood =
        r < 0.08 ? "somewhat_depressed" :
        r < 0.18 ? "somewhat_elevated" :
        "stable";
      baseTags = positiveTags;
      energyBias = 0.5;
    }

    const energy: DayEntry["energy"] =
      energyBias < 0.3 ? "low" : energyBias > 0.7 ? "high" : rand() < 0.2 ? (rand() < 0.5 ? "low" : "high") : "normal";

    // Sömn följer episod (U-form: hypomani = för lite, deppigt = för mycket eller dåligt)
    let sleep: DayEntry["sleep"];
    if (energyBias > 0.7) {
      sleep = rand() < 0.6 ? "poor" : "ok";
    } else if (energyBias < 0.3) {
      sleep = rand() < 0.4 ? "very_good" : rand() < 0.5 ? "poor" : "ok";
    } else {
      sleep = rand() < 0.7 ? "good" : rand() < 0.5 ? "ok" : "very_good";
    }

    // Aptit (U-form): hypo = lite, depp = lite eller mycket
    let eating: DayEntry["eating"];
    if (energyBias > 0.7) {
      eating = rand() < 0.5 ? "low" : "normal";
    } else if (energyBias < 0.3) {
      eating = rand() < 0.4 ? "low" : rand() < 0.5 ? "high" : "normal";
    } else {
      eating = "normal";
    }

    const exercised = energyBias < 0.3 ? rand() < 0.2 : rand() < 0.55;
    const exercise_types = exercised ? [exerciseTypes[Math.floor(rand() * exerciseTypes.length)]] : [];

    const tagCount = Math.floor(rand() * 2) + (mood === "stable" ? 0 : 1);
    const tags: string[] = [];
    for (let t = 0; t < tagCount; t++) {
      const tag = baseTags[Math.floor(rand() * baseTags.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }

    const comments = energyBias < 0.3
      ? ["Tung morgon", "Orkade inte mycket idag", "Behövde sova länge"]
      : energyBias > 0.7
        ? ["Massor av idéer", "Svårt att varva ner", "Pratade non-stop"]
        : ["Bra dag", "Lugnt och fint", "Vanlig dag"];
    const comment = rand() < 0.18 ? comments[Math.floor(rand() * comments.length)] : null;

    const side_effects = rand() < 0.08 ? [sideEffects[Math.floor(rand() * sideEffects.length)]] : [];

    script.push({ mood, energy, sleep, eating, exercised, exercise_types, tags, comment, side_effects });
  }

  return script;
}

export async function startDemoSession(): Promise<{ error: Error | null }> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return { error: error ?? new Error("Kunde inte starta demo") };
  }
  const userId = data.user.id;

  try {
    await supabase.auth.updateUser({
      data: { is_demo: true, first_name: "Alex", profile_completed: true },
    });
  } catch { /* ignore */ }

  await supabase.from("profiles").upsert(
    { user_id: userId, first_name: "Alex" },
    { onConflict: "user_id" }
  );

  try {
    // Diagnos
    await supabase.from("diagnoses").insert({
      user_id: userId,
      name: "Bipolär typ II",
      diagnosed_at: format(subDays(new Date(), 540), "yyyy-MM-dd"),
    });

    // Karaktäristika (egna mönster användaren upptäckt)
    const characteristics = [
      { name: "Sover dåligt → uppvarvad nästa dag", mood_type: "elevated" },
      { name: "Sociala sammanhang ger energi", mood_type: "elevated" },
      { name: "Mörka kvällar drar ner mig", mood_type: "depressed" },
      { name: "Promenader hjälper alltid", mood_type: "stable" },
      { name: "Koffein efter 14 = orolig sömn", mood_type: "elevated" },
    ];
    await supabase.from("characteristics").insert(
      characteristics.map((c) => ({ user_id: userId, name: c.name, mood_type: c.mood_type, source: "manual" }))
    );

    // Mediciner: en aktiv stämningsstabiliserare + en utsatt
    const { data: med1 } = await supabase
      .from("medications")
      .insert({
        user_id: userId,
        name: "Lamotrigin",
        dosage: "100 mg",
        frequency: "daily",
        status: "current",
        active: true,
        started_at: format(subDays(new Date(), 180), "yyyy-MM-dd"),
        indication: "Stämningsstabiliserare",
        side_effects: ["Trötthet"],
        effectiveness: "good",
        notes: "Hjälpt mot djupa svackor.",
      })
      .select()
      .single();

    await supabase.from("medications").insert({
      user_id: userId,
      name: "Sertralin",
      dosage: "50 mg",
      frequency: "daily",
      status: "stopped",
      active: false,
      started_at: format(subDays(new Date(), 365), "yyyy-MM-dd"),
      stopped_at: format(subDays(new Date(), 200), "yyyy-MM-dd"),
      indication: "SSRI – utsatt pga risk för uppvarvning",
      stop_reason: "Triggade hypomani",
      effectiveness: "poor",
    });

    // 90 dagars mood-historik
    const days = 90;
    const script = buildScript(days);
    const today = new Date();
    const moodRows = script.map((entry, i) => {
      const date = format(subDays(today, days - 1 - i), "yyyy-MM-dd");
      return {
        user_id: userId,
        date,
        mood: entry.mood,
        energy_level: entry.energy,
        sleep_quality: entry.sleep,
        eating_quality: entry.eating,
        exercised: entry.exercised,
        exercise_types: entry.exercise_types,
        tags: entry.tags,
        comment: entry.comment,
        medication_side_effects: entry.side_effects,
      };
    });
    await supabase.from("mood_entries").insert(moodRows);

    // Medication logs ~88% följsamhet de senaste 180 dagarna
    if (med1?.id) {
      const rand = mulberry32(7);
      const logs: Array<{ user_id: string; medication_id: string; date: string; taken: boolean }> = [];
      for (let i = 0; i < 180; i++) {
        if (rand() < 0.88) {
          logs.push({
            user_id: userId,
            medication_id: med1.id,
            date: format(subDays(today, i), "yyyy-MM-dd"),
            taken: true,
          });
        }
      }
      // Insert i chunks om 500 för att undvika payload-gränser
      for (let i = 0; i < logs.length; i += 500) {
        await supabase.from("medication_logs").insert(logs.slice(i, i + 500));
      }
    }
  } catch (e) {
    console.warn("[demo] seed warning:", e);
  }

  return { error: null };
}

export function isDemoUser(user: { user_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return Boolean(user?.user_metadata?.is_demo);
}

/**
 * Byter rollen för en demo-session. Standardrollen är 'patient' (bipolär)
 * via DB-triggern; den här låter användaren testa anhörig- eller läkarvyn.
 */
export async function setDemoRole(role: "patient" | "relative" | "doctor"): Promise<void> {
  try {
    await supabase.auth.updateUser({ data: { role } });
  } catch { /* ignore */ }
  if (role !== "patient") {
    await supabase.rpc("assign_initial_role", { _role: role });
  }
}

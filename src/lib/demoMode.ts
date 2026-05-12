import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

/**
 * Demo-läge: skapar ett anonymt konto via Supabase och seedar ~14 dagars
 * realistisk historik så användaren direkt ser översikt, kalender och
 * insikter. Inga uppgifter, en knapptryckning.
 *
 * Anonyma konton får en riktig auth.uid() vilket gör att RLS funkar
 * normalt och datat är isolerat per session/enhet.
 */

// Realistisk 14-dagars historik som visar variation utan att vara dramatisk.
// Mix av stable, somewhat_elevated, somewhat_depressed och en topp/dal.
const MOOD_SCRIPT: Array<{
  mood: string;
  energy?: string;
  sleep?: string;
  eating?: string;
  exercised?: boolean;
  tags?: string[];
  comment?: string;
}> = [
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal", exercised: true, tags: ["Lugn", "Fokuserad"] },
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal", exercised: false },
  { mood: "somewhat_elevated", energy: "high", sleep: "ok", eating: "normal", tags: ["Energisk", "Social"] },
  { mood: "somewhat_elevated", energy: "high", sleep: "poor", eating: "low", exercised: true, tags: ["Tankeflöde"] },
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal", exercised: true },
  { mood: "somewhat_depressed", energy: "low", sleep: "poor", eating: "low", tags: ["Trött", "Nedstämd"], comment: "Tung morgon" },
  { mood: "somewhat_depressed", energy: "low", sleep: "good", eating: "normal", tags: ["Trött"] },
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal", exercised: true, tags: ["Lugn"] },
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal", exercised: false },
  { mood: "somewhat_elevated", energy: "high", sleep: "ok", eating: "normal", exercised: true, tags: ["Social", "Kreativ"] },
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal", exercised: true },
  { mood: "somewhat_depressed", energy: "low", sleep: "poor", eating: "low", tags: ["Stress"] },
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal", exercised: true, tags: ["Fokuserad"] },
  { mood: "stable", energy: "normal", sleep: "good", eating: "normal" },
];

export async function startDemoSession(): Promise<{ error: Error | null }> {
  // 1) Skapa anonym session
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return { error: error ?? new Error("Kunde inte starta demo") };
  }
  const userId = data.user.id;

  // Markera kontot som demo så vi kan visa badge/copy och hantera
  // konvertering senare.
  try {
    await supabase.auth.updateUser({
      data: {
        is_demo: true,
        first_name: "Demo",
        profile_completed: true,
      },
    });
  } catch {
    // ignorera — inte kritiskt
  }

  // 2) Skapa profil-rad
  await supabase.from("profiles").upsert(
    { user_id: userId, first_name: "Demo" },
    { onConflict: "user_id" }
  );

  // 3) Seed: en aktiv medicin + 14 dagars mood-entries
  try {
    const { data: med } = await supabase
      .from("medications")
      .insert({
        user_id: userId,
        name: "Lamotrigin",
        dosage: "100 mg",
        frequency: "daily",
        status: "current",
        active: true,
        started_at: format(subDays(new Date(), 60), "yyyy-MM-dd"),
        indication: "Stämningsstabiliserare",
      })
      .select()
      .single();

    const today = new Date();
    const moodRows = MOOD_SCRIPT.map((entry, i) => {
      const date = format(subDays(today, MOOD_SCRIPT.length - 1 - i), "yyyy-MM-dd");
      return {
        user_id: userId,
        date,
        mood: entry.mood,
        energy_level: entry.energy ?? null,
        sleep_quality: entry.sleep ?? null,
        eating_quality: entry.eating ?? null,
        exercised: entry.exercised ?? null,
        tags: entry.tags ?? [],
        comment: entry.comment ?? null,
      };
    });
    await supabase.from("mood_entries").insert(moodRows);

    // Seed medication_logs så följsamhet ser realistisk ut (~85%)
    if (med?.id) {
      const medLogs = moodRows
        .filter((_, i) => i % 7 !== 3) // hoppa över ~1 dag/vecka
        .map((r) => ({
          user_id: userId,
          medication_id: med.id,
          date: r.date,
          taken: true,
        }));
      await supabase.from("medication_logs").insert(medLogs);
    }
  } catch (e) {
    // Seed-fel ska inte hindra demo — användaren kan fortfarande testa
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
  // Uppdatera metadata så useUserRole-fallback också vet rätt roll direkt
  try {
    await supabase.auth.updateUser({ data: { role } });
  } catch {
    /* ignore */
  }
  // RPC tillåter byte från default 'patient' till relative/doctor/patient
  if (role !== "patient") {
    await supabase.rpc("assign_initial_role", { _role: role });
  }
}


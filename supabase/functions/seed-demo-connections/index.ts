// Seedar fejk-patienter och godkända kopplingar för demo-anhöriga / demo-läkare
// så att de direkt har "personer att följa" när de loggar in i demoläget.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "relative" | "doctor";

const FAKE_PATIENTS: Array<{
  email: string;
  first_name: string;
  last_name: string;
  diagnosis: string;
  med: { name: string; dosage: string };
  bias: "stable" | "low" | "elevated";
}> = [
  { email: "demo-anna@toddy.demo",  first_name: "Anna",  last_name: "L.", diagnosis: "Bipolär typ II", med: { name: "Lamotrigin", dosage: "100 mg" }, bias: "stable"   },
  { email: "demo-erik@toddy.demo",  first_name: "Erik",  last_name: "S.", diagnosis: "Bipolär typ I",  med: { name: "Litium",      dosage: "600 mg" }, bias: "elevated" },
  { email: "demo-maria@toddy.demo", first_name: "Maria", last_name: "K.", diagnosis: "Cyklotymi",      med: { name: "Lamotrigin", dosage: "50 mg"  }, bias: "low"      },
];

const MOODS = ["very_depressed","depressed","somewhat_depressed","stable","somewhat_elevated","elevated","very_elevated"] as const;

function mulberry32(seed: number) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

function buildMoodRows(userId: string, bias: "stable" | "low" | "elevated", days = 60) {
  const rand = mulberry32(userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const today = new Date();
  const rows: any[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(today.getDate() - (days - 1 - i));
    const r = rand();
    let mood: typeof MOODS[number];
    if (bias === "elevated") mood = r < 0.15 ? "elevated" : r < 0.5 ? "somewhat_elevated" : r < 0.85 ? "stable" : "somewhat_depressed";
    else if (bias === "low") mood = r < 0.15 ? "depressed" : r < 0.55 ? "somewhat_depressed" : r < 0.9 ? "stable" : "somewhat_elevated";
    else mood = r < 0.1 ? "somewhat_depressed" : r < 0.2 ? "somewhat_elevated" : "stable";
    const energy = bias === "elevated" ? (rand() < 0.5 ? "high" : "normal") : bias === "low" ? (rand() < 0.5 ? "low" : "normal") : "normal";
    const sleep = bias === "elevated" ? (rand() < 0.5 ? "poor" : "ok") : bias === "low" ? (rand() < 0.4 ? "very_good" : "ok") : "good";
    rows.push({
      user_id: userId, date: fmt(d), mood,
      energy_level: energy, sleep_quality: sleep, eating_quality: "normal",
      exercised: rand() < 0.4, exercise_types: [], tags: [], comment: null, medication_side_effects: [],
    });
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: corsHeaders });

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: corsHeaders });
    if (!user.user_metadata?.is_demo) {
      return new Response(JSON.stringify({ error: "demo only" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const role: Role = body.role === "doctor" ? "doctor" : "relative";

    const admin = createClient(url, service);

    for (const fp of FAKE_PATIENTS) {
      // Hitta eller skapa fejkpatient
      let patientId: string | null = null;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u) => u.email === fp.email);
      if (existing) {
        patientId = existing.id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: fp.email,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: { first_name: fp.first_name, profile_completed: true, is_demo_seed: true },
        });
        if (createErr || !created.user) { console.warn("create user", createErr); continue; }
        patientId = created.user.id;

        // Säkerställ patient-roll (triggern sätter den, men för säkerhets skull)
        await admin.from("user_roles").upsert({ user_id: patientId, role: "patient" }, { onConflict: "user_id,role" });
        await admin.from("profiles").upsert({ user_id: patientId, first_name: fp.first_name, last_name: fp.last_name }, { onConflict: "user_id" });
        await admin.from("diagnoses").insert({ user_id: patientId, name: fp.diagnosis, diagnosed_at: fmt(new Date(Date.now() - 1000 * 60 * 60 * 24 * 400)) });
        await admin.from("medications").insert({
          user_id: patientId, name: fp.med.name, dosage: fp.med.dosage, frequency: "daily",
          status: "current", active: true, started_at: fmt(new Date(Date.now() - 1000 * 60 * 60 * 24 * 180)),
          indication: "Stämningsstabiliserare", effectiveness: "good",
        });
        await admin.from("mood_entries").insert(buildMoodRows(patientId, fp.bias));
      }

      if (!patientId) continue;

      // Skapa godkänd koppling till demo-användaren
      if (role === "relative") {
        await admin.from("patient_relative_connections").upsert({
          patient_id: patientId, relative_id: user.id, status: "approved", initiated_by: "patient",
          share_mood: true, share_sleep: true, share_eating: true, share_exercise: true,
          share_medication: true, share_comments: true, share_characteristics: true, notify_low_mood: true,
        }, { onConflict: "patient_id,relative_id" });
      } else {
        await admin.from("patient_doctor_connections").upsert({
          patient_id: patientId, doctor_id: user.id, status: "approved", initiated_by: "patient",
          share_mood: true, share_sleep: true, share_eating: true, share_exercise: true,
          share_medication: true, share_comments: true, share_ai_insights: true,
        }, { onConflict: "patient_id,doctor_id" });
      }
    }

    return new Response(JSON.stringify({ ok: true, count: FAKE_PATIENTS.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-demo-connections", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});

// Daglig städning av demo-konton:
//  1) Raderar anonyma demo-användare (is_demo=true) äldre än 24h.
//  2) Raderar seedade fejk-patienter (is_demo_seed=true) som inte längre
//     har någon kvarvarande koppling till en aktiv demo-användare.
// Cascading deletes på auth.users tar med sig profiles/mood_entries/etc
// via befintliga FK:er — och seed-funktionen återskapar fejkpatienterna
// vid behov nästa gång en demo-anhörig/demo-läkare loggar in.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_AGE_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authorization: only the service role (used by cron) may run this destructive cleanup.
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader !== `Bearer ${service}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, service);


    const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;

    // Hämta alla användare (paginera tills tomt)
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      allUsers.push(...users);
      if (users.length < perPage) break;
      page++;
      if (page > 50) break; // safety
    }

    const demoUsers = allUsers.filter((u) => u.user_metadata?.is_demo === true);
    const seedUsers = allUsers.filter((u) => u.user_metadata?.is_demo_seed === true);

    // 1) Radera demo-användare äldre än cutoff
    const deletedDemo: string[] = [];
    for (const u of demoUsers) {
      const created = new Date(u.created_at).getTime();
      if (created < cutoff) {
        const { error } = await admin.auth.admin.deleteUser(u.id);
        if (!error) deletedDemo.push(u.id);
        else console.warn("delete demo failed", u.id, error.message);
      }
    }

    // 2) Räkna kopplingar till varje seed-patient. Om det inte finns några
    //    aktiva kopplingar kvar (alla anhöriga/läkare är borta) → radera.
    const deletedSeed: string[] = [];
    const remainingDemoIds = new Set(
      allUsers
        .filter((u) => u.user_metadata?.is_demo === true && !deletedDemo.includes(u.id))
        .map((u) => u.id)
    );

    for (const sp of seedUsers) {
      const [{ data: rels }, { data: docs }] = await Promise.all([
        admin.from("patient_relative_connections").select("relative_id").eq("patient_id", sp.id),
        admin.from("patient_doctor_connections").select("doctor_id").eq("patient_id", sp.id),
      ]);
      const stillUsed =
        (rels ?? []).some((r: any) => remainingDemoIds.has(r.relative_id)) ||
        (docs ?? []).some((d: any) => remainingDemoIds.has(d.doctor_id));
      if (!stillUsed) {
        const { error } = await admin.auth.admin.deleteUser(sp.id);
        if (!error) deletedSeed.push(sp.id);
        else console.warn("delete seed failed", sp.id, error.message);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        scanned: allUsers.length,
        deleted_demo: deletedDemo.length,
        deleted_seed: deletedSeed.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("cleanup-demo-users", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

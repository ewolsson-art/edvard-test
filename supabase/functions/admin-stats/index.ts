// Aggregerad admin-statistik. Inga personliga uppgifter, ingen identifierbar data.
// Endast räkningar och procentfördelningar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verifiera adminroll
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (roleRow?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const day = 86400000;
    const iso = (ts: number) => new Date(ts).toISOString();
    const dateOnly = (ts: number) => new Date(ts).toISOString().slice(0, 10);

    // --- Användare (auth) ---
    const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    // listUsers returnerar inte total count på vissa versioner — räkna via user_roles istället
    const { count: totalUsers } = await admin
      .from("user_roles").select("*", { count: "exact", head: true });

    // Nya senaste 7 / 30 dgr — paginera auth users
    let newLast7 = 0, newLast30 = 0;
    const perPage = 1000;
    let page = 1;
    while (true) {
      const { data: pageData, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error || !pageData?.users?.length) break;
      for (const u of pageData.users) {
        const created = new Date(u.created_at).getTime();
        if (now - created <= 7 * day) newLast7++;
        if (now - created <= 30 * day) newLast30++;
      }
      if (pageData.users.length < perPage) break;
      page++;
      if (page > 50) break; // safety
    }

    // --- Rollfördelning ---
    const { data: rolesRows } = await admin.from("user_roles").select("role");
    const roleCounts: Record<string, number> = {};
    (rolesRows ?? []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1; });

    // --- Aktiva användare (har mood_entry) ---
    const { data: active7 } = await admin
      .from("mood_entries").select("user_id").gte("date", dateOnly(now - 7 * day));
    const { data: active30 } = await admin
      .from("mood_entries").select("user_id").gte("date", dateOnly(now - 30 * day));
    const activeUsers7 = new Set((active7 ?? []).map((r: any) => r.user_id)).size;
    const activeUsers30 = new Set((active30 ?? []).map((r: any) => r.user_id)).size;

    // --- Check-ins totalt + senaste 30 dgr ---
    const { count: totalCheckins } = await admin
      .from("mood_entries").select("*", { count: "exact", head: true });
    const { count: checkinsLast30 } = await admin
      .from("mood_entries").select("*", { count: "exact", head: true })
      .gte("date", dateOnly(now - 30 * day));

    // --- Mood-fördelning senaste 30 dgr (procent) ---
    const { data: moodRows } = await admin
      .from("mood_entries").select("mood").gte("date", dateOnly(now - 30 * day));
    const moodDist: Record<string, number> = {};
    (moodRows ?? []).forEach((r: any) => { if (r.mood) moodDist[r.mood] = (moodDist[r.mood] ?? 0) + 1; });

    // --- Diagnoser (antal användare per diagnos) ---
    const { data: diagRows } = await admin.from("diagnoses").select("name, user_id");
    const diagCount: Record<string, Set<string>> = {};
    (diagRows ?? []).forEach((r: any) => {
      const k = (r.name ?? "").trim().toLowerCase();
      if (!k) return;
      (diagCount[k] ??= new Set()).add(r.user_id);
    });
    const topDiagnoses = Object.entries(diagCount)
      .map(([name, set]) => ({ name, users: set.size }))
      .sort((a, b) => b.users - a.users).slice(0, 10);

    // --- Mediciner (top 10 namn, unika användare) ---
    const { data: medRows } = await admin
      .from("medications").select("name, user_id").eq("active", true);
    const medCount: Record<string, Set<string>> = {};
    (medRows ?? []).forEach((r: any) => {
      const k = (r.name ?? "").trim().toLowerCase();
      if (!k) return;
      (medCount[k] ??= new Set()).add(r.user_id);
    });
    const topMedications = Object.entries(medCount)
      .map(([name, set]) => ({ name, users: set.size }))
      .sort((a, b) => b.users - a.users).slice(0, 10);

    // --- Onboarding-completion (har profil med first_name) ---
    const { count: profilesCount } = await admin
      .from("profiles").select("*", { count: "exact", head: true })
      .not("first_name", "is", null);

    // --- Forum-aktivitet ---
    const { count: forumPosts } = await admin
      .from("community_posts").select("*", { count: "exact", head: true });
    const { count: forumReplies } = await admin
      .from("community_replies").select("*", { count: "exact", head: true });

    // --- Vårdgivare/anhörig-kopplingar (antal godkända) ---
    const { count: doctorConn } = await admin
      .from("patient_doctor_connections").select("*", { count: "exact", head: true })
      .eq("status", "approved");
    const { count: relativeConn } = await admin
      .from("patient_relative_connections").select("*", { count: "exact", head: true })
      .eq("status", "approved");

    // --- Daglig serie (nya användare + check-ins) senaste 30 dgr ---
    const dailyMap: Record<string, { date: string; checkins: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = dateOnly(now - i * day);
      dailyMap[d] = { date: d, checkins: 0 };
    }
    (moodRows ?? []).forEach((_r: any) => {/* date stripped above */});
    const { data: moodWithDate } = await admin
      .from("mood_entries").select("date").gte("date", dateOnly(now - 30 * day));
    (moodWithDate ?? []).forEach((r: any) => {
      if (dailyMap[r.date]) dailyMap[r.date].checkins++;
    });

    return new Response(JSON.stringify({
      generatedAt: iso(now),
      users: {
        total: totalUsers ?? 0,
        newLast7,
        newLast30,
        activeLast7: activeUsers7,
        activeLast30: activeUsers30,
        completedProfile: profilesCount ?? 0,
        roleCounts,
      },
      checkins: {
        total: totalCheckins ?? 0,
        last30: checkinsLast30 ?? 0,
        moodDistribution30d: moodDist,
      },
      health: {
        topDiagnoses,
        topMedications,
      },
      community: {
        posts: forumPosts ?? 0,
        replies: forumReplies ?? 0,
      },
      connections: {
        doctorApproved: doctorConn ?? 0,
        relativeApproved: relativeConn ?? 0,
      },
      daily30d: Object.values(dailyMap),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("admin-stats error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

    // Verifiera adminroll (användaren kan ha flera roller)
    const { data: adminRows, error: roleErr } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
    if (roleErr || !adminRows || adminRows.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const day = 86400000;
    const iso = (ts: number) => new Date(ts).toISOString();
    const dateOnly = (ts: number) => new Date(ts).toISOString().slice(0, 10);

    // --- Användare (auth) — paginera och bygg demo-set att exkludera ---
    const demoIds = new Set<string>();
    let newLast7 = 0, newLast30 = 0;
    let realUsersTotal = 0;
    const realUsers: Array<{ id: string; email: string | null; created_at: string; last_sign_in_at: string | null }> = [];
    const perPage = 1000;
    let page = 1;
    while (true) {
      const { data: pageData, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error || !pageData?.users?.length) break;
      for (const u of pageData.users) {
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const isDemo = meta.is_demo === true || meta.is_demo_seed === true;
        if (isDemo) { demoIds.add(u.id); continue; }
        realUsersTotal++;
        const created = new Date(u.created_at).getTime();
        if (now - created <= 7 * day) newLast7++;
        if (now - created <= 30 * day) newLast30++;
        realUsers.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        });
      }
      if (pageData.users.length < perPage) break;
      page++;
      if (page > 50) break; // safety
    }
    const notDemo = (uid: string | null | undefined) => !!uid && !demoIds.has(uid);
    const totalUsers = realUsersTotal;

    // --- Rollfördelning (exkl. demo) ---
    const { data: rolesRows } = await admin.from("user_roles").select("user_id, role");
    const roleCounts: Record<string, number> = {};
    (rolesRows ?? []).forEach((r: any) => {
      if (!notDemo(r.user_id)) return;
      roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
    });

    // --- Aktiva användare (har mood_entry, exkl. demo) ---
    const { data: active7 } = await admin
      .from("mood_entries").select("user_id").gte("date", dateOnly(now - 7 * day));
    const { data: active30 } = await admin
      .from("mood_entries").select("user_id").gte("date", dateOnly(now - 30 * day));
    const activeUsers7 = new Set((active7 ?? []).map((r: any) => r.user_id).filter(notDemo)).size;
    const activeUsers30 = new Set((active30 ?? []).map((r: any) => r.user_id).filter(notDemo)).size;

    // --- Check-ins (exkl. demo) ---
    const { data: allCheckins } = await admin
      .from("mood_entries").select("user_id, date, mood");
    const realCheckins = (allCheckins ?? []).filter((r: any) => notDemo(r.user_id));
    const totalCheckins = realCheckins.length;
    const cutoff30 = dateOnly(now - 30 * day);
    const checkins30 = realCheckins.filter((r: any) => r.date >= cutoff30);
    const checkinsLast30 = checkins30.length;

    // --- Mood-fördelning senaste 30 dgr (exkl. demo) ---
    const moodDist: Record<string, number> = {};
    checkins30.forEach((r: any) => { if (r.mood) moodDist[r.mood] = (moodDist[r.mood] ?? 0) + 1; });

    // --- Diagnoser (exkl. demo) ---
    const { data: diagRows } = await admin.from("diagnoses").select("name, user_id");
    const diagCount: Record<string, Set<string>> = {};
    (diagRows ?? []).forEach((r: any) => {
      if (!notDemo(r.user_id)) return;
      const k = (r.name ?? "").trim().toLowerCase();
      if (!k) return;
      (diagCount[k] ??= new Set()).add(r.user_id);
    });
    const topDiagnoses = Object.entries(diagCount)
      .map(([name, set]) => ({ name, users: set.size }))
      .sort((a, b) => b.users - a.users).slice(0, 10);

    // --- Mediciner (exkl. demo) ---
    const { data: medRows } = await admin
      .from("medications").select("name, user_id").eq("active", true);
    const medCount: Record<string, Set<string>> = {};
    (medRows ?? []).forEach((r: any) => {
      if (!notDemo(r.user_id)) return;
      const k = (r.name ?? "").trim().toLowerCase();
      if (!k) return;
      (medCount[k] ??= new Set()).add(r.user_id);
    });
    const topMedications = Object.entries(medCount)
      .map(([name, set]) => ({ name, users: set.size }))
      .sort((a, b) => b.users - a.users).slice(0, 10);

    // --- Onboarding-completion (exkl. demo) ---
    const { data: profileRows } = await admin
      .from("profiles").select("user_id, first_name").not("first_name", "is", null);
    const profilesCount = (profileRows ?? []).filter((r: any) => notDemo(r.user_id)).length;

    // --- Forum-aktivitet (exkl. demo) ---
    const { data: postRows } = await admin.from("community_posts").select("user_id");
    const { data: replyRows } = await admin.from("community_replies").select("user_id");
    const forumPosts = (postRows ?? []).filter((r: any) => notDemo(r.user_id)).length;
    const forumReplies = (replyRows ?? []).filter((r: any) => notDemo(r.user_id)).length;

    // --- Vårdgivare/anhörig-kopplingar (exkl. demo i båda parter) ---
    const { data: doctorConnRows } = await admin
      .from("patient_doctor_connections").select("patient_id, doctor_id").eq("status", "approved");
    const { data: relativeConnRows } = await admin
      .from("patient_relative_connections").select("patient_id, relative_id").eq("status", "approved");
    const doctorConn = (doctorConnRows ?? []).filter((r: any) => notDemo(r.patient_id) && notDemo(r.doctor_id)).length;
    const relativeConn = (relativeConnRows ?? []).filter((r: any) => notDemo(r.patient_id) && notDemo(r.relative_id)).length;

    // --- Daglig serie (check-ins, exkl. demo) ---
    const dailyMap: Record<string, { date: string; checkins: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = dateOnly(now - i * day);
      dailyMap[d] = { date: d, checkins: 0 };
    }
    checkins30.forEach((r: any) => {
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

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

    // --- Detalj-läge: ?user_id=xxx returnerar detaljerad data för en användare ---
    const url = new URL(req.url);
    const detailUserId = url.searchParams.get("user_id");
    if (detailUserId) {
      const { data: authUser } = await admin.auth.admin.getUserById(detailUserId);
      const u = authUser?.user;
      if (!u) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const [{ count: checkinsTotal }, { data: recentCheckins }, { data: pageViews }, { data: roles }] = await Promise.all([
        admin.from("mood_entries").select("id", { count: "exact", head: true }).eq("user_id", detailUserId),
        admin.from("mood_entries").select("date, mood, created_at").eq("user_id", detailUserId).order("created_at", { ascending: false }).limit(20),
        admin.from("page_views").select("path, referrer, utm_source, utm_medium, utm_campaign, created_at").eq("user_id", detailUserId).order("created_at", { ascending: false }).limit(5000),
        admin.from("user_roles").select("role").eq("user_id", detailUserId),
      ]);

      const pageCounts: Record<string, number> = {};
      const refCounts: Record<string, number> = {};
      const utmCounts: Record<string, number> = {};
      let lastVisit: string | null = null;
      let firstTouch: { referrer: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; at: string } | null = null;
      (pageViews ?? []).forEach((p: any) => {
        pageCounts[p.path] = (pageCounts[p.path] ?? 0) + 1;
        if (p.referrer) refCounts[p.referrer] = (refCounts[p.referrer] ?? 0) + 1;
        if (p.utm_source) utmCounts[p.utm_source] = (utmCounts[p.utm_source] ?? 0) + 1;
        if (!lastVisit || p.created_at > lastVisit) lastVisit = p.created_at;
        if (!firstTouch || p.created_at < firstTouch.at) {
          firstTouch = {
            referrer: p.referrer ?? null,
            utm_source: p.utm_source ?? null,
            utm_medium: p.utm_medium ?? null,
            utm_campaign: p.utm_campaign ?? null,
            at: p.created_at,
          };
        }
      });
      const topPages = Object.entries(pageCounts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 25);
      const topReferrers = Object.entries(refCounts).map(([referrer, count]) => ({ referrer, count })).sort((a, b) => b.count - a.count).slice(0, 10);
      const topUtm = Object.entries(utmCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10);

      return new Response(JSON.stringify({
        user: {
          id: u.id,
          email: u.email ?? null,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
          roles: (roles ?? []).map((r: any) => r.role),
        },
        checkinsTotal: checkinsTotal ?? 0,
        recentCheckins: recentCheckins ?? [],
        pageViewsTotal: (pageViews ?? []).length,
        lastVisit,
        firstTouch,
        topPages,
        topReferrers,
        topUtm,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }



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
    const realUserIds = new Set(realUsers.map((u) => u.id));
    // Riktig användare = finns i auth.users OCH är inte demo-flaggad.
    // Detta exkluderar även "orphan"-rader (t.ex. raderade demo-konton vars data ligger kvar).
    const notDemo = (uid: string | null | undefined) => !!uid && realUserIds.has(uid);
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

    // --- Sidvisningar (page_views — endast inloggade, exkl. demo) ---
    const { count: pageViewsTotalAll } = await admin
      .from("page_views").select("id", { count: "exact", head: true });
    const { data: pvRecent } = await admin
      .from("page_views").select("path, user_id, referrer, utm_source, utm_medium, utm_campaign, created_at")
      .gte("created_at", iso(now - 30 * day))
      .limit(20000);
    const pvFiltered = (pvRecent ?? []).filter((r: any) => notDemo(r.user_id));
    const pvLast7 = pvFiltered.filter((r: any) => new Date(r.created_at).getTime() >= now - 7 * day).length;
    const pvLast30 = pvFiltered.length;
    const pathCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};
    const utmSourceCounts: Record<string, number> = {};
    const utmMediumCounts: Record<string, number> = {};
    const utmCampaignCounts: Record<string, number> = {};
    pvFiltered.forEach((r: any) => {
      pathCounts[r.path] = (pathCounts[r.path] ?? 0) + 1;
      if (r.referrer) referrerCounts[r.referrer] = (referrerCounts[r.referrer] ?? 0) + 1;
      if (r.utm_source) utmSourceCounts[r.utm_source] = (utmSourceCounts[r.utm_source] ?? 0) + 1;
      if (r.utm_medium) utmMediumCounts[r.utm_medium] = (utmMediumCounts[r.utm_medium] ?? 0) + 1;
      if (r.utm_campaign) utmCampaignCounts[r.utm_campaign] = (utmCampaignCounts[r.utm_campaign] ?? 0) + 1;
    });
    const topPaths = Object.entries(pathCounts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 15);
    const topReferrers = Object.entries(referrerCounts).map(([referrer, count]) => ({ referrer, count })).sort((a, b) => b.count - a.count).slice(0, 15);
    const topUtmSources = Object.entries(utmSourceCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const topUtmMediums = Object.entries(utmMediumCounts).map(([medium, count]) => ({ medium, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const topUtmCampaigns = Object.entries(utmCampaignCounts).map(([campaign, count]) => ({ campaign, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // --- First-touch per användare (all-time, för "varifrån de kom") ---
    const { data: allPv } = await admin
      .from("page_views").select("user_id, referrer, utm_source, utm_medium, utm_campaign, created_at")
      .order("created_at", { ascending: true })
      .limit(50000);
    const firstTouchByUser: Record<string, { referrer: string | null; utm_source: string | null; at: string }> = {};
    (allPv ?? []).forEach((r: any) => {
      if (!notDemo(r.user_id)) return;
      if (!firstTouchByUser[r.user_id]) {
        firstTouchByUser[r.user_id] = {
          referrer: r.referrer ?? null,
          utm_source: r.utm_source ?? null,
          at: r.created_at,
        };
      }
    });

    // Acquisition-sammanfattning: hur många användare per source
    const acquisitionCounts: Record<string, number> = {};
    let directCount = 0;
    Object.values(firstTouchByUser).forEach((ft) => {
      const src = ft.utm_source || ft.referrer;
      if (!src) directCount++;
      else acquisitionCounts[src] = (acquisitionCounts[src] ?? 0) + 1;
    });
    const acquisitionBreakdown = Object.entries(acquisitionCounts)
      .map(([source, users]) => ({ source, users }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 15);
    if (directCount > 0) acquisitionBreakdown.unshift({ source: 'Direkt / okänt', users: directCount });


    // --- Daglig serie (check-ins, exkl. demo) ---
    const dailyMap: Record<string, { date: string; checkins: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = dateOnly(now - i * day);
      dailyMap[d] = { date: d, checkins: 0 };
    }
    checkins30.forEach((r: any) => {
      if (dailyMap[r.date]) dailyMap[r.date].checkins++;
    });

    // --- Per-användare-aktivitet ---
    const perUserCheckins: Record<string, { total: number; last30: number; lastDate: string | null }> = {};
    for (const r of realCheckins) {
      const u = r.user_id as string;
      if (!perUserCheckins[u]) perUserCheckins[u] = { total: 0, last30: 0, lastDate: null };
      perUserCheckins[u].total++;
      if (r.date >= cutoff30) perUserCheckins[u].last30++;
      if (!perUserCheckins[u].lastDate || r.date > perUserCheckins[u].lastDate!) {
        perUserCheckins[u].lastDate = r.date;
      }
    }
    const userActivity = realUsers
      .map((u) => {
        const c = perUserCheckins[u.id] ?? { total: 0, last30: 0, lastDate: null };
        const ft = firstTouchByUser[u.id];
        return {
          id: u.id,
          email: u.email,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at,
          checkinsTotal: c.total,
          checkinsLast30: c.last30,
          lastCheckinDate: c.lastDate,
          source: ft ? (ft.utm_source || ft.referrer || null) : null,
        };
      })
      .sort((a, b) => {
        const ta = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0;
        const tb = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0;
        return tb - ta;
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
      },
      community: {
        posts: forumPosts ?? 0,
        replies: forumReplies ?? 0,
      },
      connections: {
        doctorApproved: doctorConn ?? 0,
        relativeApproved: relativeConn ?? 0,
      },
      pageViews: {
        total: pageViewsTotalAll ?? 0,
        last7: pvLast7,
        last30: pvLast30,
        topPaths,
      },
      daily30d: Object.values(dailyMap),
      userActivity,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("admin-stats error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

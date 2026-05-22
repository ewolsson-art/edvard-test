import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Activity, MessageCircle, Heart, TrendingUp, Loader2, RefreshCw, X, Bell, Eye, Globe } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FirstTouch {
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  at: string;
}

interface UserDetail {
  user: { id: string; email: string | null; createdAt: string; lastSignInAt: string | null; roles: string[] };
  checkinsTotal: number;
  recentCheckins: { date: string; mood: string; created_at: string }[];
  pageViewsTotal: number;
  lastVisit: string | null;
  firstTouch: FirstTouch | null;
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  topUtm: { source: string; count: number }[];
}

interface Stats {
  generatedAt: string;
  users: {
    total: number;
    newLast7: number;
    newLast30: number;
    activeLast7: number;
    activeLast30: number;
    completedProfile: number;
    roleCounts: Record<string, number>;
  };
  checkins: {
    total: number;
    last30: number;
    moodDistribution30d: Record<string, number>;
  };
  health: {
    topDiagnoses: { name: string; users: number }[];
  };
  community: { posts: number; replies: number };
  connections: { doctorApproved: number; relativeApproved: number };
  pageViews?: {
    total: number;
    last7: number;
    last30: number;
    topPaths: { path: string; count: number }[];
    topReferrers: { referrer: string; count: number }[];
    topUtmSources: { source: string; count: number }[];
    topUtmMediums: { medium: string; count: number }[];
    topUtmCampaigns: { campaign: string; count: number }[];
    acquisitionBreakdown: { source: string; users: number }[];
  };
  daily30d: { date: string; checkins: number }[];
  userActivity: {
    id: string;
    email: string | null;
    createdAt: string;
    lastSignInAt: string | null;
    checkinsTotal: number;
    checkinsLast30: number;
    lastCheckinDate: string | null;
    source: string | null;
  }[];
}

const MOOD_LABELS: Record<string, string> = {
  severe_elevated: 'Kraftigt uppvarvad',
  elevated: 'Uppvarvad',
  somewhat_elevated: 'Något uppvarvad',
  stable: 'Stabil',
  somewhat_depressed: 'Något nedstämd',
  depressed: 'Nedstämd',
  severe_depressed: 'Kraftigt nedstämd',
};

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('sv-SE');
}
function fmtDateTime(s: string | null) {
  if (!s) return 'Aldrig';
  return new Date(s).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

const MOOD_COLOR: Record<string, string> = {
  severe_elevated: 'hsl(35 95% 55%)',
  elevated: 'hsl(45 90% 55%)',
  somewhat_elevated: 'hsl(55 80% 60%)',
  stable: 'hsl(142 65% 50%)',
  somewhat_depressed: 'hsl(220 60% 60%)',
  depressed: 'hsl(225 70% 55%)',
  severe_depressed: 'hsl(235 75% 50%)',
};

export default function Admin() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEmail, setDetailEmail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke('admin-stats');
    if (error) setError(error.message);
    else setStats(data as Stats);
    setLoading(false);
  };

  const openDetail = async (userId: string, email: string | null) => {
    setDetail(null);
    setDetailEmail(email);
    setDetailLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const url = `https://phudximaihknfsmkizix.supabase.co/functions/v1/admin-stats?user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Kunde inte hämta');
      setDetail(json as UserDetail);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const { toast } = useToast();
  const [pushTesting, setPushTesting] = useState(false);

  const sendTestPush = async () => {
    setPushTesting(true);
    try {
      if (!Capacitor.isNativePlatform()) {
        toast({
          title: 'Endast i native-appen',
          description: 'Test-notiser fungerar bara i Toddy-appen på iOS/Android, inte i webbläsaren.',
          variant: 'destructive',
        });
        return;
      }
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') {
          toast({
            title: 'Tillstånd saknas',
            description: 'Notiser är avstängda i iOS-inställningarna. Aktivera dem under Inställningar → Toddy → Notiser.',
            variant: 'destructive',
          });
          return;
        }
      }
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 100000),
          title: 'Toddy – test',
          body: 'Push fungerar. Allt grönt på iOS-byggget.',
          schedule: { at: new Date(Date.now() + 3000) },
        }],
      });
      toast({
        title: 'Test-notis schemalagd',
        description: 'Du bör se notisen om 3 sekunder. Lås gärna skärmen för att verifiera lock-screen-rendering.',
      });
    } catch (e: any) {
      toast({ title: 'Kunde inte skicka', description: e.message ?? 'Okänt fel', variant: 'destructive' });
    } finally {
      setPushTesting(false);
    }
  };

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-white/40" />
    </div>;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const moodTotal = stats ? Object.values(stats.checkins.moodDistribution30d).reduce((a, b) => a + b, 0) : 0;
  const maxDaily = stats ? Math.max(1, ...stats.daily30d.map(d => d.checkins)) : 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto md:mx-0 px-5 md:px-8 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Aggregerad, anonym statistik. Ingen personidentifierbar data visas.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 rounded-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Uppdatera
          </Button>
        </motion.div>

        {error && (
          <Card className="p-4 mb-6 border-destructive/30 bg-destructive/5 text-sm text-destructive">
            {error}
          </Card>
        )}

        {loading && !stats && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        )}

        {stats && (
          <div className="space-y-8">
            {/* Push test (native only) */}
            <Card className="p-5 bg-white/[0.02] border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0">
                <Bell className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80">Verifiera push-notiser</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Skickar en lokal test-notis om 3 sekunder via OS:et. Fungerar bara i den installerade Toddy-appen, inte i webbläsaren.
                  </p>
                </div>
              </div>
              <Button onClick={sendTestPush} disabled={pushTesting} size="sm" className="rounded-full gap-2 flex-shrink-0">
                {pushTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                Skicka test
              </Button>
            </Card>


            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi icon={<Users className="w-4 h-4" />} label="Totalt antal användare" value={stats.users.total} />
              <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Nya senaste 7 dagarna" value={stats.users.newLast7} sub={`${stats.users.newLast30} senaste 30 dgr`} />
              <Kpi icon={<Activity className="w-4 h-4" />} label="Aktiva senaste 7 dgr" value={stats.users.activeLast7} sub={`${stats.users.activeLast30} senaste 30 dgr`} />
              <Kpi icon={<Heart className="w-4 h-4" />} label="Check-ins totalt" value={stats.checkins.total} sub={`${stats.checkins.last30} senaste 30 dgr`} />
              {stats.pageViews && (
                <Kpi
                  icon={<Eye className="w-4 h-4" />}
                  label="Sidvisningar totalt"
                  value={stats.pageViews.total}
                  sub={`${stats.pageViews.last7} sen. 7 dgr · ${stats.pageViews.last30} sen. 30 dgr`}
                />
              )}
            </section>

            {/* Daily checkins bar chart */}
            <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white/80 mb-4">Check-ins per dag (senaste 30)</h2>
              <div className="flex items-end gap-1 h-40">
                {stats.daily30d.map(d => (
                  <div key={d.date} className="flex-1 h-full flex flex-col items-center justify-end group" title={`${d.date}: ${d.checkins}`}>
                    <span className="text-[10px] font-medium text-white/60 mb-1 tabular-nums">
                      {d.checkins > 0 ? d.checkins : ''}
                    </span>
                    <div
                      className="w-full rounded-sm bg-primary/70 hover:bg-primary transition-colors"
                      style={{ height: `${(d.checkins / maxDaily) * 100}%`, minHeight: d.checkins > 0 ? 2 : 0 }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-white/30">
                <span>{stats.daily30d[0]?.date}</span>
                <span>{stats.daily30d[stats.daily30d.length - 1]?.date}</span>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Roles */}
              <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/80 mb-4">Rollfördelning</h2>
                <ul className="space-y-2 text-sm">
                  {Object.entries(stats.users.roleCounts).map(([role, n]) => (
                    <Row key={role} label={role} value={n} />
                  ))}
                  <Row label="Slutfört profil" value={stats.users.completedProfile} />
                </ul>
              </Card>

              {/* Mood distribution */}
              <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/80 mb-4">Mood-fördelning (30 dgr)</h2>
                {moodTotal === 0 ? (
                  <p className="text-sm text-white/40">Ingen data</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(stats.checkins.moodDistribution30d)
                      .sort((a, b) => b[1] - a[1])
                      .map(([mood, n]) => {
                        const pct = (n / moodTotal) * 100;
                        return (
                          <li key={mood} className="text-sm">
                            <div className="flex justify-between text-white/70 mb-1">
                              <span>{MOOD_LABELS[mood] ?? mood}</span>
                              <span className="text-white/40">{pct.toFixed(1)}% · {n}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: MOOD_COLOR[mood] ?? 'hsl(0 0% 60%)' }} />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </Card>

              {/* Top diagnoses */}
              <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/80 mb-4">Vanligaste diagnoser</h2>
                {stats.health.topDiagnoses.length === 0 ? (
                  <p className="text-sm text-white/40">Ingen data</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {stats.health.topDiagnoses.map(d => (
                      <Row key={d.name} label={d.name} value={`${d.users} anv.`} />
                    ))}
                  </ul>
                )}
              </Card>


              {/* Community */}
              <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Forum
                </h2>
                <ul className="space-y-2 text-sm">
                  <Row label="Inlägg totalt" value={stats.community.posts} />
                  <Row label="Svar totalt" value={stats.community.replies} />
                </ul>
              </Card>

              {/* Connections */}
              <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/80 mb-4">Kopplingar (godkända)</h2>
                <ul className="space-y-2 text-sm">
                  <Row label="Vårdgivare ↔ användare" value={stats.connections.doctorApproved} />
                  <Row label="Anhörig ↔ användare" value={stats.connections.relativeApproved} />
                </ul>
              </Card>

              {/* Top sidor */}
              {stats.pageViews && (
                <Card className="p-6 bg-white/[0.02] border-white/[0.06] md:col-span-2">
                  <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Mest besökta sidor (30 dgr)
                  </h2>
                  {stats.pageViews.topPaths.length === 0 ? (
                    <p className="text-sm text-white/40">Ingen data</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {stats.pageViews.topPaths.map(p => (
                        <Row key={p.path} label={p.path} value={p.count} />
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-white/30 mt-3">
                    Endast inloggade användare spåras (exkl. demo). Anonyma besök på toddy.se räknas ej.
                  </p>
                </Card>
              )}

              {/* Acquisition: varifrån användarna kommer (first-touch all-time) */}
              {stats.pageViews && (
                <Card className="p-6 bg-white/[0.02] border-white/[0.06] md:col-span-2">
                  <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Varifrån användarna kommer
                  </h2>
                  <p className="text-[11px] text-white/40 mb-4">
                    First-touch per användare: första referrer eller UTM-källa vi såg. "Direkt / okänt" = ingen referrer (skrev URL, app, bokmärke) eller besök innan spårning aktiverades.
                  </p>
                  {stats.pageViews.acquisitionBreakdown.length === 0 ? (
                    <p className="text-sm text-white/40">Ingen källdata ännu.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {stats.pageViews.acquisitionBreakdown.map(a => (
                        <Row key={a.source} label={a.source} value={`${a.users} anv.`} />
                      ))}
                    </ul>
                  )}

                  {stats.pageViews.topReferrers.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-white/[0.06]">
                      <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wide">Top referrers (30 dgr · alla besök)</h3>
                      <ul className="space-y-1.5 text-sm">
                        {stats.pageViews.topReferrers.map(r => (
                          <Row key={r.referrer} label={r.referrer} value={r.count} />
                        ))}
                      </ul>
                    </div>
                  )}

                  {(stats.pageViews.topUtmSources.length > 0 ||
                    stats.pageViews.topUtmMediums.length > 0 ||
                    stats.pageViews.topUtmCampaigns.length > 0) && (
                    <div className="mt-6 pt-5 border-t border-white/[0.06] grid sm:grid-cols-3 gap-5">
                      <UtmList title="UTM source" items={stats.pageViews.topUtmSources.map(x => ({ k: x.source, v: x.count }))} />
                      <UtmList title="UTM medium" items={stats.pageViews.topUtmMediums.map(x => ({ k: x.medium, v: x.count }))} />
                      <UtmList title="UTM campaign" items={stats.pageViews.topUtmCampaigns.map(x => ({ k: x.campaign, v: x.count }))} />
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Per-user activity */}
            <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-sm font-semibold text-white/80">Användaraktivitet</h2>
                <input
                  type="text"
                  placeholder="Sök e-post..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="text-base md:text-sm px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 w-56"
                />
              </div>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-white/35 border-b border-white/[0.06]">
                      <th className="px-6 py-2 font-medium">E-post</th>
                      <th className="px-2 py-2 font-medium">Källa</th>
                      <th className="px-2 py-2 font-medium">Skapad</th>
                      <th className="px-2 py-2 font-medium">Senaste inloggning</th>
                      <th className="px-2 py-2 font-medium text-right">Check-ins (30d)</th>
                      <th className="px-2 py-2 font-medium text-right">Totalt</th>
                      <th className="px-6 py-2 font-medium">Senaste check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.userActivity
                      .filter(u => !userQuery || (u.email ?? '').toLowerCase().includes(userQuery.toLowerCase()))
                      .map(u => (
                        <tr
                          key={u.id}
                          onClick={() => openDetail(u.id, u.email)}
                          className="border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-2 text-white/85 truncate max-w-[220px]">{u.email ?? '—'}</td>
                          <td className="px-2 py-2 text-white/55 truncate max-w-[140px]">
                            {u.source ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-white/[0.05] text-white/75 text-[11px]">{u.source}</span>
                            ) : (
                              <span className="text-white/30 text-[11px]">direkt</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-white/55">{fmtDate(u.createdAt)}</td>
                          <td className="px-2 py-2 text-white/85">{fmtDateTime(u.lastSignInAt)}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-white/85">{u.checkinsLast30}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-white/55">{u.checkinsTotal}</td>
                          <td className="px-6 py-2 text-white/55">{u.lastCheckinDate ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {stats.userActivity.length === 0 && (
                  <p className="text-sm text-white/40 px-6 py-4">Ingen data</p>
                )}
              </div>
            </Card>

            <FeedbackPanel />



            <p className="text-xs text-white/30 text-center pt-4">
              Genererat {new Date(stats.generatedAt).toLocaleString('sv-SE')}
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!detailEmail} onOpenChange={(o) => { if (!o) { setDetailEmail(null); setDetail(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white/90 truncate">{detailEmail ?? 'Användare'}</DialogTitle>
          </DialogHeader>
          {detailLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          )}
          {detail && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi icon={<Heart className="w-4 h-4" />} label="Check-ins totalt" value={detail.checkinsTotal} />
                <Kpi icon={<Activity className="w-4 h-4" />} label="Sidvisningar" value={detail.pageViewsTotal} />
                <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Senaste inloggning" value={fmtDateTime(detail.user.lastSignInAt)} />
                <Kpi icon={<Users className="w-4 h-4" />} label="Senaste sidvisning" value={detail.lastVisit ? fmtDateTime(detail.lastVisit) : '—'} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">Roller</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.user.roles.length === 0 && <span className="text-sm text-white/40">Inga roller</span>}
                  {detail.user.roles.map(r => (
                    <span key={r} className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-white/75 border border-white/[0.08]">{r}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Varifrån de kom (first-touch)
                </h3>
                {detail.firstTouch ? (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm space-y-1.5">
                    <Row label="Referrer" value={detail.firstTouch.referrer ?? '—'} />
                    <Row label="UTM source" value={detail.firstTouch.utm_source ?? '—'} />
                    <Row label="UTM medium" value={detail.firstTouch.utm_medium ?? '—'} />
                    <Row label="UTM campaign" value={detail.firstTouch.utm_campaign ?? '—'} />
                    <Row label="Första besök" value={fmtDateTime(detail.firstTouch.at)} />
                  </div>
                ) : (
                  <p className="text-sm text-white/40">Ingen källdata registrerad.</p>
                )}
                {(detail.topReferrers.length > 0 || detail.topUtm.length > 0) && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    {detail.topReferrers.length > 0 && (
                      <UtmList title="Top referrers" items={detail.topReferrers.map(x => ({ k: x.referrer, v: x.count }))} />
                    )}
                    {detail.topUtm.length > 0 && (
                      <UtmList title="Top UTM source" items={detail.topUtm.map(x => ({ k: x.source, v: x.count }))} />
                    )}
                  </div>
                )}
              </div>


              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">Mest besökta sidor</h3>
                {detail.topPages.length === 0 ? (
                  <p className="text-sm text-white/40">Ingen sidvisning loggad än. (Loggning aktiverades nyligen.)</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.topPages.map(p => {
                      const max = detail.topPages[0].count;
                      const pct = (p.count / max) * 100;
                      return (
                        <li key={p.path} className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-white/80 font-mono text-xs truncate max-w-[60%]">{p.path}</span>
                            <span className="text-white/45 tabular-nums">{p.count}</span>
                          </div>
                          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">Senaste check-ins</h3>
                {detail.recentCheckins.length === 0 ? (
                  <p className="text-sm text-white/40">Inga check-ins</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.recentCheckins.map((c, i) => (
                      <li key={i} className="flex justify-between border-b border-white/[0.04] pb-1.5">
                        <span className="text-white/70">{c.date}</span>
                        <span className="text-white/55">{c.mood}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card className="p-4 bg-white/[0.02] border-white/[0.06]">
      <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
        {icon}<span>{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-white/35 mt-1">{sub}</div>}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <li className="flex justify-between border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
      <span className="text-white/65 capitalize">{label}</span>
      <span className="text-white/90 font-medium tabular-nums">{value}</span>
    </li>
  );
}

function UtmList({ title, items }: { title: string; items: { k: string; v: number }[] }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold text-white/45 uppercase tracking-wide mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-white/30">—</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map(it => (
            <li key={it.k} className="flex justify-between gap-2">
              <span className="text-white/75 truncate">{it.k}</span>
              <span className="text-white/45 tabular-nums">{it.v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FeedbackRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  message: string;
  category: string | null;
  status: string;
  created_at: string;
}

function FeedbackPanel() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('id, user_id, user_email, message, category, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    setRows((data ?? []) as FeedbackRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await supabase.from('feedback').update({ status: 'read' }).eq('id', id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'read' } : r));
  };
  const remove = async (id: string) => {
    await supabase.from('feedback').delete().eq('id', id);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const visible = showAll ? rows : rows.filter(r => r.status !== 'read');
  const unreadCount = rows.filter(r => r.status !== 'read').length;

  return (
    <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white/80">Feedback från användare</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] text-[11px] font-bold tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs text-white/55 hover:text-white/85 transition-colors"
          >
            {showAll ? 'Visa endast nya' : `Visa alla (${rows.length})`}
          </button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 rounded-full h-7 text-xs">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-white/40 py-3">
          {showAll ? 'Ingen feedback ännu.' : 'Inga nya meddelanden.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map(r => (
            <li
              key={r.id}
              className={`rounded-2xl p-4 border ${r.status === 'read' ? 'border-white/[0.04] bg-white/[0.01]' : 'border-[hsl(45_85%_55%/0.18)] bg-[hsl(45_85%_55%/0.04)]'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/85 truncate">
                    {r.user_email ?? 'Anonym'}
                  </p>
                  <p className="text-[11px] text-white/40">
                    {new Date(r.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                    {r.category ? <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/55">{r.category}</span> : null}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {r.status !== 'read' && (
                    <button
                      onClick={() => markRead(r.id)}
                      className="text-[11px] px-2.5 py-1 rounded-full text-white/65 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      Markera läst
                    </button>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    aria-label="Radera"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[14px] text-white/85 whitespace-pre-wrap leading-relaxed">
                {r.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}


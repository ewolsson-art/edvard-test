import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Activity, MessageCircle, Heart, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    topMedications: { name: string; users: number }[];
  };
  community: { posts: number; replies: number };
  connections: { doctorApproved: number; relativeApproved: number };
  daily30d: { date: string; checkins: number }[];
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

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke('admin-stats');
    if (error) setError(error.message);
    else setStats(data as Stats);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

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
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
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
            {/* KPI row */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi icon={<Users className="w-4 h-4" />} label="Totalt antal användare" value={stats.users.total} />
              <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Nya senaste 7 dagarna" value={stats.users.newLast7} sub={`${stats.users.newLast30} senaste 30 dgr`} />
              <Kpi icon={<Activity className="w-4 h-4" />} label="Aktiva senaste 7 dgr" value={stats.users.activeLast7} sub={`${stats.users.activeLast30} senaste 30 dgr`} />
              <Kpi icon={<Heart className="w-4 h-4" />} label="Check-ins totalt" value={stats.checkins.total} sub={`${stats.checkins.last30} senaste 30 dgr`} />
            </section>

            {/* Daily checkins bar chart */}
            <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white/80 mb-4">Check-ins per dag (senaste 30)</h2>
              <div className="flex items-end gap-1 h-32">
                {stats.daily30d.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end group" title={`${d.date}: ${d.checkins}`}>
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

              {/* Top medications */}
              <Card className="p-6 bg-white/[0.02] border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/80 mb-4">Vanligaste mediciner (aktiva)</h2>
                {stats.health.topMedications.length === 0 ? (
                  <p className="text-sm text-white/40">Ingen data</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {stats.health.topMedications.map(m => (
                      <Row key={m.name} label={m.name} value={`${m.users} anv.`} />
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
            </div>

            <p className="text-xs text-white/30 text-center pt-4">
              Genererat {new Date(stats.generatedAt).toLocaleString('sv-SE')}
            </p>
          </div>
        )}
      </div>
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

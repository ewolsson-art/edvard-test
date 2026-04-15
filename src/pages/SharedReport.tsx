import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Brain, Moon, Utensils, Dumbbell, Pill, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoodStats } from '@/components/MoodStats';
import { SleepStats, SleepStatsType } from '@/components/SleepStats';
import { EatingStats, EatingStatsType } from '@/components/EatingStats';
import { ExerciseStats, ExerciseStatsType } from '@/components/ExerciseStats';
import { Logo } from '@/components/Logo';
import { MOOD_LABELS as DEFAULT_MOOD_LABELS, MoodType, MoodStats as MoodStatsType } from '@/types/mood';
import { useTranslation } from 'react-i18next';

interface SharedReportData {
  id: string;
  share_key: string;
  user_id: string;
  report_type: 'month' | 'year';
  period: string;
  stats: {
    mood?: MoodStatsType;
    sleep?: SleepStatsType;
    eating?: EatingStatsType;
    exercise?: ExerciseStatsType;
    entries?: Array<{
      date: string;
      mood?: string;
      sleepQuality?: string;
      eatingQuality?: string;
      exercised?: boolean;
      exerciseTypes?: string[];
      comment?: string;
    }>;
    categories: string[];
  };
  medications: Array<{
    name: string;
    dosage: string;
    started_at: string;
    active: boolean;
  }> | null;
  created_at: string;
  expires_at: string | null;
}

const SharedReport = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'sv' ? sv : enUS;
  const { shareKey } = useParams<{ shareKey: string }>();
  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!shareKey) { setError(t('sharedReport.noShareKey')); setLoading(false); return; }
      try {
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-report?share_key=${encodeURIComponent(shareKey)}`;
        const fetchResponse = await fetch(functionUrl, {
          method: 'GET',
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
        });
        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json();
          if (fetchResponse.status === 404) setError(t('sharedReport.reportNotFound'));
          else if (fetchResponse.status === 410) setError(t('sharedReport.linkExpired'));
          else setError(errorData.error || t('sharedReport.couldNotFetch'));
          setLoading(false); return;
        }
        const data = await fetchResponse.json();
        setReport(data as SharedReportData);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError(t('sharedReport.couldNotFetch'));
      } finally { setLoading(false); }
    };
    fetchReport();
  }, [shareKey, t]);

  const periodLabel = useMemo(() => {
    if (!report) return '';
    if (report.report_type === 'year') return report.period;
    const [year, month] = report.period.split('-').map(Number);
    return format(new Date(year, month - 1), 'MMMM yyyy', { locale });
  }, [report, locale]);

  const categories = report?.stats?.categories || [];

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">{t('sharedReport.cannotShow')}</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const stats = report.stats;
  const medications = report.medications || [];
  const activeMeds = medications.filter(m => m.active);
  const inactiveMeds = medications.filter(m => !m.active);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Badge variant="secondary" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {report.report_type === 'month' ? t('sharedReport.monthReport') : t('sharedReport.yearReport')}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {report.report_type === 'month' ? t('sharedReport.monthReport') : t('sharedReport.yearReport')}
          </h1>
          <p className="text-xl text-muted-foreground capitalize">{periodLabel}</p>
          <p className="text-sm text-muted-foreground">
            {t('sharedReport.created')} {format(new Date(report.created_at), 'd MMMM yyyy', { locale })}
          </p>
        </div>

        {categories.includes('mood') && stats.mood && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">{t('sharedReport.mood')}</h2>
            </div>
            <MoodStats stats={stats.mood} periodLabel={periodLabel} />
            {stats.entries && stats.entries.length > 0 && (
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">{t('sharedReport.dailyRegistrations')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {stats.entries.filter(e => e.mood).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                        <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${entry.mood === 'elevated' ? 'bg-orange-400' : entry.mood === 'stable' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{format(new Date(entry.date), 'd MMM', { locale })}</span>
                            <span className="text-sm text-muted-foreground">{DEFAULT_MOOD_LABELS[entry.mood as MoodType]}</span>
                          </div>
                          {entry.comment && <p className="text-sm text-muted-foreground mt-1 italic">"{entry.comment}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {categories.includes('sleep') && stats.sleep && (
          <section className="space-y-4">
            <div className="flex items-center gap-2"><Moon className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">{t('sharedReport.sleep')}</h2></div>
            <SleepStats stats={stats.sleep} periodLabel={periodLabel} />
          </section>
        )}

        {categories.includes('eating') && stats.eating && (
          <section className="space-y-4">
            <div className="flex items-center gap-2"><Utensils className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">{t('sharedReport.diet')}</h2></div>
            <EatingStats stats={stats.eating} periodLabel={periodLabel} />
          </section>
        )}

        {categories.includes('exercise') && stats.exercise && (
          <section className="space-y-4">
            <div className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">{t('sharedReport.exercise')}</h2></div>
            <ExerciseStats stats={stats.exercise} periodLabel={periodLabel} />
          </section>
        )}

        {categories.includes('medication') && medications.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">{t('sharedReport.medications')}</h2></div>
            {activeMeds.length > 0 && (
              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-base">{t('sharedReport.activeMeds')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeMeds.map((med, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div><p className="font-medium">{med.name}</p><p className="text-sm text-muted-foreground">{med.dosage}</p></div>
                        <Badge variant="outline" className="text-xs">{t('sharedReport.since')} {format(new Date(med.started_at), 'd MMM yyyy', { locale })}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {inactiveMeds.length > 0 && (
              <Card className="glass-card opacity-60">
                <CardHeader className="pb-2"><CardTitle className="text-base">{t('sharedReport.endedMeds')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inactiveMeds.map((med, i) => (<div key={i}><p className="font-medium text-sm">{med.name}</p><p className="text-xs text-muted-foreground">{med.dosage}</p></div>))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        <footer className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground">{t('sharedReport.generatedWith')}</p>
        </footer>
      </main>
    </div>
  );
};

export default SharedReport;

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowLeft, Calendar, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOOD_LABELS, MoodType } from '@/types/mood';

interface SharedReportData {
  id: string;
  report_type: 'month' | 'year';
  period: string;
  stats: {
    elevated: number;
    stable: number;
    depressed: number;
    total: number;
  };
  medications?: Array<{
    name: string;
    dosage: string;
    started_at: string;
  }>;
  created_at: string;
}

const SharedReport = () => {
  const { shareKey } = useParams<{ shareKey: string }>();
  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!shareKey) {
        setError('Ingen delningsnyckel angiven');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('share_key', shareKey)
        .single();

      if (fetchError || !data) {
        setError('Rapporten kunde inte hittas eller har utgått');
        setLoading(false);
        return;
      }

      // Parse the JSONB fields
      const reportData: SharedReportData = {
        id: data.id,
        report_type: data.report_type as 'month' | 'year',
        period: data.period,
        stats: data.stats as SharedReportData['stats'],
        medications: data.medications as SharedReportData['medications'],
        created_at: data.created_at,
      };

      setReport(reportData);
      setLoading(false);
    };

    fetchReport();
  }, [shareKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="animate-pulse text-muted-foreground">Laddar rapport...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Gå till startsidan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, medications } = report;
  const elevatedPct = stats.total > 0 ? Math.round((stats.elevated / stats.total) * 100) : 0;
  const stablePct = stats.total > 0 ? Math.round((stats.stable / stats.total) * 100) : 0;
  const depressedPct = stats.total > 0 ? Math.round((stats.depressed / stats.total) * 100) : 0;

  const formatPeriod = () => {
    if (report.report_type === 'year') {
      return report.period;
    }
    const [year, month] = report.period.split('-').map(Number);
    return format(new Date(year, month - 1), 'MMMM yyyy', { locale: sv });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Between Clouds
          </h1>
          <p className="text-muted-foreground text-sm">Mående-statistik</p>
        </div>

        {/* Report Card */}
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
              <Calendar className="h-4 w-4" />
              <span>{report.report_type === 'year' ? 'Årsrapport' : 'Månadsrapport'}</span>
            </div>
            <CardTitle className="text-xl capitalize">{formatPeriod()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Summary */}
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">registrerade dagar</p>
            </div>

            {/* Visual Bar */}
            <div className="h-4 rounded-full overflow-hidden bg-muted flex">
              {stats.elevated > 0 && (
                <div 
                  className="bg-mood-elevated h-full transition-all"
                  style={{ width: `${elevatedPct}%` }}
                />
              )}
              {stats.stable > 0 && (
                <div 
                  className="bg-mood-stable h-full transition-all"
                  style={{ width: `${stablePct}%` }}
                />
              )}
              {stats.depressed > 0 && (
                <div 
                  className="bg-mood-depressed h-full transition-all"
                  style={{ width: `${depressedPct}%` }}
                />
              )}
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="w-3 h-3 rounded-full bg-mood-elevated mx-auto" />
                <p className="font-semibold text-lg">{stats.elevated}</p>
                <p className="text-xs text-muted-foreground">{MOOD_LABELS.elevated}</p>
                <p className="text-xs text-muted-foreground">({elevatedPct}%)</p>
              </div>
              <div className="space-y-1">
                <div className="w-3 h-3 rounded-full bg-mood-stable mx-auto" />
                <p className="font-semibold text-lg">{stats.stable}</p>
                <p className="text-xs text-muted-foreground">{MOOD_LABELS.stable}</p>
                <p className="text-xs text-muted-foreground">({stablePct}%)</p>
              </div>
              <div className="space-y-1">
                <div className="w-3 h-3 rounded-full bg-mood-depressed mx-auto" />
                <p className="font-semibold text-lg">{stats.depressed}</p>
                <p className="text-xs text-muted-foreground">{MOOD_LABELS.depressed}</p>
                <p className="text-xs text-muted-foreground">({depressedPct}%)</p>
              </div>
            </div>

            {/* Medications */}
            {medications && medications.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Mediciner</h3>
                </div>
                <div className="space-y-2">
                  {medications.map((med, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{med.name}</span>
                      <span className="mx-1">-</span>
                      <span>{med.dosage}</span>
                      <span className="mx-1">|</span>
                      <span>sedan {format(new Date(med.started_at), 'd MMM yyyy', { locale: sv })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Delad {format(new Date(report.created_at), 'd MMMM yyyy', { locale: sv })}</p>
          <p>
            <Link to="/" className="hover:text-foreground transition-colors">
              Between Clouds - Mående-tracker för bipolär sjukdom
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedReport;

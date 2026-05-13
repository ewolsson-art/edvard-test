import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar as CalendarIcon, FileText, Download, TrendingUp, TrendingDown, Minus, Heart, Moon, Utensils, Dumbbell, Pill, Users, ChevronDown } from 'lucide-react';
import { useRelativeConnections, PatientConnection } from '@/hooks/useRelativeConnections';
import { usePatientMoodData } from '@/hooks/usePatientMoodData';
import { usePatientMedications } from '@/hooks/usePatientMedications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReportData {
  mood: {
    elevated: number;
    stable: number;
    depressed: number;
    total: number;
    trend: 'up' | 'down' | 'stable';
    insight: string;
  };
  sleep: {
    good: number;
    bad: number;
    total: number;
    percentage: number;
    insight: string;
  };
  eating: {
    good: number;
    bad: number;
    total: number;
    percentage: number;
    insight: string;
  };
  exercise: {
    exercised: number;
    total: number;
    percentage: number;
    insight: string;
  };
  medication: {
    taken: number;
    total: number;
    percentage: number;
    insight: string;
  };
  period: {
    start: Date;
    end: Date;
    totalDays: number;
    registeredDays: number;
  };
}

const RelativeReports = () => {
  const { t } = useTranslation();
  const today = new Date();
  const defaultStart = startOfMonth(subMonths(today, 1));
  const defaultEnd = endOfMonth(subMonths(today, 1));

  const { approvedConnections, isLoading: connectionsLoading } = useRelativeConnections();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(defaultEnd);
  const [includeMood, setIncludeMood] = useState(true);
  const [includeSleep, setIncludeSleep] = useState(true);
  const [includeEating, setIncludeEating] = useState(true);
  const [includeExercise, setIncludeExercise] = useState(true);
  const [includeMedication, setIncludeMedication] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Get selected connection
  const selectedConnection = useMemo(() => {
    return approvedConnections.find(c => c.patient_id === selectedPatientId) || null;
  }, [approvedConnections, selectedPatientId]);

  // Auto-select first patient when connections load
  useMemo(() => {
    if (approvedConnections.length > 0 && !selectedPatientId) {
      setSelectedPatientId(approvedConnections[0].patient_id);
    }
  }, [approvedConnections, selectedPatientId]);

  // Fetch patient data
  const { entries, isLoaded: moodLoaded } = usePatientMoodData({
    patientId: selectedPatientId || '',
  });
  
  const { isLoaded: medsLoaded, getLogsForDate, activeMedications } = usePatientMedications({
    patientId: selectedPatientId || '',
  });

  const getPatientName = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    return connection.patient_email || 'Patient';
  };

  const reportData = useMemo((): ReportData | null => {
    if (!moodLoaded || !medsLoaded || !reportGenerated || !selectedConnection) return null;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const filteredEntries = entries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, { start: startDate, end: endDate });
    });

    // Mood stats
    let elevated = 0, stable = 0, depressed = 0;
    filteredEntries.forEach(entry => {
      if (entry.mood === 'elevated') elevated++;
      else if (entry.mood === 'stable') stable++;
      else if (entry.mood === 'depressed') depressed++;
    });
    const moodTotal = elevated + stable + depressed;
    
    let moodTrend: 'up' | 'down' | 'stable' = 'stable';
    let moodInsight = '';
    if (moodTotal > 0) {
      const stablePercentage = (stable / moodTotal) * 100;
      const elevatedPercentage = (elevated / moodTotal) * 100;
      const depressedPercentage = (depressed / moodTotal) * 100;
      
      if (stablePercentage >= 60) {
        moodInsight = t('reports.moodInsightStable', { percentage: Math.round(stablePercentage) });
        moodTrend = 'stable';
      } else if (elevatedPercentage > depressedPercentage) {
        moodInsight = t('reports.moodInsightElevated', { percentage: Math.round(elevatedPercentage) });
        moodTrend = 'up';
      } else if (depressedPercentage > elevatedPercentage) {
        moodInsight = t('reports.moodInsightDepressed', { percentage: Math.round(depressedPercentage) });
        moodTrend = 'down';
      } else {
        moodInsight = t('reports.moodInsightVarying');
      }
    }

    // Sleep stats
    let sleepGood = 0, sleepBad = 0;
    filteredEntries.forEach(entry => {
      if (entry.sleepQuality === 'good') sleepGood++;
      else if (entry.sleepQuality === 'bad') sleepBad++;
    });
    const sleepTotal = sleepGood + sleepBad;
    const sleepPercentage = sleepTotal > 0 ? Math.round((sleepGood / sleepTotal) * 100) : 0;
    let sleepInsight = '';
    if (sleepPercentage >= 70) {
      sleepInsight = t('reports.sleepInsightGood', { percentage: sleepPercentage });
    } else if (sleepPercentage >= 50) {
      sleepInsight = t('reports.sleepInsightVarying', { percentage: 100 - sleepPercentage });
    } else {
      sleepInsight = t('reports.sleepInsightBad', { percentage: 100 - sleepPercentage });
    }

    // Eating stats
    let eatingGood = 0, eatingBad = 0;
    filteredEntries.forEach(entry => {
      if (entry.eatingQuality === 'good') eatingGood++;
      else if (entry.eatingQuality === 'bad') eatingBad++;
    });
    const eatingTotal = eatingGood + eatingBad;
    const eatingPercentage = eatingTotal > 0 ? Math.round((eatingGood / eatingTotal) * 100) : 0;
    let eatingInsight = '';
    if (eatingPercentage >= 70) {
      eatingInsight = t('reports.eatingInsightGood', { percentage: eatingPercentage });
    } else {
      eatingInsight = t('reports.eatingInsightBad');
    }

    // Exercise stats
    let exercised = 0;
    filteredEntries.forEach(entry => {
      if (entry.exercised === true) exercised++;
    });
    const exerciseTotal = filteredEntries.filter(e => e.exercised !== undefined).length;
    const exercisePercentage = exerciseTotal > 0 ? Math.round((exercised / exerciseTotal) * 100) : 0;
    let exerciseInsight = '';
    if (exercisePercentage >= 50) {
      exerciseInsight = t('reports.exerciseInsightGood', { percentage: exercisePercentage });
    } else {
      exerciseInsight = t('reports.exerciseInsightGood', { percentage: exercisePercentage });
    }

    // Medication stats
    let medsTaken = 0;
    days.forEach(day => {
      const logs = getLogsForDate(format(day, 'yyyy-MM-dd'));
      if (logs.length > 0) medsTaken++;
    });
    const medsPercentage = days.length > 0 ? Math.round((medsTaken / days.length) * 100) : 0;
    let medsInsight = '';
    if (medsPercentage >= 90) {
      medsInsight = t('reports.medInsightExcellent', { percentage: medsPercentage });
    } else if (medsPercentage >= 70) {
      medsInsight = t('reports.medInsightGood', { percentage: medsPercentage });
    } else {
      medsInsight = t('reports.medInsightBad');
    }

    return {
      mood: { elevated, stable, depressed, total: moodTotal, trend: moodTrend, insight: moodInsight },
      sleep: { good: sleepGood, bad: sleepBad, total: sleepTotal, percentage: sleepPercentage, insight: sleepInsight },
      eating: { good: eatingGood, bad: eatingBad, total: eatingTotal, percentage: eatingPercentage, insight: eatingInsight },
      exercise: { exercised, total: exerciseTotal, percentage: exercisePercentage, insight: exerciseInsight },
      medication: { taken: medsTaken, total: days.length, percentage: medsPercentage, insight: medsInsight },
      period: {
        start: startDate,
        end: endDate,
        totalDays: days.length,
        registeredDays: filteredEntries.length,
      },
    };
  }, [entries, moodLoaded, medsLoaded, reportGenerated, startDate, endDate, getLogsForDate, selectedConnection]);

  const handleGenerateReport = () => {
    setReportGenerated(true);
  };

  const handleExportPDF = async () => {
    if (!reportData || !selectedConnection) return;

    const patientName = getPatientName(selectedConnection);
    const { generateReportPdf } = await import('@/lib/reportPdf');

    const sections = [];

    if (includeMood && selectedConnection.share_mood && reportData.mood.total > 0) {
      const stablePct = reportData.mood.total > 0
        ? Math.round((reportData.mood.stable / reportData.mood.total) * 100)
        : 0;
      sections.push({
        title: t('relativeReports.mood'),
        tag: 'M',
        color: [212, 165, 116] as [number, number, number],
        progress: stablePct,
        progressLabel: `${stablePct}% stabila dagar`,
        stats: [
          t('reports.elevatedDays', { count: reportData.mood.elevated }),
          t('reports.stableDays', { count: reportData.mood.stable }),
          t('reports.depressedDays', { count: reportData.mood.depressed }),
        ],
        insight: reportData.mood.insight,
      });
    }

    if (includeSleep && selectedConnection.share_sleep && reportData.sleep.total > 0) {
      sections.push({
        title: t('relativeReports.sleep'),
        tag: 'S',
        color: [120, 134, 196] as [number, number, number],
        progress: reportData.sleep.percentage,
        progressLabel: `${reportData.sleep.percentage}% bra sömn`,
        stats: [
          t('reports.goodSleep', { count: reportData.sleep.good, percentage: reportData.sleep.percentage }),
          t('reports.badSleep', { count: reportData.sleep.bad }),
        ],
        insight: reportData.sleep.insight,
      });
    }

    if (includeEating && selectedConnection.share_eating && reportData.eating.total > 0) {
      sections.push({
        title: t('relativeReports.food'),
        tag: 'K',
        color: [216, 168, 80] as [number, number, number],
        progress: reportData.eating.percentage,
        progressLabel: `${reportData.eating.percentage}% bra dagar`,
        stats: [
          t('reports.goodEating', { count: reportData.eating.good, percentage: reportData.eating.percentage }),
          t('reports.badEating', { count: reportData.eating.bad }),
        ],
        insight: reportData.eating.insight,
      });
    }

    if (includeExercise && selectedConnection.share_exercise && reportData.exercise.total > 0) {
      sections.push({
        title: t('relativeReports.exercise'),
        tag: 'T',
        color: [120, 168, 124] as [number, number, number],
        progress: reportData.exercise.percentage,
        progressLabel: `${reportData.exercise.percentage}% aktiva dagar`,
        stats: [
          t('reports.exerciseDays', { exercised: reportData.exercise.exercised, total: reportData.exercise.total, percentage: reportData.exercise.percentage }),
        ],
        insight: reportData.exercise.insight,
      });
    }

    if (includeMedication && selectedConnection.share_medication && activeMedications.length > 0) {
      sections.push({
        title: t('relativeReports.medication'),
        tag: 'L',
        color: [168, 130, 196] as [number, number, number],
        progress: reportData.medication.percentage,
        progressLabel: `${reportData.medication.percentage}% följsamhet`,
        stats: [
          t('reports.medicationDays', { taken: reportData.medication.taken, total: reportData.medication.total, percentage: reportData.medication.percentage }),
        ],
        insight: reportData.medication.insight,
      });
    }

    await generateReportPdf({
      title: t('relativeReports.healthReport'),
      periodStart: reportData.period.start,
      periodEnd: reportData.period.end,
      forLine: `För ${patientName}`,
      registeredDays: reportData.period.registeredDays,
      totalDays: reportData.period.totalDays,
      registrationLabel: 'Registrerade dagar',
      registrationRateLabel: 'Registreringsgrad',
      sections,
      filename: `halsorapport-${patientName.replace(/\s+/g, '-').toLowerCase()}-${format(reportData.period.start, 'yyyy-MM-dd')}-${format(reportData.period.end, 'yyyy-MM-dd')}.pdf`,
    });
  };

  if (connectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (approvedConnections.length === 0) {
    return (
      <div className="py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{t('relativeReports.title')}</h1>
            <p className="text-muted-foreground">{t('relativeReports.subtitle')}</p>
          </header>
          
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('relativeReports.noApprovedRelatives')}</h3>
              <p className="text-muted-foreground">
                {t('relativeReports.needApproved')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isDataLoading = !moodLoaded || !medsLoaded;

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{t('relativeReports.title')}</h1>
          <p className="text-muted-foreground">{t('relativeReports.subtitleInsightful')}</p>
        </header>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('relativeReports.createReport')}
            </CardTitle>
            <CardDescription>
              {t('relativeReports.createReportDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('relativeReports.selectRelative')}</Label>
              <Select value={selectedPatientId || ''} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder={t("relativeReports.selectRelativePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {approvedConnections.map(connection => (
                    <SelectItem key={connection.patient_id} value={connection.patient_id}>
                      {getPatientName(connection)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('relativeReports.timePeriod')}</Label>
              <div className="flex flex-wrap gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'd MMM yyyy', { locale: sv }) : t('relativeReports.fromDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      locale={sv}
                    />
                  </PopoverContent>
                </Popover>

                <span className="self-center text-muted-foreground">–</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'd MMM yyyy', { locale: sv }) : t('relativeReports.toDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                      locale={sv}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick date presets */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(startOfMonth(subMonths(today, 1)));
                    setEndDate(endOfMonth(subMonths(today, 1)));
                  }}
                >
                  {t('relativeReports.lastMonth')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(startOfMonth(today));
                    setEndDate(today);
                  }}
                >
                  {t('relativeReports.thisMonth')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(subMonths(today, 3));
                    setEndDate(today);
                  }}
                >
                  {t('relativeReports.last3Months')}
                </Button>
              </div>
            </div>

            {/* Category Selection - only show categories that are shared */}
            {selectedConnection && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('relativeReports.includeInReport')}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedConnection.share_mood && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="mood" checked={includeMood} onCheckedChange={(checked) => setIncludeMood(checked === true)} />
                      <Label htmlFor="mood" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="h-4 w-4 text-primary" />
                        {t('relativeReports.mood')}
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_sleep && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="sleep" checked={includeSleep} onCheckedChange={(checked) => setIncludeSleep(checked === true)} />
                      <Label htmlFor="sleep" className="flex items-center gap-2 cursor-pointer">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        {t('relativeReports.sleep')}
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_eating && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="eating" checked={includeEating} onCheckedChange={(checked) => setIncludeEating(checked === true)} />
                      <Label htmlFor="eating" className="flex items-center gap-2 cursor-pointer">
                        <Utensils className="h-4 w-4 text-amber-500" />
                        {t('relativeReports.food')}
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_exercise && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="exercise" checked={includeExercise} onCheckedChange={(checked) => setIncludeExercise(checked === true)} />
                      <Label htmlFor="exercise" className="flex items-center gap-2 cursor-pointer">
                        <Dumbbell className="h-4 w-4 text-green-500" />
                        {t('relativeReports.exercise')}
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_medication && activeMedications.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="medication" checked={includeMedication} onCheckedChange={(checked) => setIncludeMedication(checked === true)} />
                      <Label htmlFor="medication" className="flex items-center gap-2 cursor-pointer">
                        <Pill className="h-4 w-4 text-purple-500" />
                        {t('relativeReports.medication')}
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={handleGenerateReport} 
              className="w-full md:w-auto"
              disabled={!selectedPatientId || isDataLoading}
            >
              {isDataLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('relativeReports.loadingData')}
                </>
              ) : (
                t('relativeReports.generateReport')
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {reportGenerated && reportData && selectedConnection && (
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('relativeReports.reportFor')} {getPatientName(selectedConnection)}</CardTitle>
                <CardDescription>
                  {format(reportData.period.start, 'd MMMM', { locale: sv })} – {format(reportData.period.end, 'd MMMM yyyy', { locale: sv })}
                </CardDescription>
              </div>
              <Button onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                {t('relativeReports.exportPdf')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('relativeReports.summary')}</p>
                <p className="font-medium">
                  {t('relativeReports.daysRegistered', { registered: reportData.period.registeredDays, total: reportData.period.totalDays })} ({Math.round((reportData.period.registeredDays / reportData.period.totalDays) * 100)}%)
                </p>
              </div>

              {/* Mood Section */}
              {includeMood && selectedConnection.share_mood && reportData.mood.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">{t('relativeReports.mood')}</h3>
                    {reportData.mood.trend === 'up' && <TrendingUp className="h-4 w-4 text-amber-500" />}
                    {reportData.mood.trend === 'down' && <TrendingDown className="h-4 w-4 text-blue-500" />}
                    {reportData.mood.trend === 'stable' && <Minus className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-mood-elevated-light rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-mood-elevated-foreground">{reportData.mood.elevated}</p>
                      <p className="text-xs text-muted-foreground">{t('relativeReports.elevatedDays')}</p>
                    </div>
                    <div className="bg-mood-stable-light rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-mood-stable-foreground">{reportData.mood.stable}</p>
                      <p className="text-xs text-muted-foreground">{t('relativeReports.stableDays')}</p>
                    </div>
                    <div className="bg-mood-depressed-light rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-mood-depressed-foreground">{reportData.mood.depressed}</p>
                      <p className="text-xs text-muted-foreground">{t('relativeReports.depressedDays')}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{reportData.mood.insight}</p>
                </div>
              )}

              {/* Sleep Section */}
              {includeSleep && selectedConnection.share_sleep && reportData.sleep.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Moon className="h-4 w-4 text-indigo-500" />
                    </div>
                    <h3 className="font-semibold">{t('relativeReports.sleep')}</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.sleep.percentage}% {t('relativeReports.goodNights')}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${reportData.sleep.percentage}%` }} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{reportData.sleep.insight}</p>
                </div>
              )}

              {/* Eating Section */}
              {includeEating && selectedConnection.share_eating && reportData.eating.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Utensils className="h-4 w-4 text-amber-500" />
                    </div>
                    <h3 className="font-semibold">{t('relativeReports.food')}</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.eating.percentage}% {t('relativeReports.goodDays')}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${reportData.eating.percentage}%` }} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{reportData.eating.insight}</p>
                </div>
              )}

              {/* Exercise Section */}
              {includeExercise && selectedConnection.share_exercise && reportData.exercise.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Dumbbell className="h-4 w-4 text-green-500" />
                    </div>
                    <h3 className="font-semibold">{t('relativeReports.exercise')}</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.exercise.percentage}% {t('relativeReports.ofDays')}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500" 
                      style={{ width: `${reportData.exercise.percentage}%` }} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{reportData.exercise.insight}</p>
                </div>
              )}

              {/* Medication Section */}
              {includeMedication && selectedConnection.share_medication && activeMedications.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Pill className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="font-semibold">{t('relativeReports.medication')}</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.medication.percentage}% {t('relativeReports.compliance')}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                      style={{ width: `${reportData.medication.percentage}%` }} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{reportData.medication.insight}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RelativeReports;

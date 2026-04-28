import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar as CalendarIcon, Download, TrendingUp, TrendingDown, Minus, Heart, Moon, Utensils, Dumbbell, Pill } from 'lucide-react';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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

const Reports = () => {
  const { t } = useTranslation();
  const today = new Date();
  const defaultStart = startOfMonth(subMonths(today, 1));
  const defaultEnd = endOfMonth(subMonths(today, 1));

  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(defaultEnd);
  const [includeMood, setIncludeMood] = useState(true);
  const [includeSleep, setIncludeSleep] = useState(true);
  const [includeEating, setIncludeEating] = useState(true);
  const [includeExercise, setIncludeExercise] = useState(true);
  const [includeMedication, setIncludeMedication] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);

  const { entries, isLoaded } = useMoodData();
  const { isLoaded: medsLoaded, getMedicationsTakenOnDate, activeMedications } = useMedications();
  const { preferences, loading: prefsLoading } = useUserPreferences();
  const { fullName } = useProfile();

  const reportData = useMemo((): ReportData | null => {
    if (!isLoaded || !medsLoaded || !reportGenerated) return null;

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
      exerciseInsight = t('reports.exerciseInsightBad', { percentage: exercisePercentage });
    }

    // Medication stats
    let medsTaken = 0;
    days.forEach(day => {
      const meds = getMedicationsTakenOnDate(format(day, 'yyyy-MM-dd'));
      if (meds.length > 0) medsTaken++;
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
  }, [entries, isLoaded, medsLoaded, reportGenerated, startDate, endDate, getMedicationsTakenOnDate]);

  const handleGenerateReport = () => {
    setReportGenerated(true);
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(51, 65, 85);
    doc.text(t('reports.healthReport'), margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    const periodText = `${format(reportData.period.start, 'd MMMM', { locale: sv })} - ${format(reportData.period.end, 'd MMMM yyyy', { locale: sv })}`;
    doc.text(periodText, margin, y);
    y += 5;
    
    if (fullName) {
      doc.text(t('reports.generatedFor', { name: fullName }), margin, y);
      y += 5;
    }
    doc.text(t('reports.generated', { date: format(new Date(), 'd MMMM yyyy', { locale: sv }) }), margin, y);
    y += 15;

    // Summary box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, 'F');
    y += 8;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(t('reports.summaryLabel', { registered: reportData.period.registeredDays, total: reportData.period.totalDays }), margin + 5, y);
    y += 7;
    const registrationRate = Math.round((reportData.period.registeredDays / reportData.period.totalDays) * 100);
    doc.setTextColor(100, 116, 139);
    doc.text(t('reports.registrationRate', { rate: registrationRate }), margin + 5, y);
    y += 20;

    // Sections
    const addSection = (title: string, icon: string, stats: string[], insight: string, color: number[]) => {
      if (y > 250) {
        doc.addPage();
        y = 25;
      }

      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(`${icon} ${title}`, margin + 5, y + 6);
      y += 15;

      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      stats.forEach(stat => {
        doc.text(`• ${stat}`, margin + 5, y);
        y += 7;
      });

      y += 3;
      doc.setFillColor(248, 250, 252);
      const insightLines = doc.splitTextToSize(insight, pageWidth - margin * 2 - 10);
      const insightHeight = insightLines.length * 6 + 8;
      doc.roundedRect(margin, y, pageWidth - margin * 2, insightHeight, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(insightLines, margin + 5, y + 6);
      y += insightHeight + 10;
    };

    if (includeMood && reportData.mood.total > 0) {
      addSection(
        t('reports.mood'),
        '💙',
        [
          t('reports.elevatedDays', { count: reportData.mood.elevated }),
          t('reports.stableDays', { count: reportData.mood.stable }),
          t('reports.depressedDays', { count: reportData.mood.depressed }),
        ],
        reportData.mood.insight,
        [100, 116, 139]
      );
    }

    if (includeSleep && reportData.sleep.total > 0) {
      addSection(
        t('reports.sleep'),
        '🌙',
        [
          t('reports.goodSleep', { count: reportData.sleep.good, percentage: reportData.sleep.percentage }),
          t('reports.badSleep', { count: reportData.sleep.bad }),
        ],
        reportData.sleep.insight,
        [99, 102, 241]
      );
    }

    if (includeEating && reportData.eating.total > 0) {
      addSection(
        t('reports.diet'),
        '🍽️',
        [
          t('reports.goodEating', { count: reportData.eating.good, percentage: reportData.eating.percentage }),
          t('reports.badEating', { count: reportData.eating.bad }),
        ],
        reportData.eating.insight,
        [234, 179, 8]
      );
    }

    if (includeExercise && reportData.exercise.total > 0) {
      addSection(
        t('reports.exercise'),
        '💪',
        [
          t('reports.exerciseDays', { exercised: reportData.exercise.exercised, total: reportData.exercise.total, percentage: reportData.exercise.percentage }),
        ],
        reportData.exercise.insight,
        [34, 197, 94]
      );
    }

    if (includeMedication && activeMedications.length > 0) {
      addSection(
        t('reports.medication'),
        '💊',
        [
          t('reports.medicationDays', { taken: reportData.medication.taken, total: reportData.medication.total, percentage: reportData.medication.percentage }),
        ],
        reportData.medication.insight,
        [168, 85, 247]
      );
    }

    // Footer
    if (y > 270) {
      doc.addPage();
      y = 25;
    }
    y = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated with Toddy', margin, y);
    doc.text('www.toddy.se', pageWidth - margin - 40, y);

    // Save
    const filename = `halsorapport-${format(reportData.period.start, 'yyyy-MM-dd')}-${format(reportData.period.end, 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
  };

  if (!isLoaded || !medsLoaded || prefsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const CATEGORY_OPTIONS = [
    { id: 'mood', icon: Heart, label: t('reports.mood'), checked: includeMood, setChecked: setIncludeMood, show: true },
    { id: 'sleep', icon: Moon, label: t('reports.sleep'), checked: includeSleep, setChecked: setIncludeSleep, show: true },
    { id: 'eating', icon: Utensils, label: t('reports.diet'), checked: includeEating, setChecked: setIncludeEating, show: true },
    { id: 'exercise', icon: Dumbbell, label: t('reports.exercise'), checked: includeExercise, setChecked: setIncludeExercise, show: true },
    { id: 'medication', icon: Pill, label: t('reports.medication'), checked: includeMedication, setChecked: setIncludeMedication, show: activeMedications.length > 0 },
  ];

  const presets = [
    { label: t('reports.lastMonth'), apply: () => { setStartDate(startOfMonth(subMonths(today, 1))); setEndDate(endOfMonth(subMonths(today, 1))); } },
    { label: t('reports.thisMonth'), apply: () => { setStartDate(startOfMonth(today)); setEndDate(today); } },
    { label: t('reports.last3Months'), apply: () => { setStartDate(subMonths(today, 3)); setEndDate(today); } },
  ];

  return (
    <div className="space-y-8">
      <p className="text-[13px] text-foreground/30 -mt-4">{t('reports.subtitle')}</p>

      {/* Period */}
      <ReportGroup label={t('reports.timePeriod')}>
        <div className="px-4 py-3.5 flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.07] text-[14px] text-foreground/80 transition-colors">
                <CalendarIcon className="h-4 w-4 text-foreground/40" />
                {format(startDate, 'd MMM yyyy', { locale: sv })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus locale={sv} />
            </PopoverContent>
          </Popover>
          <span className="self-center text-foreground/30">–</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.07] text-[14px] text-foreground/80 transition-colors">
                <CalendarIcon className="h-4 w-4 text-foreground/40" />
                {format(endDate, 'd MMM yyyy', { locale: sv })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus locale={sv} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={p.apply}
              className="px-3 py-1.5 rounded-full text-[13px] text-foreground/60 hover:text-foreground/90 bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </ReportGroup>

      {/* Categories */}
      <ReportGroup label={t('reports.includeInReport')}>
        {CATEGORY_OPTIONS.filter(c => c.show).map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => opt.setChecked(!opt.checked)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-foreground/[0.04] active:bg-foreground/[0.06]"
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0 text-foreground/30" />
              <span className="flex-1 text-[15px] font-medium text-foreground/80">{opt.label}</span>
              <Checkbox checked={opt.checked} onCheckedChange={(c) => opt.setChecked(c === true)} className="pointer-events-none" />
            </button>
          );
        })}
      </ReportGroup>

      <Button onClick={handleGenerateReport} className="w-full rounded-full">
        {t('reports.generateReport')}
      </Button>

      {reportGenerated && reportData && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground/90">{t('reports.yourReport')}</h2>
              <p className="text-[13px] text-foreground/40 mt-0.5">
                {format(reportData.period.start, 'd MMMM', { locale: sv })} – {format(reportData.period.end, 'd MMMM yyyy', { locale: sv })}
              </p>
            </div>
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2 rounded-full">
              <Download className="h-4 w-4" />
              {t('reports.exportPDF')}
            </Button>
          </div>

          <ReportGroup label={t('reports.summary')}>
            <div className="px-4 py-4">
              <p className="text-[14px] text-foreground/80">
                {t('reports.youRegistered', { registered: reportData.period.registeredDays, total: reportData.period.totalDays, percentage: Math.round((reportData.period.registeredDays / reportData.period.totalDays) * 100) })}
              </p>
            </div>
          </ReportGroup>

          {includeMood && reportData.mood.total > 0 && (
            <ReportSection icon={Heart} title={t('reports.mood')} trailing={
              reportData.mood.trend === 'up' ? <TrendingUp className="h-4 w-4 text-foreground/40" /> :
              reportData.mood.trend === 'down' ? <TrendingDown className="h-4 w-4 text-foreground/40" /> :
              <Minus className="h-4 w-4 text-foreground/40" />
            }>
              <div className="grid grid-cols-3 gap-px bg-border/20">
                <MoodCell value={reportData.mood.elevated} label={t('reports.elevated')} />
                <MoodCell value={reportData.mood.stable} label={t('reports.stable')} />
                <MoodCell value={reportData.mood.depressed} label={t('reports.depressed')} />
              </div>
              <InsightRow text={reportData.mood.insight} />
            </ReportSection>
          )}

          {includeSleep && reportData.sleep.total > 0 && (
            <ReportSection icon={Moon} title={t('reports.sleep')} trailing={
              <span className="text-[13px] text-foreground/40">{reportData.sleep.percentage}% {t('reports.goodNights')}</span>
            }>
              <ProgressRow value={reportData.sleep.percentage} />
              <InsightRow text={reportData.sleep.insight} />
            </ReportSection>
          )}

          {includeEating && reportData.eating.total > 0 && (
            <ReportSection icon={Utensils} title={t('reports.diet')} trailing={
              <span className="text-[13px] text-foreground/40">{reportData.eating.percentage}% {t('reports.goodDays')}</span>
            }>
              <ProgressRow value={reportData.eating.percentage} />
              <InsightRow text={reportData.eating.insight} />
            </ReportSection>
          )}

          {includeExercise && reportData.exercise.total > 0 && (
            <ReportSection icon={Dumbbell} title={t('reports.exercise')} trailing={
              <span className="text-[13px] text-foreground/40">{reportData.exercise.percentage}% {t('reports.ofTheDays')}</span>
            }>
              <ProgressRow value={reportData.exercise.percentage} />
              <InsightRow text={reportData.exercise.insight} />
            </ReportSection>
          )}

          {includeMedication && activeMedications.length > 0 && (
            <ReportSection icon={Pill} title={t('reports.medication')} trailing={
              <span className="text-[13px] text-foreground/40">{reportData.medication.percentage}% {t('reports.adherence')}</span>
            }>
              <ProgressRow value={reportData.medication.percentage} />
              <InsightRow text={reportData.medication.insight} />
            </ReportSection>
          )}
        </div>
      )}
    </div>
  );
};

function ReportGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/25 mb-3 px-1">{label}</p>
      <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden divide-y divide-border/20">
        {children}
      </div>
    </div>
  );
}

function ReportSection({ icon: Icon, title, trailing, children }: { icon: React.ElementType; title: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden divide-y divide-border/20">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Icon className="w-[18px] h-[18px] text-foreground/40" />
        <h3 className="flex-1 text-[15px] font-semibold text-foreground/85">{title}</h3>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function MoodCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-foreground/[0.02] px-3 py-4 text-center">
      <p className="text-2xl font-bold text-foreground/85">{value}</p>
      <p className="text-[12px] text-foreground/40 mt-0.5">{label}</p>
    </div>
  );
}

function ProgressRow({ value }: { value: number }) {
  return (
    <div className="px-4 py-4">
      <div className="h-2 bg-foreground/[0.06] rounded-full overflow-hidden">
        <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InsightRow({ text }: { text: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[13px] text-foreground/55 leading-relaxed">{text}</p>
    </div>
  );
}

export default Reports;

import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar as CalendarIcon, FileText, Download, TrendingUp, TrendingDown, Minus, Heart, Moon, Utensils, Dumbbell, Pill } from 'lucide-react';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

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
        moodInsight = `Du har haft ett stabilt mående under ${Math.round(stablePercentage)}% av perioden. Det är ett bra tecken på balans.`;
        moodTrend = 'stable';
      } else if (elevatedPercentage > depressedPercentage) {
        moodInsight = `Du har upplevt förhöjt mående ${Math.round(elevatedPercentage)}% av tiden. Var uppmärksam på tecken på hypomani.`;
        moodTrend = 'up';
      } else if (depressedPercentage > elevatedPercentage) {
        moodInsight = `Du har haft nedstämdhet ${Math.round(depressedPercentage)}% av perioden. Överväg att prata med din läkare om detta mönster.`;
        moodTrend = 'down';
      } else {
        moodInsight = 'Ditt mående har varierat under perioden. Det kan vara värt att titta närmare på vilka faktorer som påverkar.';
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
      sleepInsight = `Du har sovit bra ${sleepPercentage}% av nätterna. Fortsätt med dina goda sömnrutiner!`;
    } else if (sleepPercentage >= 50) {
      sleepInsight = `Din sömn har varit varierande. ${100 - sleepPercentage}% dåliga nätter kan påverka ditt mående.`;
    } else {
      sleepInsight = `Du har haft sömnproblem ${100 - sleepPercentage}% av nätterna. Sömn är viktigt för din hälsa.`;
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
      eatingInsight = `Du har ätit bra ${eatingPercentage}% av dagarna. Bra jobbat!`;
    } else {
      eatingInsight = `Du har haft oregelbundna matvanor. Regelbunden mat kan stabilisera humöret.`;
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
      exerciseInsight = `Du har tränat ${exercisePercentage}% av dagarna. Motion är bra för både kropp och sinne!`;
    } else {
      exerciseInsight = `Du har tränat ${exercisePercentage}% av dagarna. Även korta promenader kan göra skillnad.`;
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
      medsInsight = `Utmärkt! Du har tagit din medicin ${medsPercentage}% av dagarna.`;
    } else if (medsPercentage >= 70) {
      medsInsight = `Du har tagit din medicin ${medsPercentage}% av dagarna. Försök att vara mer konsekvent.`;
    } else {
      medsInsight = `Du har missat medicin ofta. Regelbunden medicinering är viktig för din behandling.`;
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

  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(51, 65, 85);
    doc.text('Hälsorapport', margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    const periodText = `${format(reportData.period.start, 'd MMMM', { locale: sv })} - ${format(reportData.period.end, 'd MMMM yyyy', { locale: sv })}`;
    doc.text(periodText, margin, y);
    y += 5;
    
    if (fullName) {
      doc.text(`Genererad för: ${fullName}`, margin, y);
      y += 5;
    }
    doc.text(`Genererad: ${format(new Date(), 'd MMMM yyyy', { locale: sv })}`, margin, y);
    y += 15;

    // Summary box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, 'F');
    y += 8;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(`Sammanfattning: ${reportData.period.registeredDays} av ${reportData.period.totalDays} dagar registrerade`, margin + 5, y);
    y += 7;
    const registrationRate = Math.round((reportData.period.registeredDays / reportData.period.totalDays) * 100);
    doc.setTextColor(100, 116, 139);
    doc.text(`Registreringsfrekvens: ${registrationRate}%`, margin + 5, y);
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
        'Mående',
        '💙',
        [
          `Förhöjt: ${reportData.mood.elevated} dagar`,
          `Stabilt: ${reportData.mood.stable} dagar`,
          `Nedstämt: ${reportData.mood.depressed} dagar`,
        ],
        reportData.mood.insight,
        [100, 116, 139]
      );
    }

    if (includeSleep && reportData.sleep.total > 0) {
      addSection(
        'Sömn',
        '🌙',
        [
          `Bra sömn: ${reportData.sleep.good} nätter (${reportData.sleep.percentage}%)`,
          `Dålig sömn: ${reportData.sleep.bad} nätter`,
        ],
        reportData.sleep.insight,
        [99, 102, 241]
      );
    }

    if (includeEating && reportData.eating.total > 0) {
      addSection(
        'Mat',
        '🍽️',
        [
          `Bra matvanor: ${reportData.eating.good} dagar (${reportData.eating.percentage}%)`,
          `Mindre bra matvanor: ${reportData.eating.bad} dagar`,
        ],
        reportData.eating.insight,
        [234, 179, 8]
      );
    }

    if (includeExercise && reportData.exercise.total > 0) {
      addSection(
        'Träning',
        '💪',
        [
          `Träningsdagar: ${reportData.exercise.exercised} av ${reportData.exercise.total} (${reportData.exercise.percentage}%)`,
        ],
        reportData.exercise.insight,
        [34, 197, 94]
      );
    }

    if (includeMedication && activeMedications.length > 0) {
      addSection(
        'Medicin',
        '💊',
        [
          `Dagar med medicin: ${reportData.medication.taken} av ${reportData.medication.total} (${reportData.medication.percentage}%)`,
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
    doc.text('Genererad med Between Clouds', margin, y);
    doc.text('www.betweenclouds.se', pageWidth - margin - 40, y);

    // Save
    const filename = `halsorapport-${format(reportData.period.start, 'yyyy-MM-dd')}-${format(reportData.period.end, 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
  };

  if (!isLoaded || !medsLoaded || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Rapporter</h1>
          <p className="text-muted-foreground">Skapa insiktsfulla rapporter baserat på din insamlade data</p>
        </header>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Skapa rapport
            </CardTitle>
            <CardDescription>
              Välj tidsperiod och vilka kategorier som ska ingå i rapporten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tidsperiod</Label>
              <div className="flex flex-wrap gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'd MMM yyyy', { locale: sv }) : 'Från datum'}
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
                      {endDate ? format(endDate, 'd MMM yyyy', { locale: sv }) : 'Till datum'}
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
                  Förra månaden
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(startOfMonth(today));
                    setEndDate(today);
                  }}
                >
                  Denna månad
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(subMonths(today, 3));
                    setEndDate(today);
                  }}
                >
                  Senaste 3 månaderna
                </Button>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Inkludera i rapporten</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox id="mood" checked={includeMood} onCheckedChange={(checked) => setIncludeMood(checked === true)} />
                  <Label htmlFor="mood" className="flex items-center gap-2 cursor-pointer">
                    <Heart className="h-4 w-4 text-primary" />
                    Mående
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="sleep" checked={includeSleep} onCheckedChange={(checked) => setIncludeSleep(checked === true)} />
                  <Label htmlFor="sleep" className="flex items-center gap-2 cursor-pointer">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    Sömn
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="eating" checked={includeEating} onCheckedChange={(checked) => setIncludeEating(checked === true)} />
                  <Label htmlFor="eating" className="flex items-center gap-2 cursor-pointer">
                    <Utensils className="h-4 w-4 text-amber-500" />
                    Mat
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="exercise" checked={includeExercise} onCheckedChange={(checked) => setIncludeExercise(checked === true)} />
                  <Label htmlFor="exercise" className="flex items-center gap-2 cursor-pointer">
                    <Dumbbell className="h-4 w-4 text-green-500" />
                    Träning
                  </Label>
                </div>
                {activeMedications.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <Checkbox id="medication" checked={includeMedication} onCheckedChange={(checked) => setIncludeMedication(checked === true)} />
                    <Label htmlFor="medication" className="flex items-center gap-2 cursor-pointer">
                      <Pill className="h-4 w-4 text-purple-500" />
                      Medicin
                    </Label>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleGenerateReport} className="w-full md:w-auto">
              Generera rapport
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {reportGenerated && reportData && (
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Din rapport</CardTitle>
                <CardDescription>
                  {format(reportData.period.start, 'd MMMM', { locale: sv })} – {format(reportData.period.end, 'd MMMM yyyy', { locale: sv })}
                </CardDescription>
              </div>
              <Button onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Exportera PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Sammanfattning</p>
                <p className="font-medium">
                  Du har registrerat {reportData.period.registeredDays} av {reportData.period.totalDays} dagar ({Math.round((reportData.period.registeredDays / reportData.period.totalDays) * 100)}%)
                </p>
              </div>

              {/* Mood Section */}
              {includeMood && reportData.mood.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">Mående</h3>
                    {reportData.mood.trend === 'up' && <TrendingUp className="h-4 w-4 text-amber-500" />}
                    {reportData.mood.trend === 'down' && <TrendingDown className="h-4 w-4 text-blue-500" />}
                    {reportData.mood.trend === 'stable' && <Minus className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-mood-elevated-light rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-mood-elevated-foreground">{reportData.mood.elevated}</p>
                      <p className="text-xs text-muted-foreground">Förhöjt</p>
                    </div>
                    <div className="bg-mood-stable-light rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-mood-stable-foreground">{reportData.mood.stable}</p>
                      <p className="text-xs text-muted-foreground">Stabilt</p>
                    </div>
                    <div className="bg-mood-depressed-light rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-mood-depressed-foreground">{reportData.mood.depressed}</p>
                      <p className="text-xs text-muted-foreground">Nedstämt</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{reportData.mood.insight}</p>
                </div>
              )}

              {/* Sleep Section */}
              {includeSleep && reportData.sleep.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Moon className="h-4 w-4 text-indigo-500" />
                    </div>
                    <h3 className="font-semibold">Sömn</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.sleep.percentage}% bra nätter</span>
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
              {includeEating && reportData.eating.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Utensils className="h-4 w-4 text-amber-500" />
                    </div>
                    <h3 className="font-semibold">Mat</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.eating.percentage}% bra dagar</span>
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
              {includeExercise && reportData.exercise.total > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Dumbbell className="h-4 w-4 text-green-500" />
                    </div>
                    <h3 className="font-semibold">Träning</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.exercise.percentage}% av dagarna</span>
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
              {includeMedication && activeMedications.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Pill className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="font-semibold">Medicin</h3>
                    <span className="text-sm text-muted-foreground ml-auto">{reportData.medication.percentage}% följsamhet</span>
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

export default Reports;

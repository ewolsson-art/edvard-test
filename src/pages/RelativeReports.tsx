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
        moodInsight = `Din närstående har haft ett stabilt mående under ${Math.round(stablePercentage)}% av perioden.`;
        moodTrend = 'stable';
      } else if (elevatedPercentage > depressedPercentage) {
        moodInsight = `Din närstående har upplevt förhöjt mående ${Math.round(elevatedPercentage)}% av tiden.`;
        moodTrend = 'up';
      } else if (depressedPercentage > elevatedPercentage) {
        moodInsight = `Din närstående har haft nedstämdhet ${Math.round(depressedPercentage)}% av perioden.`;
        moodTrend = 'down';
      } else {
        moodInsight = 'Måendet har varierat under perioden.';
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
      sleepInsight = `Bra sömn ${sleepPercentage}% av nätterna.`;
    } else if (sleepPercentage >= 50) {
      sleepInsight = `Varierande sömn med ${100 - sleepPercentage}% dåliga nätter.`;
    } else {
      sleepInsight = `Sömnproblem ${100 - sleepPercentage}% av nätterna.`;
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
      eatingInsight = `Bra matvanor ${eatingPercentage}% av dagarna.`;
    } else {
      eatingInsight = `Oregelbundna matvanor under perioden.`;
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
      exerciseInsight = `Träning ${exercisePercentage}% av dagarna.`;
    } else {
      exerciseInsight = `Träning ${exercisePercentage}% av dagarna.`;
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
      medsInsight = `Utmärkt följsamhet: ${medsPercentage}% av dagarna.`;
    } else if (medsPercentage >= 70) {
      medsInsight = `Medicin tagen ${medsPercentage}% av dagarna.`;
    } else {
      medsInsight = `Medicin missad ofta under perioden.`;
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
    const { default: jsPDF } = await import('jspdf');
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
    
    doc.text(`Patient: ${patientName}`, margin, y);
    y += 5;
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

    if (includeMood && selectedConnection.share_mood && reportData.mood.total > 0) {
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

    if (includeSleep && selectedConnection.share_sleep && reportData.sleep.total > 0) {
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

    if (includeEating && selectedConnection.share_eating && reportData.eating.total > 0) {
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

    if (includeExercise && selectedConnection.share_exercise && reportData.exercise.total > 0) {
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

    if (includeMedication && selectedConnection.share_medication && activeMedications.length > 0) {
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
    const filename = `halsorapport-${patientName.replace(/\s+/g, '-').toLowerCase()}-${format(reportData.period.start, 'yyyy-MM-dd')}-${format(reportData.period.end, 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Rapporter</h1>
            <p className="text-muted-foreground">Skapa rapporter för dina närstående</p>
          </header>
          
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga godkända närstående</h3>
              <p className="text-muted-foreground">
                Du behöver ha en godkänd koppling till en närstående för att kunna skapa rapporter.
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
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Rapporter</h1>
          <p className="text-muted-foreground">Skapa insiktsfulla rapporter för dina närstående</p>
        </header>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Skapa rapport
            </CardTitle>
            <CardDescription>
              Välj närstående, tidsperiod och vilka kategorier som ska ingå
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Välj närstående</Label>
              <Select value={selectedPatientId || ''} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Välj en närstående" />
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

            {/* Category Selection - only show categories that are shared */}
            {selectedConnection && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Inkludera i rapporten</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedConnection.share_mood && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="mood" checked={includeMood} onCheckedChange={(checked) => setIncludeMood(checked === true)} />
                      <Label htmlFor="mood" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="h-4 w-4 text-primary" />
                        Mående
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_sleep && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="sleep" checked={includeSleep} onCheckedChange={(checked) => setIncludeSleep(checked === true)} />
                      <Label htmlFor="sleep" className="flex items-center gap-2 cursor-pointer">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        Sömn
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_eating && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="eating" checked={includeEating} onCheckedChange={(checked) => setIncludeEating(checked === true)} />
                      <Label htmlFor="eating" className="flex items-center gap-2 cursor-pointer">
                        <Utensils className="h-4 w-4 text-amber-500" />
                        Mat
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_exercise && (
                    <div className="flex items-center space-x-3">
                      <Checkbox id="exercise" checked={includeExercise} onCheckedChange={(checked) => setIncludeExercise(checked === true)} />
                      <Label htmlFor="exercise" className="flex items-center gap-2 cursor-pointer">
                        <Dumbbell className="h-4 w-4 text-green-500" />
                        Träning
                      </Label>
                    </div>
                  )}
                  {selectedConnection.share_medication && activeMedications.length > 0 && (
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
            )}

            <Button 
              onClick={handleGenerateReport} 
              className="w-full md:w-auto"
              disabled={!selectedPatientId || isDataLoading}
            >
              {isDataLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Laddar data...
                </>
              ) : (
                'Generera rapport'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {reportGenerated && reportData && selectedConnection && (
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rapport för {getPatientName(selectedConnection)}</CardTitle>
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
                  {reportData.period.registeredDays} av {reportData.period.totalDays} dagar registrerade ({Math.round((reportData.period.registeredDays / reportData.period.totalDays) * 100)}%)
                </p>
              </div>

              {/* Mood Section */}
              {includeMood && selectedConnection.share_mood && reportData.mood.total > 0 && (
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
              {includeSleep && selectedConnection.share_sleep && reportData.sleep.total > 0 && (
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
              {includeEating && selectedConnection.share_eating && reportData.eating.total > 0 && (
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
              {includeExercise && selectedConnection.share_exercise && reportData.exercise.total > 0 && (
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
              {includeMedication && selectedConnection.share_medication && activeMedications.length > 0 && (
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

export default RelativeReports;

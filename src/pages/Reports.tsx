import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { FileText, Download, Share2, Calendar, BarChart3, Copy, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import { MOOD_LABELS, MoodType } from '@/types/mood';

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [copiedMonth, setCopiedMonth] = useState(false);
  const [copiedYear, setCopiedYear] = useState(false);
  
  const { entries, isLoaded, getEntriesForMonth, getEntriesForYear, getStatsForYear } = useMoodData();
  const { medications, isLoaded: medsLoaded } = useMedications();
  const { toast } = useToast();

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: sv }),
    };
  });

  // Generate year options (current year and 2 previous)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map(year => ({
    value: year.toString(),
    label: year.toString(),
  }));

  const downloadMonthlyPDF = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthData = getEntriesForMonth(year, month - 1);
    const monthName = format(new Date(year, month - 1), 'MMMM yyyy', { locale: sv });
    
    let elevated = 0, stable = 0, depressed = 0;
    Object.values(monthData).forEach(mood => {
      if (mood === 'elevated') elevated++;
      if (mood === 'stable') stable++;
      if (mood === 'depressed') depressed++;
    });
    const total = elevated + stable + depressed;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Manadsrapport', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Stats overview box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(20, y, pageWidth - 40, 50, 3, 3, 'F');
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sammanfattning', 30, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Antal registrerade dagar: ${total}`, 30, y);
    y += 8;

    // Stats with percentages
    const elevatedPct = total > 0 ? Math.round((elevated / total) * 100) : 0;
    const stablePct = total > 0 ? Math.round((stable / total) * 100) : 0;
    const depressedPct = total > 0 ? Math.round((depressed / total) * 100) : 0;

    doc.setTextColor(234, 88, 12); // Orange
    doc.text(`Uppvarvad: ${elevated} dagar (${elevatedPct}%)`, 30, y);
    
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`Stabil: ${stable} dagar (${stablePct}%)`, 100, y);
    
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`Nedstamd: ${depressed} dagar (${depressedPct}%)`, 160, y);
    
    doc.setTextColor(0, 0, 0);
    y += 25;

    // Visual bar chart
    const barWidth = pageWidth - 60;
    const barHeight = 20;
    
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(30, y, barWidth, barHeight, 2, 2, 'F');
    
    if (total > 0) {
      let barX = 30;
      
      if (elevated > 0) {
        const elevatedWidth = (elevated / total) * barWidth;
        doc.setFillColor(251, 146, 60); // Orange
        doc.rect(barX, y, elevatedWidth, barHeight, 'F');
        barX += elevatedWidth;
      }
      
      if (stable > 0) {
        const stableWidth = (stable / total) * barWidth;
        doc.setFillColor(74, 222, 128); // Green
        doc.rect(barX, y, stableWidth, barHeight, 'F');
        barX += stableWidth;
      }
      
      if (depressed > 0) {
        const depressedWidth = (depressed / total) * barWidth;
        doc.setFillColor(248, 113, 113); // Red
        doc.rect(barX, y, depressedWidth, barHeight, 'F');
      }
    }
    y += 35;

    // Medications section
    if (medications.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Mediciner', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      medications.filter(m => m.active).forEach(med => {
        const startDate = format(new Date(med.started_at), 'd MMM yyyy', { locale: sv });
        doc.text(`• ${med.name} - ${med.dosage} (sedan ${startDate})`, 25, y);
        y += 6;
      });
      y += 10;
    }

    // Daily entries
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dagliga registreringar', 20, y);
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const sortedEntries = Object.entries(monthData).sort(([a], [b]) => Number(a) - Number(b));
    
    sortedEntries.forEach(([day, mood]) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const entry = entries.find(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === Number(day);
      });
      
      // Color indicator
      if (mood === 'elevated') doc.setFillColor(251, 146, 60);
      else if (mood === 'stable') doc.setFillColor(74, 222, 128);
      else doc.setFillColor(248, 113, 113);
      
      doc.circle(25, y - 1.5, 2, 'F');
      
      doc.setTextColor(0, 0, 0);
      const dateText = `${day}/${month} - ${MOOD_LABELS[mood as MoodType]}`;
      doc.text(dateText, 30, y);
      
      if (entry?.comment) {
        doc.setTextColor(100, 100, 100);
        const commentText = entry.comment.length > 60 ? entry.comment.substring(0, 60) + '...' : entry.comment;
        doc.text(`"${commentText}"`, 35, y + 5);
        y += 5;
      }
      
      y += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Genererad: ${format(new Date(), 'yyyy-MM-dd HH:mm')} | Between Clouds`, pageWidth / 2, 290, { align: 'center' });

    doc.save(`maende-rapport-${selectedMonth}.pdf`);
    
    toast({
      title: "PDF nedladdad",
      description: `maende-rapport-${selectedMonth}.pdf har sparats.`,
    });
  };

  const downloadYearlyPDF = () => {
    const year = Number(selectedYear);
    const yearEntries = getEntriesForYear(year);
    const stats = getStatsForYear(year);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Arsrapport', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(year.toString(), pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Stats overview box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(20, y, pageWidth - 40, 50, 3, 3, 'F');
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Arssammanfattning', 30, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Totalt antal registrerade dagar: ${stats.total}`, 30, y);
    y += 8;

    const elevatedPct = stats.total > 0 ? Math.round((stats.elevated / stats.total) * 100) : 0;
    const stablePct = stats.total > 0 ? Math.round((stats.stable / stats.total) * 100) : 0;
    const depressedPct = stats.total > 0 ? Math.round((stats.depressed / stats.total) * 100) : 0;

    doc.setTextColor(234, 88, 12);
    doc.text(`Uppvarvad: ${stats.elevated} dagar (${elevatedPct}%)`, 30, y);
    
    doc.setTextColor(34, 197, 94);
    doc.text(`Stabil: ${stats.stable} dagar (${stablePct}%)`, 100, y);
    
    doc.setTextColor(239, 68, 68);
    doc.text(`Nedstamd: ${stats.depressed} dagar (${depressedPct}%)`, 160, y);
    
    doc.setTextColor(0, 0, 0);
    y += 25;

    // Visual bar chart
    const barWidth = pageWidth - 60;
    const barHeight = 20;
    
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(30, y, barWidth, barHeight, 2, 2, 'F');
    
    if (stats.total > 0) {
      let barX = 30;
      
      if (stats.elevated > 0) {
        const elevatedWidth = (stats.elevated / stats.total) * barWidth;
        doc.setFillColor(251, 146, 60);
        doc.rect(barX, y, elevatedWidth, barHeight, 'F');
        barX += elevatedWidth;
      }
      
      if (stats.stable > 0) {
        const stableWidth = (stats.stable / stats.total) * barWidth;
        doc.setFillColor(74, 222, 128);
        doc.rect(barX, y, stableWidth, barHeight, 'F');
        barX += stableWidth;
      }
      
      if (stats.depressed > 0) {
        const depressedWidth = (stats.depressed / stats.total) * barWidth;
        doc.setFillColor(248, 113, 113);
        doc.rect(barX, y, depressedWidth, barHeight, 'F');
      }
    }
    y += 35;

    // Medications section
    if (medications.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Mediciner', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      medications.filter(m => m.active).forEach(med => {
        const startDate = format(new Date(med.started_at), 'd MMM yyyy', { locale: sv });
        doc.text(`• ${med.name} - ${med.dosage} (sedan ${startDate})`, 25, y);
        y += 6;
      });
      y += 10;
    }

    // Monthly breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Manadsvis fordelning', 20, y);
    y += 12;

    const months = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
                    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];

    months.forEach((monthName, i) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const monthEntries = yearEntries.filter(e => new Date(e.date).getMonth() === i);
      const elevated = monthEntries.filter(e => e.mood === 'elevated').length;
      const stable = monthEntries.filter(e => e.mood === 'stable').length;
      const depressed = monthEntries.filter(e => e.mood === 'depressed').length;
      const monthTotal = elevated + stable + depressed;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(monthName, 25, y);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`${monthTotal} dagar`, 70, y);

      // Mini bar for each month
      const miniBarWidth = 80;
      const miniBarHeight = 6;
      const miniBarX = 100;
      
      doc.setFillColor(229, 231, 235);
      doc.rect(miniBarX, y - 4, miniBarWidth, miniBarHeight, 'F');
      
      if (monthTotal > 0) {
        let barX = miniBarX;
        
        if (elevated > 0) {
          const w = (elevated / monthTotal) * miniBarWidth;
          doc.setFillColor(251, 146, 60);
          doc.rect(barX, y - 4, w, miniBarHeight, 'F');
          barX += w;
        }
        
        if (stable > 0) {
          const w = (stable / monthTotal) * miniBarWidth;
          doc.setFillColor(74, 222, 128);
          doc.rect(barX, y - 4, w, miniBarHeight, 'F');
          barX += w;
        }
        
        if (depressed > 0) {
          const w = (depressed / monthTotal) * miniBarWidth;
          doc.setFillColor(248, 113, 113);
          doc.rect(barX, y - 4, w, miniBarHeight, 'F');
        }
      }

      y += 12;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Genererad: ${format(new Date(), 'yyyy-MM-dd HH:mm')} | Between Clouds`, pageWidth / 2, 290, { align: 'center' });

    doc.save(`maende-rapport-${selectedYear}.pdf`);
    
    toast({
      title: "PDF nedladdad",
      description: `maende-rapport-${selectedYear}.pdf har sparats.`,
    });
  };

  const generateTextReport = (type: 'month' | 'year') => {
    if (type === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthData = getEntriesForMonth(year, month - 1);
      const monthName = format(new Date(year, month - 1), 'MMMM yyyy', { locale: sv });
      
      let elevated = 0, stable = 0, depressed = 0;
      Object.values(monthData).forEach(mood => {
        if (mood === 'elevated') elevated++;
        if (mood === 'stable') stable++;
        if (mood === 'depressed') depressed++;
      });
      const total = elevated + stable + depressed;

      let report = `MÅNADSRAPPORT - ${monthName.toUpperCase()}\n${'='.repeat(40)}\n\n`;
      report += `SAMMANFATTNING\n--------------\n`;
      report += `Antal registrerade dagar: ${total}\n`;
      report += `${MOOD_LABELS.elevated}: ${elevated} dagar (${total > 0 ? Math.round((elevated / total) * 100) : 0}%)\n`;
      report += `${MOOD_LABELS.stable}: ${stable} dagar (${total > 0 ? Math.round((stable / total) * 100) : 0}%)\n`;
      report += `${MOOD_LABELS.depressed}: ${depressed} dagar (${total > 0 ? Math.round((depressed / total) * 100) : 0}%)\n\n`;
      
      if (medications.length > 0) {
        report += `MEDICINER\n---------\n`;
        medications.filter(m => m.active).forEach(med => {
          const startDate = format(new Date(med.started_at), 'd MMM yyyy', { locale: sv });
          report += `• ${med.name} - ${med.dosage} (sedan ${startDate})\n`;
        });
        report += '\n';
      }

      report += `DAGLIGA REGISTRERINGAR\n----------------------\n`;
      Object.entries(monthData)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([day, mood]) => {
          const entry = entries.find(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === Number(day);
          });
          const comment = entry?.comment ? ` - "${entry.comment}"` : '';
          report += `${day}/${month}: ${MOOD_LABELS[mood as MoodType]}${comment}\n`;
        });

      report += `\n---\nGenererad: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
      return report;
    } else {
      const year = Number(selectedYear);
      const yearEntries = getEntriesForYear(year);
      const stats = getStatsForYear(year);

      let report = `ÅRSRAPPORT - ${year}\n${'='.repeat(40)}\n\n`;
      report += `ÅRSSAMMANFATTNING\n-----------------\n`;
      report += `Totalt antal registrerade dagar: ${stats.total}\n`;
      report += `${MOOD_LABELS.elevated}: ${stats.elevated} dagar (${stats.total > 0 ? Math.round((stats.elevated / stats.total) * 100) : 0}%)\n`;
      report += `${MOOD_LABELS.stable}: ${stats.stable} dagar (${stats.total > 0 ? Math.round((stats.stable / stats.total) * 100) : 0}%)\n`;
      report += `${MOOD_LABELS.depressed}: ${stats.depressed} dagar (${stats.total > 0 ? Math.round((stats.depressed / stats.total) * 100) : 0}%)\n\n`;

      if (medications.length > 0) {
        report += `MEDICINER\n---------\n`;
        medications.filter(m => m.active).forEach(med => {
          const startDate = format(new Date(med.started_at), 'd MMM yyyy', { locale: sv });
          report += `• ${med.name} - ${med.dosage} (sedan ${startDate})\n`;
        });
        report += '\n';
      }

      report += `MÅNADSVIS FÖRDELNING\n--------------------\n`;
      const months = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
      
      months.forEach((monthName, i) => {
        const monthEntries = yearEntries.filter(e => new Date(e.date).getMonth() === i);
        const elevated = monthEntries.filter(e => e.mood === 'elevated').length;
        const stable = monthEntries.filter(e => e.mood === 'stable').length;
        const depressed = monthEntries.filter(e => e.mood === 'depressed').length;
        const total = elevated + stable + depressed;
        report += `${monthName.padEnd(12)}: ${total} dagar (↑${elevated} ●${stable} ↓${depressed})\n`;
      });

      report += `\n---\nGenererad: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
      return report;
    }
  };

  const copyToClipboard = async (type: 'month' | 'year') => {
    const report = generateTextReport(type);
    
    try {
      await navigator.clipboard.writeText(report);
      if (type === 'month') {
        setCopiedMonth(true);
        setTimeout(() => setCopiedMonth(false), 2000);
      } else {
        setCopiedYear(true);
        setTimeout(() => setCopiedYear(false), 2000);
      }
      toast({
        title: "Kopierat till urklipp",
        description: "Du kan nu klistra in rapporten i ett meddelande till din läkare.",
      });
    } catch (err) {
      toast({
        title: "Kunde inte kopiera",
        description: "Försök ladda ner rapporten istället.",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded || !medsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Rapporter
          </h1>
          <p className="text-muted-foreground">
            Exportera och dela dina måendedata med din läkare
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Report Card */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Månadsrapport</CardTitle>
                  <CardDescription>Exportera data för en specifik månad</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj månad" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={downloadMonthlyPDF}
                >
                  <Download className="h-4 w-4" />
                  Ladda ner PDF
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => copyToClipboard('month')}
                >
                  {copiedMonth ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedMonth ? 'Kopierat!' : 'Kopiera'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Yearly Report Card */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Årsrapport</CardTitle>
                  <CardDescription>Exportera data för ett helt år</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj år" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={downloadYearlyPDF}
                >
                  <Download className="h-4 w-4" />
                  Ladda ner PDF
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => copyToClipboard('year')}
                >
                  {copiedYear ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedYear ? 'Kopierat!' : 'Kopiera'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info section */}
        <Card className="mt-6 bg-muted/30 border-dashed">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Share2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Tips för att dela med din läkare</p>
                <p className="text-sm text-muted-foreground">
                  Ladda ner PDF-rapporten och bifoga den som bilaga i ett e-postmeddelande eller skriv ut den. 
                  Du kan också kopiera textrapporten och klistra in i 1177-appen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

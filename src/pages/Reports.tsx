import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Download, Share2, Calendar, BarChart3, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
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
  const [sharingMonth, setSharingMonth] = useState(false);
  const [sharingYear, setSharingYear] = useState(false);
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
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 25;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Manadsrapport', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 18;

    // Stats overview box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 55, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 55, 4, 4, 'S');
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Sammanfattning', margin + 10, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Registrerade dagar: ${total}`, margin + 10, y);
    y += 12;

    // Stats in columns
    const elevatedPct = total > 0 ? Math.round((elevated / total) * 100) : 0;
    const stablePct = total > 0 ? Math.round((stable / total) * 100) : 0;
    const depressedPct = total > 0 ? Math.round((depressed / total) * 100) : 0;

    const colWidth = contentWidth / 3;
    
    // Elevated
    doc.setFillColor(254, 215, 170);
    doc.circle(margin + 15, y - 1, 3, 'F');
    doc.setTextColor(194, 65, 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Uppvarvad', margin + 22, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${elevated} dagar (${elevatedPct}%)`, margin + 22, y + 6);
    
    // Stable
    doc.setFillColor(187, 247, 208);
    doc.circle(margin + colWidth + 15, y - 1, 3, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('Stabil', margin + colWidth + 22, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stable} dagar (${stablePct}%)`, margin + colWidth + 22, y + 6);
    
    // Depressed
    doc.setFillColor(254, 202, 202);
    doc.circle(margin + colWidth * 2 + 15, y - 1, 3, 'F');
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.text('Nedstamd', margin + colWidth * 2 + 22, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${depressed} dagar (${depressedPct}%)`, margin + colWidth * 2 + 22, y + 6);
    
    doc.setTextColor(0, 0, 0);
    y += 25;

    // Visual bar chart
    const barHeight = 14;
    
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, barHeight, 3, 3, 'F');
    
    if (total > 0) {
      let barX = margin;
      
      if (elevated > 0) {
        const elevatedWidth = (elevated / total) * contentWidth;
        doc.setFillColor(251, 146, 60);
        doc.roundedRect(barX, y, elevatedWidth, barHeight, 3, 3, 'F');
        barX += elevatedWidth;
      }
      
      if (stable > 0) {
        const stableWidth = (stable / total) * contentWidth;
        doc.setFillColor(74, 222, 128);
        doc.rect(barX, y, stableWidth, barHeight, 'F');
        barX += stableWidth;
      }
      
      if (depressed > 0) {
        const depressedWidth = (depressed / total) * contentWidth;
        doc.setFillColor(248, 113, 113);
        doc.roundedRect(barX, y, depressedWidth, barHeight, 3, 3, 'F');
      }
    }
    y += 25;

    // Medications section
    if (medications.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Mediciner', margin, y);
      y += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      medications.filter(m => m.active).forEach(med => {
        const startDate = format(new Date(med.started_at), 'd MMM yyyy', { locale: sv });
        doc.text(`• ${med.name} - ${med.dosage} (sedan ${startDate})`, margin + 5, y);
        y += 5;
      });
      y += 8;
    }

    // Daily entries
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dagliga registreringar', margin, y);
    y += 10;

    doc.setFontSize(9);
    
    const sortedEntries = Object.entries(monthData).sort(([a], [b]) => Number(a) - Number(b));
    
    sortedEntries.forEach(([day, mood]) => {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      
      const entry = entries.find(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === Number(day);
      });
      
      // Color indicator
      if (mood === 'elevated') doc.setFillColor(251, 146, 60);
      else if (mood === 'stable') doc.setFillColor(74, 222, 128);
      else doc.setFillColor(248, 113, 113);
      
      doc.circle(margin + 3, y - 1, 2, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      const dateText = `${day}/${month}`;
      doc.text(dateText, margin + 8, y);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`- ${MOOD_LABELS[mood as MoodType]}`, margin + 20, y);
      
      if (entry?.comment) {
        y += 5;
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        // Word wrap for long comments
        const maxWidth = contentWidth - 15;
        const lines = doc.splitTextToSize(`"${entry.comment}"`, maxWidth);
        lines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = 25;
          }
          doc.text(line, margin + 8, y);
          y += 4;
        });
        doc.setFontSize(9);
      }
      
      y += 6;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Between Clouds | Genererad ${format(new Date(), 'yyyy-MM-dd HH:mm')} | Sida ${i}/${pageCount}`,
        pageWidth / 2,
        287,
        { align: 'center' }
      );
    }

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
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 25;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Arsrapport', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(year.toString(), pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 18;

    // Stats overview box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 55, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 55, 4, 4, 'S');
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Arssammanfattning', margin + 10, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Totalt registrerade dagar: ${stats.total}`, margin + 10, y);
    y += 12;

    const elevatedPct = stats.total > 0 ? Math.round((stats.elevated / stats.total) * 100) : 0;
    const stablePct = stats.total > 0 ? Math.round((stats.stable / stats.total) * 100) : 0;
    const depressedPct = stats.total > 0 ? Math.round((stats.depressed / stats.total) * 100) : 0;

    const colWidth = contentWidth / 3;
    
    // Elevated
    doc.setFillColor(254, 215, 170);
    doc.circle(margin + 15, y - 1, 3, 'F');
    doc.setTextColor(194, 65, 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Uppvarvad', margin + 22, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stats.elevated} dagar (${elevatedPct}%)`, margin + 22, y + 6);
    
    // Stable
    doc.setFillColor(187, 247, 208);
    doc.circle(margin + colWidth + 15, y - 1, 3, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('Stabil', margin + colWidth + 22, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stats.stable} dagar (${stablePct}%)`, margin + colWidth + 22, y + 6);
    
    // Depressed
    doc.setFillColor(254, 202, 202);
    doc.circle(margin + colWidth * 2 + 15, y - 1, 3, 'F');
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.text('Nedstamd', margin + colWidth * 2 + 22, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stats.depressed} dagar (${depressedPct}%)`, margin + colWidth * 2 + 22, y + 6);
    
    doc.setTextColor(0, 0, 0);
    y += 25;

    // Visual bar chart
    const barHeight = 14;
    
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, barHeight, 3, 3, 'F');
    
    if (stats.total > 0) {
      let barX = margin;
      
      if (stats.elevated > 0) {
        const elevatedWidth = (stats.elevated / stats.total) * contentWidth;
        doc.setFillColor(251, 146, 60);
        doc.roundedRect(barX, y, elevatedWidth, barHeight, 3, 3, 'F');
        barX += elevatedWidth;
      }
      
      if (stats.stable > 0) {
        const stableWidth = (stats.stable / stats.total) * contentWidth;
        doc.setFillColor(74, 222, 128);
        doc.rect(barX, y, stableWidth, barHeight, 'F');
        barX += stableWidth;
      }
      
      if (stats.depressed > 0) {
        const depressedWidth = (stats.depressed / stats.total) * contentWidth;
        doc.setFillColor(248, 113, 113);
        doc.roundedRect(barX, y, depressedWidth, barHeight, 3, 3, 'F');
      }
    }
    y += 25;

    // Medications section
    if (medications.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Mediciner', margin, y);
      y += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      medications.filter(m => m.active).forEach(med => {
        const startDate = format(new Date(med.started_at), 'd MMM yyyy', { locale: sv });
        doc.text(`• ${med.name} - ${med.dosage} (sedan ${startDate})`, margin + 5, y);
        y += 5;
      });
      y += 8;
    }

    // Monthly breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Manadsvis fordelning', margin, y);
    y += 12;

    const months = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
                    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];

    // Table header
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Manad', margin + 5, y);
    doc.text('Dagar', margin + 45, y);
    doc.text('Fordelning', margin + 70, y);
    y += 8;

    doc.setFont('helvetica', 'normal');

    months.forEach((monthName, i) => {
      if (y > 265) {
        doc.addPage();
        y = 25;
      }

      const monthEntries = yearEntries.filter(e => new Date(e.date).getMonth() === i);
      const elevated = monthEntries.filter(e => e.mood === 'elevated').length;
      const stable = monthEntries.filter(e => e.mood === 'stable').length;
      const depressed = monthEntries.filter(e => e.mood === 'depressed').length;
      const monthTotal = elevated + stable + depressed;

      doc.setFontSize(9);
      doc.text(monthName, margin + 5, y);
      doc.text(`${monthTotal}`, margin + 45, y);

      // Mini bar for each month
      const miniBarWidth = 90;
      const miniBarHeight = 6;
      const miniBarX = margin + 70;
      
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(miniBarX, y - 4, miniBarWidth, miniBarHeight, 2, 2, 'F');
      
      if (monthTotal > 0) {
        let barX = miniBarX;
        
        if (elevated > 0) {
          const w = (elevated / monthTotal) * miniBarWidth;
          doc.setFillColor(251, 146, 60);
          doc.roundedRect(barX, y - 4, w, miniBarHeight, 2, 2, 'F');
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
          doc.roundedRect(barX, y - 4, w, miniBarHeight, 2, 2, 'F');
        }
      }

      y += 10;
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Between Clouds | Genererad ${format(new Date(), 'yyyy-MM-dd HH:mm')} | Sida ${i}/${pageCount}`,
        pageWidth / 2,
        287,
        { align: 'center' }
      );
    }

    doc.save(`maende-rapport-${selectedYear}.pdf`);
    
    toast({
      title: "PDF nedladdad",
      description: `maende-rapport-${selectedYear}.pdf har sparats.`,
    });
  };


  const shareReport = async (type: 'month' | 'year') => {
    if (type === 'month') {
      setSharingMonth(true);
    } else {
      setSharingYear(true);
    }

    try {
      // Create share URL to overview page with period parameter
      const period = type === 'month' ? selectedMonth : selectedYear;
      const shareUrl = `${window.location.origin}/oversikt?period=${period}&view=${type === 'month' ? 'month' : 'year'}`;
      
      // Try to copy to clipboard, but show link in toast either way
      let copied = false;
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch (clipboardErr) {
        console.log('Clipboard not available:', clipboardErr);
      }

      if (type === 'month') {
        setCopiedMonth(true);
        setTimeout(() => setCopiedMonth(false), 5000);
      } else {
        setCopiedYear(true);
        setTimeout(() => setCopiedYear(false), 5000);
      }

      toast({
        title: copied ? "Länk kopierad!" : "Delningslänk skapad!",
        description: (
          <div className="space-y-2">
            <p>{copied ? "Länken har kopierats." : "Kopiera länken nedan:"}</p>
            <code className="block p-2 bg-muted rounded text-xs break-all select-all">
              {shareUrl}
            </code>
          </div>
        ),
        duration: 10000,
      });
    } catch (err) {
      console.error('Share error:', err);
      toast({
        title: "Kunde inte skapa länk",
        description: "Försök igen.",
        variant: "destructive",
      });
    } finally {
      if (type === 'month') {
        setSharingMonth(false);
      } else {
        setSharingYear(false);
      }
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
                  onClick={() => shareReport('month')}
                  disabled={sharingMonth}
                >
                  {sharingMonth ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : copiedMonth ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {copiedMonth ? 'Kopierat!' : 'Dela länk'}
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
                  onClick={() => shareReport('year')}
                  disabled={sharingYear}
                >
                  {sharingYear ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : copiedYear ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {copiedYear ? 'Kopierat!' : 'Dela länk'}
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
                  Klicka på "Dela länk" för att skapa en unik URL som du kan skicka till din läkare. 
                  Länken visar en sammanfattning av ditt mående utan att din läkare behöver logga in. 
                  Du kan också ladda ner en PDF för utskrift.
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

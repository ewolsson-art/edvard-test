import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { FileText, Download, Share2, Calendar, BarChart3, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMoodData } from '@/hooks/useMoodData';
import { useToast } from '@/hooks/use-toast';
import { MOOD_LABELS, MoodType } from '@/types/mood';

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [copiedMonth, setCopiedMonth] = useState(false);
  const [copiedYear, setCopiedYear] = useState(false);
  
  const { entries, isLoaded, getEntriesForMonth, getEntriesForYear, getStatsForYear } = useMoodData();
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

  const generateMonthlyReport = () => {
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

    const report = `
MÅNADSRAPPORT - ${monthName.toUpperCase()}
${'='.repeat(40)}

SAMMANFATTNING
--------------
Antal registrerade dagar: ${total}
${MOOD_LABELS.elevated}: ${elevated} dagar (${total > 0 ? Math.round((elevated / total) * 100) : 0}%)
${MOOD_LABELS.stable}: ${stable} dagar (${total > 0 ? Math.round((stable / total) * 100) : 0}%)
${MOOD_LABELS.depressed}: ${depressed} dagar (${total > 0 ? Math.round((depressed / total) * 100) : 0}%)

DAGLIGA REGISTRERINGAR
----------------------
${Object.entries(monthData)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([day, mood]) => {
    const entry = entries.find(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === Number(day);
    });
    const comment = entry?.comment ? ` - "${entry.comment}"` : '';
    return `${day}/${month}: ${MOOD_LABELS[mood as MoodType]}${comment}`;
  })
  .join('\n')}

---
Genererad: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}
    `.trim();

    return report;
  };

  const generateYearlyReport = () => {
    const year = Number(selectedYear);
    const yearEntries = getEntriesForYear(year);
    const stats = getStatsForYear(year);

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const monthEntries = yearEntries.filter(e => new Date(e.date).getMonth() === i);
      const elevated = monthEntries.filter(e => e.mood === 'elevated').length;
      const stable = monthEntries.filter(e => e.mood === 'stable').length;
      const depressed = monthEntries.filter(e => e.mood === 'depressed').length;
      return {
        month: format(new Date(year, i), 'MMMM', { locale: sv }),
        elevated,
        stable,
        depressed,
        total: elevated + stable + depressed,
      };
    });

    const report = `
ÅRSRAPPORT - ${year}
${'='.repeat(40)}

ÅRSSAMMANFATTNING
-----------------
Totalt antal registrerade dagar: ${stats.total}
${MOOD_LABELS.elevated}: ${stats.elevated} dagar (${stats.total > 0 ? Math.round((stats.elevated / stats.total) * 100) : 0}%)
${MOOD_LABELS.stable}: ${stats.stable} dagar (${stats.total > 0 ? Math.round((stats.stable / stats.total) * 100) : 0}%)
${MOOD_LABELS.depressed}: ${stats.depressed} dagar (${stats.total > 0 ? Math.round((stats.depressed / stats.total) * 100) : 0}%)

MÅNADSVIS FÖRDELNING
--------------------
${monthlyBreakdown
  .map(m => `${m.month.padEnd(12)}: ${m.total} dagar (⚡${m.elevated} ☀️${m.stable} 🌧️${m.depressed})`)
  .join('\n')}

---
Genererad: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}
    `.trim();

    return report;
  };

  const downloadReport = (type: 'month' | 'year') => {
    const report = type === 'month' ? generateMonthlyReport() : generateYearlyReport();
    const filename = type === 'month' 
      ? `mående-rapport-${selectedMonth}.txt`
      : `mående-rapport-${selectedYear}.txt`;
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Rapport nedladdad",
      description: `${filename} har sparats.`,
    });
  };

  const copyToClipboard = async (type: 'month' | 'year') => {
    const report = type === 'month' ? generateMonthlyReport() : generateYearlyReport();
    
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

  if (!isLoaded) {
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
                  onClick={() => downloadReport('month')}
                >
                  <Download className="h-4 w-4" />
                  Ladda ner
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
                  onClick={() => downloadReport('year')}
                >
                  <Download className="h-4 w-4" />
                  Ladda ner
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
                  Kopiera rapporten och klistra in den i ett e-postmeddelande, SMS eller i 1177-appen. 
                  Du kan också ladda ner filen och bifoga den som en bilaga.
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

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileJson, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function GDPRExport() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<'json' | 'pdf' | null>(null);

  const fetchAllData = async () => {
    if (!user) return null;

    const [
      { data: profile },
      { data: moodEntries },
      { data: medications },
      { data: medicationLogs },
      { data: diagnoses },
      { data: characteristics },
      { data: preferences },
      { data: customQuestions },
      { data: customAnswers },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('mood_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('medications').select('*').eq('user_id', user.id),
      supabase.from('medication_logs').select('*').eq('user_id', user.id),
      supabase.from('diagnoses').select('*').eq('user_id', user.id),
      supabase.from('characteristics').select('*').eq('user_id', user.id),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
      supabase.from('custom_checkin_questions').select('*').eq('user_id', user.id),
      supabase.from('custom_checkin_answers').select('*').eq('user_id', user.id),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      email: user.email,
      profile,
      preferences,
      diagnoses: diagnoses || [],
      characteristics: characteristics || [],
      medications: medications || [],
      medicationLogs: medicationLogs || [],
      moodEntries: moodEntries || [],
      customQuestions: customQuestions || [],
      customAnswers: customAnswers || [],
    };
  };

  const handleExportJSON = async () => {
    setExporting('json');
    try {
      const data = await fetchAllData();
      if (!data) throw new Error('No data');

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toddy-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: t('gdpr.exportDone'), description: t('gdpr.exportDoneJSON') });
    } catch {
      toast({ title: t('gdpr.exportError'), description: t('gdpr.exportErrorDesc'), variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const data = await fetchAllData();
      if (!data) throw new Error('No data');

      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 20;
      const lineHeight = 7;
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();

      const addText = (text: string, fontSize = 10, bold = false) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * lineHeight;
      };

      const addSection = (title: string) => {
        y += 5;
        addText(title, 14, true);
        y += 2;
      };

      addText(t('gdpr.pdfHeader'), 18, true);
      addText(`${t('gdpr.pdfExported')}: ${new Date().toLocaleDateString('sv-SE')}`, 10);
      addText(`${t('gdpr.pdfEmail')}: ${data.email || '—'}`, 10);
      y += 5;

      addSection(t('gdpr.pdfProfile'));
      if (data.profile) {
        addText(`${t('gdpr.pdfName')}: ${data.profile.first_name || ''} ${data.profile.last_name || ''}`);
      }

      if (data.diagnoses.length > 0) {
        addSection(t('gdpr.pdfDiagnoses'));
        data.diagnoses.forEach((d: any) => addText(`• ${d.name}${d.diagnosed_at ? ` (${d.diagnosed_at})` : ''}`));
      }

      if (data.medications.length > 0) {
        addSection(t('gdpr.pdfMedications'));
        data.medications.forEach((m: any) => addText(`• ${m.name} — ${m.dosage} (${m.active ? t('gdpr.pdfActive') : t('gdpr.pdfInactive')})`));
      }

      addSection(t('gdpr.pdfCheckins', { count: data.moodEntries.length }));
      const recentEntries = data.moodEntries.slice(0, 30);
      recentEntries.forEach((e: any) => {
        addText(`${e.date}: ${e.mood}${e.comment ? ` — "${e.comment}"` : ''}`);
      });
      if (data.moodEntries.length > 30) {
        addText(t('gdpr.pdfAndMore', { count: data.moodEntries.length - 30 }));
      }

      doc.save(`toddy-export-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: t('gdpr.exportDone'), description: t('gdpr.exportDonePDF') });
    } catch {
      toast({ title: t('gdpr.exportError'), description: t('gdpr.exportErrorDesc'), variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('gdpr.description')}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleExportJSON} disabled={!!exporting} className="flex-1 gap-2">
          {exporting === 'json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
          JSON
        </Button>
        <Button variant="outline" onClick={handleExportPDF} disabled={!!exporting} className="flex-1 gap-2">
          {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          PDF
        </Button>
      </div>
    </div>
  );
}

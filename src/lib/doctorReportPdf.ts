import { format, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { MoodEntry } from '@/types/mood';
import { detectEpisodes, EPISODE_META } from '@/lib/episodeDetection';

/**
 * Compact 1-page PDF intended for a doctor's appointment.
 * Last 90 days, dense, no fluff. Helvetica only (no emoji).
 */

interface DoctorPdfInput {
  patientName?: string;
  entries: MoodEntry[];
  medications: Array<{ name: string; dosage: string; active: boolean; started_at?: string; side_effects?: string[] }>;
  /** Top patterns from pattern_insights (already sorted by confidence). */
  patterns: Array<{ title: string; description: string; severity?: string }>;
  filename: string;
}

const sanitize = (s: string) =>
  (s || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const COL = {
  ink: [22, 26, 36] as [number, number, number],
  inkSoft: [82, 92, 112] as [number, number, number],
  inkMute: [140, 150, 168] as [number, number, number],
  paper: [255, 255, 252] as [number, number, number],
  panel: [246, 244, 236] as [number, number, number],
  hairline: [220, 215, 200] as [number, number, number],
  gold: [232, 184, 64] as [number, number, number],
  red: [200, 70, 70] as [number, number, number],
  orange: [220, 130, 50] as [number, number, number],
  green: [80, 150, 90] as [number, number, number],
  blue: [80, 110, 180] as [number, number, number],
};

export async function generateDoctorReportPdf(input: DoctorPdfInput): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  const today = new Date();
  const start = subDays(today, 90);
  const last90 = input.entries.filter((e) => new Date(e.date).getTime() >= start.getTime());

  // ----- header -----
  doc.setFillColor(...COL.paper);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(...COL.gold);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COL.ink);
  doc.text('TODDY · LÄKARRAPPORT', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Senaste 90 dagarna · ${format(start, 'd MMM', { locale: sv })} – ${format(today, 'd MMM yyyy', { locale: sv })}`, pageW - margin, 11, { align: 'right' });

  let y = 26;

  // ----- patient line -----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COL.ink);
  doc.text(sanitize(input.patientName || 'Användare'), margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COL.inkMute);
  doc.text(`Skapad ${format(today, 'd MMM yyyy HH:mm', { locale: sv })}`, pageW - margin, y, { align: 'right' });
  y += 6;

  // ----- mood overview -----
  const counts = { up: 0, mid: 0, down: 0 };
  last90.forEach((e) => {
    if (['severe_elevated', 'elevated', 'somewhat_elevated'].includes(e.mood)) counts.up++;
    else if (['severe_depressed', 'depressed', 'somewhat_depressed'].includes(e.mood)) counts.down++;
    else counts.mid++;
  });
  const total = counts.up + counts.mid + counts.down;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COL.ink);
  doc.text('Stämningsläge', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COL.inkSoft);
  doc.text(`${total} registrerade dagar av 90`, pageW - margin, y, { align: 'right' });
  y += 4;

  // Stacked bar
  const barW = contentW;
  const barH = 5;
  const upW = (barW * counts.up) / Math.max(1, total);
  const midW = (barW * counts.mid) / Math.max(1, total);
  const downW = (barW * counts.down) / Math.max(1, total);
  doc.setFillColor(...COL.orange);
  doc.rect(margin, y, upW, barH, 'F');
  doc.setFillColor(...COL.green);
  doc.rect(margin + upW, y, midW, barH, 'F');
  doc.setFillColor(...COL.blue);
  doc.rect(margin + upW + midW, y, downW, barH, 'F');
  y += barH + 4;

  doc.setFontSize(8.5);
  doc.setTextColor(...COL.inkSoft);
  doc.text(`Uppvarvad: ${counts.up} d (${pct(counts.up)}%)   Stabil: ${counts.mid} d (${pct(counts.mid)}%)   Nedstämd: ${counts.down} d (${pct(counts.down)}%)`, margin, y);
  y += 7;

  // ----- episoder -----
  const episodes = detectEpisodes(last90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COL.ink);
  doc.text(`Episoder (${episodes.length})`, margin, y);
  y += 4;

  if (episodes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COL.inkMute);
    doc.text('Inga längre episoder upptäckta de senaste 90 dagarna.', margin, y);
    y += 6;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    episodes.slice(0, 5).forEach((ep) => {
      const meta = EPISODE_META[ep.kind];
      const color: [number, number, number] = ep.kind === 'mixed'
        ? COL.red
        : ep.kind === 'manic'
        ? COL.orange
        : ep.kind === 'hypomanic'
        ? [220, 180, 60]
        : COL.blue;
      doc.setFillColor(...color);
      doc.circle(margin + 1.5, y - 1.2, 1.2, 'F');
      doc.setTextColor(...COL.ink);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitize(meta.label), margin + 5, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COL.inkSoft);
      doc.text(
        `${ep.days} dagar · ${format(new Date(ep.startDate), 'd MMM', { locale: sv })} – ${format(new Date(ep.endDate), 'd MMM', { locale: sv })}`,
        pageW - margin, y, { align: 'right' },
      );
      y += 5;
    });
    y += 2;
  }

  // ----- mediciner -----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COL.ink);
  doc.text('Mediciner', margin, y);
  y += 4;
  if (input.medications.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COL.inkMute);
    doc.text('Inga registrerade mediciner.', margin, y);
    y += 6;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    input.medications.slice(0, 8).forEach((m) => {
      const dot = m.active ? COL.green : COL.inkMute;
      doc.setFillColor(...dot);
      doc.circle(margin + 1.5, y - 1.2, 1.2, 'F');
      doc.setTextColor(...COL.ink);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitize(`${m.name} ${m.dosage}`), margin + 5, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COL.inkSoft);
      const tag = m.active ? 'pågående' : 'avslutad';
      const sideTxt = m.side_effects && m.side_effects.length > 0
        ? ` · biverkningar: ${m.side_effects.slice(0, 3).join(', ')}`
        : '';
      doc.text(sanitize(`${tag}${sideTxt}`), pageW - margin, y, { align: 'right' });
      y += 5;
    });
    y += 2;
  }

  // ----- top patterns -----
  if (input.patterns.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COL.ink);
    doc.text('AI-mönster (top 3)', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    input.patterns.slice(0, 3).forEach((p) => {
      const color = p.severity === 'warning' ? COL.red : p.severity === 'attention' ? COL.orange : COL.blue;
      doc.setFillColor(...color);
      doc.circle(margin + 1.5, y - 1.2, 1.2, 'F');
      doc.setTextColor(...COL.ink);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitize(p.title), margin + 5, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COL.inkSoft);
      const lines = doc.splitTextToSize(sanitize(p.description), contentW - 10) as string[];
      lines.slice(0, 2).forEach((ln) => {
        doc.text(ln, margin + 5, y);
        y += 4;
      });
      y += 1;
    });
  }

  // ----- footer -----
  doc.setDrawColor(...COL.hairline);
  doc.setLineWidth(0.2);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COL.inkMute);
  doc.text('Toddy · självrapporterad data, ej diagnostiskt verktyg', margin, pageH - 7);
  doc.text('toddy.se', pageW - margin, pageH - 7, { align: 'right' });

  doc.save(input.filename);
}

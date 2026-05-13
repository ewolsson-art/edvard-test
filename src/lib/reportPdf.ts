import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

/**
 * Playful, clean PDF report renderer for Toddy.
 *
 * IMPORTANT: jsPDF's built-in Helvetica font does NOT support emoji glyphs —
 * those render as garbage characters (e.g. "Ø<ß"). This renderer therefore
 * uses pure typography + colored shapes instead of emoji icons.
 *
 * Swedish characters (å, ä, ö) ARE supported by Helvetica via Latin-1, so
 * those work fine as long as we don't switch fonts.
 */

export interface ReportSection {
  title: string;
  /** Two-letter mono-friendly tag drawn inside the colored chip. */
  tag: string;
  stats: string[];
  insight: string;
  /** RGB triplet for the section accent color. */
  color: [number, number, number];
  /** 0–100 progress to draw above the stats. Omit if not applicable. */
  progress?: number;
  progressLabel?: string;
}

export interface ReportPdfInput {
  title: string;
  periodStart: Date;
  periodEnd: Date;
  /** Optional first metadata line, e.g. "Skapad för: Anna Eriksson". */
  forLine?: string;
  registeredDays: number;
  totalDays: number;
  registrationLabel: string;
  registrationRateLabel: string;
  sections: ReportSection[];
  filename: string;
}

// Soft, warm palette — playful but credible for a clinical context.
const COL = {
  ink: [28, 32, 44] as [number, number, number],
  inkSoft: [82, 92, 112] as [number, number, number],
  inkMute: [140, 150, 168] as [number, number, number],
  paper: [255, 252, 244] as [number, number, number],   // warm off-white
  panel: [248, 244, 232] as [number, number, number],   // soft cream panel
  panelDeep: [241, 235, 218] as [number, number, number],
  gold: [232, 184, 64] as [number, number, number],     // toddy golden yellow
  goldSoft: [251, 240, 207] as [number, number, number],
  hairline: [228, 220, 200] as [number, number, number],
};

// Strip characters Helvetica/Latin-1 can't render (emoji etc.).
const sanitize = (s: string): string => {
  if (!s) return '';
  return s
    // remove emoji and other non-Latin-1 symbols
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    // collapse double spaces left over after stripping
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const generateReportPdf = async (input: ReportPdfInput): Promise<void> => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageWidth - margin * 2;

  // Warm paper background.
  doc.setFillColor(...COL.paper);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ---------- Hero band ----------
  const heroH = 44;
  doc.setFillColor(...COL.gold);
  doc.rect(0, 0, pageWidth, heroH, 'F');

  // Decorative dots
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth - 18, 14, 1.6, 'F');
  doc.circle(pageWidth - 26, 22, 0.9, 'F');
  doc.circle(pageWidth - 12, 28, 1.1, 'F');

  // Tiny "Toddy" wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COL.ink);
  doc.text('TODDY', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 50, 20);
  doc.text(sanitize(input.title.toUpperCase()), margin, 19, { charSpace: 0.4 });

  // Big period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COL.ink);
  const periodText = `${format(input.periodStart, 'd MMM', { locale: sv })} – ${format(input.periodEnd, 'd MMM yyyy', { locale: sv })}`;
  doc.text(sanitize(periodText), margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 56, 22);
  const metaParts: string[] = [];
  if (input.forLine) metaParts.push(input.forLine);
  metaParts.push(`Skapad ${format(new Date(), 'd MMM yyyy', { locale: sv })}`);
  doc.text(sanitize(metaParts.join('  ·  ')), margin, 39);

  let y = heroH + 12;

  // ---------- Summary tiles ----------
  const tileH = 26;
  const gap = 4;
  const tileW = (contentW - gap) / 2;
  const regRate = input.totalDays > 0
    ? Math.round((input.registeredDays / input.totalDays) * 100)
    : 0;

  const drawTile = (
    x: number,
    big: string,
    label: string,
    accent: [number, number, number],
  ) => {
    doc.setFillColor(...COL.panel);
    doc.roundedRect(x, y, tileW, tileH, 4, 4, 'F');
    // accent bar
    doc.setFillColor(...accent);
    doc.roundedRect(x, y, 3, tileH, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...COL.ink);
    doc.text(sanitize(big), x + 9, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COL.inkSoft);
    doc.text(sanitize(label), x + 9, y + 21);
  };

  drawTile(margin, `${input.registeredDays}/${input.totalDays}`, sanitize(input.registrationLabel), COL.gold);
  drawTile(margin + tileW + gap, `${regRate}%`, sanitize(input.registrationRateLabel), [120, 180, 140]);

  y += tileH + 12;

  // ---------- Sections ----------
  const drawSection = (s: ReportSection) => {
    const stats = s.stats.map(sanitize);
    const insightLines = doc.splitTextToSize(sanitize(s.insight), contentW - 16) as string[];

    const headerH = 14;
    const statsH = stats.length * 6 + 4;
    const progressH = s.progress !== undefined ? 12 : 0;
    const insightH = insightLines.length * 5 + 12;
    const cardH = headerH + progressH + statsH + insightH + 6;

    // Page break
    if (y + cardH > pageHeight - 22) {
      addFooter();
      doc.addPage();
      doc.setFillColor(...COL.paper);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      y = margin;
    }

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentW, cardH, 5, 5, 'F');
    doc.setDrawColor(...COL.hairline);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentW, cardH, 5, 5, 'S');

    // Colored chip with tag
    const chipX = margin + 8;
    const chipY = y + 6;
    doc.setFillColor(...s.color);
    doc.roundedRect(chipX, chipY, 14, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(sanitize(s.tag).slice(0, 2).toUpperCase(), chipX + 7, chipY + 9, { align: 'center' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COL.ink);
    doc.text(sanitize(s.title), chipX + 20, chipY + 10);

    let cy = y + headerH + 6;

    // Progress bar
    if (s.progress !== undefined) {
      const barX = margin + 10;
      const barW = contentW - 20;
      const barH = 4;
      doc.setFillColor(...COL.panelDeep);
      doc.roundedRect(barX, cy, barW, barH, 2, 2, 'F');
      const fillW = Math.max(2, (barW * Math.min(100, Math.max(0, s.progress))) / 100);
      doc.setFillColor(...s.color);
      doc.roundedRect(barX, cy, fillW, barH, 2, 2, 'F');
      if (s.progressLabel) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COL.inkMute);
        doc.text(sanitize(s.progressLabel), barX + barW, cy + barH + 4, { align: 'right' });
      }
      cy += progressH;
    }

    // Stats list
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COL.inkSoft);
    stats.forEach((stat) => {
      // bullet dot
      doc.setFillColor(...s.color);
      doc.circle(margin + 12, cy - 1.5, 0.8, 'F');
      doc.text(stat, margin + 16, cy);
      cy += 6;
    });
    cy += 2;

    // Insight panel
    doc.setFillColor(...COL.panel);
    doc.roundedRect(margin + 8, cy, contentW - 16, insightLines.length * 5 + 8, 3, 3, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(...COL.ink);
    doc.text(insightLines, margin + 12, cy + 6);

    y += cardH + 6;
  };

  // Footer (per page)
  const addFooter = () => {
    const fy = pageHeight - 10;
    doc.setDrawColor(...COL.hairline);
    doc.setLineWidth(0.2);
    doc.line(margin, fy - 4, pageWidth - margin, fy - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COL.inkMute);
    doc.text('Skapad med Toddy – din lugna stämningsdagbok', margin, fy);
    doc.text('toddy.se', pageWidth - margin, fy, { align: 'right' });
  };

  input.sections.forEach(drawSection);
  addFooter();

  doc.save(input.filename);
};

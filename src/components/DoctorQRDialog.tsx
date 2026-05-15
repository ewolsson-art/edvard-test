import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Check, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';
import { format, subDays } from 'date-fns';

interface Props {
  trigger: React.ReactNode;
}

/**
 * "Visa min läkare"-QR. Skapar en shared_reports-rad med 24h expiry
 * och visar en QR-kod till /rapport/:shareKey som läkaren kan scanna direkt.
 */
export function DoctorQRDialog({ trigger }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { entries } = useMoodData();
  const { activeMedications, allMedications } = useMedications() as any;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date();
      const start = subDays(today, 90);
      const last90 = entries.filter((e) => new Date(e.date).getTime() >= start.getTime());

      // Aggregera enkel mood-stats för delad vy
      const counts: Record<string, number> = {};
      last90.forEach((e) => { counts[e.mood] = (counts[e.mood] ?? 0) + 1; });

      const meds = (allMedications ?? activeMedications ?? []).map((m: any) => ({
        name: m.name,
        dosage: m.dosage,
        started_at: m.started_at,
        active: m.active,
      }));

      const shareKey = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => b.toString(36).padStart(2, '0'))
        .join('')
        .slice(0, 16);

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('shared_reports').insert({
        user_id: user.id,
        share_key: shareKey,
        report_type: 'month',
        period: format(today, 'yyyy-MM'),
        stats: {
          mood: { ...counts, total: last90.length, totalDays: 90 },
          entries: last90.map((e) => ({
            date: e.date,
            mood: e.mood,
            sleepQuality: e.sleepQuality,
            comment: e.comment,
          })),
          categories: ['mood', 'medication'],
        },
        medications: meds,
        expires_at: expiresAt,
      });

      if (error) throw error;
      const url = `${window.location.origin}/rapport/${shareKey}`;
      setShareUrl(url);
    } catch (e) {
      console.error(e);
      toast({ title: 'Kunde inte skapa QR-kod', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setShareUrl(null); } }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Visa min läkare</DialogTitle>
          <DialogDescription>
            Skapar en tillfällig länk som visar dina senaste 90 dagar. Länken slutar fungera om 24 timmar.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <Button onClick={generate} disabled={loading} className="w-full rounded-full gap-2" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            {loading ? 'Skapar…' : 'Skapa QR-kod'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl flex items-center justify-center">
              <QRCodeSVG value={shareUrl} size={220} level="M" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">Giltig i 24 timmar</p>
              <p className="text-[12px] text-foreground/60 break-all">{shareUrl}</p>
            </div>
            <Button onClick={copy} variant="outline" className="w-full rounded-full gap-2">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Kopierad' : 'Kopiera länk'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

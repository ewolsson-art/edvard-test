import { useState, useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronRight, Stethoscope, Pill, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MoodEntry, MoodType } from '@/types/mood';
import { Medication } from '@/types/medication';
import { PatientDiagnosis } from '@/hooks/usePatientDiagnoses';
import { PatientPresentation } from '@/components/PatientPresentation';
import { cn } from '@/lib/utils';

interface PatientProfileCardProps {
  patientName: string;
  patientEmail?: string;
  diagnoses: PatientDiagnosis[];
  activeMedications: Medication[];
  inactiveMedications: Medication[];
  entries: MoodEntry[];
  shareMedication: boolean;
  shareMood: boolean;
}

const MOOD_COLOR: Record<MoodType, string> = {
  severe_elevated: 'hsl(45 95% 55%)',
  elevated: 'hsl(45 95% 55% / 0.75)',
  somewhat_elevated: 'hsl(45 95% 55% / 0.55)',
  stable: 'hsl(142 70% 45%)',
  somewhat_depressed: 'hsl(0 75% 55% / 0.55)',
  depressed: 'hsl(0 75% 55% / 0.75)',
  severe_depressed: 'hsl(0 75% 55%)',
};

const isElevated = (m: MoodType) => m.includes('elevated');
const isDepressed = (m: MoodType) => m.includes('depressed');

export function PatientProfileCard(props: PatientProfileCardProps) {
  const { patientName, patientEmail, diagnoses, activeMedications, entries, shareMood } = props;
  const [open, setOpen] = useState(false);

  const initial = patientName?.[0]?.toUpperCase() ?? 'A';

  const latest = useMemo(() => {
    if (!entries.length) return null;
    return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [entries]);

  const latestColor = latest ? MOOD_COLOR[latest.mood] : null;
  const daysSince = latest ? differenceInDays(new Date(), parseISO(latest.date)) : null;

  // Quick warning detection for badge
  const hasWarning = useMemo(() => {
    if (!shareMood) return false;
    const last7 = entries.filter(e => differenceInDays(new Date(), parseISO(e.date)) < 7);
    const elev = last7.some(e => isElevated(e.mood));
    const dep = last7.some(e => isDepressed(e.mood));
    const badNights = last7.filter(e => e.sleepQuality === 'bad').length;
    return (elev && dep) || badNights >= 4;
  }, [entries, shareMood]);

  const sinceLabel =
    daysSince === null
      ? 'Ingen incheckning ännu'
      : daysSince === 0
      ? 'Incheckad idag'
      : daysSince === 1
      ? 'Incheckad igår'
      : `${daysSince} dagar sedan`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 md:p-5 flex items-center gap-4 transition-colors hover:bg-foreground/[0.04] active:scale-[0.995]"
        aria-label={`Visa profil för ${patientName}`}
      >
        {/* Avatar with mood ring */}
        <div className="relative shrink-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-primary bg-primary/10"
            style={
              latestColor
                ? { boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${latestColor}` }
                : undefined
            }
          >
            {initial}
          </div>
          {hasWarning && (
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-[hsl(0_75%_60%)]" />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">{patientName}</p>
          <p className="text-xs text-muted-foreground/70 truncate">{sinceLabel}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              {diagnoses.length} {diagnoses.length === 1 ? 'diagnos' : 'diagnoser'}
            </span>
            <span className="flex items-center gap-1">
              <Pill className="w-3 h-3" />
              {activeMedications.length} {activeMedications.length === 1 ? 'medicin' : 'mediciner'}
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="p-5 md:p-6 border-b border-border/40">
            <DialogTitle className="font-display text-xl font-semibold">{patientName}</DialogTitle>
            {patientEmail && (
              <p className="text-sm text-muted-foreground/70 mt-0.5 truncate">{patientEmail}</p>
            )}
          </div>
          <div className="p-5 md:p-6">
            <PatientPresentation {...props} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

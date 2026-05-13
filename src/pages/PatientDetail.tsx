import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, Mail, Stethoscope, Pill, Activity, CalendarDays } from 'lucide-react';
import { useDoctorConnections } from '@/hooks/useDoctorConnections';
import { useRelativeConnections } from '@/hooks/useRelativeConnections';
import { useUserRole } from '@/hooks/useUserRole';
import { usePatientMoodData } from '@/hooks/usePatientMoodData';
import { usePatientMedications } from '@/hooks/usePatientMedications';
import { usePatientDiagnoses } from '@/hooks/usePatientDiagnoses';
import { PatientOverview } from '@/components/PatientOverview';
import { PatientPresentation } from '@/components/PatientPresentation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { MoodType } from '@/types/mood';

const MOOD_COLOR: Record<MoodType, string> = {
  severe_elevated: 'hsl(45 95% 55%)',
  elevated: 'hsl(45 95% 55% / 0.8)',
  somewhat_elevated: 'hsl(45 95% 55% / 0.55)',
  stable: 'hsl(142 70% 45%)',
  somewhat_depressed: 'hsl(0 75% 55% / 0.55)',
  depressed: 'hsl(0 75% 55% / 0.8)',
  severe_depressed: 'hsl(0 75% 55%)',
};

const PatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { isDoctor, isRelative, isLoading: roleLoading } = useUserRole();

  const { approvedConnections: doctorConnections, isLoading: doctorLoading } = useDoctorConnections();
  const { approvedConnections: relativeConnections, isLoading: relativeLoading } = useRelativeConnections();

  const isLoading = roleLoading || (isDoctor && doctorLoading) || (isRelative && relativeLoading);

  const connection = isDoctor
    ? doctorConnections.find(c => c.patient_id === patientId)
    : isRelative
      ? relativeConnections.find(c => c.patient_id === patientId)
      : null;

  const normalizedConnection = connection
    ? { ...connection, patient_profile: connection.patient_profile, patient_email: connection.patient_email }
    : null;

  const pid = normalizedConnection?.patient_id ?? '';
  const { entries, isLoaded: moodLoaded } = usePatientMoodData({ patientId: pid || null });
  const { activeMedications, inactiveMedications, isLoaded: medsLoaded } = usePatientMedications({ patientId: pid });
  const { diagnoses, isLoading: diagnosesLoading } = usePatientDiagnoses({ patientId: pid });

  const patientName = useMemo(() => {
    const p = normalizedConnection?.patient_profile;
    if (p?.first_name || p?.last_name) {
      return [p?.first_name, p?.last_name].filter(Boolean).join(' ');
    }
    return normalizedConnection?.patient_email || 'Användare';
  }, [normalizedConnection]);

  const initial = patientName?.[0]?.toUpperCase() ?? 'A';
  const latest = useMemo(() => {
    if (!entries.length) return null;
    return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [entries]);
  const latestColor = latest ? MOOD_COLOR[latest.mood] : null;
  const daysSince = latest ? differenceInDays(new Date(), parseISO(latest.date)) : null;
  const sinceLabel =
    daysSince === null ? 'Ingen incheckning ännu'
    : daysSince === 0 ? 'Incheckad idag'
    : daysSince === 1 ? 'Incheckad igår'
    : `${daysSince} dagar sedan`;

  const handleBack = () => {
    if (isDoctor) navigate('/lakare');
    else if (isRelative) navigate('/anhorig');
    else navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!normalizedConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Användare hittades inte</h2>
          <p className="text-muted-foreground">Användaren finns inte eller är inte kopplad till dig.</p>
        </div>
      </div>
    );
  }

  const detailsLoaded = moodLoaded && medsLoaded && !diagnosesLoading;
  const shareMedication = normalizedConnection.share_medication !== false;
  const shareMood = normalizedConnection.share_mood !== false;

  return (
    <div className="pb-24">
      {/* Sticky compact header */}
      <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/30">
        <div className="max-w-3xl mx-auto md:mx-0 px-5 md:px-8 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base font-semibold truncate">{patientName}</h1>
            <p className="text-[11px] text-muted-foreground/60 truncate">{sinceLabel}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto md:mx-0 px-5 md:px-8 pt-6 space-y-8">
        {/* Profile hero */}
        <header className="flex items-start gap-4 md:gap-5">
          <div
            className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-semibold text-primary bg-primary/10"
            style={
              latestColor
                ? { boxShadow: `0 0 0 3px hsl(var(--background)), 0 0 0 5px ${latestColor}, 0 0 32px ${latestColor}33` }
                : undefined
            }
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="font-display text-2xl md:text-3xl font-semibold leading-tight truncate">
              {patientName}
            </h2>
            {normalizedConnection.patient_email && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground/70 mt-1 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{normalizedConnection.patient_email}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[11px] text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                {diagnoses.length} {diagnoses.length === 1 ? 'diagnos' : 'diagnoser'}
              </span>
              <span className="flex items-center gap-1">
                <Pill className="w-3 h-3" />
                {activeMedications.length} {activeMedications.length === 1 ? 'medicin' : 'mediciner'}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {entries.length} check-ins
              </span>
              {latest && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Senast {format(parseISO(latest.date), 'd MMM', { locale: sv })}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Profile details: status, warnings, trend, diagnoses, meds */}
        {detailsLoaded ? (
          <PatientPresentation
            patientName={patientName}
            diagnoses={diagnoses}
            activeMedications={activeMedications}
            inactiveMedications={inactiveMedications}
            entries={entries}
            shareMedication={shareMedication}
            shareMood={shareMood}
          />
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
          </div>
        )}

        {/* Overview as a section, not the whole page */}
        <section className="space-y-3 pt-2">
          <header className="px-1">
            <h2 className="font-display text-xl font-semibold leading-tight">Översikt</h2>
            <p className="text-[12px] text-muted-foreground/70 leading-tight mt-0.5">
              Kalender, mönster och statistik över tid
            </p>
          </header>
          <div className="rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm p-5 md:p-6">
            <PatientOverview
              connection={normalizedConnection as any}
              onBack={handleBack}
              hideExtras={isRelative}
              hideHeader
              hideProfileCard
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default PatientDetail;

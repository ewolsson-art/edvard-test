import { useMemo } from 'react';
import { format, differenceInDays, parseISO, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Stethoscope, Pill, Activity, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { MoodEntry, MoodType } from '@/types/mood';
import { Medication } from '@/types/medication';
import { PatientDiagnosis } from '@/hooks/usePatientDiagnoses';
import { cn } from '@/lib/utils';

interface PatientPresentationProps {
  patientName: string;
  diagnoses: PatientDiagnosis[];
  activeMedications: Medication[];
  inactiveMedications: Medication[];
  entries: MoodEntry[];
  shareMedication: boolean;
  shareMood: boolean;
}

const MOOD_TONE: Record<MoodType, { color: string; label: string; severity: number }> = {
  severe_elevated: { color: 'hsl(45 95% 55%)', label: 'Kraftigt uppvarvad', severity: 3 },
  elevated: { color: 'hsl(45 95% 55% / 0.75)', label: 'Uppvarvad', severity: 2 },
  somewhat_elevated: { color: 'hsl(45 95% 55% / 0.55)', label: 'Något uppvarvad', severity: 1 },
  stable: { color: 'hsl(142 70% 45%)', label: 'Stabil', severity: 0 },
  somewhat_depressed: { color: 'hsl(0 75% 55% / 0.55)', label: 'Något nedstämd', severity: 1 },
  depressed: { color: 'hsl(0 75% 55% / 0.75)', label: 'Nedstämd', severity: 2 },
  severe_depressed: { color: 'hsl(0 75% 55%)', label: 'Kraftigt nedstämd', severity: 3 },
};

const isElevated = (m: MoodType) => m === 'severe_elevated' || m === 'elevated' || m === 'somewhat_elevated';
const isDepressed = (m: MoodType) => m === 'severe_depressed' || m === 'depressed' || m === 'somewhat_depressed';

export function PatientPresentation({
  patientName,
  diagnoses,
  activeMedications,
  inactiveMedications,
  entries,
  shareMedication,
  shareMood,
}: PatientPresentationProps) {
  // Latest entry
  const latest = useMemo(() => {
    if (!entries.length) return null;
    return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [entries]);

  // 14-day window
  const last14 = useMemo(() => {
    const today = new Date();
    return entries.filter(e => {
      const d = parseISO(e.date);
      const diff = differenceInDays(today, d);
      return diff >= 0 && diff < 14;
    });
  }, [entries]);

  const stats14 = useMemo(() => {
    let elev = 0, dep = 0, stable = 0;
    last14.forEach(e => {
      if (isElevated(e.mood)) elev++;
      else if (isDepressed(e.mood)) dep++;
      else if (e.mood === 'stable') stable++;
    });
    return { elev, dep, stable, registered: last14.length, missed: 14 - last14.length };
  }, [last14]);

  // Mixed-features warning: both elevated and depressed days same week
  const mixedWarning = useMemo(() => {
    const last7 = last14.filter(e => {
      const diff = differenceInDays(new Date(), parseISO(e.date));
      return diff < 7;
    });
    const hasElev = last7.some(e => isElevated(e.mood));
    const hasDep = last7.some(e => isDepressed(e.mood));
    return hasElev && hasDep;
  }, [last14]);

  // Sleep-reduction warning (mania prodrome)
  const sleepWarning = useMemo(() => {
    const last7 = last14.filter(e => differenceInDays(new Date(), parseISO(e.date)) < 7);
    const badNights = last7.filter(e => e.sleepQuality === 'bad').length;
    return badNights >= 4;
  }, [last14]);

  // 14-day mini trend (oldest left)
  const trendBars = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = subDays(today, 13 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      return { date: d, mood: entry?.mood ?? null };
    });
  }, [entries]);

  // Group active meds by indication
  const medsByIndication = useMemo(() => {
    const groups: Record<string, Medication[]> = {};
    activeMedications.forEach(m => {
      const key = m.indication?.trim() || 'Övrigt';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [activeMedications]);

  const latestTone = latest ? MOOD_TONE[latest.mood] : null;
  const latestDate = latest ? parseISO(latest.date) : null;
  const daysSinceLatest = latestDate ? differenceInDays(new Date(), latestDate) : null;

  return (
    <section className="space-y-4">
      {/* Hero status card */}
      <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'shrink-0 w-14 h-14 rounded-full flex items-center justify-center',
              latestTone ? '' : 'bg-muted/40',
            )}
            style={latestTone ? { backgroundColor: latestTone.color + '22', boxShadow: `0 0 28px ${latestTone.color}33` } : undefined}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: latestTone ? latestTone.color : 'hsl(var(--muted-foreground))' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-1">
              Senaste incheckning
            </p>
            {latest && latestTone ? (
              <>
                <p className="text-xl font-semibold text-foreground leading-tight">{latestTone.label}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {daysSinceLatest === 0 && 'Idag'}
                  {daysSinceLatest === 1 && 'Igår'}
                  {daysSinceLatest !== null && daysSinceLatest > 1 && `${daysSinceLatest} dagar sedan`}
                  {' · '}
                  {format(parseISO(latest.date), 'd MMM yyyy', { locale: sv })}
                </p>
              </>
            ) : (
              <p className="text-base text-muted-foreground/60">Ingen incheckning ännu</p>
            )}
          </div>
        </div>

        {/* Warnings */}
        {(mixedWarning || sleepWarning) && shareMood && (
          <div className="mt-4 space-y-2">
            {mixedWarning && (
              <div className="flex gap-2.5 p-3 rounded-2xl bg-[hsl(0_75%_55%/0.08)] border border-[hsl(0_75%_55%/0.2)]">
                <AlertTriangle className="w-4 h-4 text-[hsl(0_75%_60%)] shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/85 leading-relaxed">
                  <span className="font-semibold">Möjliga blandade tecken:</span> både uppvarvade och nedstämda dagar senaste veckan. Ökad suicidrisk — överväg uppföljning.
                </p>
              </div>
            )}
            {sleepWarning && (
              <div className="flex gap-2.5 p-3 rounded-2xl bg-[hsl(45_85%_55%/0.08)] border border-[hsl(45_85%_55%/0.2)]">
                <AlertTriangle className="w-4 h-4 text-[hsl(45_85%_55%)] shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/85 leading-relaxed">
                  <span className="font-semibold">Försämrad sömn:</span> minst 4 nätter med dålig sömn senaste veckan — möjlig prodrom till uppvarvad period.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 14-day trend */}
        {shareMood && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Senaste 14 dagar
              </p>
              <p className="text-[11px] text-muted-foreground/50">
                {stats14.registered} av 14 incheckade
              </p>
            </div>
            <div className="flex items-end gap-1 h-10">
              {trendBars.map((b, i) => {
                const tone = b.mood ? MOOD_TONE[b.mood] : null;
                const height = !b.mood ? 18 : tone!.severity === 0 ? 32 : 36 + tone!.severity * 6;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${height}%`,
                      backgroundColor: tone ? tone.color : 'hsl(var(--muted) / 0.4)',
                      opacity: tone ? 1 : 0.3,
                    }}
                    title={`${format(b.date, 'd MMM', { locale: sv })}: ${tone?.label ?? 'Ingen incheckning'}`}
                  />
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-semibold text-foreground tabular-nums">{stats14.elev}</p>
                <p className="text-[11px] text-muted-foreground/60">Uppvarvad</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground tabular-nums">{stats14.stable}</p>
                <p className="text-[11px] text-muted-foreground/60">Stabil</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground tabular-nums">{stats14.dep}</p>
                <p className="text-[11px] text-muted-foreground/60">Nedstämd</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diagnoses */}
      <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <Stethoscope className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Diagnoser</h3>
          {diagnoses.length > 0 && (
            <span className="text-xs text-muted-foreground/60 ml-auto">{diagnoses.length} st</span>
          )}
        </div>
        {diagnoses.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">Inga diagnoser registrerade.</p>
        ) : (
          <ul className="divide-y divide-border/30">
            {diagnoses.map(d => (
              <li key={d.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <span className="text-base text-foreground">{d.name}</span>
                {d.diagnosed_at && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/60 shrink-0">
                    <CalendarIcon className="w-3 h-3" />
                    Sedan {format(parseISO(d.diagnosed_at), 'MMM yyyy', { locale: sv })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Medications */}
      {shareMedication && (
        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <Pill className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Mediciner</h3>
            {activeMedications.length > 0 && (
              <span className="text-xs text-muted-foreground/60 ml-auto">
                {activeMedications.length} aktiva
              </span>
            )}
          </div>

          {activeMedications.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">Inga aktiva mediciner.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(medsByIndication).map(([indication, meds]) => (
                <div key={indication}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-2">
                    {indication}
                  </p>
                  <ul className="space-y-2">
                    {meds.map(m => (
                      <li key={m.id} className="rounded-2xl bg-muted/20 px-4 py-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-base font-medium text-foreground truncate">{m.name}</p>
                          <p className="text-sm text-muted-foreground tabular-nums shrink-0">{m.dosage}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/70">
                          {m.frequency === 'daily' && <span>Dagligen</span>}
                          {m.frequency === 'as_needed' && <span>Vid behov</span>}
                          {m.started_at && (
                            <>
                              <span>·</span>
                              <span>Sedan {format(parseISO(m.started_at), 'MMM yyyy', { locale: sv })}</span>
                            </>
                          )}
                          {m.is_trial && (
                            <>
                              <span>·</span>
                              <span className="text-[hsl(45_85%_55%)]">Provperiod</span>
                            </>
                          )}
                        </div>
                        {m.side_effects && m.side_effects.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {m.side_effects.map((s, i) => (
                              <span
                                key={i}
                                className="text-[11px] text-[hsl(0_75%_60%)] bg-[hsl(0_75%_55%/0.08)] px-2 py-0.5 rounded-full"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {m.notes && (
                          <p className="mt-2 text-xs text-muted-foreground/70 italic leading-relaxed">{m.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {inactiveMedications.length > 0 && (
            <details className="mt-4 group">
              <summary className="text-xs text-muted-foreground/60 cursor-pointer list-none flex items-center gap-1 hover:text-foreground">
                <Activity className="w-3 h-3" />
                <span>{inactiveMedications.length} tidigare mediciner</span>
              </summary>
              <ul className="mt-2 space-y-1.5 pl-4 border-l border-border/40">
                {inactiveMedications.map(m => (
                  <li key={m.id} className="text-xs text-muted-foreground/70">
                    <span className="text-foreground/70">{m.name}</span> {m.dosage}
                    {m.stop_reason && <span className="opacity-60"> — {m.stop_reason}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

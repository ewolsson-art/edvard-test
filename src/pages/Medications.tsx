import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';
import {
  Pill, Plus, Pencil, Trash2, Check, X, Calendar, CheckCircle2, Clock,
  AlertTriangle, ThumbsUp, ThumbsDown, Minus, HelpCircle, History, Info, ChevronRight,
  Sparkles, FileText, FlaskConical, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMedications, AddMedicationInput } from '@/hooks/useMedications';
import {
  MedicationFrequency,
  FREQUENCY_LABELS,
  MedicationStatus,
  STATUS_LABELS,
  MedicationEffectiveness,
  EFFECTIVENESS_LABELS,
  EFFECTIVENESS_COLORS,
  COMMON_SIDE_EFFECTS,
  COMMON_INDICATIONS,
  Medication,
} from '@/types/medication';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { MedicationInsights } from '@/components/medications/MedicationInsights';

const EFFECTIVENESS_ICONS: Record<MedicationEffectiveness, JSX.Element> = {
  works_well: <ThumbsUp className="h-4 w-4" />,
  works_partially: <Check className="h-4 w-4" />,
  no_effect: <Minus className="h-4 w-4" />,
  made_worse: <ThumbsDown className="h-4 w-4" />,
  too_early: <HelpCircle className="h-4 w-4" />,
};

interface MedFormState {
  name: string;
  dosage: string;
  startedAt: string;
  frequency: MedicationFrequency;
  status: MedicationStatus;
  sideEffects: string[];
  customSideEffect: string;
  effectiveness: MedicationEffectiveness | '';
  notes: string;
  stoppedAt: string;
  stopReason: string;
  isTrial: boolean;
  indication: string;
  customIndication: string;
}

const emptyForm = (): MedFormState => ({
  name: '',
  dosage: '',
  startedAt: format(new Date(), 'yyyy-MM-dd'),
  frequency: 'daily',
  status: 'current',
  sideEffects: [],
  customSideEffect: '',
  effectiveness: '',
  notes: '',
  stoppedAt: '',
  stopReason: '',
  isTrial: false,
  indication: '',
  customIndication: '',
});

const Medications = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const dateFnsLocale = i18n.language === 'sv' ? sv : enUS;

  const {
    medications, currentMedications, asNeededMedications, previousMedications,
    isLoaded, addMedication, updateMedication, setMedicationStatus,
    deleteMedication, logMedication, isMedicationTakenOnDate,
  } = useMedications();

  const [tab, setTab] = useState<'current' | 'previous'>('current');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [form, setForm] = useState<MedFormState>(emptyForm());
  const [detailMed, setDetailMed] = useState<Medication | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'EEEE d MMMM', { locale: dateFnsLocale });

  const dailyMeds = currentMedications;
  const takenToday = dailyMeds.filter(m => isMedicationTakenOnDate(m.id, today)).length;
  const totalToday = dailyMeds.length;
  const progressPercent = totalToday > 0 ? (takenToday / totalToday) * 100 : 0;
  const allTaken = totalToday > 0 && takenToday === totalToday;

  const openAdd = () => {
    setEditingMed(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (med: Medication) => {
    setEditingMed(med);
    const ind = med.indication ?? '';
    const isCommon = ind === '' || COMMON_INDICATIONS.includes(ind);
    setForm({
      name: med.name,
      dosage: med.dosage,
      startedAt: med.started_at,
      frequency: med.frequency,
      status: med.status ?? (med.active ? 'current' : 'previous'),
      sideEffects: med.side_effects ?? [],
      customSideEffect: '',
      effectiveness: med.effectiveness ?? '',
      notes: med.notes ?? '',
      stoppedAt: med.stopped_at ?? '',
      stopReason: med.stop_reason ?? '',
      isTrial: med.is_trial ?? false,
      indication: isCommon ? ind : 'Annat',
      customIndication: isCommon ? '' : ind,
    });
    setDetailMed(null);
    setIsFormOpen(true);
  };

  const toggleSideEffect = (effect: string) => {
    setForm(f => ({
      ...f,
      sideEffects: f.sideEffects.includes(effect)
        ? f.sideEffects.filter(s => s !== effect)
        : [...f.sideEffects, effect],
    }));
  };

  const addCustomSideEffect = () => {
    const v = form.customSideEffect.trim();
    if (v && !form.sideEffects.includes(v)) {
      setForm(f => ({ ...f, sideEffects: [...f.sideEffects, v], customSideEffect: '' }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.dosage.trim()) return;
    // For previously tested medications, dates are optional — fall back to today so the DB stays valid
    const effectiveStartedAt = form.startedAt || today;
    const indicationValue =
      form.indication === 'Annat'
        ? (form.customIndication.trim() || null)
        : (form.indication.trim() || null);
    const payload: AddMedicationInput = {
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      startedAt: effectiveStartedAt,
      frequency: form.frequency,
      status: form.status,
      sideEffects: form.sideEffects,
      effectiveness: form.effectiveness === '' ? null : form.effectiveness,
      notes: form.notes.trim() || null,
      stoppedAt: form.status === 'previous' ? (form.stoppedAt || effectiveStartedAt) : (form.stoppedAt || null),
      stopReason: form.stopReason.trim() || null,
      isTrial: form.isTrial,
      indication: indicationValue,
    };
    if (editingMed) {
      await updateMedication(editingMed.id, payload);
    } else {
      await addMedication(payload);
    }
    setIsFormOpen(false);
    setEditingMed(null);
    setForm(emptyForm());
  };

  const handleToggleTaken = async (medicationId: string) => {
    const isTaken = isMedicationTakenOnDate(medicationId, today);
    await logMedication(medicationId, today, !isTaken);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try { return format(new Date(dateStr), 'd MMM yyyy', { locale: dateFnsLocale }); } catch { return dateStr; }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allCurrent = [...currentMedications, ...asNeededMedications];
  const hasAny = medications.length > 0;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-2xl mx-auto md:mx-0 px-5 md:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Tillbaka"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-semibold tracking-tight">Mediciner</h1>
        </div>
      </header>
      <div className="p-5 md:p-8">
        <div className="max-w-2xl mx-auto md:mx-0 space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[13px] text-foreground/30">
              Håll koll på vad du tar nu, vad du har testat tidigare och vilka effekter & biverkningar du upplever.
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2 rounded-full shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Lägg till</span>
          </Button>
        </header>

        {/* Onboarding info card when empty */}
        {!hasAny && (
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Bygg din medicin-historik</h3>
                  <p className="text-sm text-muted-foreground">Det här hjälper dig och din vårdgivare</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Lägg till medicinerna du tar <strong className="text-foreground">just nu</strong> så du kan checka av dem dagligen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Registrera även mediciner du <strong className="text-foreground">har testat tidigare</strong> – med biverkningar och om de fungerade.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Allt sparas privat och kan delas med läkare eller anhörig.</span>
                </li>
              </ul>
              <Button onClick={openAdd} className="w-full gap-2 rounded-full">
                <Plus className="h-4 w-4" />
                Lägg till första medicinen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Today's check-in */}
        {dailyMeds.length > 0 && (
          <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${allTaken ? 'bg-emerald-500/10' : 'bg-foreground/[0.06]'}`}>
                    {allTaken ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-foreground/40" />}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground/90">Idag</p>
                    <p className="text-[12px] text-foreground/30 capitalize">{todayLabel}</p>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-foreground/50 px-2.5 py-1 rounded-full bg-foreground/[0.05]">
                  {takenToday}/{totalToday} tagna
                </span>
              </div>
              <Progress value={progressPercent} className="h-1" />
              <div className="space-y-1.5">
                {dailyMeds.map(med => {
                  const isTaken = isMedicationTakenOnDate(med.id, today);
                  return (
                    <button
                      key={med.id}
                      onClick={() => handleToggleTaken(med.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isTaken ? 'bg-emerald-500/[0.06]' : 'bg-foreground/[0.03] hover:bg-foreground/[0.05]'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isTaken ? 'border-emerald-500 bg-emerald-500' : 'border-foreground/20'
                      }`}>
                        {isTaken && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium ${isTaken ? 'text-foreground/40 line-through' : 'text-foreground/85'}`}>{med.name}</p>
                        <p className="text-[12px] text-foreground/30">{med.dosage}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tabs current vs previous */}
        {hasAny && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'current' | 'previous')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="gap-2">
                <Pill className="h-4 w-4" />
                Aktuella ({allCurrent.length})
              </TabsTrigger>
              <TabsTrigger value="previous" className="gap-2">
                <History className="h-4 w-4" />
                Har testat ({previousMedications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-3 mt-4">
              {allCurrent.length === 0 ? (
                <EmptyState
                  icon={<Pill className="h-10 w-10 text-muted-foreground/50" />}
                  text="Inga aktuella mediciner"
                  hint="Lägg till en medicin du tar just nu."
                />
              ) : (
                <>
                  {currentMedications.map(med => (
                    <MedCard key={med.id} med={med} onClick={() => setDetailMed(med)} />
                  ))}
                  {asNeededMedications.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                        Vid behov
                      </p>
                      {asNeededMedications.map(med => (
                        <MedCard key={med.id} med={med} onClick={() => setDetailMed(med)} accent="amber" />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="previous" className="space-y-3 mt-4">
              {previousMedications.length === 0 ? (
                <EmptyState
                  icon={<History className="h-10 w-10 text-muted-foreground/50" />}
                  text="Inga tidigare mediciner registrerade"
                  hint="Lägg till mediciner du har testat förut – det hjälper läkaren att se vad som fungerat eller inte."
                />
              ) : (
                previousMedications.map(med => (
                  <MedCard key={med.id} med={med} onClick={() => setDetailMed(med)} accent="muted" />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add / Edit form dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); setEditingMed(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMed ? 'Redigera medicin' : 'Lägg till medicin'}</DialogTitle>
            <DialogDescription>
              Fyll i så mycket eller lite du vill. Du kan alltid uppdatera senare.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Step 1: Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                Tar du den nu eller har du testat den?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(['current', 'previous'] as MedicationStatus[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/30 hover:border-primary/30'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Basic info */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                Grunduppgifter
              </Label>
              <div className="space-y-2">
                <Input
                  placeholder="Namn (t.ex. Lamotrigin)"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                <Input
                  placeholder="Dosering (t.ex. 100mg morgon & kväll)"
                  value={form.dosage}
                  onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Vad tar du den mot? <span className="opacity-60">(valfritt)</span>
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_INDICATIONS.map(ind => {
                      const selected = form.indication === ind;
                      return (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, indication: selected ? '' : ind, customIndication: ind === 'Annat' ? f.customIndication : '' }))}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                            selected
                              ? 'bg-primary/15 border-primary/40 text-primary'
                              : 'border-border bg-muted/30 hover:border-primary/30'
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 inline mr-1" />}
                          {ind}
                        </button>
                      );
                    })}
                  </div>
                  {form.indication === 'Annat' && (
                    <Input
                      placeholder="Skriv vad medicinen tas mot"
                      value={form.customIndication}
                      onChange={e => setForm(f => ({ ...f, customIndication: e.target.value }))}
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Startade {form.status === 'previous' && <span className="opacity-60">(valfritt)</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.startedAt}
                      onChange={e => setForm(f => ({ ...f, startedAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Slutade {form.status === 'previous' && <span className="opacity-60">(valfritt)</span>}
                      {form.status !== 'previous' && <span className="opacity-60">(valfritt)</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.stoppedAt}
                      onChange={e => setForm(f => ({ ...f, stoppedAt: e.target.value }))}
                    />
                  </div>
                </div>
                {form.status === 'previous' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <p className="text-xs text-muted-foreground w-full">Kommer du inte ihåg datum? Välj en grov uppskattning:</p>
                    {[
                      { label: 'Senaste året', months: 12 },
                      { label: '1–2 år sedan', months: 18 },
                      { label: '2–5 år sedan', months: 42 },
                      { label: 'Mer än 5 år sedan', months: 72 },
                      { label: 'Vet ej', months: null },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          if (opt.months === null) {
                            setForm(f => ({ ...f, startedAt: '', stoppedAt: '' }));
                          } else {
                            const d = new Date();
                            d.setMonth(d.getMonth() - opt.months);
                            setForm(f => ({ ...f, startedAt: format(d, 'yyyy-MM-dd'), stoppedAt: '' }));
                          }
                        }}
                        className="px-3 py-1.5 rounded-full text-xs border border-border bg-muted/30 hover:border-primary/30 transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Hur ofta</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm(f => ({ ...f, frequency: v as MedicationFrequency }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Trial / regular medication toggle */}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isTrial: !f.isTrial }))}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                    form.isTrial
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-border bg-muted/30 hover:border-amber-500/30'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    form.isTrial ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/40'
                  }`}>
                    {form.isTrial && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium">Provmedicin (nyinsatt / under utvärdering)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Markera om detta är en medicin du provar – så hålls den isär från dina grundmediciner när du rapporterar biverkningar.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Effectiveness */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                Hur fungerar/fungerade den för dig?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(EFFECTIVENESS_LABELS) as MedicationEffectiveness[]).map(eff => (
                  <button
                    key={eff}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, effectiveness: f.effectiveness === eff ? '' : eff }))}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all text-left ${
                      form.effectiveness === eff
                        ? EFFECTIVENESS_COLORS[eff] + ' border-2'
                        : 'border-border bg-muted/30 hover:bg-muted/60'
                    }`}
                  >
                    {EFFECTIVENESS_ICONS[eff]}
                    <span className="text-xs">{EFFECTIVENESS_LABELS[eff]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Side effects */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                Biverkningar du upplever/upplevde
              </Label>
              <p className="text-xs text-muted-foreground">Tryck på de som stämmer, eller skriv egna.</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SIDE_EFFECTS.map(effect => {
                  const selected = form.sideEffects.includes(effect);
                  return (
                    <button
                      key={effect}
                      type="button"
                      onClick={() => toggleSideEffect(effect)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selected
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                          : 'border-border bg-muted/30 hover:border-amber-500/30'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 inline mr-1" />}
                      {effect}
                    </button>
                  );
                })}
              </div>
              {form.sideEffects.filter(s => !COMMON_SIDE_EFFECTS.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.sideEffects.filter(s => !COMMON_SIDE_EFFECTS.includes(s)).map(s => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}
                      <button onClick={() => toggleSideEffect(s)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Lägg till egen biverkning"
                  value={form.customSideEffect}
                  onChange={e => setForm(f => ({ ...f, customSideEffect: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSideEffect(); }}}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomSideEffect}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Step 5: Reason for stopping (only when 'previous') */}
            {form.status === 'previous' && (
              <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                <Label className="flex items-center gap-1.5 text-sm">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
                  Varför slutade du?
                </Label>
                <p className="text-xs text-muted-foreground">Slutdatum fyller du i ovan under Grunduppgifter.</p>
                <Textarea
                  placeholder="Orsak (t.ex. för biverkningar, byttes ut, ingen effekt)"
                  value={form.stopReason}
                  onChange={e => setForm(f => ({ ...f, stopReason: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Egna anteckningar (valfritt)
              </Label>
              <Textarea
                placeholder="Allt du vill komma ihåg om denna medicin"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsFormOpen(false); setEditingMed(null); }}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.dosage.trim()}>
              {editingMed ? 'Spara ändringar' : 'Lägg till'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailMed} onOpenChange={(open) => { if (!open) setDetailMed(null); }}>
        <DialogContent className="max-w-md">
          {detailMed && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" />
                  {detailMed.name}
                </DialogTitle>
                <DialogDescription>{detailMed.dosage}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {detailMed.is_trial && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                    <FlaskConical className="h-4 w-4" />
                    <span className="font-medium">Provmedicin – under utvärdering</span>
                  </div>
                )}
                {detailMed.indication && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tas mot</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
                      {detailMed.indication}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Hur ofta" value={FREQUENCY_LABELS[detailMed.frequency]} />
                  <InfoRow label="Startade" value={formatDate(detailMed.started_at)} />
                  <InfoRow label="Status" value={STATUS_LABELS[(detailMed.status ?? (detailMed.active ? 'current' : 'previous')) as MedicationStatus]} />
                  {detailMed.stopped_at && <InfoRow label="Slutade" value={formatDate(detailMed.stopped_at)} />}
                </div>

                {/* Grafiska insikter: mående + biverkningar under medicinens period */}
                <div className="pt-2 border-t border-border/40">
                  <MedicationInsights med={detailMed} />
                </div>


                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Effekt</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${EFFECTIVENESS_COLORS[detailMed.effectiveness]}`}>
                      {EFFECTIVENESS_ICONS[detailMed.effectiveness]}
                      <span>{EFFECTIVENESS_LABELS[detailMed.effectiveness]}</span>
                    </div>
                  </div>
                )}

                {detailMed.side_effects && detailMed.side_effects.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Biverkningar
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailMed.side_effects.map(s => (
                        <Badge key={s} variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detailMed.stop_reason && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orsak till att den slutades</p>
                    <p className="text-sm">{detailMed.stop_reason}</p>
                  </div>
                )}

                {detailMed.notes && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anteckningar</p>
                    <p className="text-sm whitespace-pre-wrap">{detailMed.notes}</p>
                  </div>
                )}

                {/* Quick status switch */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ändra status</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['current', 'previous'] as MedicationStatus[]).map(s => {
                      const currentStatus = detailMed.status ?? (detailMed.active ? 'current' : 'previous');
                      const isCurrent = currentStatus === s;
                      return (
                        <button
                          key={s}
                          onClick={() => { setMedicationStatus(detailMed.id, s); setDetailMed({ ...detailMed, status: s, active: s === 'current' } as Medication); }}
                          disabled={isCurrent}
                          className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                            isCurrent ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/30 hover:border-primary/30'
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1">
                      <Trash2 className="h-4 w-4" /> Ta bort
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ta bort medicin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Detta tar bort {detailMed.name} och all tillhörande historik permanent.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => { deleteMedication(detailMed.id); setDetailMed(null); }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ta bort
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={() => openEdit(detailMed)} className="gap-1">
                  <Pencil className="h-4 w-4" /> Redigera
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function EmptyState({ icon, text, hint }: { icon: React.ReactNode; text: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm py-10 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-[14px] font-medium text-foreground/60">{text}</p>
      <p className="text-[13px] text-foreground/30 mt-1 px-6">{hint}</p>
    </div>
  );
}

function MedCard({
  med,
  onClick,
  accent = 'default',
}: {
  med: Medication;
  onClick: () => void;
  accent?: 'default' | 'amber' | 'muted';
}) {
  const sideEffectsCount = med.side_effects?.length ?? 0;
  const effectiveness = med.effectiveness;
  const opacityClass = accent === 'muted' ? 'opacity-70 hover:opacity-100' : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl bg-foreground/[0.03] backdrop-blur-sm hover:bg-foreground/[0.05] active:bg-foreground/[0.06] transition-colors p-4 ${opacityClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-semibold text-foreground/90 truncate">{med.name}</p>
            {med.is_trial && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
                <FlaskConical className="h-3 w-3" />
                Prov
              </span>
            )}
            {accent === 'amber' && !med.is_trial && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
                Vid behov
              </span>
            )}
            {effectiveness && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${EFFECTIVENESS_COLORS[effectiveness]}`}>
                {EFFECTIVENESS_ICONS[effectiveness]}
                <span className="hidden xs:inline">{EFFECTIVENESS_LABELS[effectiveness]}</span>
              </span>
            )}
          </div>
          <p className="text-[13px] text-foreground/40 mt-0.5">{med.dosage}</p>
          {med.indication && (
            <p className="text-[12px] text-foreground/50 mt-1">Mot: {med.indication}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-foreground/30">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {med.status === 'previous' && med.stopped_at
                ? `${formatShort(med.started_at)} – ${formatShort(med.stopped_at)}`
                : `Sedan ${formatShort(med.started_at)}`}
            </span>
            <span>{FREQUENCY_LABELS[med.frequency]}</span>
            {sideEffectsCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600/80 dark:text-amber-400/80">
                <AlertTriangle className="h-3 w-3" />
                {sideEffectsCount} biverkning{sideEffectsCount > 1 ? 'ar' : ''}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-foreground/15 mt-1 shrink-0" />
      </div>
    </button>
  );
}

function formatShort(dateStr: string) {
  try { return format(new Date(dateStr), 'MMM yyyy', { locale: sv }); } catch { return dateStr; }
}

export default Medications;

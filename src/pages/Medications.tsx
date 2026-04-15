import { useState } from 'react';
import { format } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';
import { Pill, Plus, Pencil, Trash2, Check, X, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMedications } from '@/hooks/useMedications';
import { MedicationFrequency, FREQUENCY_LABELS } from '@/types/medication';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Medications = () => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === 'sv' ? sv : enUS;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newStartDate, setNewStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newFrequency, setNewFrequency] = useState<MedicationFrequency>('daily');
  const [editName, setEditName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editFrequency, setEditFrequency] = useState<MedicationFrequency>('daily');

  const {
    medications, activeMedications, asNeededMedications, inactiveMedications,
    isLoaded, addMedication, updateMedication, toggleMedicationActive,
    deleteMedication, logMedication, isMedicationTakenOnDate,
  } = useMedications();

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'EEEE d MMMM', { locale: dateFnsLocale });

  const takenToday = activeMedications.filter(med => isMedicationTakenOnDate(med.id, today)).length;
  const totalToday = activeMedications.length;
  const progressPercent = totalToday > 0 ? (takenToday / totalToday) * 100 : 0;
  const allTaken = totalToday > 0 && takenToday === totalToday;

  const handleAdd = async () => {
    if (newName.trim() && newDosage.trim() && newStartDate) {
      await addMedication(newName.trim(), newDosage.trim(), newStartDate, newFrequency);
      setNewName(''); setNewDosage(''); setNewStartDate(format(new Date(), 'yyyy-MM-dd')); setNewFrequency('daily'); setIsAddOpen(false);
    }
  };

  const handleEdit = (id: string, name: string, dosage: string, startedAt: string, frequency: MedicationFrequency) => {
    setEditingId(id); setEditName(name); setEditDosage(dosage); setEditStartDate(startedAt); setEditFrequency(frequency);
  };

  const handleSaveEdit = async () => {
    if (editingId && editName.trim() && editDosage.trim() && editStartDate) {
      await updateMedication(editingId, editName.trim(), editDosage.trim(), editStartDate, editFrequency);
      setEditingId(null);
    }
  };

  const handleToggleTaken = async (medicationId: string) => {
    const isTaken = isMedicationTakenOnDate(medicationId, today);
    await logMedication(medicationId, today, !isTaken);
  };

  const formatStartDate = (dateStr: string) => {
    try { return format(new Date(dateStr), 'd MMM yyyy', { locale: dateFnsLocale }); } catch { return dateStr; }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold mb-2">{t('medicationsPage.title')}</h1>
          <p className="text-sm text-muted-foreground mb-8">{t('medicationsPage.subtitle')}</p>
        </header>

        <section>
          <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${allTaken ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                    {allTaken ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Clock className="h-6 w-6 text-primary" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t('medicationsPage.todaysMeds')}</CardTitle>
                    <CardDescription className="capitalize">{todayLabel}</CardDescription>
                  </div>
                </div>
                {totalToday > 0 && (
                  <Badge variant={allTaken ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                    {takenToday} {t('medicationsPage.of')} {totalToday} {t('medicationsPage.taken').toLowerCase()}
                  </Badge>
                )}
              </div>
              {totalToday > 0 && <div className="mt-4"><Progress value={progressPercent} className="h-2" /></div>}
            </CardHeader>
            <CardContent>
              {activeMedications.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('medicationsPage.noActiveMeds')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('medicationsPage.addBelow')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeMedications.map(med => {
                    const isTaken = isMedicationTakenOnDate(med.id, today);
                    return (
                      <button key={med.id} onClick={() => handleToggleTaken(med.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isTaken ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/5'}`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isTaken ? 'border-green-500 bg-green-500' : 'border-muted-foreground/30'}`}>
                          {isTaken && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${isTaken ? 'text-muted-foreground' : ''}`}>{med.name}</p>
                          <p className="text-sm text-muted-foreground">{med.dosage}</p>
                        </div>
                        {isTaken && <span className="text-xs text-green-600 font-medium">{t('medicationsPage.taken')} ✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-semibold">{t('medicationsPage.allMeds')}</h2>
              <p className="text-sm text-muted-foreground">
                {medications.length} {t('medicationsPage.medsTotal')} ({activeMedications.length} {t('medicationsPage.active')})
              </p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />{t('medicationsPage.addMed')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('medicationsPage.addMedTitle')}</DialogTitle>
                  <DialogDescription>{t('medicationsPage.addMedDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('medicationsPage.name')}</Label>
                    <Input id="name" placeholder={t('medicationsPage.namePlaceholder')} value={newName} onChange={e => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">{t('medicationsPage.dosage')}</Label>
                    <Input id="dosage" placeholder={t('medicationsPage.dosagePlaceholder')} value={newDosage} onChange={e => setNewDosage(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t('medicationsPage.startDate')}</Label>
                    <Input id="startDate" type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">{t('medicationsPage.frequency')}</Label>
                    <Select value={newFrequency} onValueChange={(v) => setNewFrequency(v as MedicationFrequency)}>
                      <SelectTrigger><SelectValue placeholder={t('medicationsPage.selectFrequency')} /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t('medicationsPage.cancel')}</Button>
                  <Button onClick={handleAdd} disabled={!newName.trim() || !newDosage.trim() || !newStartDate}>{t('medicationsPage.add')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {medications.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Pill className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('medicationsPage.noMeds')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('medicationsPage.clickAdd')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeMedications.length > 0 && (
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <CardTitle className="text-base">{t('medicationsPage.activeMeds')}</CardTitle>
                      <Badge variant="secondary" className="ml-auto">{activeMedications.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y divide-border">
                      {activeMedications.map(med => (
                        <MedicationRow key={med.id} med={med} editingId={editingId} editName={editName} editDosage={editDosage} editStartDate={editStartDate} editFrequency={editFrequency} setEditName={setEditName} setEditDosage={setEditDosage} setEditStartDate={setEditStartDate} setEditFrequency={setEditFrequency} handleEdit={handleEdit} handleSaveEdit={handleSaveEdit} setEditingId={setEditingId} toggleMedicationActive={toggleMedicationActive} deleteMedication={deleteMedication} formatStartDate={formatStartDate} t={t} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {asNeededMedications.length > 0 && (
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <CardTitle className="text-base">{t('medicationsPage.asNeeded')}</CardTitle>
                      <Badge variant="secondary" className="ml-auto">{asNeededMedications.length}</Badge>
                    </div>
                    <CardDescription className="text-sm">{t('medicationsPage.asNeededDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      {asNeededMedications.map(med => {
                        const isTaken = isMedicationTakenOnDate(med.id, today);
                        return (
                          <button key={med.id} onClick={() => handleToggleTaken(med.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isTaken ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/30 hover:border-amber-500/30 hover:bg-amber-500/5'}`}>
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isTaken ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/30'}`}>
                              {isTaken && <Check className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${isTaken ? 'text-muted-foreground' : ''}`}>{med.name}</p>
                              <p className="text-sm text-muted-foreground">{med.dosage}</p>
                            </div>
                            {isTaken && <span className="text-xs text-amber-600 font-medium">{t('medicationsPage.takenToday')} ✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="divide-y divide-border border-t pt-4">
                      {asNeededMedications.map(med => (
                        <MedicationRow key={med.id} med={med} editingId={editingId} editName={editName} editDosage={editDosage} editStartDate={editStartDate} editFrequency={editFrequency} setEditName={setEditName} setEditDosage={setEditDosage} setEditStartDate={setEditStartDate} setEditFrequency={setEditFrequency} handleEdit={handleEdit} handleSaveEdit={handleSaveEdit} setEditingId={setEditingId} toggleMedicationActive={toggleMedicationActive} deleteMedication={deleteMedication} formatStartDate={formatStartDate} t={t} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {inactiveMedications.length > 0 && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="inactive" className="border-0">
                    <Card className="glass-card">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                          <span className="text-base font-semibold">{t('medicationsPage.inactiveMeds')}</span>
                          <Badge variant="outline" className="ml-2">{inactiveMedications.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="divide-y divide-border">
                          {inactiveMedications.map(med => (
                            <MedicationRow key={med.id} med={med} editingId={editingId} editName={editName} editDosage={editDosage} editStartDate={editStartDate} editFrequency={editFrequency} setEditName={setEditName} setEditDosage={setEditDosage} setEditStartDate={setEditStartDate} setEditFrequency={setEditFrequency} handleEdit={handleEdit} handleSaveEdit={handleSaveEdit} setEditingId={setEditingId} toggleMedicationActive={toggleMedicationActive} deleteMedication={deleteMedication} formatStartDate={formatStartDate} t={t} />
                          ))}
                        </div>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

interface MedicationRowProps {
  med: { id: string; name: string; dosage: string; started_at: string; frequency: MedicationFrequency; active: boolean };
  editingId: string | null;
  editName: string; editDosage: string; editStartDate: string; editFrequency: MedicationFrequency;
  setEditName: (v: string) => void; setEditDosage: (v: string) => void; setEditStartDate: (v: string) => void; setEditFrequency: (v: MedicationFrequency) => void;
  handleEdit: (id: string, name: string, dosage: string, startedAt: string, frequency: MedicationFrequency) => void;
  handleSaveEdit: () => void; setEditingId: (id: string | null) => void;
  toggleMedicationActive: (id: string, active: boolean) => void;
  deleteMedication: (id: string) => void;
  formatStartDate: (dateStr: string) => string;
  t: (key: string, opts?: any) => string;
}

function MedicationRow({ med, editingId, editName, editDosage, editStartDate, editFrequency, setEditName, setEditDosage, setEditStartDate, setEditFrequency, handleEdit, handleSaveEdit, setEditingId, toggleMedicationActive, deleteMedication, formatStartDate, t }: MedicationRowProps) {
  if (editingId === med.id) {
    return (
      <div className="py-4 space-y-3">
        <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder={t('medicationsPage.name')} />
        <Input value={editDosage} onChange={e => setEditDosage(e.target.value)} placeholder={t('medicationsPage.dosage')} />
        <Input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
        <Select value={editFrequency} onValueChange={(v) => setEditFrequency(v as MedicationFrequency)}>
          <SelectTrigger><SelectValue placeholder={t('medicationsPage.selectFrequency')} /></SelectTrigger>
          <SelectContent>
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveEdit}><Check className="h-4 w-4 mr-1" />{t('medicationsPage.save')}</Button>
          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4 mr-1" />{t('medicationsPage.cancel')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-4 flex items-center gap-3 ${!med.active ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{med.name}</p>
        <p className="text-sm text-muted-foreground">{med.dosage}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span>{FREQUENCY_LABELS[med.frequency] || t('medicationsPage.daily')}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t('medicationsPage.since')} {formatStartDate(med.started_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Switch checked={med.active} onCheckedChange={(checked) => toggleMedicationActive(med.id, checked)} />
        <Button size="icon" variant="ghost" onClick={() => handleEdit(med.id, med.name, med.dosage, med.started_at, med.frequency)}><Pencil className="h-4 w-4" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('medicationsPage.deleteMed')}</AlertDialogTitle>
              <AlertDialogDescription>{t('medicationsPage.deleteConfirm', { name: med.name })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('medicationsPage.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMedication(med.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('medicationsPage.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default Medications;

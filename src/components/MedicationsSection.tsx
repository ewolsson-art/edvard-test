import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Pill, Plus, Pencil, Trash2, Check, X, Calendar, CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMedications } from '@/hooks/useMedications';
import { MedicationFrequency, FREQUENCY_LABELS } from '@/types/medication';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const MedicationsSection = () => {
  const { t } = useTranslation();
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const {
    medications,
    activeMedications,
    asNeededMedications,
    inactiveMedications,
    isLoaded,
    addMedication,
    updateMedication,
    toggleMedicationActive,
    deleteMedication,
    logMedication,
    isMedicationTakenOnDate,
  } = useMedications();

  // Split active meds into ongoing vs. trial (under evaluation)
  const ongoingMedications = activeMedications.filter(m => !m.is_trial);
  const trialMedications = activeMedications.filter(m => m.is_trial);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'EEEE d MMMM', { locale: sv });

  // Calculate today's progress (only regular active meds, not as-needed)
  const takenToday = activeMedications.filter(med => isMedicationTakenOnDate(med.id, today)).length;
  const totalToday = activeMedications.length;
  const progressPercent = totalToday > 0 ? (takenToday / totalToday) * 100 : 0;
  const allTaken = totalToday > 0 && takenToday === totalToday;

  const handleAdd = async () => {
    if (newName.trim() && newDosage.trim() && newStartDate) {
      await addMedication(newName.trim(), newDosage.trim(), newStartDate, newFrequency);
      setNewName('');
      setNewDosage('');
      setNewStartDate(format(new Date(), 'yyyy-MM-dd'));
      setNewFrequency('daily');
      setIsAddOpen(false);
    }
  };

  const handleEdit = (id: string, name: string, dosage: string, startedAt: string, frequency: MedicationFrequency) => {
    setEditingId(id);
    setEditName(name);
    setEditDosage(dosage);
    setEditStartDate(startedAt);
    setEditFrequency(frequency);
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
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: sv });
    } catch {
      return dateStr;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mediciner</h3>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              Lägg till
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till medicin</DialogTitle>
              <DialogDescription>
                Ange namn, dosering och startdatum för din medicin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn</Label>
                <Input
                  id="name"
                  placeholder="t.ex. Lamotrigin"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosering</Label>
                <Input
                  id="dosage"
                  placeholder="t.ex. 100mg morgon & kväll"
                  value={newDosage}
                  onChange={e => setNewDosage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Hur ofta</Label>
                <Select value={newFrequency} onValueChange={(v) => setNewFrequency(v as MedicationFrequency)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj frekvens" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAdd} disabled={!newName.trim() || !newDosage.trim() || !newStartDate}>
                Lägg till
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's medications - Quick logging */}
      {(activeMedications.length > 0 || asNeededMedications.length > 0) && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium capitalize">{todayLabel}</p>
            {totalToday > 0 && (
              <Badge variant={allTaken ? 'default' : 'secondary'} className="text-xs">
                {takenToday}/{totalToday}
              </Badge>
            )}
          </div>
          
          {totalToday > 0 && (
            <Progress value={progressPercent} className="h-1.5" />
          )}
          
          <div className="space-y-2">
            {activeMedications.map(med => {
              const isTaken = isMedicationTakenOnDate(med.id, today);
              return (
                <button
                  key={med.id}
                  onClick={() => handleToggleTaken(med.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isTaken 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : 'border-border bg-background hover:border-primary/30'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isTaken 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-muted-foreground/30'
                  }`}>
                    {isTaken && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isTaken ? 'text-muted-foreground' : ''}`}>
                      {med.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{med.dosage}</p>
                  </div>
                </button>
              );
            })}
            
            {/* As-needed medications */}
            {asNeededMedications.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground pt-2">Vid behov</p>
                {asNeededMedications.map(med => {
                  const isTaken = isMedicationTakenOnDate(med.id, today);
                  return (
                    <button
                      key={med.id}
                      onClick={() => handleToggleTaken(med.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        isTaken 
                          ? 'border-amber-500/30 bg-amber-500/5' 
                          : 'border-border bg-background hover:border-amber-500/30'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isTaken 
                          ? 'border-amber-500 bg-amber-500' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {isTaken && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isTaken ? 'text-muted-foreground' : ''}`}>
                          {med.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{med.dosage}</p>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {medications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga mediciner tillagda ännu.</p>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Pågående (ongoing base meds) */}
            {ongoingMedications.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pågående · {ongoingMedications.length}
                  </p>
                </div>
                {ongoingMedications.map(med => (
                  <MedicationRow
                    key={med.id}
                    med={med}
                    editingId={editingId}
                    editName={editName}
                    editDosage={editDosage}
                    editStartDate={editStartDate}
                    editFrequency={editFrequency}
                    setEditName={setEditName}
                    setEditDosage={setEditDosage}
                    setEditStartDate={setEditStartDate}
                    setEditFrequency={setEditFrequency}
                    handleEdit={handleEdit}
                    handleSaveEdit={handleSaveEdit}
                    setEditingId={setEditingId}
                    toggleMedicationActive={toggleMedicationActive}
                    deleteMedication={deleteMedication}
                    formatStartDate={formatStartDate}
                  />
                ))}
              </div>
            )}

            {/* Testar (trial / under evaluation) */}
            {trialMedications.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Testar · {trialMedications.length}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground px-1 -mt-1">
                  Mediciner du utvärderar för att se om de fungerar
                </p>
                {trialMedications.map(med => (
                  <MedicationRow
                    key={med.id}
                    med={med}
                    editingId={editingId}
                    editName={editName}
                    editDosage={editDosage}
                    editStartDate={editStartDate}
                    editFrequency={editFrequency}
                    setEditName={setEditName}
                    setEditDosage={setEditDosage}
                    setEditStartDate={setEditStartDate}
                    setEditFrequency={setEditFrequency}
                    handleEdit={handleEdit}
                    handleSaveEdit={handleSaveEdit}
                    setEditingId={setEditingId}
                    toggleMedicationActive={toggleMedicationActive}
                    deleteMedication={deleteMedication}
                    formatStartDate={formatStartDate}
                  />
                ))}
              </div>
            )}

            {/* Vid behov */}
            {asNeededMedications.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Vid behov · {asNeededMedications.length}
                  </p>
                </div>
                {asNeededMedications.map(med => (
                  <MedicationRow
                    key={med.id}
                    med={med}
                    editingId={editingId}
                    editName={editName}
                    editDosage={editDosage}
                    editStartDate={editStartDate}
                    editFrequency={editFrequency}
                    setEditName={setEditName}
                    setEditDosage={setEditDosage}
                    setEditStartDate={setEditStartDate}
                    setEditFrequency={setEditFrequency}
                    handleEdit={handleEdit}
                    handleSaveEdit={handleSaveEdit}
                    setEditingId={setEditingId}
                    toggleMedicationActive={toggleMedicationActive}
                    deleteMedication={deleteMedication}
                    formatStartDate={formatStartDate}
                  />
                ))}
              </div>
            )}

            {/* Avslutade (previously tested, now inactive) */}
            {inactiveMedications.length > 0 && (
              <Collapsible open={showInactive} onOpenChange={setShowInactive}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Avslutade · {inactiveMedications.length}
                      </span>
                    </div>
                    {showInactive ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground px-1">
                    Mediciner du har testat tidigare
                  </p>
                  {inactiveMedications.map(med => (
                    <MedicationRow
                      key={med.id}
                      med={med}
                      editingId={editingId}
                      editName={editName}
                      editDosage={editDosage}
                      editStartDate={editStartDate}
                      editFrequency={editFrequency}
                      setEditName={setEditName}
                      setEditDosage={setEditDosage}
                      setEditStartDate={setEditStartDate}
                      setEditFrequency={setEditFrequency}
                      handleEdit={handleEdit}
                      handleSaveEdit={handleSaveEdit}
                      setEditingId={setEditingId}
                      toggleMedicationActive={toggleMedicationActive}
                      deleteMedication={deleteMedication}
                      formatStartDate={formatStartDate}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

// Medication row component
interface MedicationRowProps {
  med: { id: string; name: string; dosage: string; started_at: string; frequency: MedicationFrequency; active: boolean; is_trial?: boolean };
  editingId: string | null;
  editName: string;
  editDosage: string;
  editStartDate: string;
  editFrequency: MedicationFrequency;
  setEditName: (v: string) => void;
  setEditDosage: (v: string) => void;
  setEditStartDate: (v: string) => void;
  setEditFrequency: (v: MedicationFrequency) => void;
  handleEdit: (id: string, name: string, dosage: string, startedAt: string, frequency: MedicationFrequency) => void;
  handleSaveEdit: () => void;
  setEditingId: (id: string | null) => void;
  toggleMedicationActive: (id: string, active: boolean) => void;
  deleteMedication: (id: string) => void;
  formatStartDate: (dateStr: string) => string;
}

function MedicationRow({
  med,
  editingId,
  editName,
  editDosage,
  editStartDate,
  editFrequency,
  setEditName,
  setEditDosage,
  setEditStartDate,
  setEditFrequency,
  handleEdit,
  handleSaveEdit,
  setEditingId,
  toggleMedicationActive,
  deleteMedication,
  formatStartDate,
}: MedicationRowProps) {
  if (editingId === med.id) {
    return (
      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <Input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          placeholder="Namn"
          className="h-8 text-sm"
        />
        <Input
          value={editDosage}
          onChange={e => setEditDosage(e.target.value)}
          placeholder="Dosering"
          className="h-8 text-sm"
        />
        <Input
          type="date"
          value={editStartDate}
          onChange={e => setEditStartDate(e.target.value)}
          className="h-8 text-sm"
        />
        <Select value={editFrequency} onValueChange={(v) => setEditFrequency(v as MedicationFrequency)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Välj frekvens" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Spara
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            Avbryt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${!med.active ? 'opacity-60 bg-muted/30' : 'bg-background'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{med.name}</p>
          {med.is_trial && (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px] border-amber-500/40 text-amber-500 bg-amber-500/10">
              Prov
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{med.dosage}</p>
        <p className="text-xs text-muted-foreground">
          {FREQUENCY_LABELS[med.frequency]} · Sedan {formatStartDate(med.started_at)}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Switch
          checked={med.active}
          onCheckedChange={(checked) => toggleMedicationActive(med.id, checked)}
          className="scale-75"
        />
        <Button 
          size="icon" 
          variant="ghost"
          className="h-7 w-7"
          onClick={() => handleEdit(med.id, med.name, med.dosage, med.started_at, med.frequency)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort medicin?</AlertDialogTitle>
              <AlertDialogDescription>
                Detta tar bort {med.name} och all historik.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMedication(med.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ta bort
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

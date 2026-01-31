import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Pill, Plus, Pencil, Trash2, Check, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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

const Medications = () => {
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
    medications,
    activeMedications,
    isLoaded,
    addMedication,
    updateMedication,
    toggleMedicationActive,
    deleteMedication,
    logMedication,
    isMedicationTakenOnDate,
  } = useMedications();

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'EEEE d MMMM', { locale: sv });

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Mediciner
          </h1>
          <p className="text-muted-foreground">
            Hantera dina mediciner och logga dagligt intag
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's medications */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Dagens mediciner</CardTitle>
                  <CardDescription className="capitalize">{todayLabel}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeMedications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Du har inga aktiva mediciner. Lägg till en nedan.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeMedications.map(med => {
                    const isTaken = isMedicationTakenOnDate(med.id, today);
                    return (
                      <div 
                        key={med.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isTaken ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'
                        }`}
                      >
                        <Checkbox 
                          checked={isTaken}
                          onCheckedChange={() => handleToggleTaken(med.id)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${isTaken ? 'line-through text-muted-foreground' : ''}`}>
                            {med.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{med.dosage}</p>
                        </div>
                        {isTaken && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manage medications */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Mina mediciner</CardTitle>
                  <CardDescription>Lägg till och hantera mediciner</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
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
            </CardHeader>
            <CardContent>
              {medications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Inga mediciner tillagda ännu.
                </p>
              ) : (
                <div className="space-y-3">
                  {medications.map(med => (
                    <div 
                      key={med.id}
                      className={`p-3 rounded-lg border ${
                        med.active ? 'bg-card border-border' : 'bg-muted/30 border-border opacity-60'
                      }`}
                    >
                      {editingId === med.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Namn"
                          />
                          <Input
                            value={editDosage}
                            onChange={e => setEditDosage(e.target.value)}
                            placeholder="Dosering"
                          />
                          <Input
                            type="date"
                            value={editStartDate}
                            onChange={e => setEditStartDate(e.target.value)}
                          />
                          <Select value={editFrequency} onValueChange={(v) => setEditFrequency(v as MedicationFrequency)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Välj frekvens" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4 mr-1" />
                              Spara
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 mr-1" />
                              Avbryt
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium">{med.name}</p>
                            <p className="text-sm text-muted-foreground">{med.dosage}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {FREQUENCY_LABELS[med.frequency] || 'Dagligen'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Sedan {formatStartDate(med.started_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={med.active}
                              onCheckedChange={(checked) => toggleMedicationActive(med.id, checked)}
                              title={med.active ? 'Aktiv' : 'Inaktiv'}
                            />
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleEdit(med.id, med.name, med.dosage, med.started_at, med.frequency)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ta bort medicin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Detta tar bort {med.name} och all historik. Åtgärden kan inte ångras.
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
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Medications;

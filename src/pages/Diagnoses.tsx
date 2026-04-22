import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Stethoscope, Search, ArrowLeft, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDiagnoses } from '@/hooks/useDiagnoses';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DIAGNOSIS_GROUPS: Record<string, string[]> = {
  'Bipolär & affektiva': [
    'Bipolär sjukdom typ 1',
    'Bipolär sjukdom typ 2',
    'Cyklotymi',
    'Depression',
    'Återkommande depression',
  ],
  'Ångest & stress': [
    'Generaliserat ångestsyndrom (GAD)',
    'Paniksyndrom',
    'Social fobi',
    'PTSD',
    'OCD (Tvångssyndrom)',
  ],
  'Neuropsykiatriskt': [
    'ADHD',
    'ADD',
    'Autismspektrumtillstånd (AST)',
    'Tourettes',
  ],
  'Personlighet & övrigt': [
    'Borderline personlighetssyndrom',
    'Ätstörning',
    'Schizofreni',
    'Schizoaffektivt syndrom',
  ],
};

const ALL_SUGGESTIONS = Object.values(DIAGNOSIS_GROUPS).flat();

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
};

export default function Diagnoses() {
  const navigate = useNavigate();
  const { diagnoses, isLoading, addDiagnosis, removeDiagnosis } = useDiagnoses();
  const [query, setQuery] = useState('');
  const [diagnosedAt, setDiagnosedAt] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>('Bipolär & affektiva');
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const existingNames = diagnoses.map((d) => d.name.toLowerCase());

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_SUGGESTIONS.filter(
      (n) => n.toLowerCase().includes(q) && !existingNames.includes(n.toLowerCase())
    ).slice(0, 6);
  }, [query, existingNames]);

  const handleAdd = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) return;
    if (existingNames.includes(trimmed.toLowerCase())) return;
    setIsSubmitting(true);
    const ok = await addDiagnosis(trimmed, diagnosedAt || undefined);
    if (ok) {
      setQuery('');
      setDiagnosedAt('');
      setShowDatePicker(false);
    }
    setIsSubmitting(false);
  };

  const pendingDiagnosis = diagnoses.find((d) => d.id === pendingRemoveId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-2xl mx-auto px-5 md:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Tillbaka"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-semibold tracking-tight">Mina diagnoser</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-8 pb-24 space-y-10">
        {/* Intro */}
        <section className="text-center space-y-3 pt-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center">
            <Stethoscope className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold tracking-tight">
            Lägg till dina diagnoser
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Dina diagnoser hjälper Toddy att anpassa upplevelsen efter dig. De delas endast med läkare och anhöriga som du själv godkänt.
          </p>
        </section>

        {/* My diagnoses */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Dina diagnoser
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {diagnoses.length} {diagnoses.length === 1 ? 'diagnos' : 'diagnoser'}
            </span>
          </div>

          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : diagnoses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Du har inte lagt till några diagnoser ännu.
              </p>
            </div>
          ) : (
            <ul className="rounded-2xl bg-card overflow-hidden divide-y divide-border/40 ring-1 ring-border/40">
              {diagnoses.map((d) => {
                const formatted = formatDate(d.diagnosed_at);
                return (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium truncate">{d.name}</p>
                        {formatted && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Diagnos sedan {formatted}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setPendingRemoveId(d.id)}
                      disabled={isSubmitting}
                      className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                      aria-label={`Ta bort ${d.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Add new */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground px-1">
            Lägg till ny
          </h3>

          {/* Search box */}
          <div className="rounded-2xl bg-card ring-1 ring-border/40 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 100))}
                placeholder="Sök eller skriv en diagnos…"
                className="pl-10 h-12 text-base bg-background border-border/60 rounded-xl"
                disabled={isSubmitting}
              />
            </div>

            {/* Inline search suggestions */}
            {searchMatches.length > 0 && (
              <div className="space-y-1">
                {searchMatches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAdd(s)}
                    disabled={isSubmitting}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-muted/60 transition-colors flex items-center justify-between group"
                  >
                    <span>{s}</span>
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Optional date */}
            <button
              type="button"
              onClick={() => setShowDatePicker((v) => !v)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {diagnosedAt
                  ? `Diagnos från ${new Date(diagnosedAt).toLocaleDateString('sv-SE')}`
                  : 'Lägg till diagnos-datum (valfritt)'}
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', showDatePicker && 'rotate-180')} />
            </button>

            {showDatePicker && (
              <Input
                type="date"
                value={diagnosedAt}
                onChange={(e) => setDiagnosedAt(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-11 text-base bg-background border-border/60 rounded-xl"
              />
            )}

            <Button
              onClick={() => handleAdd(query)}
              disabled={isSubmitting || !query.trim()}
              className="w-full h-12 rounded-xl text-[15px] font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till {query.trim() && `"${query.trim()}"`}
            </Button>
          </div>

          {/* Browse by category */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground px-1 pt-2">
              Eller välj från lista
            </p>
            {Object.entries(DIAGNOSIS_GROUPS).map(([groupName, items]) => {
              const isOpen = openGroup === groupName;
              const available = items.filter((n) => !existingNames.includes(n.toLowerCase()));
              return (
                <div
                  key={groupName}
                  className="rounded-2xl bg-card ring-1 ring-border/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isOpen ? null : groupName)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-[15px] font-medium">{groupName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{available.length}</span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-muted-foreground transition-transform',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2">
                      {available.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-1 py-2">
                          Alla i denna kategori är redan tillagda.
                        </p>
                      ) : (
                        available.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleAdd(name)}
                            disabled={isSubmitting}
                            className="px-3 py-2 rounded-full text-sm bg-muted/40 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Confirm remove */}
      <AlertDialog open={!!pendingRemoveId} onOpenChange={(o) => !o && setPendingRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort diagnos?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDiagnosis?.name} kommer att tas bort från din profil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingRemoveId) {
                  setIsSubmitting(true);
                  await removeDiagnosis(pendingRemoveId);
                  setIsSubmitting(false);
                  setPendingRemoveId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

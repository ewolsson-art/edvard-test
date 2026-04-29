import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  ArrowLeft, Calendar, AlertTriangle, ChevronRight, Pill, FlaskConical, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMedications } from '@/hooks/useMedications';
import {
  FREQUENCY_LABELS,
  EFFECTIVENESS_COLORS,
  EFFECTIVENESS_LABELS,
  Medication,
} from '@/types/medication';

type CategorySlug = 'regelbundet' | 'vid-behov' | 'slutat';

const CATEGORY_META: Record<CategorySlug, {
  emoji: string;
  title: string;
  subtitle: string;
  emptyText: string;
  emptyHint: string;
  accent: 'default' | 'amber' | 'muted';
  ringClass: string;
}> = {
  'regelbundet': {
    emoji: '🕒',
    title: 'Tar regelbundet',
    subtitle: 'Mediciner du tar dagligen eller på schema.',
    emptyText: 'Inga regelbundna mediciner ännu',
    emptyHint: 'Lägg till de mediciner du tar varje dag.',
    accent: 'default',
    ringClass: 'from-primary/15 to-primary/5 ring-primary/30',
  },
  'vid-behov': {
    emoji: '⛑️',
    title: 'Vid behov',
    subtitle: 'Mediciner du tar när besvär uppstår.',
    emptyText: 'Inga vid behov-mediciner ännu',
    emptyHint: 'Lägg till de mediciner du tar vid besvär.',
    accent: 'amber',
    ringClass: 'from-amber-500/15 to-amber-500/5 ring-amber-500/30',
  },
  'slutat': {
    emoji: '🗂️',
    title: 'Slutat ta',
    subtitle: 'Tidigare provade mediciner och deras erfarenheter.',
    emptyText: 'Inget tidigare testat ännu',
    emptyHint: 'Mediciner du slutat med dyker upp här.',
    accent: 'muted',
    ringClass: 'from-foreground/[0.08] to-foreground/[0.02] ring-foreground/15',
  },
};

const MedicationCategory = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const slug = (category as CategorySlug) ?? 'regelbundet';
  const meta = CATEGORY_META[slug] ?? CATEGORY_META['regelbundet'];

  const {
    isLoaded, currentMedications, asNeededMedications, previousMedications,
  } = useMedications();

  const meds = useMemo<Medication[]>(() => {
    if (slug === 'regelbundet') return currentMedications;
    if (slug === 'vid-behov') return asNeededMedications;
    if (slug === 'slutat') return previousMedications;
    return [];
  }, [slug, currentMedications, asNeededMedications, previousMedications]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const openMed = (id: string) => navigate(`/mediciner?open=${id}`);

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-2xl mx-auto md:mx-0 px-5 md:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/mediciner')}
            className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Tillbaka"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-semibold tracking-tight">{meta.title}</h1>
        </div>
      </header>

      <div className="p-5 md:p-8">
        <div className="max-w-2xl mx-auto md:mx-0 space-y-6">
          <section className={`rounded-2xl p-5 bg-gradient-to-br ${meta.ringClass.split(' ').slice(0,2).join(' ')} ring-1 ${meta.ringClass.split(' ').slice(2).join(' ')}`}>
            <div className="flex items-center gap-3">
              <span className="text-[28px] leading-none" aria-hidden="true">{meta.emoji}</span>
              <div>
                <p className="text-[26px] font-display font-semibold leading-none text-foreground/95">{meds.length}</p>
                <p className="text-[12px] text-foreground/50 mt-1">{meta.subtitle}</p>
              </div>
            </div>
          </section>

          {meds.length === 0 ? (
            <div className="rounded-2xl bg-foreground/[0.03] backdrop-blur-sm py-10 text-center">
              <div className="flex justify-center mb-3">
                <Pill className="h-8 w-8 text-foreground/20" />
              </div>
              <p className="text-[14px] font-medium text-foreground/60">{meta.emptyText}</p>
              <p className="text-[13px] text-foreground/30 mt-1 px-6">{meta.emptyHint}</p>
              <Button
                onClick={() => navigate('/mediciner?add=1')}
                className="mt-5 gap-2 rounded-full"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Lägg till medicin
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Button
                onClick={() => navigate('/mediciner?add=1')}
                className="w-full gap-2 rounded-full"
              >
                <Plus className="h-4 w-4" />
                Lägg till medicin
              </Button>
              {groupByEffectiveness(meds).map(group => (
                group.meds.length === 0 ? null : (
                  <section key={group.key} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${group.dotClass}`} aria-hidden="true" />
                      <h3 className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider">
                        {group.label}
                      </h3>
                      <span className="text-[12px] text-foreground/35">{group.meds.length}</span>
                    </div>
                    <div className="space-y-2">
                      {group.meds.map(med => (
                        <MedRow key={med.id} med={med} accent={meta.accent} onClick={() => openMed(med.id)} />
                      ))}
                    </div>
                  </section>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function MedRow({ med, onClick, accent }: { med: Medication; onClick: () => void; accent: 'default' | 'amber' | 'muted' }) {
  const sideEffectsCount = med.side_effects?.length ?? 0;
  const effectiveness = med.effectiveness;
  const opacityClass = accent === 'muted' ? 'opacity-80 hover:opacity-100' : '';
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
                <span>{EFFECTIVENESS_LABELS[effectiveness]}</span>
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

type EffGroup = {
  key: 'good' | 'bad' | 'unclear';
  label: string;
  dotClass: string;
  meds: Medication[];
};

function groupByEffectiveness(meds: Medication[]): EffGroup[] {
  const good: Medication[] = [];
  const bad: Medication[] = [];
  const unclear: Medication[] = [];
  for (const m of meds) {
    const e = m.effectiveness;
    if (e === 'works_well' || e === 'works_partially') good.push(m);
    else if (e === 'no_effect' || e === 'made_worse') bad.push(m);
    else unclear.push(m);
  }
  return [
    { key: 'good', label: 'Fungerade bra', dotClass: 'bg-emerald-500', meds: good },
    { key: 'bad', label: 'Fungerade dåligt', dotClass: 'bg-red-500', meds: bad },
    { key: 'unclear', label: 'Oklart resultat', dotClass: 'bg-foreground/30', meds: unclear },
  ];
}

export default MedicationCategory;

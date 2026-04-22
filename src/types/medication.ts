export type MedicationFrequency = 
  | 'daily' 
  | 'twice_daily' 
  | 'three_times_daily' 
  | 'weekly' 
  | 'as_needed' 
  | 'other';

export const FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  daily: 'En gång dagligen',
  twice_daily: 'Två gånger dagligen',
  three_times_daily: 'Tre gånger dagligen',
  weekly: 'En gång i veckan',
  as_needed: 'Vid behov',
  other: 'Annan',
};

export type MedicationStatus = 'current' | 'previous' | 'paused';

export const STATUS_LABELS: Record<MedicationStatus, string> = {
  current: 'Tar nu',
  previous: 'Har testat',
  paused: 'Pausad',
};

export type MedicationEffectiveness =
  | 'works_well'
  | 'works_partially'
  | 'no_effect'
  | 'made_worse'
  | 'too_early';

export const EFFECTIVENESS_LABELS: Record<MedicationEffectiveness, string> = {
  works_well: 'Fungerar bra',
  works_partially: 'Fungerar delvis',
  no_effect: 'Ingen effekt',
  made_worse: 'Blev sämre',
  too_early: 'För tidigt att säga',
};

export const EFFECTIVENESS_COLORS: Record<MedicationEffectiveness, string> = {
  works_well: 'text-green-500 bg-green-500/10 border-green-500/30',
  works_partially: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  no_effect: 'text-muted-foreground bg-muted border-border',
  made_worse: 'text-red-500 bg-red-500/10 border-red-500/30',
  too_early: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
};

// Common side effects for quick selection
export const COMMON_SIDE_EFFECTS = [
  'Trötthet',
  'Illamående',
  'Yrsel',
  'Huvudvärk',
  'Muntorrhet',
  'Viktuppgång',
  'Viktnedgång',
  'Sömnsvårigheter',
  'Sömnighet',
  'Skakningar',
  'Sexuella problem',
  'Magbesvär',
  'Förstoppning',
  'Diarré',
  'Hjärtklappning',
  'Svettningar',
  'Hudutslag',
  'Koncentrationsproblem',
  'Känslomässig avtrubbning',
  'Ångest',
  'Rastlöshet',
];

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  started_at: string; // Date string YYYY-MM-DD
  active: boolean;
  status: MedicationStatus;
  stopped_at: string | null;
  stop_reason: string | null;
  side_effects: string[];
  effectiveness: MedicationEffectiveness | null;
  notes: string | null;
  is_trial: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_id: string;
  date: string;
  taken: boolean;
  created_at: string;
}

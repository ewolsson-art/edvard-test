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

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  started_at: string; // Date string YYYY-MM-DD
  active: boolean;
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

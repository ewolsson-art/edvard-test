export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
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

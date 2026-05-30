// Thin hook over diagnosis configuration. Static data lives in
// src/data/diagnosisConfig.ts (K-6 — split for tree-shaking and clarity).
import { useDiagnoses } from './useDiagnoses';
import { MoodType } from '@/types/mood';
import { useMemo } from 'react';
import {
  DIAGNOSIS_LABELS,
  MOOD_LABELS_BY_TYPE,
  MOOD_SUBLABELS_BY_TYPE,
  detectDiagnosisType,
  getMoodTagsForType,
  type DiagnosisType,
  type TagOption,
} from '@/data/diagnosisConfig';

export type { DiagnosisType };

export interface DiagnosisConfig {
  diagnosisType: DiagnosisType;
  diagnosisLabel: string;
  moodLabels: Record<MoodType, string>;
  moodSublabels: Record<MoodType, string>;
  moodTags: Record<MoodType, TagOption[]>;
}

export function getDiagnosisConfig(diagnoses: { name: string }[]): DiagnosisConfig {
  const diagnosisType = detectDiagnosisType(diagnoses);
  return {
    diagnosisType,
    diagnosisLabel: DIAGNOSIS_LABELS[diagnosisType],
    moodLabels: MOOD_LABELS_BY_TYPE[diagnosisType],
    moodSublabels: MOOD_SUBLABELS_BY_TYPE[diagnosisType],
    moodTags: getMoodTagsForType(diagnosisType),
  };
}

export const useDiagnosisConfig = () => {
  const { diagnoses, isLoading } = useDiagnoses();
  const config = useMemo(() => getDiagnosisConfig(diagnoses), [diagnoses]);
  return { ...config, isLoading, diagnoses };
};

// For components that receive diagnoses directly (e.g. relative/doctor views).
export function getPatientDiagnosisConfig(diagnoses: { name: string }[]): DiagnosisConfig {
  return getDiagnosisConfig(diagnoses);
}


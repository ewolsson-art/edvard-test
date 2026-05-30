// K-13: smoke tests for pure utilities. Not full coverage, but catches
// regressions in the data layer that the bipolar UI relies on.
import { describe, it, expect } from 'vitest';
import {
  detectDiagnosisType,
  getMoodTagsForType,
  MOOD_LABELS_BY_TYPE,
  DIAGNOSIS_LABELS,
} from '@/data/diagnosisConfig';

describe('diagnosisConfig', () => {
  it('detects bipolar type 1 from Swedish name', () => {
    expect(detectDiagnosisType([{ name: 'Bipolär sjukdom typ 1' }])).toBe('bipolar_1');
  });

  it('detects bipolar type 2 from Swedish name', () => {
    expect(detectDiagnosisType([{ name: 'Bipolär sjukdom typ 2' }])).toBe('bipolar_2');
  });

  it('detects cyklotymi', () => {
    expect(detectDiagnosisType([{ name: 'Cyklotymi' }])).toBe('cyclothymia');
  });

  it('detects depression', () => {
    expect(detectDiagnosisType([{ name: 'Egentlig depression' }])).toBe('depression');
  });

  it('falls back to general for unknown diagnoses', () => {
    expect(detectDiagnosisType([{ name: 'ADHD' }])).toBe('general');
    expect(detectDiagnosisType([])).toBe('general');
  });

  it('depression label set differs from bipolar (uses "Mycket bra" for elevated)', () => {
    expect(MOOD_LABELS_BY_TYPE.depression.severe_elevated).toBe('Mycket bra');
    expect(MOOD_LABELS_BY_TYPE.bipolar_1.severe_elevated).toBe('Svårt uppvarvad');
  });

  it('provides all 7 mood levels for every diagnosis', () => {
    const levels = ['severe_elevated', 'elevated', 'somewhat_elevated', 'stable',
      'somewhat_depressed', 'depressed', 'severe_depressed'] as const;
    for (const dx of Object.keys(DIAGNOSIS_LABELS) as Array<keyof typeof DIAGNOSIS_LABELS>) {
      const tags = getMoodTagsForType(dx);
      for (const level of levels) {
        expect(tags[level], `${dx}/${level}`).toBeDefined();
      }
    }
  });

  it('elevated tags are populated for all diagnoses (depression uses positive variants)', () => {
    for (const dx of Object.keys(DIAGNOSIS_LABELS) as Array<keyof typeof DIAGNOSIS_LABELS>) {
      const tags = getMoodTagsForType(dx);
      expect(tags.severe_elevated.length).toBeGreaterThan(0);
      expect(tags.elevated.length).toBeGreaterThan(0);
      expect(tags.somewhat_elevated.length).toBeGreaterThan(0);
    }
  });
});

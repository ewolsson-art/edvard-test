import { useDiagnoses } from './useDiagnoses';
import { MoodType } from '@/types/mood';
import { useMemo } from 'react';

export type DiagnosisType = 'bipolar_1' | 'bipolar_2' | 'cyclothymia' | 'depression' | 'general';

interface MoodConfig {
  label: string;
  sublabel: string;
}

interface TagOption {
  value: string;
  label: string;
  emoji: string;
}

export interface DiagnosisConfig {
  diagnosisType: DiagnosisType;
  diagnosisLabel: string;
  moodLabels: Record<MoodType, string>;
  moodSublabels: Record<MoodType, string>;
  moodTags: Record<MoodType, TagOption[]>;
}

function detectDiagnosisType(diagnoses: { name: string }[]): DiagnosisType {
  const names = diagnoses.map(d => d.name.toLowerCase());
  
  if (names.some(n => n.includes('typ 1') || n.includes('type 1') || n.includes('bipolar i') || n === 'bipolär sjukdom typ 1')) {
    return 'bipolar_1';
  }
  if (names.some(n => n.includes('typ 2') || n.includes('type 2') || n.includes('bipolar ii') || n === 'bipolär sjukdom typ 2')) {
    return 'bipolar_2';
  }
  if (names.some(n => n.includes('cyklotymi') || n.includes('cyclothymi'))) {
    return 'cyclothymia';
  }
  if (names.some(n => n.includes('depression') || n.includes('depressiv'))) {
    return 'depression';
  }
  if (names.some(n => n.includes('bipolär') || n.includes('bipolar'))) {
    return 'bipolar_1'; // Default bipolar to type 1
  }
  return 'general';
}

const DIAGNOSIS_LABELS: Record<DiagnosisType, string> = {
  bipolar_1: 'Bipolär typ 1',
  bipolar_2: 'Bipolär typ 2',
  cyclothymia: 'Cyklotymi',
  depression: 'Depression',
  general: 'Allmän',
};

function getMoodLabels(type: DiagnosisType): Record<MoodType, string> {
  switch (type) {
    case 'bipolar_1':
      return {
        elevated: 'Mani',
        somewhat_elevated: 'Hypomani',
        stable: 'Stabil',
        somewhat_depressed: 'Låg',
        depressed: 'Depression',
      };
    case 'bipolar_2':
      return {
        elevated: 'Hypomani',
        somewhat_elevated: 'Lätt förhöjt',
        stable: 'Stabil',
        somewhat_depressed: 'Låg',
        depressed: 'Depression',
      };
    case 'cyclothymia':
      return {
        elevated: 'Förhöjt',
        somewhat_elevated: 'Lätt förhöjt',
        stable: 'Stabil',
        somewhat_depressed: 'Låg',
        depressed: 'Mycket låg',
      };
    case 'depression':
      return {
        elevated: 'Mycket bra',
        somewhat_elevated: 'Bra',
        stable: 'Stabil',
        somewhat_depressed: 'Låg',
        depressed: 'Mycket låg',
      };
    default:
      return {
        elevated: 'Mycket upp',
        somewhat_elevated: 'Upp',
        stable: 'Stabil',
        somewhat_depressed: 'Låg',
        depressed: 'Mycket låg',
      };
  }
}

function getMoodSublabels(type: DiagnosisType): Record<MoodType, string> {
  switch (type) {
    case 'bipolar_1':
      return {
        elevated: 'Grandiositet, riskbeteende, sömnlöshet',
        somewhat_elevated: 'Energisk, rastlös, pratglad',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Tung, trött, orolig',
        depressed: 'Hopplöshet, tomhet, energilös',
      };
    case 'bipolar_2':
      return {
        elevated: 'Produktiv, rastlös, pratglad',
        somewhat_elevated: 'Energisk, positiv, kreativ',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Tung, trött, orolig',
        depressed: 'Hopplöshet, tomhet, energilös',
      };
    case 'cyclothymia':
      return {
        elevated: 'Energisk, rastlös',
        somewhat_elevated: 'Positiv, aktiv',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Tung, trött',
        depressed: 'Väldigt tungt idag',
      };
    case 'depression':
      return {
        elevated: 'Energisk, glad, motiverad',
        somewhat_elevated: 'Positiv, aktiv',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Tung, trött, orolig',
        depressed: 'Hopplöshet, tomhet, energilös',
      };
    default:
      return {
        elevated: 'Rastlös, racing thoughts',
        somewhat_elevated: 'Energisk, positiv',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Tung, trött',
        depressed: 'Väldigt tungt idag',
      };
  }
}

function getMoodTags(type: DiagnosisType): Record<MoodType, TagOption[]> {
  const baseTags: Record<MoodType, TagOption[]> = {
    elevated: [],
    somewhat_elevated: [],
    stable: [
      { value: 'lugn', label: 'Lugn', emoji: '🧘' },
      { value: 'fokuserad', label: 'Fokuserad', emoji: '🎯' },
      { value: 'tacksam', label: 'Tacksam', emoji: '🙏' },
      { value: 'nöjd', label: 'Nöjd', emoji: '😊' },
      { value: 'balanserad', label: 'Balanserad', emoji: '⚖️' },
      { value: 'social', label: 'Social', emoji: '👥' },
      { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
      { value: 'trött', label: 'Trött', emoji: '😴' },
      { value: 'stress', label: 'Stress', emoji: '😓' },
      { value: 'ångest', label: 'Ångest', emoji: '😰' },
    ],
    somewhat_depressed: [
      { value: 'trött', label: 'Trött', emoji: '😴' },
      { value: 'ångest', label: 'Ångest', emoji: '😰' },
      { value: 'orolig', label: 'Orolig', emoji: '😟' },
      { value: 'koncentrationssvårigheter', label: 'Fokussvårt', emoji: '🧠' },
      { value: 'social tillbakadragning', label: 'Isolerar mig', emoji: '🚪' },
      { value: 'gråtmild', label: 'Gråtmild', emoji: '😢' },
      { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
      { value: 'aptitförändringar', label: 'Aptitlös', emoji: '🍽️' },
      { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
      { value: 'energilös', label: 'Energilös', emoji: '🪫' },
    ],
    depressed: [
      { value: 'hopplöshet', label: 'Hopplös', emoji: '🌑' },
      { value: 'tomhet', label: 'Tom inuti', emoji: '🫥' },
      { value: 'ångest', label: 'Ångest', emoji: '😰' },
      { value: 'gråtmild', label: 'Gråtmild', emoji: '😢' },
      { value: 'social tillbakadragning', label: 'Isolerar mig', emoji: '🚪' },
      { value: 'skuldkänslor', label: 'Skuldkänslor', emoji: '😞' },
      { value: 'värdelöshet', label: 'Värdelös', emoji: '💔' },
      { value: 'koncentrationssvårigheter', label: 'Fokussvårt', emoji: '🧠' },
      { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
      { value: 'energilös', label: 'Orkar inte', emoji: '🪫' },
    ],
  };

  switch (type) {
    case 'bipolar_1':
      baseTags.elevated = [
        { value: 'grandiositet', label: 'Grandiositet', emoji: '👑' },
        { value: 'racing thoughts', label: 'Racing thoughts', emoji: '💭' },
        { value: 'sömnlöshet', label: 'Sömnlöshet', emoji: '🌙' },
        { value: 'riskbeteende', label: 'Riskbeteende', emoji: '⚠️' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
        { value: 'eufori', label: 'Euforisk', emoji: '✨' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'storslagna planer', label: 'Storslagna planer', emoji: '🏔️' },
        { value: 'pratar mycket', label: 'Pratar mycket', emoji: '🗣️' },
        { value: 'spenderar mycket', label: 'Spenderar mycket', emoji: '💸' },
      ];
      baseTags.somewhat_elevated = [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
        { value: 'otålig', label: 'Otålig', emoji: '⏳' },
        { value: 'stress', label: 'Stress', emoji: '😓' },
      ];
      break;

    case 'bipolar_2':
      baseTags.elevated = [
        { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'pratar mycket', label: 'Pratglad', emoji: '🗣️' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'sömnsvårigheter', label: 'Sover mindre', emoji: '🌙' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'otålig', label: 'Otålig', emoji: '⏳' },
      ];
      baseTags.somewhat_elevated = [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'positiv', label: 'Positiv', emoji: '😊' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'stress', label: 'Stress', emoji: '😓' },
        { value: 'otålig', label: 'Otålig', emoji: '⏳' },
        { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
        { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
      ];
      break;

    case 'cyclothymia':
      baseTags.elevated = [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'otålig', label: 'Otålig', emoji: '⏳' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
      ];
      baseTags.somewhat_elevated = [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'positiv', label: 'Positiv', emoji: '😊' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
      ];
      break;

    case 'depression':
      baseTags.elevated = [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'glad', label: 'Glad', emoji: '😄' },
        { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'tacksam', label: 'Tacksam', emoji: '🙏' },
      ];
      baseTags.somewhat_elevated = [
        { value: 'positiv', label: 'Positiv', emoji: '😊' },
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'lugn', label: 'Lugn', emoji: '🧘' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
      ];
      break;

    default:
      // General - use existing tags
      baseTags.elevated = [
        { value: 'racing thoughts', label: 'Racing thoughts', emoji: '💭' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
        { value: 'eufori', label: 'Euforisk', emoji: '✨' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'sömnsvårigheter', label: 'Sover lite', emoji: '🌙' },
        { value: 'storslagna planer', label: 'Storslagna planer', emoji: '🏔️' },
        { value: 'pratar mycket', label: 'Pratar mycket', emoji: '🗣️' },
        { value: 'spenderar mycket', label: 'Spenderar mycket', emoji: '💸' },
        { value: 'distraherbar', label: 'Distraherbar', emoji: '🦋' },
      ];
      baseTags.somewhat_elevated = [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
        { value: 'stress', label: 'Stress', emoji: '😓' },
        { value: 'otålig', label: 'Otålig', emoji: '⏳' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
      ];
      break;
  }

  return baseTags;
}

export function getDiagnosisConfig(diagnoses: { name: string }[]): DiagnosisConfig {
  const diagnosisType = detectDiagnosisType(diagnoses);
  return {
    diagnosisType,
    diagnosisLabel: DIAGNOSIS_LABELS[diagnosisType],
    moodLabels: getMoodLabels(diagnosisType),
    moodSublabels: getMoodSublabels(diagnosisType),
    moodTags: getMoodTags(diagnosisType),
  };
}

export const useDiagnosisConfig = () => {
  const { diagnoses, isLoading } = useDiagnoses();

  const config = useMemo(() => {
    return getDiagnosisConfig(diagnoses);
  }, [diagnoses]);

  return {
    ...config,
    isLoading,
    diagnoses,
  };
};

// For use in components that receive a patient ID
export function getPatientDiagnosisConfig(diagnoses: { name: string }[]): DiagnosisConfig {
  return getDiagnosisConfig(diagnoses);
}

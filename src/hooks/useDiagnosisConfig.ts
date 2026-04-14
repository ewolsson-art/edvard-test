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
    return 'bipolar_1';
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
        severe_elevated: 'Svårt uppvarvad',
        elevated: 'Måttligt uppvarvad',
        somewhat_elevated: 'Lindrigt uppvarvad',
        stable: 'Normalt stämningsläge',
        somewhat_depressed: 'Lindrig nedstämdhet',
        depressed: 'Måttlig nedstämdhet',
        severe_depressed: 'Svår nedstämdhet',
      };
    case 'bipolar_2':
      return {
        severe_elevated: 'Svårt uppvarvad',
        elevated: 'Måttligt uppvarvad',
        somewhat_elevated: 'Lindrigt uppvarvad',
        stable: 'Normalt stämningsläge',
        somewhat_depressed: 'Lindrig nedstämdhet',
        depressed: 'Måttlig nedstämdhet',
        severe_depressed: 'Svår nedstämdhet',
      };
    case 'cyclothymia':
      return {
        severe_elevated: 'Svårt uppvarvad',
        elevated: 'Måttligt uppvarvad',
        somewhat_elevated: 'Lindrigt uppvarvad',
        stable: 'Normalt stämningsläge',
        somewhat_depressed: 'Lindrig nedstämdhet',
        depressed: 'Måttlig nedstämdhet',
        severe_depressed: 'Svår nedstämdhet',
      };
    case 'depression':
      return {
        severe_elevated: 'Mycket bra',
        elevated: 'Bra',
        somewhat_elevated: 'Lite bättre',
        stable: 'Normalt stämningsläge',
        somewhat_depressed: 'Lindrig nedstämdhet',
        depressed: 'Måttlig nedstämdhet',
        severe_depressed: 'Svår nedstämdhet',
      };
    default:
      return {
        severe_elevated: 'Svårt uppvarvad',
        elevated: 'Måttligt uppvarvad',
        somewhat_elevated: 'Lindrigt uppvarvad',
        stable: 'Normalt stämningsläge',
        somewhat_depressed: 'Lindrig nedstämdhet',
        depressed: 'Måttlig nedstämdhet',
        severe_depressed: 'Svår nedstämdhet',
      };
  }
}

function getMoodSublabels(type: DiagnosisType): Record<MoodType, string> {
  switch (type) {
    case 'bipolar_1':
      return {
        severe_elevated: 'Kraftig påverkan på livsföringen',
        elevated: 'Viss påverkan på livsföringen',
        somewhat_elevated: 'Ingen påverkan på livsföringen',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Ingen påverkan på livsföringen',
        depressed: 'Viss påverkan på livsföringen',
        severe_depressed: 'Kraftig påverkan på livsföringen',
      };
    case 'bipolar_2':
      return {
        severe_elevated: 'Kraftig påverkan på livsföringen',
        elevated: 'Viss påverkan på livsföringen',
        somewhat_elevated: 'Ingen påverkan på livsföringen',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Ingen påverkan på livsföringen',
        depressed: 'Viss påverkan på livsföringen',
        severe_depressed: 'Kraftig påverkan på livsföringen',
      };
    case 'cyclothymia':
      return {
        severe_elevated: 'Kraftig påverkan på livsföringen',
        elevated: 'Viss påverkan på livsföringen',
        somewhat_elevated: 'Ingen påverkan på livsföringen',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Ingen påverkan på livsföringen',
        depressed: 'Viss påverkan på livsföringen',
        severe_depressed: 'Kraftig påverkan på livsföringen',
      };
    case 'depression':
      return {
        severe_elevated: 'Mycket energisk och glad',
        elevated: 'Positiv och aktiv',
        somewhat_elevated: 'Lite bättre än vanligt',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Ingen påverkan på livsföringen',
        depressed: 'Viss påverkan på livsföringen',
        severe_depressed: 'Kraftig påverkan på livsföringen',
      };
    default:
      return {
        severe_elevated: 'Kraftig påverkan på livsföringen',
        elevated: 'Viss påverkan på livsföringen',
        somewhat_elevated: 'Ingen påverkan på livsföringen',
        stable: 'Balanserad, lugn',
        somewhat_depressed: 'Ingen påverkan på livsföringen',
        depressed: 'Viss påverkan på livsföringen',
        severe_depressed: 'Kraftig påverkan på livsföringen',
      };
  }
}

function getMoodTags(type: DiagnosisType): Record<MoodType, TagOption[]> {
  const baseTags: Record<MoodType, TagOption[]> = {
    severe_elevated: [],
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
    severe_depressed: [
      { value: 'hopplöshet', label: 'Hopplös', emoji: '🌑' },
      { value: 'tomhet', label: 'Tom inuti', emoji: '🫥' },
      { value: 'ångest', label: 'Svår ångest', emoji: '😰' },
      { value: 'suicidtankar', label: 'Mörka tankar', emoji: '🆘' },
      { value: 'social tillbakadragning', label: 'Helt isolerad', emoji: '🚪' },
      { value: 'värdelöshet', label: 'Värdelös', emoji: '💔' },
      { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
      { value: 'energilös', label: 'Orkar ingenting', emoji: '🪫' },
      { value: 'självskada', label: 'Självskada', emoji: '⚠️' },
      { value: 'psykomotorisk hämning', label: 'Kan inte röra mig', emoji: '🧊' },
    ],
  };

  const elevatedTags: Record<string, { severe: TagOption[]; moderate: TagOption[]; mild: TagOption[] }> = {
    bipolar_1: {
      severe: [
        { value: 'grandiositet', label: 'Grandiositet', emoji: '👑' },
        { value: 'psykos', label: 'Psykotiska symtom', emoji: '🌀' },
        { value: 'sömnlöshet', label: 'Sömnlöshet', emoji: '🌙' },
        { value: 'riskbeteende', label: 'Riskbeteende', emoji: '⚠️' },
        { value: 'impulsivitet', label: 'Extremt impulsiv', emoji: '⚡' },
        { value: 'eufori', label: 'Euforisk', emoji: '✨' },
        { value: 'irritabilitet', label: 'Mycket irriterad', emoji: '😤' },
        { value: 'storslagna planer', label: 'Storslagna planer', emoji: '🏔️' },
        { value: 'spenderar mycket', label: 'Spenderar okontrollerat', emoji: '💸' },
        { value: 'agitation', label: 'Agiterad', emoji: '🔥' },
      ],
      moderate: [
        { value: 'racing thoughts', label: 'Racing thoughts', emoji: '💭' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
        { value: 'eufori', label: 'Euforisk', emoji: '✨' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'sömnsvårigheter', label: 'Sover lite', emoji: '🌙' },
        { value: 'pratar mycket', label: 'Pratar mycket', emoji: '🗣️' },
        { value: 'spenderar mycket', label: 'Spenderar mycket', emoji: '💸' },
        { value: 'storslagna planer', label: 'Storslagna planer', emoji: '🏔️' },
        { value: 'social', label: 'Hypersocial', emoji: '👥' },
      ],
      mild: [
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
      ],
    },
    bipolar_2: {
      severe: [
        { value: 'produktiv', label: 'Extremt produktiv', emoji: '🚀' },
        { value: 'rastlöshet', label: 'Mycket rastlös', emoji: '🦶' },
        { value: 'pratar mycket', label: 'Pratglad', emoji: '🗣️' },
        { value: 'sömnsvårigheter', label: 'Sover mycket lite', emoji: '🌙' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'riskbeteende', label: 'Riskbeteende', emoji: '⚠️' },
        { value: 'spenderar mycket', label: 'Spenderar mycket', emoji: '💸' },
        { value: 'racing thoughts', label: 'Racing thoughts', emoji: '💭' },
        { value: 'agitation', label: 'Agiterad', emoji: '🔥' },
      ],
      moderate: [
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
      ],
      mild: [
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
      ],
    },
    cyclothymia: {
      severe: [
        { value: 'energisk', label: 'Mycket energisk', emoji: '🔋' },
        { value: 'rastlöshet', label: 'Mycket rastlös', emoji: '🦶' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'sömnsvårigheter', label: 'Sover lite', emoji: '🌙' },
        { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
        { value: 'social', label: 'Hypersocial', emoji: '👥' },
        { value: 'otålig', label: 'Otålig', emoji: '⏳' },
      ],
      moderate: [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
        { value: 'produktiv', label: 'Produktiv', emoji: '🚀' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
        { value: 'otålig', label: 'Otålig', emoji: '⏳' },
        { value: 'impulsivitet', label: 'Impulsiv', emoji: '⚡' },
      ],
      mild: [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'positiv', label: 'Positiv', emoji: '😊' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
        { value: 'rastlöshet', label: 'Rastlös', emoji: '🦶' },
      ],
    },
    depression: {
      severe: [
        { value: 'energisk', label: 'Mycket energisk', emoji: '🔋' },
        { value: 'glad', label: 'Mycket glad', emoji: '😄' },
        { value: 'motiverad', label: 'Supermotiverad', emoji: '💪' },
        { value: 'social', label: 'Hypersocial', emoji: '👥' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'tacksam', label: 'Tacksam', emoji: '🙏' },
      ],
      moderate: [
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'glad', label: 'Glad', emoji: '😄' },
        { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
        { value: 'tacksam', label: 'Tacksam', emoji: '🙏' },
      ],
      mild: [
        { value: 'positiv', label: 'Positiv', emoji: '😊' },
        { value: 'energisk', label: 'Energisk', emoji: '🔋' },
        { value: 'motiverad', label: 'Motiverad', emoji: '💪' },
        { value: 'social', label: 'Social', emoji: '👥' },
        { value: 'lugn', label: 'Lugn', emoji: '🧘' },
        { value: 'kreativ', label: 'Kreativ', emoji: '🎨' },
      ],
    },
    general: {
      severe: [
        { value: 'racing thoughts', label: 'Racing thoughts', emoji: '💭' },
        { value: 'rastlöshet', label: 'Mycket rastlös', emoji: '🦶' },
        { value: 'impulsivitet', label: 'Extremt impulsiv', emoji: '⚡' },
        { value: 'eufori', label: 'Euforisk', emoji: '✨' },
        { value: 'irritabilitet', label: 'Mycket irriterad', emoji: '😤' },
        { value: 'sömnsvårigheter', label: 'Sömnlöshet', emoji: '🌙' },
        { value: 'storslagna planer', label: 'Storslagna planer', emoji: '🏔️' },
        { value: 'pratar mycket', label: 'Pratar mycket', emoji: '🗣️' },
        { value: 'spenderar mycket', label: 'Spenderar mycket', emoji: '💸' },
        { value: 'riskbeteende', label: 'Riskbeteende', emoji: '⚠️' },
      ],
      moderate: [
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
      ],
      mild: [
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
      ],
    },
  };

  const tags = elevatedTags[type] || elevatedTags.general;
  baseTags.severe_elevated = tags.severe;
  baseTags.elevated = tags.moderate;
  baseTags.somewhat_elevated = tags.mild;

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

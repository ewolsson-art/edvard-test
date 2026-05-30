// Static configuration data for diagnosis-aware UI.
// Extracted from useDiagnosisConfig.ts (K-6) — keep this file pure data only.
// See mem://medical/bipolar-symptoms for clinical rationale.
import { MoodType } from '@/types/mood';

export type DiagnosisType = 'bipolar_1' | 'bipolar_2' | 'cyclothymia' | 'depression' | 'general';

export interface TagOption {
  value: string;
  label: string;
  emoji: string;
}

export const DIAGNOSIS_LABELS: Record<DiagnosisType, string> = {
  bipolar_1: 'Bipolär typ 1',
  bipolar_2: 'Bipolär typ 2',
  cyclothymia: 'Cyklotymi',
  depression: 'Depression',
  general: 'Allmän',
};

export function detectDiagnosisType(diagnoses: { name: string }[]): DiagnosisType {
  const names = diagnoses.map(d => d.name.toLowerCase());
  if (names.some(n => n.includes('typ 1') || n.includes('type 1') || n.includes('bipolar i') || n === 'bipolär sjukdom typ 1')) return 'bipolar_1';
  if (names.some(n => n.includes('typ 2') || n.includes('type 2') || n.includes('bipolar ii') || n === 'bipolär sjukdom typ 2')) return 'bipolar_2';
  if (names.some(n => n.includes('cyklotymi') || n.includes('cyclothymi'))) return 'cyclothymia';
  if (names.some(n => n.includes('depression') || n.includes('depressiv'))) return 'depression';
  if (names.some(n => n.includes('bipolär') || n.includes('bipolar'))) return 'bipolar_1';
  return 'general';
}

const STANDARD_MOOD_LABELS: Record<MoodType, string> = {
  severe_elevated: 'Svårt uppvarvad',
  elevated: 'Måttligt uppvarvad',
  somewhat_elevated: 'Lindrigt uppvarvad',
  stable: 'Normalt stämningsläge',
  somewhat_depressed: 'Lindrig nedstämdhet',
  depressed: 'Måttlig nedstämdhet',
  severe_depressed: 'Svår nedstämdhet',
};

const DEPRESSION_MOOD_LABELS: Record<MoodType, string> = {
  ...STANDARD_MOOD_LABELS,
  severe_elevated: 'Mycket bra',
  elevated: 'Bra',
  somewhat_elevated: 'Lite bättre',
};

export const MOOD_LABELS_BY_TYPE: Record<DiagnosisType, Record<MoodType, string>> = {
  bipolar_1: STANDARD_MOOD_LABELS,
  bipolar_2: STANDARD_MOOD_LABELS,
  cyclothymia: STANDARD_MOOD_LABELS,
  depression: DEPRESSION_MOOD_LABELS,
  general: STANDARD_MOOD_LABELS,
};

const STANDARD_SUBLABELS: Record<MoodType, string> = {
  severe_elevated: 'Kraftig påverkan på livsföringen',
  elevated: 'Viss påverkan på livsföringen',
  somewhat_elevated: 'Ingen påverkan på livsföringen',
  stable: 'Balanserad, lugn',
  somewhat_depressed: 'Ingen påverkan på livsföringen',
  depressed: 'Viss påverkan på livsföringen',
  severe_depressed: 'Kraftig påverkan på livsföringen',
};

const DEPRESSION_SUBLABELS: Record<MoodType, string> = {
  ...STANDARD_SUBLABELS,
  severe_elevated: 'Mycket energisk och glad',
  elevated: 'Positiv och aktiv',
  somewhat_elevated: 'Lite bättre än vanligt',
};

export const MOOD_SUBLABELS_BY_TYPE: Record<DiagnosisType, Record<MoodType, string>> = {
  bipolar_1: STANDARD_SUBLABELS,
  bipolar_2: STANDARD_SUBLABELS,
  cyclothymia: STANDARD_SUBLABELS,
  depression: DEPRESSION_SUBLABELS,
  general: STANDARD_SUBLABELS,
};

export const BASE_DEPRESSED_TAGS: Record<MoodType, TagOption[]> = {
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
    { value: 'glädjelös', label: 'Ingen glädje', emoji: '🌫️' },
    { value: 'orolig', label: 'Orolig', emoji: '😟' },
    { value: 'ångest', label: 'Ångest', emoji: '😰' },
    { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
    { value: 'koncentrationssvårigheter', label: 'Fokussvårt', emoji: '🧠' },
    { value: 'social tillbakadragning', label: 'Drar mig undan', emoji: '🚪' },
    { value: 'gråtmild', label: 'Gråtmild', emoji: '😢' },
    { value: 'kroppsliga besvär', label: 'Värk i kroppen', emoji: '🤕' },
    { value: 'aptitförändringar', label: 'Aptit förändrad', emoji: '🍽️' },
    { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
    { value: 'energilös', label: 'Energilös', emoji: '🪫' },
  ],
  depressed: [
    { value: 'meningslöshet', label: 'Meningslöst', emoji: '🌫️' },
    { value: 'glädjelös', label: 'Ingen lust', emoji: '🍂' },
    { value: 'skuldkänslor', label: 'Skuldkänslor', emoji: '😞' },
    { value: 'låg självkänsla', label: 'Låg självkänsla', emoji: '💧' },
    { value: 'ångest', label: 'Ångest', emoji: '😰' },
    { value: 'irritabilitet', label: 'Irriterad', emoji: '😤' },
    { value: 'gråtmild', label: 'Gråtmild', emoji: '😢' },
    { value: 'social tillbakadragning', label: 'Isolerar mig', emoji: '🚪' },
    { value: 'koncentrationssvårigheter', label: 'Fokussvårt', emoji: '🧠' },
    { value: 'hygien svårt', label: 'Hygien tungt', emoji: '🪥' },
    { value: 'kroppsliga besvär', label: 'Värk/huvudvärk', emoji: '🤕' },
    { value: 'sexlust låg', label: 'Tappad sexlust', emoji: '🌑' },
    { value: 'sömnsvårigheter', label: 'Sömnsvårt', emoji: '🌙' },
    { value: 'energilös', label: 'Orkar inte', emoji: '🪫' },
  ],
  severe_depressed: [
    { value: 'hopplöshet', label: 'Hopplöst', emoji: '🌑' },
    { value: 'tomhet', label: 'Tom inuti', emoji: '🫥' },
    { value: 'värdelöshet', label: 'Värdelös', emoji: '💔' },
    { value: 'suicidtankar', label: 'Mörka tankar', emoji: '🆘' },
    { value: 'självskada', label: 'Självskada', emoji: '⚠️' },
    { value: 'svår ångest', label: 'Svår ångest', emoji: '😰' },
    { value: 'orkar ingenting', label: 'Orkar ingenting', emoji: '🪫' },
    { value: 'hygien svårt', label: 'Klarar inte hygien', emoji: '🪥' },
    { value: 'social tillbakadragning', label: 'Helt isolerad', emoji: '🚪' },
    { value: 'psykomotorisk hämning', label: 'Kan inte röra mig', emoji: '🧊' },
    { value: 'aptit borta', label: 'Kan inte äta', emoji: '🍽️' },
    { value: 'sömnsvårigheter', label: 'Sover knappt/för mycket', emoji: '🌙' },
  ],
};

export const ELEVATED_TAGS_BY_TYPE: Record<DiagnosisType, { severe: TagOption[]; moderate: TagOption[]; mild: TagOption[] }> = {
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

export function getMoodTagsForType(type: DiagnosisType): Record<MoodType, TagOption[]> {
  const elevated = ELEVATED_TAGS_BY_TYPE[type] || ELEVATED_TAGS_BY_TYPE.general;
  return {
    ...BASE_DEPRESSED_TAGS,
    severe_elevated: elevated.severe,
    elevated: elevated.moderate,
    somewhat_elevated: elevated.mild,
  };
}

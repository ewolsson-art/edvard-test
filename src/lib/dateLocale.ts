import { useTranslation } from 'react-i18next';
import { sv, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'sv').toLowerCase();
  if (lang.startsWith('en')) return enUS;
  return sv;
}

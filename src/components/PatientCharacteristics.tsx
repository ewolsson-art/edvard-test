import { Zap, Cloud, Lock, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePatientCharacteristics } from '@/hooks/usePatientCharacteristics';
import { cn } from '@/lib/utils';
import { MoodType } from '@/types/mood';
import { useTranslation } from 'react-i18next';

interface PatientCharacteristicsProps {
  patientId: string;
  latestMood?: MoodType | null;
  isShared: boolean;
  patientName?: string;
}

export const PatientCharacteristics = ({ patientId, latestMood, isShared, patientName }: PatientCharacteristicsProps) => {
  const { t } = useTranslation();
  const defaultName = patientName || t('common.noData');
  const { elevatedCharacteristics, depressedCharacteristics, stableCharacteristics, isLoading } = usePatientCharacteristics(patientId);

  if (!isShared) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><Lock className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <CardTitle className="text-lg text-muted-foreground">{t('patientChars.characteristics')}</CardTitle>
              <CardDescription>{t('patientChars.notShared', { name: defaultName })}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (<Card><CardContent className="py-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></CardContent></Card>);
  }

  const hasAny = elevatedCharacteristics.length > 0 || depressedCharacteristics.length > 0 || stableCharacteristics.length > 0;

  if (!hasAny) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><Zap className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <CardTitle className="text-lg text-muted-foreground">{t('patientChars.characteristics')}</CardTitle>
              <CardDescription>{t('patientChars.noCharsYet', { name: defaultName })}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const sections = [
    { key: 'elevated', chars: elevatedCharacteristics, title: t('patientChars.elevatedPeriod'), icon: Zap, mood: 'elevated', borderColor: 'border-amber-200 dark:border-amber-900/50', ringColor: 'ring-amber-400 dark:ring-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-500', badgeStyle: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    { key: 'depressed', chars: depressedCharacteristics, title: t('patientChars.depressedPeriod'), icon: Cloud, mood: 'depressed', borderColor: 'border-red-200 dark:border-red-900/50', ringColor: 'ring-red-400 dark:ring-red-500', iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400', badgeBg: 'bg-red-500', badgeStyle: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    { key: 'stable', chars: stableCharacteristics, title: t('patientChars.stablePeriod'), icon: Sun, mood: 'stable', borderColor: 'border-emerald-200 dark:border-emerald-900/50', ringColor: 'ring-emerald-400 dark:ring-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-500', badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('patientChars.characteristics')}</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className={cn(s.borderColor, "transition-all duration-300", latestMood === s.mood && `ring-2 ${s.ringColor}`)}>
              <CardHeader className="pb-3">
                {latestMood === s.mood && <Badge className={`${s.badgeBg} text-white text-xs w-fit mb-2`}>{t('patientChars.currentState')}</Badge>}
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></div>
                  <div><CardTitle className="text-base">{s.title}</CardTitle></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {s.chars.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">{t('patientChars.noCharacteristics')}</p>
                  ) : s.chars.map(char => (
                    <Badge key={char.id} variant="secondary" className={`${s.badgeStyle} py-1.5 px-3`}>{char.name}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

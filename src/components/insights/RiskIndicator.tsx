 import { Moon, Dumbbell, Utensils, Brain } from 'lucide-react';
 import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
 
 interface RiskIndicatorProps {
   type: 'sleep' | 'exercise' | 'eating' | 'mood';
   label: string;
   currentStreak: number;
   riskLevel: number;
   historicalImpact: string | null;
 }
 
 export function RiskIndicator({ type, label, currentStreak, riskLevel, historicalImpact }: RiskIndicatorProps) {
   const icons = {
     sleep: Moon,
     exercise: Dumbbell,
     eating: Utensils,
     mood: Brain,
   };
 
   const Icon = icons[type];
   
   const getRiskColor = (level: number) => {
  const { t } = useTranslation();
     if (level >= 60) return 'bg-red-500';
     if (level >= 30) return 'bg-amber-500';
     return 'bg-emerald-500';
   };
 
   const getRiskBgColor = (level: number) => {
     if (level >= 60) return 'bg-red-500/10';
     if (level >= 30) return 'bg-amber-500/10';
     return 'bg-emerald-500/10';
   };
 
   const getRiskLabel = (level: number) => {
     if (level >= 60) return 'Hög risk';
     if (level >= 30) return 'Måttlig';
     return 'Låg risk';
   };
 
   return (
     <div className={cn('rounded-xl p-4 transition-all', getRiskBgColor(riskLevel))}>
       <div className="flex items-center gap-3 mb-3">
         <div className={cn('p-2 rounded-lg', getRiskColor(riskLevel))}>
           <Icon className="w-4 h-4 text-white" />
         </div>
         <div className="flex-1">
           <div className="flex items-center justify-between">
             <span className="font-medium text-sm">{label}</span>
             <span className={cn(
               'text-xs font-medium px-2 py-0.5 rounded-full',
               riskLevel >= 60 ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
               riskLevel >= 30 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
               'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
             )}>
               {getRiskLabel(riskLevel)}
             </span>
           </div>
         </div>
       </div>
       
       {/* Progress bar */}
       <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
         <div 
           className={cn('h-full rounded-full transition-all duration-500', getRiskColor(riskLevel))}
           style={{ width: `${Math.max(5, riskLevel)}%` }}
         />
       </div>
       
       {currentStreak > 0 && (
         <p className="text-xs text-muted-foreground">
           {type === 'sleep' && `${currentStreak} dagar med dålig sömn`}
           {type === 'exercise' && `${currentStreak} dagar utan träning`}
           {type === 'eating' && `${currentStreak} dagar med dåliga matvanor`}
           {type === 'mood' && `${currentStreak} humörbyten senaste veckan`}
         </p>
       )}
       
       {historicalImpact && riskLevel >= 30 && (
         <p className="text-xs text-muted-foreground mt-1 italic">
           {historicalImpact}
         </p>
       )}
     </div>
   );
 }
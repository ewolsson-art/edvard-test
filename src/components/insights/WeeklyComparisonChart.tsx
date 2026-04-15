 import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
 import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
 
 interface WeeklyComparisonChartProps {
   data: {
     metric: string;
     current: number;
     previous: number;
     change: number;
   }[];
 }
 
 export function WeeklyComparisonChart({ data }: WeeklyComparisonChartProps) {
  const { t } = useTranslation();
   const maxValue = Math.max(...data.flatMap(d => [d.current, d.previous]), 7);
 
   return (
     <div className="space-y-4">
       <h4 className="text-sm font-medium text-muted-foreground">Jämfört med förra veckan</h4>
       <div className="space-y-4">
         {data.map((item, index) => {
           const TrendIcon = item.change > 0 ? TrendingUp : item.change < 0 ? TrendingDown : Minus;
           const trendColor = item.change > 0 ? 'text-emerald-500' : item.change < 0 ? 'text-red-500' : 'text-muted-foreground';
           
           return (
             <div key={index} className="space-y-2">
               <div className="flex items-center justify-between text-sm">
                 <span className="font-medium">{item.metric}</span>
                 <div className="flex items-center gap-2">
                   <span className="text-muted-foreground">{item.current} / 7</span>
                   {item.change !== 0 && (
                     <div className={cn('flex items-center gap-0.5', trendColor)}>
                       <TrendIcon className="w-3 h-3" />
                       <span className="text-xs">{Math.abs(item.change)}%</span>
                     </div>
                   )}
                 </div>
               </div>
               <div className="flex gap-1 h-3">
                 {/* Current week bars */}
                 <div className="flex-1 bg-muted rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary rounded-full transition-all duration-500"
                     style={{ width: `${(item.current / maxValue) * 100}%` }}
                   />
                 </div>
               </div>
               <div className="flex gap-1 h-2 opacity-50">
                 {/* Previous week bars (smaller) */}
                 <div className="flex-1 bg-muted/50 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary/50 rounded-full transition-all duration-500"
                     style={{ width: `${(item.previous / maxValue) * 100}%` }}
                   />
                 </div>
               </div>
             </div>
           );
         })}
       </div>
       <p className="text-xs text-muted-foreground text-center">
         Översta stapeln = denna vecka • Nedre = förra veckan
       </p>
     </div>
   );
 }
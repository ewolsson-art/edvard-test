 import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
 
 interface InsightsSummaryCardProps {
   status: 'good' | 'warning' | 'alert';
   title: string;
   description: string;
   moodTrend: {
     direction: 'up' | 'down' | 'stable';
     percentage: number;
     dominantMood: 'elevated' | 'stable' | 'depressed';
   };
 }
 
 export function InsightsSummaryCard({ status, title, description, moodTrend }: InsightsSummaryCardProps) {
  const { t } = useTranslation();
   const statusConfig = {
     good: {
       bg: 'bg-emerald-500/10 border-emerald-500/30',
       iconBg: 'bg-emerald-500',
       icon: CheckCircle,
       textColor: 'text-emerald-700 dark:text-emerald-300',
     },
     warning: {
       bg: 'bg-amber-500/10 border-amber-500/30',
       iconBg: 'bg-amber-500',
       icon: AlertTriangle,
       textColor: 'text-amber-700 dark:text-amber-300',
     },
     alert: {
       bg: 'bg-red-500/10 border-red-500/30',
       iconBg: 'bg-red-500',
       icon: AlertCircle,
       textColor: 'text-red-700 dark:text-red-300',
     },
   };
 
   const moodConfig = {
     elevated: { label: 'Förhöjt', color: 'text-amber-600 dark:text-amber-400' },
     stable: { label: 'Stabilt', color: 'text-emerald-600 dark:text-emerald-400' },
     depressed: { label: 'Sänkt', color: 'text-blue-600 dark:text-blue-400' },
   };
 
   const config = statusConfig[status];
   const StatusIcon = config.icon;
   const TrendIcon = moodTrend.direction === 'up' ? TrendingUp : moodTrend.direction === 'down' ? TrendingDown : Minus;
 
   return (
     <Card className={cn('border-2 transition-all', config.bg)}>
       <CardContent className="p-6">
         <div className="flex items-start gap-4">
           <div className={cn('p-3 rounded-full', config.iconBg)}>
             <StatusIcon className="w-6 h-6 text-white" />
           </div>
           <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between mb-2">
               <h3 className={cn('text-xl font-bold', config.textColor)}>{title}</h3>
               <div className="flex items-center gap-2 text-sm">
                 <TrendIcon className={cn('w-4 h-4', moodConfig[moodTrend.dominantMood].color)} />
                 <span className={moodConfig[moodTrend.dominantMood].color}>
                   {moodTrend.percentage}% {moodConfig[moodTrend.dominantMood].label}
                 </span>
               </div>
             </div>
             <p className="text-muted-foreground">{description}</p>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }
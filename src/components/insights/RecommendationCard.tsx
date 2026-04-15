 import { Moon, Dumbbell, Utensils, AlertTriangle, Calendar, Heart } from 'lucide-react';
 import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
 
 interface RecommendationCardProps {
   priority: 'high' | 'medium' | 'low';
   icon: 'sleep' | 'exercise' | 'food' | 'warning' | 'calendar' | 'heart';
   title: string;
   description: string;
 }
 
 export function RecommendationCard({ priority, icon, title, description }: RecommendationCardProps) {
  const { t } = useTranslation();
   const icons = {
     sleep: Moon,
     exercise: Dumbbell,
     food: Utensils,
     warning: AlertTriangle,
     calendar: Calendar,
     heart: Heart,
   };
 
   const priorityConfig = {
     high: {
       border: 'border-l-red-500',
       bg: 'bg-red-500/5',
       iconBg: 'bg-red-500/10',
       iconColor: 'text-red-500',
       badge: 'bg-red-500/20 text-red-700 dark:text-red-300',
       badgeText: 'Prioritera',
     },
     medium: {
       border: 'border-l-amber-500',
       bg: 'bg-amber-500/5',
       iconBg: 'bg-amber-500/10',
       iconColor: 'text-amber-500',
       badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
       badgeText: 'Rekommenderas',
     },
     low: {
       border: 'border-l-emerald-500',
       bg: 'bg-emerald-500/5',
       iconBg: 'bg-emerald-500/10',
       iconColor: 'text-emerald-500',
       badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
       badgeText: 'Tips',
     },
   };
 
   const Icon = icons[icon];
   const config = priorityConfig[priority];
 
   return (
     <div className={cn(
       'rounded-xl p-4 border-l-4 transition-all hover:shadow-md',
       config.border,
       config.bg
     )}>
       <div className="flex items-start gap-3">
         <div className={cn('p-2 rounded-lg shrink-0', config.iconBg)}>
           <Icon className={cn('w-5 h-5', config.iconColor)} />
         </div>
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 mb-1">
             <h4 className="font-semibold text-sm">{title}</h4>
             <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.badge)}>
               {config.badgeText}
             </span>
           </div>
           <p className="text-sm text-muted-foreground">{description}</p>
         </div>
       </div>
     </div>
   );
 }
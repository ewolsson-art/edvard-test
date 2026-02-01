import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  hasCheckedInToday: boolean;
  className?: string;
  variant?: 'default' | 'compact';
}

export function StreakBadge({ 
  currentStreak, 
  longestStreak, 
  hasCheckedInToday,
  className,
  variant = 'default'
}: StreakBadgeProps) {
  const isOnFire = currentStreak >= 7;
  const isNewRecord = currentStreak > 0 && currentStreak === longestStreak;

  if (currentStreak === 0 && !hasCheckedInToday) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
                isOnFire 
                  ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" 
                  : "bg-primary/10 text-primary",
                className
              )}
            >
              <Flame className={cn(
                "w-4 h-4",
                isOnFire && "animate-pulse"
              )} />
              <span>{currentStreak}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{currentStreak} dagar i rad!</p>
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground">Bäst: {longestStreak} dagar</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl",
      isOnFire 
        ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30" 
        : "bg-primary/10 border border-primary/20",
      className
    )}>
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full",
        isOnFire 
          ? "bg-orange-500/30" 
          : "bg-primary/20"
      )}>
        <Flame className={cn(
          "w-5 h-5",
          isOnFire 
            ? "text-orange-500 animate-pulse" 
            : "text-primary"
        )} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-lg font-bold",
            isOnFire 
              ? "text-orange-600 dark:text-orange-400" 
              : "text-primary"
          )}>
            {currentStreak} {currentStreak === 1 ? 'dag' : 'dagar'} i rad
          </span>
          {isNewRecord && currentStreak > 1 && (
            <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">
              <Trophy className="w-3 h-3" />
              Nytt rekord!
            </span>
          )}
        </div>
        {longestStreak > currentStreak && (
          <p className="text-xs text-muted-foreground">
            Ditt bästa: {longestStreak} dagar
          </p>
        )}
        {isOnFire && (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            🔥 Du är on fire! Fortsätt så!
          </p>
        )}
      </div>
    </div>
  );
}

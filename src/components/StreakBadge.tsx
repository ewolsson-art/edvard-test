import { Flame, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MilestoneInfo, MILESTONES } from '@/hooks/useStreak';
import {
import { useTranslation } from 'react-i18next';
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  hasCheckedInToday: boolean;
  milestone?: MilestoneInfo;
  className?: string;
  variant?: 'default' | 'compact';
}

const MILESTONE_EMOJI: Record<number, string> = {
  3: '🌱',
  7: '🔥',
  14: '⭐',
  30: '🏆',
  60: '💎',
  90: '👑',
  180: '🦸',
  365: '🐢',
};

export function StreakBadge({ 
  currentStreak, 
  longestStreak, 
  hasCheckedInToday,
  milestone,
  className,
  variant = 'default'
}: StreakBadgeProps) {
  const { t } = useTranslation();
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
                "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold",
                isOnFire 
                  ? "bg-orange-500/30 text-orange-400 border border-orange-500/40" 
                  : "bg-primary/20 text-primary border border-primary/30",
                className
              )}
            >
              <Flame className={cn(
                "w-5 h-5",
                isOnFire && "animate-pulse"
              )} />
              <span>{currentStreak} 🔥</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="space-y-1">
            <p className="font-semibold">
              {currentStreak} {currentStreak === 1 ? 'dag' : 'dagar'} i rad!
            </p>
            {milestone?.next && milestone.daysUntilNext && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                {milestone.daysUntilNext} {milestone.daysUntilNext === 1 ? 'dag' : 'dagar'} till {MILESTONE_EMOJI[milestone.next]} {milestone.next}-dagars streak
              </p>
            )}
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground">Ditt bästa: {longestStreak} dagar</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default variant with milestone progress
  return (
    <div className={cn(
      "rounded-xl px-4 py-3",
      isOnFire 
        ? "bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/25" 
        : "bg-primary/10 border border-primary/15",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0",
          isOnFire ? "bg-orange-500/25" : "bg-primary/15"
        )}>
          <Flame className={cn(
            "w-5 h-5",
            isOnFire ? "text-orange-500 animate-pulse" : "text-primary"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-sm font-bold leading-tight",
              isOnFire ? "text-orange-600 dark:text-orange-400" : "text-primary"
            )}>
              {currentStreak} {currentStreak === 1 ? 'dag' : 'dagar'} i rad
            </span>
            {isNewRecord && currentStreak > 1 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">
                <Trophy className="w-3 h-3" />
                Nytt rekord!
              </span>
            )}
          </div>
          {/* Milestone progress */}
          {milestone?.next && milestone.daysUntilNext != null && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-foreground/5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary/40 transition-all duration-500"
                  style={{ 
                    width: `${((milestone.next - milestone.daysUntilNext) / milestone.next) * 100}%` 
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
                {MILESTONE_EMOJI[milestone.next]} {milestone.daysUntilNext} kvar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
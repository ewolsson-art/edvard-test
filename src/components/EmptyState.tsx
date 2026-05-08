import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TurtleLogo } from '@/components/TurtleLogo';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Visual scale of the turtle mascot */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Friendly empty state with the Toddy turtle mascot.
 * Use whenever a list/page has no data — gives the user a calm, branded
 * "nothing here yet" instead of a blank screen.
 */
export function EmptyState({
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const turtleSize =
    size === 'sm' ? 'w-16 h-16' :
    size === 'lg' ? 'w-32 h-32' :
    'w-24 h-24';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-10 gap-4',
        className,
      )}
    >
      <div className="relative">
        {/* Soft golden glow behind mascot */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 blur-2xl rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(45 85% 55% / 0.45), transparent 70%)' }}
        />
        <TurtleLogo
          size="hero"
          animated
          className={cn(turtleSize, 'drop-shadow-[0_6px_20px_hsl(45_85%_55%/0.25)]')}
        />
      </div>

      <div className="max-w-xs space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {action && <div className="pt-1">{action}</div>}
    </motion.div>
  );
}

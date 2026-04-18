import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface NativeHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  largeTitle?: boolean;
  /** Use transparent background (e.g. over hero) */
  transparent?: boolean;
  className?: string;
}

/**
 * iOS-style native header.
 * - Sits below the status bar via pt-safe.
 * - Back button on the left (chevron + haptic), title in middle, optional action right.
 * - largeTitle renders the iOS "Large Title" style below the inline header.
 */
export function NativeHeader({
  title,
  showBack = false,
  onBack,
  rightAction,
  largeTitle = false,
  transparent = false,
  className,
}: NativeHeaderProps) {
  const navigate = useNavigate();
  const { tap } = useHaptics();

  const handleBack = () => {
    tap();
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 pt-safe',
        transparent ? 'bg-transparent' : 'bg-background/85 backdrop-blur-2xl border-b border-border/30',
        className
      )}
      role="banner"
    >
      <div className="relative flex items-center justify-center h-12 px-2">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-1 flex items-center gap-0.5 px-2 py-2 rounded-lg text-primary active:opacity-60 transition-opacity min-h-[44px] min-w-[44px]"
            aria-label="Tillbaka"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />
          </button>
        )}
        {!largeTitle && title && (
          <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground truncate max-w-[60%]">
            {title}
          </h1>
        )}
        {rightAction && (
          <div className="absolute right-2 flex items-center min-h-[44px]">{rightAction}</div>
        )}
      </div>
      {largeTitle && title && (
        <div className="px-5 pt-1 pb-3">
          <h1 className="text-[34px] font-bold tracking-[-0.03em] text-foreground leading-tight">
            {title}
          </h1>
        </div>
      )}
    </header>
  );
}

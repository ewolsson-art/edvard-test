import { cn } from '@/lib/utils';
import { OwlLogo } from './OwlLogo';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  className
}: LogoProps) {
  const sizes = {
    sm: { text: 'text-lg' },
    md: { text: 'text-xl' },
    lg: { text: 'text-2xl' },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <OwlLogo size={size} animated={false} />
      {showText && (
        <span className={cn(
          "font-logo font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
          sizes[size].text
        )}>
          Friendly
        </span>
      )}
    </div>
  );
}

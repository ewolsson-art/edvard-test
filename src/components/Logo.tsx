import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

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
    sm: { icon: 'w-5 h-5', text: 'text-lg' },
    md: { icon: 'w-6 h-6', text: 'text-xl' },
    lg: { icon: 'w-7 h-7', text: 'text-2xl' },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Heart className={cn(sizes[size].icon, "text-primary fill-primary")} />
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

import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface OwlLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
  className?: string;
}

export function OwlLogo({ size = 'md', animated = true, className }: OwlLogoProps) {
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    hero: 'w-64 h-64 md:w-80 md:h-80',
  };

  const iconSizes = { sm: 20, md: 28, lg: 36, hero: 120 };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <Heart size={iconSizes[size]} className={cn("text-primary fill-primary/20", animated && "pulse-soft")} />
    </div>
  );
}

import { cn } from '@/lib/utils';
import owlImage from '@/assets/owl-mascot-new.png';

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

  return (
    <div className={cn("relative", sizes[size], className)}>
      <img
        src={owlImage}
        alt="Friendly owl mascot"
        className={cn(
          "w-full h-full object-contain rounded-2xl",
          animated && "owl-idle"
        )}
      />
    </div>
  );
}

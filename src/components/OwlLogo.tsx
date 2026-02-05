import { cn } from '@/lib/utils';
import owlMascot from '@/assets/owl-mascot.png';

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
    hero: 'w-56 h-56 md:w-72 md:h-72',
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <img
        src={owlMascot}
        alt="Friendly owl mascot"
        className={cn("w-full h-full object-contain", animated && "owl-idle")}
      />
    </div>
  );
}

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', subtext: 'text-sm' },
    md: { icon: 'w-10 h-10', text: 'text-xl', subtext: 'text-base' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', subtext: 'text-lg' },
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Modern minimalist cloud icon */}
      <div className={cn("relative", sizes[size].icon)}>
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
            </linearGradient>
          </defs>
          
          {/* Single clean cloud shape */}
          <path
            d="M38 32c4.418 0 8-3.582 8-8 0-3.866-2.739-7.09-6.385-7.836C38.574 10.56 33.732 6 28 6c-3.728 0-7.038 1.87-9 4.72C17.038 7.87 13.728 6 10 6 4.477 6 0 10.477 0 16c0 .694.07 1.371.204 2.024C.07 18.679 0 19.332 0 20c0 6.627 5.373 12 12 12h26z"
            fill="url(#logoGradient)"
            transform="translate(1, 4)"
          />
        </svg>
      </div>
      
      {showText && (
        <span className={cn(
          "font-logo font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
          sizes[size].text
        )}>
          Between Clouds
        </span>
      )}
    </div>
  );
}

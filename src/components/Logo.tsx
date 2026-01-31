import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl' },
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Modern cloud icon */}
      <div className={cn("relative", sizes[size].icon)}>
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background gradient cloud */}
          <defs>
            <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(210 40% 60%)" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="cloudGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(210 50% 70%)" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* Back cloud (slightly offset) */}
          <path
            d="M38 32c4.418 0 8-3.134 8-7 0-3.224-2.488-5.941-5.872-6.756C39.444 13.616 35.332 10 30 10c-3.146 0-5.946 1.186-7.686 3.014C21.16 11.186 18.146 10 15 10c-5.332 0-9.444 3.616-10.128 8.244C2.488 19.06 0 21.776 0 25c0 3.866 3.582 7 8 7h30z"
            fill="url(#cloudGradient2)"
            transform="translate(2, 4)"
          />
          
          {/* Front cloud */}
          <path
            d="M36 30c4.418 0 8-3.134 8-7 0-3.224-2.488-5.941-5.872-6.756C37.444 11.616 33.332 8 28 8c-3.146 0-5.946 1.186-7.686 3.014C19.16 9.186 16.146 8 13 8c-5.332 0-9.444 3.616-10.128 8.244C.488 17.06-2 19.776-2 23c0 3.866 3.582 7 8 7h30z"
            fill="url(#cloudGradient)"
            transform="translate(4, 6)"
          />
          
          {/* Subtle highlight */}
          <ellipse
            cx="22"
            cy="20"
            rx="8"
            ry="3"
            fill="white"
            opacity="0.25"
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "font-logo font-semibold tracking-tight text-foreground",
            sizes[size].text
          )}>
            Between
          </span>
          <span className={cn(
            "font-logo font-light tracking-wide text-primary",
            sizes[size].text
          )}>
            Clouds
          </span>
        </div>
      )}
    </div>
  );
}

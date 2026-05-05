import { cn } from '@/lib/utils';

interface DarkNightBackgroundProps {
  children: React.ReactNode;
  className?: string;
  showStars?: boolean;
}

export function DarkNightBackground({ children, className, showStars = true }: DarkNightBackgroundProps) {
  return (
    <div className={cn("min-h-screen flex flex-col relative overflow-x-hidden", className)}>
      {/* Dark night sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(230_30%_5%)] via-[hsl(225_35%_8%)] to-[hsl(220_30%_12%)]" />

      {/* Subtle moon */}
      <div className="absolute top-[6%] right-[10%] w-10 h-10 md:w-14 md:h-14 rounded-full bg-[hsl(45_25%_82%)] shadow-[0_0_30px_8px_hsl(45_25%_82%/0.1)] opacity-60" />

      {/* Stars */}
      {showStars && (
        <div className="absolute inset-0 pointer-events-none">
          {[
            "top-[3%] left-[8%] w-1 h-1", "top-[10%] left-[30%] w-1.5 h-1.5",
            "top-[5%] right-[25%] w-1 h-1", "top-[18%] left-[55%] w-1 h-1",
            "top-[7%] left-[70%] w-0.5 h-0.5", "top-[14%] right-[35%] w-1 h-1",
            "top-[2%] left-[50%] w-0.5 h-0.5", "top-[12%] left-[15%] w-1 h-1",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-white/40 ${pos}`}
              style={{ animation: `twinkle 3s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}

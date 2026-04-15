import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'settings';
  className?: string;
}

const languages = [
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher({ variant = 'navbar', className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'sv';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find(l => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  if (variant === 'settings') {
    return (
      <div ref={ref} className={cn("relative", className)}>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-foreground/[0.04] active:bg-foreground/[0.06]"
        >
          <Globe className="w-[18px] h-[18px] flex-shrink-0 text-foreground/30" />
          <div className="flex-1 min-w-0">
            <span className="text-[15px] font-medium text-foreground/80">
              {currentLang === 'sv' ? 'Språk' : 'Language'}
            </span>
            <p className="text-[12px] text-foreground/30 mt-0.5">
              {current.flag} {current.label}
            </p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-foreground/30 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="absolute left-4 right-4 mt-1 z-50 rounded-xl border border-border/30 bg-background shadow-lg overflow-hidden">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => select(lang.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                  lang.code === currentLang
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground/70 hover:bg-foreground/[0.04]"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Navbar dropdown variant
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        aria-label={currentLang === 'sv' ? 'Byt språk' : 'Change language'}
      >
        <span className="text-base">{current.flag}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 z-50 rounded-xl border border-white/10 bg-[hsl(230_30%_8%)] shadow-xl overflow-hidden backdrop-blur-xl">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                lang.code === currentLang
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

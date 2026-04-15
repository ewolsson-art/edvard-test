import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'settings';
  className?: string;
}

export function LanguageSwitcher({ variant = 'navbar', className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'sv';

  const toggle = () => {
    const next = currentLang === 'sv' ? 'en' : 'sv';
    i18n.changeLanguage(next);
  };

  if (variant === 'settings') {
    return (
      <button
        onClick={toggle}
        className={cn(
          "w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150",
          "hover:bg-foreground/[0.04] active:bg-foreground/[0.06]",
          className
        )}
      >
        <Globe className="w-[18px] h-[18px] flex-shrink-0 text-foreground/30" />
        <div className="flex-1 min-w-0">
          <span className="text-[15px] font-medium text-foreground/80">
            {currentLang === 'sv' ? 'Språk' : 'Language'}
          </span>
          <p className="text-[12px] text-foreground/30 mt-0.5">
            {currentLang === 'sv' ? 'Svenska' : 'English'}
          </p>
        </div>
        <span className="text-xs font-medium text-foreground/40 uppercase">
          {currentLang === 'sv' ? 'SV' : 'EN'}
        </span>
      </button>
    );
  }

  // Navbar variant
  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200",
        className
      )}
      aria-label={currentLang === 'sv' ? 'Switch to English' : 'Byt till svenska'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{currentLang === 'sv' ? 'EN' : 'SV'}</span>
    </button>
  );
}

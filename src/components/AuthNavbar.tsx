import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Menu, X } from 'lucide-react';

export function AuthNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { label: t('nav.aboutUs'), href: '/om-oss' },
    { label: t('nav.howItWorks'), href: '/sa-funkar-det' },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    navigate(href);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(230_30%_5%/0.9)] backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/auth')}>
              <Logo size="sm" className="[&_span]:!bg-none [&_span]:!text-white" />
            </div>

            {/* Desktop navigation - right aligned */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => navigate("/skapa-konto")}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {t('nav.getStarted')}
              </button>
              <LanguageSwitcher variant="navbar" />
              <button
                onClick={() => navigate("/logga-in")}
                className="ml-2 px-5 py-2 text-sm font-semibold text-white/80 border border-white/25 rounded-full hover:bg-white hover:text-[hsl(225_30%_7%)] hover:border-white transition-all duration-200"
              >
                {t('nav.login')}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-10 w-10 text-white hover:bg-white/10"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu - fullscreen overlay inspired by Residy */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999] bg-black flex flex-col">
          {/* Close button top-right */}
          <div className="flex items-center justify-end h-16 px-5">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label={t('nav.closeMenu')}
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Primary links - large, bold, left-aligned */}
          <div className="flex-1 flex flex-col px-8 pt-8">
            <div className="space-y-4">
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate('/logga-in'); }}
                className="block text-left text-3xl font-bold text-white tracking-tight hover:text-white/80 transition-colors"
              >
                {t('nav.login')}
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate('/skapa-konto'); }}
                className="block text-left text-3xl font-bold text-white tracking-tight hover:text-white/80 transition-colors"
              >
                {t('nav.createAccount')}
              </button>
            </div>
          </div>

          {/* Secondary links at the bottom */}
          <div className="px-8 pb-12 space-y-3 border-t border-white/10 pt-6">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="block text-left text-base text-white/50 hover:text-white/80 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <LanguageSwitcher variant="navbar" className="!text-white/50 !px-0" />
          </div>
        </div>
      )}
    </>
  );
}

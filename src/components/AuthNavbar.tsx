import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Om oss', href: '/om-oss' },
  { label: 'För patienter', href: '/for-patienter' },
  { label: 'För vårdgivare', href: '/for-vardgivare' },
  { label: 'För anhöriga', href: '/for-anhoriga' },
  { label: 'Samarbetspartners', href: '/samarbetspartners' },
];

export function AuthNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    navigate(href);
  };

  const handleLoginClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/logga-in');
  };

  const handleSignupClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/skapa-konto');
  };

  // Check current mode from URL
  const searchParams = new URLSearchParams(location.search);
  const currentMode = searchParams.get('mode');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(230_30%_5%/0.9)] backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/auth')}>
            <Logo size="sm" className="[&_span]:!bg-none [&_span]:!text-white" />
          </div>

          {/* Desktop navigation - right aligned */}
          <div className="hidden lg:flex items-center gap-1 ml-auto">
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
              onClick={() => navigate("/logga-in")}
              className="ml-3 px-5 py-2 text-sm font-semibold text-[hsl(225_30%_7%)] bg-[hsl(45_85%_55%)] rounded-full hover:bg-[hsl(45_85%_60%)] hover:scale-105 active:scale-[0.98] transition-all duration-200 shadow-[0_2px_12px_hsl(45_85%_55%/0.25)]"
            >
              Logga in
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
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

      {/* Mobile menu - fullscreen overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[60] bg-[hsl(230_30%_5%/0.98)] backdrop-blur-2xl transition-all duration-400 ease-in-out flex flex-col",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Close button */}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="cursor-pointer" onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }}>
            <Logo size="sm" className="[&_span]:!bg-none [&_span]:!text-white" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="h-10 w-10 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Nav links centered */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8">
          {navItems.map((item, i) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="w-full text-center py-4 text-lg font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { setIsMobileMenuOpen(false); navigate("/logga-in"); }}
            className="w-full mt-6 px-5 py-4 text-base font-semibold text-[hsl(225_30%_7%)] bg-[hsl(45_85%_55%)] rounded-full hover:bg-[hsl(45_85%_60%)] transition-all duration-200 shadow-[0_2px_20px_hsl(45_85%_55%/0.3)]"
          >
            Logga in
          </button>
        </div>
      </div>
    </nav>
  );
}

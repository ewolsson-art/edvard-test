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

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden absolute top-16 left-0 right-0 bg-[hsl(230_30%_5%/0.95)] backdrop-blur-xl border-b border-white/10 transition-all duration-300 ease-in-out overflow-hidden",
          isMobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

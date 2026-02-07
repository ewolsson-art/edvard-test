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

  const searchParams = new URLSearchParams(location.search);
  const currentMode = searchParams.get('mode');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(200_60%_97%/0.85)] backdrop-blur-xl border-b border-[hsl(210_20%_80%/0.4)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/auth')}>
            <Logo size="sm" />
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="px-4 py-2 text-sm font-medium text-[hsl(220_20%_35%)] hover:text-[hsl(220_25%_18%)] hover:bg-[hsl(220_20%_90%/0.6)] rounded-lg transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA buttons - desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Button 
              variant={currentMode === 'login' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="text-sm text-[hsl(220_20%_35%)] hover:text-[hsl(220_25%_18%)] hover:bg-[hsl(220_20%_90%/0.6)]" 
              onClick={handleLoginClick}
            >
              Logga in
            </Button>
            <Button 
              size="sm" 
              className={cn(
                "text-sm rounded-full px-5 bg-[hsl(45_85%_50%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_55%)]",
                currentMode === 'signup' && "ring-2 ring-[hsl(45_85%_50%)/0.5]"
              )}
              onClick={handleSignupClick}
            >
              Kom igång
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-10 w-10 text-[hsl(220_20%_30%)] hover:bg-[hsl(220_20%_90%/0.6)]"
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
          "lg:hidden absolute top-16 left-0 right-0 bg-[hsl(200_60%_97%/0.95)] backdrop-blur-xl border-b border-[hsl(210_20%_80%/0.4)] transition-all duration-300 ease-in-out overflow-hidden",
          isMobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-[hsl(220_20%_35%)] hover:text-[hsl(220_25%_18%)] hover:bg-[hsl(220_20%_90%/0.5)] rounded-lg transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 pb-2 space-y-2">
            <Button variant="outline" className="w-full text-[hsl(220_20%_30%)] border-[hsl(210_20%_80%)]" onClick={handleLoginClick}>
              Logga in
            </Button>
            <Button className="w-full bg-[hsl(45_85%_50%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_55%)]" onClick={handleSignupClick}>
              Kom igång
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

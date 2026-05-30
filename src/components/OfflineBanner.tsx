import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Subtle banner shown when the device loses internet connection.
 * Plain CSS transition — avoids pulling framer-motion into the App shell bundle.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!isOffline}
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-destructive/95 backdrop-blur-md px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg pt-safe transition-all duration-300 ${
        isOffline ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <WifiOff className="h-4 w-4" />
      <span>Du är offline. Ändringar sparas när du är ansluten igen.</span>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Subtle banner shown when the device loses internet connection.
 * Prevents silent failures by giving the user explicit feedback.
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
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-destructive/95 backdrop-blur-md px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg pt-safe"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="h-4 w-4" />
          <span>Du är offline. Ändringar sparas när du är ansluten igen.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

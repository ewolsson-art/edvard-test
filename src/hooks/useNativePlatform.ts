import { useEffect, useState } from 'react';

/**
 * Detects if app is running inside a native Capacitor shell (iOS/Android).
 * Used to enable native-only features like status bar, haptics, and to
 * adjust UX (bottom tab bar always visible, no hover states, etc.)
 */
export function useNativePlatform() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      setIsNative(true);
      const p = cap.getPlatform?.();
      if (p === 'ios' || p === 'android') setPlatform(p);
    }
  }, []);

  return { isNative, platform, isIOS: platform === 'ios', isAndroid: platform === 'android' };
}

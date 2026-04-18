import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Detects if app is running inside a native Capacitor shell (iOS/Android).
 * Uses the official Capacitor import — most reliable across timing/race scenarios.
 *
 * We initialize state synchronously so the first render is already correct
 * (no flash of web-landing in the native app).
 */
export function useNativePlatform() {
  const initialIsNative = Capacitor.isNativePlatform();
  const initialPlatform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  const [isNative, setIsNative] = useState(initialIsNative);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>(initialPlatform);

  useEffect(() => {
    // Re-check on mount in case the bridge wasn't ready at module-eval time
    setIsNative(Capacitor.isNativePlatform());
    setPlatform(Capacitor.getPlatform() as 'ios' | 'android' | 'web');
  }, []);

  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  };
}

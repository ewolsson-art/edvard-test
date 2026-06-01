import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const NATIVE_FLAG_KEY = 'toddy_is_native';

/**
 * Detects if app is running inside a native Capacitor shell (iOS/Android).
 *
 * Detection order (any match = native):
 *   1. Capacitor.isNativePlatform() — official check
 *   2. ?native=1 URL flag — set by capacitor.config.json's server.url so
 *      we get a correct first paint even before the Capacitor JS bridge
 *      is fully ready. Persisted to localStorage so it survives in-app
 *      navigation that strips query params.
 *   3. localStorage flag from a previous detection
 */
function detectNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    /* ignore */
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('native') === '1') {
      try { localStorage.setItem(NATIVE_FLAG_KEY, '1'); } catch { /* ignore */ }
      return true;
    }
  } catch {
    /* ignore */
  }
  try {
    if (localStorage.getItem(NATIVE_FLAG_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return false;
}

function detectPlatform(): 'ios' | 'android' | 'web' {
  try {
    const p = Capacitor.getPlatform();
    if (p === 'ios' || p === 'android') return p;
  } catch {
    /* ignore */
  }
  if (detectNative() && typeof navigator !== 'undefined') {
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) return 'ios';
    if (/Android/i.test(navigator.userAgent)) return 'android';
  }
  return 'web';
}

export function useNativePlatform() {
  const [isNative, setIsNative] = useState(detectNative);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>(detectPlatform);

  useEffect(() => {
    setIsNative(detectNative());
    setPlatform(detectPlatform());
  }, []);

  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  };
}

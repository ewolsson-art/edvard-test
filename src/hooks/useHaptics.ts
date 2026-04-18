import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useNativePlatform } from './useNativePlatform';

/**
 * Lightweight wrapper around Capacitor Haptics.
 * Silently no-ops on web so it's safe to call everywhere.
 *
 * Usage:
 *   const { tap, success, warning } = useHaptics();
 *   <button onClick={() => { tap(); doThing(); }} />
 */
export function useHaptics() {
  const { isNative } = useNativePlatform();

  const tap = useCallback(async () => {
    if (!isNative) return;
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
  }, [isNative]);

  const medium = useCallback(async () => {
    if (!isNative) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
  }, [isNative]);

  const heavy = useCallback(async () => {
    if (!isNative) return;
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
  }, [isNative]);

  const success = useCallback(async () => {
    if (!isNative) return;
    try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
  }, [isNative]);

  const warning = useCallback(async () => {
    if (!isNative) return;
    try { await Haptics.notification({ type: NotificationType.Warning }); } catch {}
  }, [isNative]);

  const error = useCallback(async () => {
    if (!isNative) return;
    try { await Haptics.notification({ type: NotificationType.Error }); } catch {}
  }, [isNative]);

  const selection = useCallback(async () => {
    if (!isNative) return;
    try { await Haptics.selectionStart(); await Haptics.selectionChanged(); await Haptics.selectionEnd(); } catch {}
  }, [isNative]);

  return { tap, medium, heavy, success, warning, error, selection };
}

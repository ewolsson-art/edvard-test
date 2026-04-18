import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { useNativePlatform } from '@/hooks/useNativePlatform';

/**
 * One-time native shell setup: status bar styling matching the dark theme,
 * keyboard handling, and disabling overlay so content sits below status bar.
 * Mounted once at the App root.
 */
export function NativeShellInit() {
  const { isNative, isIOS } = useNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    (async () => {
      try {
        // Match the dark night-sky theme (#0a0a0a-ish)
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
        // Don't overlay — let content sit below status bar
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {}

      try {
        // Resize layout when keyboard opens (better than native scroll on iOS)
        await Keyboard.setResizeMode({ mode: 'native' as any });
        await Keyboard.setScroll({ isDisabled: false });
      } catch {}
    })();
  }, [isNative, isIOS]);

  return null;
}

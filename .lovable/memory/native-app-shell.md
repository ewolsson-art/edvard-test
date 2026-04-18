---
name: Native App Shell
description: iOS/Android native shell architecture — bottom tab bar on mobile, sidebar on desktop, safe-area, haptics, status bar
type: feature
---
Toddy körs som en native iOS/Android-app via Capacitor. Arkitektur:

**Layout:** `AppLayout` i `src/App.tsx` döljer sidebaren på mobil (`hidden md:block`) och visar `BottomTabBar` istället. Main-innehåll har `pb-tabbar md:pb-0` så det inte hamnar bakom flikbaren.

**Komponenter:**
- `src/components/native/BottomTabBar.tsx` — iOS-style flikbar, rollanpassad (patient/doctor/relative), badges + dots, `pb-safe` för home indicator, haptic tap vid varje val.
- `src/components/native/NativeHeader.tsx` — iOS-style header med back-pil, titel, large-title-läge. Sticky med `pt-safe`.
- `src/components/native/NativeShellInit.tsx` — sätter status bar style/färg och keyboard mode vid app-start.
- `src/hooks/useNativePlatform.ts` — detekterar Capacitor (isNative, isIOS, isAndroid).
- `src/hooks/useHaptics.ts` — wrapper kring @capacitor/haptics (tap, success, warning, etc). No-op på web.

**Tailwind safe-area utilities** (i `tailwind.config.ts`): `pt-safe`, `pb-safe`, `px-safe`, `pb-tabbar` (4.5rem + safe-area), `min-h-screen-safe`.

**index.css globals:** `-webkit-tap-highlight-color: transparent`, `overscroll-behavior-y: none`, min 44pt touch-targets på mobil, `:active` istället för `:hover` på touch.

**Capacitor-plugins:** `@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/keyboard`.

**capacitor.config.json:** ingen `server.url` (bundled mode), StatusBar/Keyboard/SplashScreen konfigurerat med dark theme (#0a0a0a). `ios.contentInset: "never"` så safe-area-CSS fungerar.

**Page transitions:** `AnimatedPage` använder iOS-spring-curve (slide från höger).

**Att köra efter ändringar:** `npm run build && npx cap sync ios` → Play i Xcode.

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const CHECKIN_ID = 1001;
const MEDICATION_ID = 1002;
const isNative = Capacitor.isNativePlatform();

/**
 * Schedules daily repeating local notifications via the OS.
 * Works even when the app is closed/backgrounded on iOS/Android.
 * Web fallback uses setTimeout (only fires while tab is open).
 */
export function useNotificationScheduler() {
  const { preferences, permissionStatus } = useNotificationPreferences();
  const webTimers = useRef<{ checkin?: ReturnType<typeof setTimeout>; medication?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    if (!preferences || permissionStatus !== 'granted') return;

    // ----- Native: schedule daily repeats via OS -----
    if (isNative) {
      (async () => {
        try {
          // Cancel previous so time changes apply
          await LocalNotifications.cancel({
            notifications: [{ id: CHECKIN_ID }, { id: MEDICATION_ID }],
          });

          const toSchedule: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

          if (preferences.checkin_enabled) {
            const [h, m] = preferences.checkin_time.split(':').map(Number);
            toSchedule.push({
              id: CHECKIN_ID,
              title: 'Dags att checka in',
              body: 'Hur mår du idag? Ta en stund att registrera ditt mående.',
              schedule: { on: { hour: h, minute: m }, allowWhileIdle: true, repeats: true },
            });
          }

          if (preferences.medication_enabled) {
            const [h, m] = preferences.medication_time.split(':').map(Number);
            toSchedule.push({
              id: MEDICATION_ID,
              title: 'Medicinpåminnelse',
              body: 'Glöm inte att ta din medicin idag.',
              schedule: { on: { hour: h, minute: m }, allowWhileIdle: true, repeats: true },
            });
          }

          if (toSchedule.length > 0) {
            await LocalNotifications.schedule({ notifications: toSchedule });
          }
        } catch (e) {
          console.error('[notifications] schedule failed', e);
        }
      })();
      return;
    }

    // ----- Web fallback: setTimeout (best-effort, only while tab open) -----
    const calcDelay = (timeString: string) => {
      const now = new Date();
      const [h, m] = timeString.split(':').map(Number);
      const t = new Date();
      t.setHours(h, m, 0, 0);
      if (t <= now) t.setDate(t.getDate() + 1);
      return t.getTime() - now.getTime();
    };

    const showWeb = (title: string, body: string, tag: string) => {
      try {
        new Notification(title, { body, icon: '/favicon.ico', tag, requireInteraction: true });
      } catch (e) {
        console.error('Web Notification failed', e);
      }
    };

    if (preferences.checkin_enabled) {
      webTimers.current.checkin = setTimeout(() => {
        showWeb('Dags att checka in', 'Hur mår du idag? Ta en stund att registrera ditt mående.', 'checkin-reminder');
      }, calcDelay(preferences.checkin_time));
    }

    if (preferences.medication_enabled) {
      webTimers.current.medication = setTimeout(() => {
        showWeb('Medicinpåminnelse', 'Glöm inte att ta din medicin idag.', 'medication-reminder');
      }, calcDelay(preferences.medication_time));
    }

    return () => {
      if (webTimers.current.checkin) clearTimeout(webTimers.current.checkin);
      if (webTimers.current.medication) clearTimeout(webTimers.current.medication);
    };
  }, [preferences, permissionStatus]);

  return { isNative };
}

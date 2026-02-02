import { useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useMoodData } from '@/hooks/useMoodData';
import { useMedications } from '@/hooks/useMedications';

export function useNotificationScheduler() {
  const { preferences, permissionStatus } = useNotificationPreferences();
  const { getEntryForDate } = useMoodData();
  const { activeMedications, isMedicationTakenOnDate } = useMedications();
  
  const checkinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const medicationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((title: string, body: string, tag: string) => {
    if (permissionStatus !== 'granted') return;
    
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
        requireInteraction: true,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permissionStatus]);

  const calculateDelayUntil = useCallback((timeString: string): number => {
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime.getTime() - now.getTime();
  }, []);

  const scheduleCheckinNotification = useCallback(() => {
    if (!preferences?.checkin_enabled || permissionStatus !== 'granted') return;

    // Clear existing timeout
    if (checkinTimeoutRef.current) {
      clearTimeout(checkinTimeoutRef.current);
    }

    const delay = calculateDelayUntil(preferences.checkin_time);
    
    checkinTimeoutRef.current = setTimeout(() => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayEntry = getEntryForDate(todayStr);
      
      // Only show notification if not already checked in today
      if (!todayEntry) {
        showNotification(
          'Dags att checka in! 📝',
          'Hur mår du idag? Ta en stund att registrera ditt mående.',
          'checkin-reminder'
        );
      }
      
      // Schedule next notification
      scheduleCheckinNotification();
    }, delay);
  }, [preferences, permissionStatus, calculateDelayUntil, getEntryForDate, showNotification]);

  const scheduleMedicationNotification = useCallback(() => {
    if (!preferences?.medication_enabled || permissionStatus !== 'granted') return;

    // Clear existing timeout
    if (medicationTimeoutRef.current) {
      clearTimeout(medicationTimeoutRef.current);
    }

    const delay = calculateDelayUntil(preferences.medication_time);
    
    medicationTimeoutRef.current = setTimeout(() => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Check if there are any medications not taken today
      const untakenMeds = activeMedications.filter(
        med => med.frequency !== 'as_needed' && !isMedicationTakenOnDate(med.id, todayStr)
      );
      
      if (untakenMeds.length > 0) {
        const medNames = untakenMeds.slice(0, 3).map(m => m.name).join(', ');
        const suffix = untakenMeds.length > 3 ? ` och ${untakenMeds.length - 3} till` : '';
        
        showNotification(
          'Medicinpåminnelse 💊',
          `Glöm inte att ta: ${medNames}${suffix}`,
          'medication-reminder'
        );
      }
      
      // Schedule next notification
      scheduleMedicationNotification();
    }, delay);
  }, [preferences, permissionStatus, calculateDelayUntil, activeMedications, isMedicationTakenOnDate, showNotification]);

  // Schedule notifications when preferences change
  useEffect(() => {
    if (permissionStatus !== 'granted') return;

    scheduleCheckinNotification();
    scheduleMedicationNotification();

    return () => {
      if (checkinTimeoutRef.current) {
        clearTimeout(checkinTimeoutRef.current);
      }
      if (medicationTimeoutRef.current) {
        clearTimeout(medicationTimeoutRef.current);
      }
    };
  }, [preferences, permissionStatus, scheduleCheckinNotification, scheduleMedicationNotification]);

  return {
    isScheduled: Boolean(checkinTimeoutRef.current || medicationTimeoutRef.current),
  };
}

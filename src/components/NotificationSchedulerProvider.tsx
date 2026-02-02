import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';

export function NotificationSchedulerProvider({ children }: { children: React.ReactNode }) {
  // Initialize the notification scheduler
  useNotificationScheduler();
  
  return <>{children}</>;
}

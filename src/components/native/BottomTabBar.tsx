import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, BarChart3, MessageCircle, Bell, UserCircle, Home, Users, Bot, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useNotifications } from '@/hooks/useNotifications';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { preloadRoute } from '@/lib/routePreload';

type TabItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  dot?: boolean;
  exact?: boolean;
};

/**
 * iOS-style bottom tab bar. Visible on mobile only (md:hidden).
 * Respects safe-area-inset-bottom (home indicator).
 * Triggers haptic tap on every selection.
 */
export function BottomTabBar() {
  const { pathname } = useLocation();
  const { isDoctor, isRelative, isLoading } = useUserRole();
  const { unreadCount } = useNotifications();
  const { hasPending } = usePendingNotifications();
  const { tap } = useHaptics();
  const { t } = useTranslation();

  if (isLoading) return null;

  const patientTabs: TabItem[] = [
    { to: '/', label: t('sidebar.today'), icon: CalendarDays, exact: true },
    { to: '/oversikt', label: t('sidebar.overview'), icon: BarChart3 },
    { to: '/forum', label: t('sidebar.forum'), icon: MessageCircle },
    { to: '/fraga', label: t('sidebar.askToddy'), icon: Bot },
    { to: '/profil', label: t('sidebar.myProfile'), icon: UserCircle, dot: hasPending || unreadCount > 0 },
  ];

  const doctorTabs: TabItem[] = [
    { to: '/lakare', label: t('sidebar.home'), icon: Home, exact: true },
    { to: '/mina-patienter', label: t('sidebar.myUsers'), icon: Users },
    { to: '/profil', label: t('sidebar.myProfile'), icon: UserCircle, dot: hasPending },
  ];

  const relativeTabs: TabItem[] = [
    { to: '/anhorig', label: t('sidebar.home'), icon: Home, exact: true },
    { to: '/forum', label: t('sidebar.forum'), icon: MessageCircle },
    { to: '/notiser', label: t('sidebar.notifications'), icon: Bell, badge: unreadCount },
    { to: '/profil', label: t('sidebar.myProfile'), icon: UserCircle, dot: hasPending },
  ];

  const tabs = isDoctor ? doctorTabs : isRelative ? relativeTabs : patientTabs;

  const isActive = (tab: TabItem) =>
    tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/85 backdrop-blur-2xl border-t border-border/30 pb-safe"
      role="tablist"
      aria-label="Huvudnavigering"
    >
      <ul className="flex items-stretch justify-around px-2 pt-1.5">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                onClick={() => tap()}
                onTouchStart={() => preloadRoute(tab.to)}
                onMouseEnter={() => preloadRoute(tab.to)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[52px] rounded-xl transition-all duration-200',
                  'active:scale-95 active:bg-white/[0.04]',
                  active ? 'text-primary' : 'text-white/45'
                )}
                role="tab"
                aria-selected={active}
                aria-label={tab.label}
              >
                <div className="relative">
                  <Icon
                    className={cn('h-[26px] w-[26px] transition-all', active && 'scale-105')}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                  {tab.dot && (tab.badge === undefined || tab.badge === 0) && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </div>
                <span className={cn('text-[10px] leading-none tracking-tight', active ? 'font-semibold' : 'font-medium')}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

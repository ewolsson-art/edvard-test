import { useState } from "react";
import { CalendarDays, BarChart3, LogOut, UserCircle, Users, Home, FileText, Settings, MessageCircle, Bell, Sparkles, Stethoscope, Loader2, Bot } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingNotifications } from "@/hooks/usePendingNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const patientNavGroups = [
  {
    labelKey: "sidebar.daily",
    items: [
      { titleKey: "sidebar.today", url: "/", icon: CalendarDays, primary: true },
      { titleKey: "sidebar.overview", url: "/oversikt", icon: BarChart3 },
      { titleKey: "sidebar.forum", url: "/forum", icon: MessageCircle },
      { titleKey: "sidebar.notifications", url: "/notiser", icon: Bell },
    ],
  },
  {
    labelKey: "sidebar.assistant",
    items: [
      { titleKey: "sidebar.askToddy", url: "/fraga", icon: Bot },
    ],
  },
  {
    labelKey: "sidebar.account",
    items: [
      { titleKey: "sidebar.myProfile", url: "/profil", icon: UserCircle },
      { titleKey: "sidebar.settings", url: "/installningar", icon: Settings },
    ],
  },
];

const doctorNavGroups = [
  {
    labelKey: "sidebar.overview",
    items: [
      { titleKey: "sidebar.home", url: "/lakare", icon: Home, primary: true },
      { titleKey: "sidebar.myUsers", url: "/mina-patienter", icon: Users },
      { titleKey: "sidebar.notifications", url: "/notiser", icon: Bell },
    ],
  },
  {
    labelKey: "sidebar.account",
    items: [
      { titleKey: "sidebar.myProfile", url: "/profil", icon: UserCircle },
    ],
  },
];

const relativeNavGroups = [
  {
    labelKey: "sidebar.overview",
    items: [
      { titleKey: "sidebar.home", url: "/anhorig", icon: Home, primary: true },
      { titleKey: "sidebar.forum", url: "/forum", icon: MessageCircle },
      { titleKey: "sidebar.notifications", url: "/notiser", icon: Bell },
    ],
  },
  {
    labelKey: "sidebar.account",
    items: [
      { titleKey: "sidebar.myProfile", url: "/profil", icon: UserCircle },
      { titleKey: "sidebar.settings", url: "/installningar", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { firstName, fullName, avatarUrl } = useProfile();
  const { isDoctor, isPatient, isRelative, isLoading: roleLoading } = useUserRole();
  const { hasPending } = usePendingNotifications();
  const { unreadCount: notifUnread } = useNotifications();
  const { t } = useTranslation();
  
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const [signingOut, setSigningOut] = useState(false);

  // Don't determine nav until role is loaded to prevent sidebar flash
  if (roleLoading) {
    return (
      <Sidebar collapsible="icon" className="border-r border-border/20" aria-label="Huvudnavigering">
        <SidebarContent className="pt-8 pb-4 bg-sidebar" role="navigation">
          <div className="px-6 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const navGroups = isDoctor ? doctorNavGroups : isRelative ? relativeNavGroups : patientNavGroups;
  const homeUrl = isDoctor ? "/lakare" : isRelative ? "/anhorig" : "/";

  const getInitials = () => {
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
  };

  const isActive = (url: string) => {
    if (url === '/' || url === '/lakare' || url === '/anhorig') {
      return location.pathname === url;
    }
    return location.pathname.startsWith(url);
  };

  

  return (
    <Sidebar collapsible="icon" className="border-r border-border/20" aria-label="Huvudnavigering">
      <SidebarContent className="pt-8 pb-4 bg-sidebar" role="navigation">
        {/* Profile section at top */}
        {!isCollapsed && (
          <div className="px-6 mb-10">
            <div className="flex items-center gap-3.5">
              <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/10">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Profilbild" className="object-cover" />
                ) : null}
                <AvatarFallback className="text-sm font-medium bg-white/[0.08] text-white/80">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-semibold text-white truncate">
                  {firstName || 'Användare'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed: just logo */}
        {isCollapsed && (
          <div className="flex justify-center px-2 mb-8">
            <Link 
              to={homeUrl} 
              className="block hover:opacity-80 transition-opacity"
              aria-label="Gå till startsidan"
            >
              <Logo size="sm" showText={false} />
            </Link>
          </div>
        )}

        {navGroups.map((group, gi) => (
          <SidebarGroup key={group.labelKey} className={gi > 0 ? 'mt-8' : ''}>
            {!isCollapsed && (
              <div className="px-6 mb-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/25">{t(group.labelKey)}</span>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2.5 px-3" role="menubar" aria-label={t(group.labelKey)}>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  const isPrimary = 'primary' in item && item.primary;
                  
                  return (
                    <SidebarMenuItem key={item.titleKey} role="none">
                      <SidebarMenuButton asChild tooltip={t(item.titleKey)} role="menuitem">
                        <NavLink 
                          to={item.url} 
                          end={item.url === '/' || item.url === '/lakare' || item.url === '/anhorig' || item.url === '/foljer'}
                          className={`group relative flex items-center gap-4 rounded-xl transition-all duration-300 ${
                            isPrimary ? 'px-4 py-3.5' : 'px-4 py-3'
                          } ${
                            active 
                              ? '' 
                              : gi === 0 
                                ? 'text-white/55 hover:text-white/80 hover:bg-white/[0.04]'
                                : 'text-white/35 hover:text-white/55 hover:bg-white/[0.03]'
                          }`}
                          activeClassName="bg-white/[0.08] text-white backdrop-blur-sm"
                          aria-label={item.url === '/profil' && hasPending ? `${t(item.titleKey)} - Du har nya notifikationer` : t(item.titleKey)}
                          aria-current={active ? "page" : undefined}
                          onClick={() => { if (isMobile) setOpenMobile(false); }}
                        >
                          {item.url === '/profil' && avatarUrl ? (
                            <Avatar className="h-[22px] w-[22px] shrink-0">
                              <AvatarImage src={avatarUrl} alt="Profilbild" className="object-cover" />
                              <AvatarFallback className="text-[10px] bg-white/[0.08] text-white/60">{getInitials()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="relative">
                              <item.icon 
                                className={`shrink-0 transition-all duration-300 ${
                                  isPrimary ? 'h-[22px] w-[22px]' : 'h-5 w-5'
                                }`} 
                                strokeWidth={active ? 2 : 1.5}
                                aria-hidden="true" 
                              />
                              {item.url === '/notiser' && notifUnread > 0 && (
                                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" aria-hidden="true">
                                  {notifUnread > 9 ? '9+' : notifUnread}
                                </span>
                              )}
                            </div>
                          )}
                          {!isCollapsed && (
                            <span className={`tracking-[-0.01em] transition-all duration-300 ${
                              isPrimary 
                                ? 'text-[17px] font-semibold' 
                                : gi === 0 
                                  ? 'text-[15px] font-medium' 
                                  : 'text-[14px] font-normal'
                            }`}>
                              {t(item.titleKey)}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 bg-sidebar border-t border-white/[0.04]">
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full gap-3 justify-start px-4 py-3 rounded-xl text-white/30 hover:text-destructive hover:bg-destructive/5 transition-all duration-300"
            aria-label="Logga ut från ditt konto"
          >
            {signingOut ? <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.5} /> : <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />}
            <span className="text-[13px] font-normal">{signingOut ? t('sidebar.signingOut') : t('sidebar.signOut')}</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full h-10 rounded-xl text-white/30 hover:text-destructive hover:bg-destructive/5 transition-all duration-300"
            aria-label="Logga ut från ditt konto"
          >
            {signingOut ? <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.5} /> : <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

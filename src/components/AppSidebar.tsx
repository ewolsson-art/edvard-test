import { CalendarDays, BarChart3, LogOut, UserCircle, Users, Home, FileText, Settings, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingNotifications } from "@/hooks/usePendingNotifications";
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
    label: "Dagligt",
    items: [
      { title: "Idag", url: "/", icon: CalendarDays, primary: true },
      { title: "Översikt", url: "/oversikt", icon: BarChart3 },
      { title: "Insikter", url: "/insikter", icon: Brain },
    ],
  },
  {
    label: "Konto",
    items: [
      { title: "Inställningar", url: "/installningar", icon: Settings },
    ],
  },
];

const doctorNavGroups = [
  {
    label: "Översikt",
    items: [
      { title: "Hem", url: "/lakare", icon: Home, primary: true },
      { title: "Mina patienter", url: "/mina-patienter", icon: Users },
    ],
  },
  {
    label: "Konto",
    items: [
      { title: "Min profil", url: "/profil", icon: UserCircle },
    ],
  },
];

const relativeNavGroups = [
  {
    label: "Översikt",
    items: [
      { title: "Hem", url: "/anhorig", icon: Home, primary: true },
      { title: "Rapporter", url: "/anhorig-rapporter", icon: FileText },
    ],
  },
  {
    label: "Konto",
    items: [
      { title: "Min profil", url: "/profil", icon: UserCircle },
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
  
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  const navGroups = isDoctor ? doctorNavGroups : isRelative ? relativeNavGroups : patientNavGroups;
  const homeUrl = isDoctor ? "/lakare" : isRelative ? "/anhorig" : "/";

  const getInitials = () => {
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSignOut = async () => {
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
            <Link 
              to="/profil"
              className="flex items-center gap-3.5 hover:opacity-80 transition-opacity"
              aria-label="Gå till min profil"
              onClick={() => { if (isMobile) setOpenMobile(false); }}
            >
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
            </Link>
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
          <SidebarGroup key={group.label} className={gi > 0 ? 'mt-8' : ''}>
            {!isCollapsed && (
              <div className="px-6 mb-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/25">{group.label}</span>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-3" role="menubar" aria-label={group.label}>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  const isPrimary = 'primary' in item && item.primary;
                  
                  return (
                    <SidebarMenuItem key={item.title} role="none">
                      <SidebarMenuButton asChild tooltip={item.title} role="menuitem">
                        <NavLink 
                          to={item.url} 
                          end={item.url === '/' || item.url === '/lakare' || item.url === '/anhorig'}
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
                          aria-label={item.url === '/profil' && hasPending ? `${item.title} - Du har nya notifikationer` : item.title}
                          aria-current={active ? "page" : undefined}
                          onClick={() => { if (isMobile) setOpenMobile(false); }}
                        >
                          {item.url === '/profil' && avatarUrl ? (
                            <div className="relative">
                              <Avatar className="h-[22px] w-[22px] shrink-0">
                                <AvatarImage src={avatarUrl} alt="Profilbild" className="object-cover" />
                                <AvatarFallback className="text-[10px] bg-white/[0.08] text-white/60">{getInitials()}</AvatarFallback>
                              </Avatar>
                              {hasPending && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2" aria-hidden="true">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <item.icon 
                                className={`shrink-0 transition-all duration-300 ${
                                  isPrimary ? 'h-[22px] w-[22px]' : 'h-5 w-5'
                                }`} 
                                strokeWidth={active ? 2 : 1.5}
                                aria-hidden="true" 
                              />
                              {item.url === '/profil' && hasPending && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2" aria-hidden="true">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
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
                              {item.title}
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
            className="w-full gap-3 justify-start px-4 py-3 rounded-xl text-white/30 hover:text-destructive hover:bg-destructive/5 transition-all duration-300"
            aria-label="Logga ut från ditt konto"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[13px] font-normal">Logga ut</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-full h-10 rounded-xl text-white/30 hover:text-destructive hover:bg-destructive/5 transition-all duration-300"
            aria-label="Logga ut från ditt konto"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

import { CalendarDays, BarChart3, LogOut, UserCircle, Users, Home, FileText, Settings } from "lucide-react";
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
      { title: "Idag", url: "/", icon: CalendarDays },
      { title: "Översikt", url: "/oversikt", icon: BarChart3 },
    ],
  },
  {
    label: "Konto",
    items: [
      { title: "Min profil", url: "/profil", icon: UserCircle },
      { title: "Inställningar", url: "/installningar", icon: Settings },
    ],
  },
];

const doctorNavGroups = [
  {
    label: "Översikt",
    items: [
      { title: "Hem", url: "/lakare", icon: Home },
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
      { title: "Hem", url: "/anhorig", icon: Home },
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

  const navItems = isDoctor ? doctorNavItems : isRelative ? relativeNavItems : patientNavItems;
  const homeUrl = isDoctor ? "/lakare" : isRelative ? "/anhorig" : "/";

  const getInitials = () => {
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40" aria-label="Huvudnavigering">
      <SidebarContent className="pt-6 bg-sidebar" role="navigation">
        {/* Logo/Brand */}
        <div className={`px-4 mb-8 ${isCollapsed ? 'flex justify-center px-2' : ''}`}>
          <Link 
            to={homeUrl} 
            className="block hover:opacity-80 transition-opacity"
            aria-label="Gå till startsidan"
          >
            <Logo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-2" role="menubar" aria-label="Navigeringsmeny">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title} role="none">
                  <SidebarMenuButton asChild tooltip={item.title} role="menuitem">
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/' || item.url === '/lakare' || item.url === '/anhorig'}
                      className="group relative flex items-center gap-4 px-3 py-3.5 rounded-lg transition-colors duration-200 hover:bg-muted/60 text-white/70 hover:text-white" 
                      activeClassName="bg-muted/80 text-white font-medium"
                      aria-label={item.url === '/profil' && hasPending ? `${item.title} - Du har nya notifikationer` : item.title}
                      aria-current={location.pathname === item.url ? "page" : undefined}
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                    >
                      {item.url === '/profil' && avatarUrl ? (
                        <div className="relative">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={avatarUrl} alt="Profilbild" className="object-cover" />
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">{getInitials()}</AvatarFallback>
                          </Avatar>
                          {hasPending && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" aria-hidden="true">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <item.icon className="h-5 w-5 shrink-0 transition-colors duration-200" aria-hidden="true" />
                          {item.url === '/profil' && hasPending && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" aria-hidden="true">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                            </span>
                          )}
                        </div>
                      )}
                      {!isCollapsed && (
                        <span className="text-[17px] font-medium tracking-normal">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 bg-sidebar border-t border-border/40">
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full gap-3 justify-start px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
            aria-label="Logga ut från ditt konto"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            <span className="text-[15px]">Logga ut</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-full h-10 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
            aria-label="Logga ut från ditt konto"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

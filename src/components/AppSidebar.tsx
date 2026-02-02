import { CalendarDays, BarChart3, LogOut, MessageCircle, UserCircle, Users, Home, MessagesSquare, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
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

const patientNavItems = [
  { title: "Check-in", url: "/", icon: CalendarDays },
  { title: "Översikt", url: "/oversikt", icon: BarChart3 },
  { title: "Rapporter", url: "/rapporter", icon: FileText },
  { title: "Chatt", url: "/chatt", icon: MessageCircle },
  { title: "Min profil", url: "/profil", icon: UserCircle },
];

const doctorNavItems = [
  { title: "Hem", url: "/lakare", icon: Home },
  { title: "Mina patienter", url: "/mina-patienter", icon: Users },
  { title: "Patientchatt", url: "/lakare-chatt", icon: MessagesSquare },
  { title: "Min profil", url: "/profil", icon: UserCircle },
];

const relativeNavItems = [
  { title: "Hem", url: "/anhorig", icon: Home },
  { title: "Rapporter", url: "/anhorig-rapporter", icon: FileText },
  { title: "Min profil", url: "/profil", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { firstName, fullName, avatarUrl } = useProfile();
  const { isDoctor, isPatient, isRelative, isLoading: roleLoading } = useUserRole();
  const { hasPending } = usePendingNotifications();
  const isCollapsed = state === "collapsed";

  // Determine which nav items to show based on role
  const navItems = isDoctor ? doctorNavItems : isRelative ? relativeNavItems : patientNavItems;
  const homeUrl = isDoctor ? "/lakare" : isRelative ? "/anhorig" : "/";

  // Get initials for avatar fallback
  const getInitials = () => {
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSignOut = async () => {
    await signOut();
  };


  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-6 bg-gradient-to-b from-sidebar-background to-sidebar-background/80 backdrop-blur-xl">
        {/* Logo/Brand */}
        <div className={`px-4 mb-8 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <Link 
            to={homeUrl} 
            className="block hover:opacity-80 transition-all duration-300 hover:scale-[1.02]"
          >
            <Logo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/' || item.url === '/lakare' || item.url === '/anhorig'}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-primary/5 hover:shadow-sm" 
                      activeClassName="bg-primary/10 text-primary font-medium shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-primary before:rounded-full"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {item.url === '/profil' && avatarUrl ? (
                        <div className="relative">
                          <Avatar className="h-5 w-5 shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200">
                            <AvatarImage src={avatarUrl} alt="Profilbild" />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
                          </Avatar>
                          {hasPending && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                            </span>
                          )}
                        </div>
                      ) : item.url === '/profil' ? (
                        <div className="relative">
                          <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                          {hasPending && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        </div>
                      )}
                      {!isCollapsed && (
                        <span className="text-sm tracking-wide">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-gradient-to-t from-sidebar-background via-sidebar-background to-transparent">
        {/* Logout button */}
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full gap-2 justify-start px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:text-destructive" />
            <span className="text-sm">Logga ut</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
            title="Logga ut"
          >
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

import { CalendarDays, BarChart3, LogOut, MessageCircle, UserCircle, Users, Home, MessagesSquare, FileText, Sparkles } from "lucide-react";
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
  { title: "Kännetecken", url: "/kannetecken", icon: Sparkles },
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
      <SidebarContent className="pt-8 bg-gradient-to-b from-card/95 via-card/90 to-card/80 backdrop-blur-2xl relative overflow-hidden">
        {/* Subtle decorative gradient orb */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Logo/Brand */}
        <div className={`px-5 mb-10 relative z-10 ${isCollapsed ? 'flex justify-center px-3' : ''}`}>
          <Link 
            to={homeUrl} 
            className="block hover:opacity-90 transition-all duration-500 hover:scale-[1.02] hover:translate-x-0.5"
          >
            <Logo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5 px-3">
              {navItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/' || item.url === '/lakare' || item.url === '/anhorig'}
                      className="group relative flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5" 
                      activeClassName="bg-gradient-to-r from-primary/12 to-primary/6 text-primary font-semibold shadow-lg shadow-primary/10 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-gradient-to-b before:from-primary before:to-primary/60 before:rounded-full before:shadow-lg before:shadow-primary/30"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {item.url === '/profil' && avatarUrl ? (
                        <div className="relative">
                          <Avatar className="h-6 w-6 shrink-0 ring-2 ring-background shadow-md group-hover:ring-primary/30 group-hover:shadow-lg transition-all duration-300">
                            <AvatarImage src={avatarUrl} alt="Profilbild" className="object-cover" />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">{getInitials()}</AvatarFallback>
                          </Avatar>
                          {hasPending && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-br from-destructive to-destructive/80 shadow-lg shadow-destructive/40"></span>
                            </span>
                          )}
                        </div>
                      ) : item.url === '/profil' ? (
                        <div className="relative flex items-center justify-center w-6 h-6">
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 group-hover:from-primary/15 group-hover:to-primary/5 transition-all duration-300" />
                          <item.icon className="h-4 w-4 shrink-0 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          {hasPending && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-br from-destructive to-destructive/80 shadow-lg shadow-destructive/40"></span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative flex items-center justify-center w-6 h-6">
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 group-hover:from-primary/15 group-hover:to-primary/5 transition-all duration-300" />
                          <item.icon className="h-4 w-4 shrink-0 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                        </div>
                      )}
                      {!isCollapsed && (
                        <span className="text-sm font-medium tracking-wide transition-colors duration-300">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-gradient-to-t from-card via-card/95 to-transparent relative">
        {/* Subtle separator line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Logout button */}
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full gap-3 justify-start px-4 py-3 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 transition-all duration-300 group hover:shadow-lg hover:shadow-destructive/5"
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 group-hover:from-destructive/20 group-hover:to-destructive/10 transition-all duration-300" />
              <LogOut className="h-4 w-4 relative z-10 transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="text-sm font-medium">Logga ut</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-full h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 transition-all duration-300 group"
            title="Logga ut"
          >
            <LogOut className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

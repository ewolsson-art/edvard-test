import { CalendarDays, BarChart3, Pill, FileText, LogOut, MessageCircle, UserCircle, Users, Stethoscope, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
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
  { title: "Mediciner", url: "/mediciner", icon: Pill },
  { title: "Rapporter", url: "/rapporter", icon: FileText },
  { title: "Chatt", url: "/chatt", icon: MessageCircle },
  { title: "Mina läkare", url: "/mina-lakare", icon: Users },
];

const doctorNavItems = [
  { title: "Hem", url: "/lakare", icon: Home },
  { title: "Mina patienter", url: "/mina-patienter", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { firstName, fullName } = useProfile();
  const { isDoctor, isPatient, isLoading: roleLoading } = useUserRole();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
  };

  // Determine which nav items to show based on role
  const navItems = isDoctor ? doctorNavItems : patientNavItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {/* Logo/Brand */}
        <div className="px-4 mb-6">
          <Link to={isDoctor ? "/lakare" : "/"} className="block hover:opacity-80 transition-opacity">
            {isCollapsed ? (
              <img src={logo} alt="Between Clouds" className="w-8 h-8 object-contain" />
            ) : (
              <div className="flex items-center gap-3">
                <img src={logo} alt="Between Clouds" className="w-10 h-10 object-contain" />
                <h2 className="font-display text-lg font-bold text-foreground">
                  Between Clouds
                </h2>
              </div>
            )}
          </Link>
        </div>

        {/* Role indicator */}
        {!isCollapsed && !roleLoading && (
          <div className="px-4 mb-4">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
              {isDoctor ? 'Läkare' : 'Patient'}
            </span>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/' || item.url === '/lakare'}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {/* Profile link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Min profil">
              <NavLink 
                to="/profil" 
                end 
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted/50" 
                activeClassName="bg-muted text-primary font-medium"
              >
                <UserCircle className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {fullName || firstName || 'Min profil'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Logout button */}
        {!isCollapsed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logga ut
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-full"
            title="Logga ut"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

import { CalendarDays, BarChart3, LogOut, MessageCircle, UserCircle, Users, Home, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
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
  { title: "Chatt", url: "/chatt", icon: MessageCircle },
  { title: "Min profil", url: "/profil", icon: UserCircle },
];

const doctorNavItems = [
  { title: "Hem", url: "/lakare", icon: Home },
  { title: "Mina patienter", url: "/mina-patienter", icon: Users },
  { title: "Patientchatt", url: "/lakare-chatt", icon: MessagesSquare },
  { title: "Min profil", url: "/profil", icon: UserCircle },
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
            <Logo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
          </Link>
        </div>


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

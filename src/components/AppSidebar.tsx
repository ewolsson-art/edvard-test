import { CalendarDays, CalendarRange, Calendar, BarChart3, Pill, FileText, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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

const navItems = [
  { title: "Check-in", url: "/", icon: CalendarDays },
  { title: "Veckoöversikt", url: "/vecka", icon: CalendarRange },
  { title: "Månadsöversikt", url: "/manad", icon: Calendar },
  { title: "Årsöversikt", url: "/ar", icon: BarChart3 },
  { title: "Mediciner", url: "/mediciner", icon: Pill },
  { title: "Rapporter", url: "/rapporter", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {/* Logo/Brand */}
        <div className="px-4 mb-6">
          {!isCollapsed && (
            <Link to="/" className="block hover:opacity-80 transition-opacity">
              <h2 className="font-display text-xl font-bold text-foreground">
                Between Clouds
              </h2>
            </Link>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end 
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

      <SidebarFooter className="p-4">
        {!isCollapsed && user && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logga ut
            </Button>
          </div>
        )}
        {isCollapsed && (
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

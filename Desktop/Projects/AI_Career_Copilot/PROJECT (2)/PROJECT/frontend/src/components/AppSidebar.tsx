import {
  LayoutDashboard,
  FileUp,
  Briefcase,
  Wand2,
  Lightbulb,
  History as HistoryIcon,
  LogOut,
  Sparkles,
  UserCircle,
  BookOpen,
  ClipboardList,
  BarChart2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainWorkflowItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Upload Resume", url: "/upload", icon: FileUp },
  { title: "ATS Analysis", url: "/analysis", icon: Briefcase },
  { title: "AI Resume Tailor", url: "/tailor", icon: Wand2 },
  { title: "AI Suggestions", url: "/suggestions", icon: Lightbulb },
  { title: "History", url: "/history", icon: HistoryIcon },
];

const aiToolItems = [
  { title: "AI Gap Closer", url: "/gap-closer", icon: BookOpen },
];

const careerHubItems = [
  { title: "Applications", url: "/applications", icon: ClipboardList },
  { title: "Career Analytics", url: "/career-analytics", icon: BarChart2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.25)] animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sm text-foreground">AI Career</span>
            <span className="text-xs text-muted-foreground">Copilot</span>
          </div>
        )}
      </div>

      <SidebarContent className="px-2">
        {/* Main Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground px-3 py-1">Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainWorkflowItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground px-3 py-1">AI Tools</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {aiToolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Career Hub Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground px-3 py-1">Career Hub</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {careerHubItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10">
              <NavLink
                to="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                activeClassName="bg-accent text-accent-foreground"
              >
                <UserCircle className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10">
              <NavLink
                to="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                activeClassName=""
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Log out</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

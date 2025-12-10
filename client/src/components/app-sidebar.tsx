import { Link, useLocation } from "wouter";
import {
  Home,
  Calendar,
  Users,
  Package,
  History,
  Receipt,
  Settings,
  Flame,
  Star,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavItems = [
  {
    title: "الرئيسية",
    url: "/",
    icon: Home,
  },
  {
    title: "الطلعات",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "المشاركين",
    url: "/participants",
    icon: Users,
  },
  {
    title: "المستلزمات",
    url: "/items",
    icon: Package,
  },
  {
    title: "السجل",
    url: "/history",
    icon: History,
  },
  {
    title: "كشف الحساب",
    url: "/statement",
    icon: Receipt,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link
          href="/"
          className="flex items-center gap-3"
          data-testid="link-home-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold">كشتة</span>
            <span className="text-xs text-muted-foreground">منظم الطلعات</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive =
                  location === item.url ||
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.url}
                        data-testid={`link-nav-${item.url.replace("/", "") || "home"}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>الإعدادات</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/settings"}
                  tooltip="الإعدادات"
                >
                  <Link href="/settings" data-testid="link-nav-settings">
                    <Settings className="h-4 w-4" />
                    <span>الإعدادات</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            المطور: اسامة السميطي 2025
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

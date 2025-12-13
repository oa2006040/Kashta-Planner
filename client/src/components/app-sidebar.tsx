import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Calendar,
  Package,
  History,
  Receipt,
  Wallet,
  FileText,
  Settings,
  Flame,
  Star,
  Bell,
  UserCog,
  LogOut,
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
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const [location] = useLocation();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, handleLogout, isLoggingOut } = useAuth();
  
  const { data: notificationCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const mainNavItems = [
    {
      title: t("الرئيسية", "Home"),
      url: "/",
      icon: Home,
    },
    {
      title: t("الطلعات", "Events"),
      url: "/events",
      icon: Calendar,
    },
    {
      title: t("المستلزمات", "Items"),
      url: "/items",
      icon: Package,
    },
    {
      title: t("السجل", "History"),
      url: "/history",
      icon: History,
    },
    // Statement, Debt, Settlement Log - visible to all users (filtered by user on backend)
    {
      title: t("كشف الحساب", "Statement"),
      url: "/statement",
      icon: Receipt,
    },
    {
      title: t("محفظة الديون", "Debt Portfolio"),
      url: "/debt",
      icon: Wallet,
    },
    {
      title: t("سجل التسويات", "Settlement Log"),
      url: "/settlement-log",
      icon: FileText,
    },
  ];

  return (
    <Sidebar side={language === "ar" ? "right" : "left"} collapsible="icon">
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
            <span className="text-lg font-bold">{t("كشتة", "Kashta")}</span>
            <span className="text-xs text-muted-foreground">{t("منظم الطلعات", "Trip Planner")}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/notifications"}
                  tooltip={t("التنبيهات", "Notifications")}
                >
                  <Link href="/notifications" data-testid="link-nav-notifications">
                    <Bell className="h-4 w-4" />
                    <span>{t("التنبيهات", "Notifications")}</span>
                  </Link>
                </SidebarMenuButton>
                {notificationCount && notificationCount.count > 0 && (
                  <SidebarMenuBadge 
                    className="bg-destructive text-destructive-foreground"
                    data-testid="badge-notification-count"
                  >
                    {notificationCount.count > 9 ? "9+" : notificationCount.count}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("القائمة الرئيسية", "Main Menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive =
                  location === item.url ||
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
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
          <SidebarGroupLabel>{t("الإعدادات", "Settings")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/account"}
                  tooltip={t("الحساب", "Account")}
                >
                  <Link href="/account" data-testid="link-nav-account">
                    <UserCog className="h-4 w-4" />
                    <span>{t("الحساب", "Account")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/settings"}
                  tooltip={t("الإعدادات", "Settings")}
                >
                  <Link href="/settings" data-testid="link-nav-settings">
                    <Settings className="h-4 w-4" />
                    <span>{t("الإعدادات", "Settings")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAuthenticated && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={t("تسجيل الخروج", "Logout")}
                  >
                    <button 
                      type="button" 
                      onClick={handleLogout} 
                      disabled={isLoggingOut}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{isLoggingOut ? t("جاري الخروج...", "Logging out...") : t("تسجيل الخروج", "Logout")}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {t("المطور: اسامة السميطي 2025", "Developer: Osama Alsumiti 2025")}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

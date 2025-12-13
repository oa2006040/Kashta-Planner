import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Flame, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import EventForm from "@/pages/event-form";
import EventDetail from "@/pages/event-detail";
import ContributionForm from "@/pages/contribution-form";
import EventParticipantsForm from "@/pages/event-participants-form";
import Participants from "@/pages/participants";
import ParticipantForm from "@/pages/participant-form";
import Items from "@/pages/items";
import History from "@/pages/history";
import Statement from "@/pages/statement";
import Debt from "@/pages/debt";
import DebtDetail from "@/pages/debt-detail";
import SettlementLog from "@/pages/settlement-log";
import Settings from "@/pages/settings";
import SharedEvent from "@/pages/shared-event";
import Notifications from "@/pages/notifications";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/events" component={Events} />
      <Route path="/events/new" component={EventForm} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/events/:id/edit" component={EventForm} />
      <Route path="/events/:id/items" component={ContributionForm} />
      <Route path="/events/:id/participants" component={EventParticipantsForm} />
      <Route path="/participants" component={Participants} />
      <Route path="/participants/new" component={ParticipantForm} />
      <Route path="/participants/:id/edit" component={ParticipantForm} />
      <Route path="/items" component={Items} />
      <Route path="/history" component={History} />
      <Route path="/statement" component={Statement} />
      <Route path="/debt" component={Debt} />
      <Route path="/debt/:participantId" component={DebtDetail} />
      <Route path="/settlement-log" component={SettlementLog} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MainLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="flex h-14 sm:h-16 items-center justify-between gap-2 border-b px-3 sm:px-4 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger className="h-10 w-10 sm:h-9 sm:w-9" data-testid="button-sidebar-toggle" />
              <Link href="/" className="flex items-center gap-2 sm:hidden" data-testid="link-home-logo-mobile">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Flame className="h-4 w-4" />
                </div>
                <span className="font-bold">كشتة</span>
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <MainRouter />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function AuthenticatedRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <MainLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="kashta-ui-theme">
        <LanguageProvider defaultLanguage="ar" storageKey="kashta-language">
          <TooltipProvider>
            <Switch>
              <Route path="/share/:token" component={SharedEvent} />
              <Route>
                <AuthenticatedRouter />
              </Route>
            </Switch>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
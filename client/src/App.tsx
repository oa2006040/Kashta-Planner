import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import EventForm from "@/pages/event-form";
import EventDetail from "@/pages/event-detail";
import Participants from "@/pages/participants";
import ParticipantForm from "@/pages/participant-form";
import Items from "@/pages/items";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/events" component={Events} />
      <Route path="/events/new" component={EventForm} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/events/:id/edit" component={EventForm} />
      <Route path="/participants" component={Participants} />
      <Route path="/participants/new" component={ParticipantForm} />
      <Route path="/participants/:id/edit" component={ParticipantForm} />
      <Route path="/items" component={Items} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="kashta-ui-theme">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <header className="flex h-14 items-center justify-between gap-4 border-b px-4 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
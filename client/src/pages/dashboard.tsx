import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import {
  Calendar,
  Users,
  Package,
  TrendingUp,
  Plus,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Flame,
  Star,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Undo2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatArabicDate,
  formatHijriDate,
  formatCurrency,
  formatNumber,
} from "@/lib/constants";
import { AvatarIcon, getAvatarColor } from "@/components/avatar-icon";
import type { Event, Participant, Category } from "@shared/schema";

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalParticipants: number;
  totalItems: number;
  totalBudget: number;
  paidAmount: number;
  unpaidAmount: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <Card className="relative overflow-visible">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500 dark:text-green-400" />
                {trend}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
          </div>
          <Skeleton className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string, t: (ar: string, en: string) => string) {
  switch (status) {
    case "upcoming":
      return {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        label: t("قادمة", "Upcoming"),
      };
    case "ongoing":
      return {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        label: t("جارية", "Ongoing"),
      };
    case "completed":
      return {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
        label: t("منتهية", "Completed"),
      };
    case "cancelled":
      return {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        label: t("ملغاة", "Cancelled"),
      };
    default:
      return {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        label: t("قادمة", "Upcoming"),
      };
  }
}

function EventCard({ event, onStatusChange }: { event: Event; onStatusChange?: (id: number, status: string) => void }) {
  const { t } = useLanguage();
  const statusBadge = getStatusBadge(event.status || "upcoming", t);
  const eventDate = new Date(event.date);
  const isUpcoming = event.status === "upcoming";
  const isCancelled = event.status === "cancelled";

  const handleCancelToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(event.id, isCancelled ? "upcoming" : "cancelled");
    }
  };

  return (
    <Link href={`/events/${event.id}`}>
      <Card
        className="hover-elevate cursor-pointer transition-all"
        data-testid={`card-event-${event.id}`}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-semibold truncate text-sm sm:text-base">{event.title}</h3>
                <Badge
                  variant="secondary"
                  className={`${statusBadge.className} text-xs`}
                >
                  {statusBadge.label}
                </Badge>
              </div>

              {event.location && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{formatArabicDate(eventDate)}</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 flex-col items-center justify-center rounded-lg sm:rounded-xl bg-primary/10">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {eventDate.toLocaleDateString("ar-SA", { weekday: "short" })}
                </span>
                <span className="text-base sm:text-lg font-bold text-primary">
                  {eventDate.getDate()}
                </span>
              </div>
              {(isUpcoming || isCancelled) && onStatusChange && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 sm:h-9 sm:w-9 ${isCancelled ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"}`}
                  onClick={handleCancelToggle}
                  data-testid={`button-toggle-cancel-${event.id}`}
                >
                  {isCancelled ? (
                    <Undo2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EventCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 space-y-1.5 sm:space-y-2">
            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-28" />
          </div>
          <Skeleton className="h-11 w-11 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    refetchInterval: 5000,
  });

  const { data: participants, isLoading: participantsLoading } = useQuery<
    Participant[]
  >({
    queryKey: ["/api/participants"],
    refetchInterval: 5000,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/events/${id}`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: variables.status === "cancelled" ? t("تم إلغاء الطلعة", "Event Cancelled") : t("تم استعادة الطلعة", "Event Restored"),
        description: variables.status === "cancelled" ? t("تم تغيير حالة الطلعة إلى ملغاة", "Event status changed to cancelled") : t("تم استعادة الطلعة إلى قادمة", "Event restored to upcoming"),
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("تسويات") || error.message.includes("ديون")
        ? t("لا يمكن إلغاء الطلعة لأنها تحتوي على تسويات وديون", "Cannot cancel event with unsettled debts")
        : t("حدث خطأ أثناء تحديث حالة الطلعة", "Error updating event status");
      toast({
        title: t("خطأ", "Error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    toggleStatusMutation.mutate({ id, status });
  };

  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllCancelled, setShowAllCancelled] = useState(false);
  
  // Filter events by status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const ongoingEvents = events?.filter((e) => e.status === "ongoing") || [];
  const upcomingEvents = events?.filter((e) => e.status === "upcoming") || [];
  const completedEvents = events?.filter((e) => e.status === "completed") || [];
  // Only show cancelled events with future dates in dashboard
  const cancelledEvents = events?.filter((e) => {
    if (e.status !== "cancelled") return false;
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }) || [];
  
  // Display logic - separate sections
  const displayedUpcoming = showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 2);
  const displayedCancelled = showAllCancelled ? cancelledEvents : cancelledEvents.slice(0, 2);
  const displayedCompleted = completedEvents.slice(0, 1);
  
  const recentParticipants = participants?.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-l from-primary/20 via-primary/10 to-background p-4 sm:p-8">
        <div className="relative z-10 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary text-primary-foreground shrink-0">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">{t("أهلاً بك في كشتة", "Welcome to Kashta")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("رتب كشتاتك معانا بكل سهولة", "Plan your desert trips with ease")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link href="/events/new">
              <Button size="default" className="h-10 sm:h-9" data-testid="button-create-event">
                <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                {t("طلعة جديدة", "New Trip")}
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" size="default" className="h-10 sm:h-9" data-testid="button-view-events">
                {t("عرض الطلعات", "View Trips")}
                <ChevronLeft className={`h-4 w-4 ${language === "ar" ? "mr-2" : "ml-2"}`} />
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-8 left-1/4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Events with breakdown */}
            <Card className="relative overflow-visible">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("إجمالي الطلعات", "Total Events")}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{formatNumber(stats?.totalEvents || 0)}</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs">
                      <span className="text-green-600 dark:text-green-400">{stats?.ongoingEvents || 0} {t("جارية", "Ongoing")}</span>
                      <span className="text-blue-600 dark:text-blue-400">{stats?.upcomingEvents || 0} {t("قادمة", "Upcoming")}</span>
                      <span className="text-gray-500">{stats?.completedEvents || 0} {t("منتهية", "Completed")}</span>
                      {(stats?.cancelledEvents || 0) > 0 && (
                        <span className="text-red-500">{stats?.cancelledEvents} {t("ملغاة", "Cancelled")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                    <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Total Budget */}
            <Card className="relative overflow-visible">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("إجمالي المدفوعات", "Total Payments")}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats?.totalBudget || 0)}</p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Paid Debts */}
            <Card className="relative overflow-visible">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("الديون المدفوعة", "Paid Debts")}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats?.paidAmount || 0)}</p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Unpaid Debts */}
            <Card className="relative overflow-visible">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("الديون غير المدفوعة", "Unpaid Debts")}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(stats?.unpaidAmount || 0)}</p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
                    <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Events Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Ongoing Events - Show All */}
          {eventsLoading ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <h2 className="text-lg sm:text-xl font-semibold">{t("الطلعات الجارية", "Ongoing Events")}</h2>
              </div>
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : ongoingEvents.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <h2 className="text-lg sm:text-xl font-semibold">{t("الطلعات الجارية", "Ongoing Events")}</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {ongoingEvents.length}
                </Badge>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {ongoingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Upcoming Events - Show 2 with expand */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold">{t("الطلعات القادمة", "Upcoming Events")}</h2>
                {upcomingEvents.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {upcomingEvents.length}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {eventsLoading ? (
                <>
                  <EventCardSkeleton />
                  <EventCardSkeleton />
                </>
              ) : displayedUpcoming.length > 0 ? (
                <>
                  {displayedUpcoming.map((event) => (
                    <EventCard key={event.id} event={event} onStatusChange={handleStatusChange} />
                  ))}
                  {upcomingEvents.length > 2 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                      data-testid="button-toggle-upcoming"
                    >
                      {showAllUpcoming ? (
                        <>
                          <ChevronUp className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                          {t("عرض أقل", "Show Less")}
                        </>
                      ) : (
                        <>
                          <ChevronDown className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                          {t("عرض الكل", "Show All")} ({upcomingEvents.length})
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-2">{t("لا توجد طلعات قادمة", "No Upcoming Events")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("ابدأ بإنشاء طلعة جديدة لك ولأصدقائك", "Start by creating a new trip for you and your friends")}
                    </p>
                    <Link href="/events/new">
                      <Button size="sm" data-testid="button-create-first-event">
                        <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                        {t("إنشاء طلعة", "Create Trip")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Completed Events - Show 1 with link to events page */}
          {!eventsLoading && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <h2 className="text-lg sm:text-xl font-semibold">{t("الطلعات المنتهية", "Completed Events")}</h2>
                  {completedEvents.length > 0 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                      {completedEvents.length}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {displayedCompleted.length > 0 ? (
                  <>
                    {displayedCompleted.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                    {completedEvents.length > 1 && (
                      <Link href="/events">
                        <Button
                          variant="outline"
                          className="w-full h-10 sm:h-9"
                          data-testid="button-view-all-completed"
                        >
                          <ChevronDown className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                          {t("عرض كل الطلعات", "View All Events")} ({completedEvents.length})
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-6 sm:py-8 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        {t("لا توجد طلعات منتهية بعد", "No completed events yet")}
                      </p>
                      <Link href="/events">
                        <Button
                          variant="outline"
                          className="h-10 sm:h-9"
                          data-testid="button-view-all-events"
                        >
                          {t("عرض كل الطلعات", "View All Events")}
                          <ChevronLeft className={`h-4 w-4 ${language === "ar" ? "mr-1" : "ml-1"}`} />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Cancelled Events - Below Completed */}
          {!eventsLoading && cancelledEvents.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <h2 className="text-lg sm:text-xl font-semibold">{t("الطلعات الملغاة", "Cancelled Events")}</h2>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {cancelledEvents.length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {displayedCancelled.map((event) => (
                  <EventCard key={event.id} event={event} onStatusChange={handleStatusChange} />
                ))}
                {cancelledEvents.length > 2 && (
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-9"
                    onClick={() => setShowAllCancelled(!showAllCancelled)}
                    data-testid="button-toggle-cancelled"
                  >
                    {showAllCancelled ? (
                      <>
                        <ChevronUp className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                        {t("عرض أقل", "Show Less")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                        {t("عرض الكل", "Show All")} ({cancelledEvents.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Hidden on mobile, shown as section on tablet+ */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("إجراءات سريعة", "Quick Actions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-6 pt-0 sm:pt-0">
              <Link href="/events/new" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 sm:h-9"
                  data-testid="button-quick-new-event"
                >
                  <Calendar className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("إضافة طلعة", "Add Event")}
                </Button>
              </Link>
              <Link href="/participants/new" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 sm:h-9"
                  data-testid="button-quick-new-participant"
                >
                  <Users className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("إضافة مشارك", "Add Participant")}
                </Button>
              </Link>
              <Link href="/items" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 sm:h-9"
                  data-testid="button-quick-items"
                >
                  <Package className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("إدارة المستلزمات", "Manage Items")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Participants */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {t("المشاركين", "Participants")}
                </CardTitle>
                <Link href="/participants">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 sm:h-9"
                    data-testid="link-all-participants"
                  >
                    {t("الكل", "All")}
                    <ChevronLeft className={`h-3 w-3 ${language === "ar" ? "mr-1" : "ml-1"}`} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {participantsLoading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3">
                      <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 sm:w-24 mb-1" />
                        <Skeleton className="h-3 w-12 sm:w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentParticipants && recentParticipants.length > 0 ? (
                <div className="space-y-1 sm:space-y-2">
                  {recentParticipants.slice(0, 5).map((participant) => (
                    <Link
                      key={participant.id}
                      href={`/participants/${participant.id}/edit`}
                    >
                      <div
                        className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover-elevate cursor-pointer -mx-1 sm:-mx-2"
                        data-testid={`card-participant-${participant.id}`}
                      >
                        <div
                          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0"
                          style={{
                            backgroundColor: `${getAvatarColor(participant.name)}20`,
                          }}
                        >
                          <AvatarIcon
                            icon={participant.avatar}
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            color={getAvatarColor(participant.name)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm sm:text-base">
                            {participant.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatNumber(participant.tripCount || 0)} {t("طلعة", "trips")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("لا يوجد مشاركين", "No participants")}
                  </p>
                  <Link href="/participants/new">
                    <Button
                      variant="outline"
                      className="h-10 sm:h-9"
                      data-testid="button-add-first-participant"
                    >
                      <Plus className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                      {t("إضافة", "Add")}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date Card - Hijri & Gregorian */}
          <Card className="bg-gradient-to-l from-primary/10 to-transparent">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t("التاريخ الهجري", "Hijri Date")}</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {formatHijriDate(new Date())}
                  </p>
                </div>
                <div className="border-t border-border pt-2 sm:pt-3 space-y-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t("التاريخ الميلادي", "Gregorian Date")}</p>
                  <p className="text-sm sm:text-base font-medium">
                    {formatArabicDate(new Date())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

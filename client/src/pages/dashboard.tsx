import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
  totalParticipants: number;
  totalItems: number;
  totalBudget: number;
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
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "upcoming":
      return {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        label: "قادمة",
      };
    case "ongoing":
      return {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        label: "جارية",
      };
    case "completed":
      return {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
        label: "منتهية",
      };
    case "cancelled":
      return {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        label: "ملغاة",
      };
    default:
      return {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        label: "قادمة",
      };
  }
}

function EventCard({ event }: { event: Event }) {
  const statusBadge = getStatusBadge(event.status || "upcoming");
  const eventDate = new Date(event.date);

  return (
    <Link href={`/events/${event.id}`}>
      <Card
        className="hover-elevate cursor-pointer transition-all"
        data-testid={`card-event-${event.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{event.title}</h3>
                <Badge
                  variant="secondary"
                  className={`${statusBadge.className} text-xs`}
                >
                  {statusBadge.label}
                </Badge>
              </div>

              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{formatArabicDate(eventDate)}</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 text-center shrink-0">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary/10">
                <span className="text-xs text-muted-foreground">
                  {eventDate.toLocaleDateString("ar-SA", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold text-primary">
                  {eventDate.getDate()}
                </span>
              </div>
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-14 w-14 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
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

  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  
  // Filter events by status
  const ongoingEvents = events?.filter((e) => e.status === "ongoing") || [];
  const upcomingEvents = events?.filter((e) => e.status === "upcoming") || [];
  const completedEvents = events?.filter((e) => e.status === "completed") || [];
  
  // Display logic
  const displayedUpcoming = showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 2);
  const displayedCompleted = completedEvents.slice(0, 1);
  
  const recentParticipants = participants?.slice(0, 5);

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/20 via-primary/10 to-background p-8">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">أهلاً بك في كشتة</h1>
              <p className="text-muted-foreground">
                رتب كشتاتك معانا بكل سهولة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/events/new">
              <Button data-testid="button-create-event">
                <Plus className="h-4 w-4 ml-2" />
                طلعة جديدة
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" data-testid="button-view-events">
                عرض الطلعات
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-8 left-1/4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="إجمالي الطلعات"
              value={formatNumber(stats?.totalEvents || 0)}
              icon={Calendar}
              trend={
                stats?.totalEvents ? `${stats.upcomingEvents} قادمة` : undefined
              }
            />
            <StatCard
              title="المشاركين"
              value={formatNumber(stats?.totalParticipants || 0)}
              icon={Users}
            />
            <StatCard
              title="المستلزمات"
              value={formatNumber(stats?.totalItems || 0)}
              icon={Package}
            />
            <StatCard
              title="إجمالي الميزانية"
              value={formatCurrency(stats?.totalBudget || 0)}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Events Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ongoing Events - Show All */}
          {eventsLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-semibold">الطلعات الجارية</h2>
              </div>
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : ongoingEvents.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-semibold">الطلعات الجارية</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {ongoingEvents.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {ongoingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Upcoming Events - Show 2 with expand */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">الطلعات القادمة</h2>
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
                    <EventCard key={event.id} event={event} />
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
                          <ChevronUp className="h-4 w-4 ml-2" />
                          عرض أقل
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 ml-2" />
                          عرض الكل ({upcomingEvents.length})
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
                    <h3 className="font-medium mb-2">لا توجد طلعات قادمة</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      ابدأ بإنشاء طلعة جديدة لك ولأصدقائك
                    </p>
                    <Link href="/events/new">
                      <Button size="sm" data-testid="button-create-first-event">
                        <Plus className="h-4 w-4 ml-2" />
                        إنشاء طلعة
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Completed Events - Show 1 with link to events page */}
          {!eventsLoading && completedEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">الطلعات المنتهية</h2>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                    {completedEvents.length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {displayedCompleted.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
                {completedEvents.length > 1 && (
                  <Link href="/events">
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-view-all-completed"
                    >
                      <ChevronDown className="h-4 w-4 ml-2" />
                      عرض كل الطلعات ({completedEvents.length})
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/events/new" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-quick-new-event"
                >
                  <Calendar className="h-4 w-4 ml-2" />
                  إضافة طلعة
                </Button>
              </Link>
              <Link href="/participants/new" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-quick-new-participant"
                >
                  <Users className="h-4 w-4 ml-2" />
                  إضافة مشارك
                </Button>
              </Link>
              <Link href="/items" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-quick-items"
                >
                  <Package className="h-4 w-4 ml-2" />
                  إدارة المستلزمات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Participants */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  المشاركين
                </CardTitle>
                <Link href="/participants">
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="link-all-participants"
                  >
                    الكل
                    <ChevronLeft className="h-3 w-3 mr-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {participantsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentParticipants && recentParticipants.length > 0 ? (
                <div className="space-y-3">
                  {recentParticipants.slice(0, 5).map((participant) => (
                    <Link
                      key={participant.id}
                      href={`/participants/${participant.id}/edit`}
                    >
                      <div
                        className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer -mx-2"
                        data-testid={`card-participant-${participant.id}`}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: `${getAvatarColor(participant.name)}20`,
                          }}
                        >
                          <AvatarIcon
                            icon={participant.avatar}
                            className="h-5 w-5"
                            color={getAvatarColor(participant.name)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {participant.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(participant.tripCount || 0)} طلعة
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    لا يوجد مشاركين
                  </p>
                  <Link href="/participants/new">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="button-add-first-participant"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hijri Date Card */}
          <Card className="bg-gradient-to-l from-primary/10 to-transparent">
            <CardContent className="p-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">التاريخ الهجري</p>
                <p className="text-lg font-semibold">
                  {formatHijriDate(new Date())}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatArabicDate(new Date())}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

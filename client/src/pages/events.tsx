import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronLeft,
  LayoutGrid,
  List
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatArabicDate, formatCurrency } from "@/lib/constants";
import type { Event } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case 'upcoming':
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'قادمة' };
    case 'ongoing':
      return { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'جارية' };
    case 'completed':
      return { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300', label: 'منتهية' };
    case 'cancelled':
      return { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'ملغاة' };
    default:
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'قادمة' };
  }
}

function EventCard({ event, view }: { event: Event; view: "grid" | "list" }) {
  const statusBadge = getStatusBadge(event.status || 'upcoming');
  const eventDate = new Date(event.date);

  if (view === "list") {
    return (
      <Link href={`/events/${event.id}`}>
        <Card className="hover-elevate cursor-pointer" data-testid={`card-event-${event.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {eventDate.toLocaleDateString('ar-SA', { weekday: 'short' })}
                </span>
                <span className="text-xl font-bold text-primary">
                  {eventDate.getDate()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{event.title}</h3>
                  <Badge variant="secondary" className={`${statusBadge.className} text-xs`}>
                    {statusBadge.label}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatArabicDate(eventDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {event.totalBudget && parseFloat(event.totalBudget) > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {formatCurrency(event.totalBudget)}
                  </Badge>
                )}
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-event-${event.id}`}>
        <CardContent className="p-0">
          <div className="h-32 bg-gradient-to-l from-primary/30 via-primary/20 to-primary/10 rounded-t-lg flex items-center justify-center">
            <Calendar className="h-12 w-12 text-primary/50" />
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold line-clamp-1">{event.title}</h3>
              <Badge variant="secondary" className={`${statusBadge.className} text-xs shrink-0`}>
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

            {event.totalBudget && parseFloat(event.totalBudget) > 0 && (
              <div className="pt-2 border-t">
                <span className="text-sm font-medium">{formatCurrency(event.totalBudget)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EventCardSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Skeleton className="h-32 rounded-t-lg" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Events() {
  const [view, setView] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const filteredEvents = events?.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الطلعات</h1>
          <p className="text-muted-foreground">إدارة جميع الطلعات والرحلات البرية</p>
        </div>
        <Link href="/events/new">
          <Button data-testid="button-new-event">
            <Plus className="h-4 w-4 ml-2" />
            طلعة جديدة
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن طلعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
            data-testid="input-search-events"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="upcoming">قادمة</SelectItem>
            <SelectItem value="ongoing">جارية</SelectItem>
            <SelectItem value="completed">منتهية</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("grid")}
            data-testid="button-view-grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Events List/Grid */}
      {isLoading ? (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <EventCardSkeleton key={i} view={view} />
          ))}
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} view={view} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || statusFilter !== "all" ? "لا توجد نتائج" : "لا توجد طلعات"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery || statusFilter !== "all" 
                ? "جرب تغيير معايير البحث" 
                : "ابدأ بإنشاء طلعتك الأولى وادعُ أصدقاءك للمشاركة"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link href="/events/new">
                <Button data-testid="button-create-first-event">
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء طلعة جديدة
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
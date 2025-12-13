import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Calendar, Users, Wallet, Check, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { NotificationWithPayload } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "event_invite":
      return <Calendar className="h-4 w-4" />;
    case "manager_assigned":
    case "role_changed":
      return <Users className="h-4 w-4" />;
    case "debt_claim":
    case "debt_confirmed":
    case "debt_rejected":
      return <Wallet className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function NotificationTypeBadge({ type, t }: { type: string; t: (ar: string, en: string) => string }) {
  const labels: Record<string, { ar: string; en: string }> = {
    event_invite: { ar: "دعوة", en: "Invitation" },
    manager_assigned: { ar: "تعيين مدير", en: "Manager Assigned" },
    role_changed: { ar: "تغيير دور", en: "Role Changed" },
    debt_claim: { ar: "مطالبة دين", en: "Debt Claim" },
    debt_confirmed: { ar: "تأكيد دين", en: "Debt Confirmed" },
    debt_rejected: { ar: "رفض دين", en: "Debt Rejected" },
  };
  
  const label = labels[type] || { ar: "إشعار", en: "Notification" };
  
  return (
    <Badge variant="outline" className="text-xs">
      {t(label.ar, label.en)}
    </Badge>
  );
}

export default function Notifications() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loadingNotificationIds, setLoadingNotificationIds] = useState<Set<string>>(new Set());
  
  const addLoadingId = (id: string) => {
    setLoadingNotificationIds(prev => new Set(prev).add(id));
  };
  
  const removeLoadingId = (id: string) => {
    setLoadingNotificationIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };
  
  const { data: notifications, isLoading } = useQuery<NotificationWithPayload[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });
  
  const acceptInviteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      addLoadingId(notificationId);
      return apiRequest("POST", `/api/notifications/${notificationId}/accept-invite`);
    },
    onSuccess: (data: any, notificationId: string) => {
      removeLoadingId(notificationId);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: t("تم قبول الدعوة", "Invitation accepted"),
        description: t("يمكنك الآن مشاهدة الفعالية", "You can now view the event"),
      });
      if (data?.eventId) {
        setLocation(`/events/${data.eventId}`);
      }
    },
    onError: (_, notificationId: string) => {
      removeLoadingId(notificationId);
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء قبول الدعوة", "Failed to accept invitation"),
        variant: "destructive",
      });
    },
  });
  
  const declineInviteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      addLoadingId(notificationId);
      return apiRequest("POST", `/api/notifications/${notificationId}/decline-invite`);
    },
    onSuccess: (_, notificationId: string) => {
      removeLoadingId(notificationId);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      toast({
        title: t("تم رفض الدعوة", "Invitation declined"),
      });
    },
    onError: (_, notificationId: string) => {
      removeLoadingId(notificationId);
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء رفض الدعوة", "Failed to decline invitation"),
        variant: "destructive",
      });
    },
  });
  
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return format(d, language === "ar" ? "d MMMM yyyy HH:mm" : "MMM d, yyyy HH:mm", {
      locale: language === "ar" ? ar : undefined,
    });
  };
  
  const getActionUrl = (notification: NotificationWithPayload): string | null => {
    if (notification.actionUrl) return notification.actionUrl;
    if (notification.payload?.eventId) return `/events/${notification.payload.eventId}`;
    if (notification.payload?.participantId) return `/debt/${notification.payload.participantId}`;
    return null;
  };
  
  const handleNotificationClick = async (notification: NotificationWithPayload) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl" dir={language === "ar" ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold mb-6">{t("التنبيهات", "Notifications")}</h1>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  const readNotifications = notifications?.filter(n => n.isRead) || [];
  
  return (
    <div className="container mx-auto p-4 max-w-2xl" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          {t("التنبيهات", "Notifications")}
        </h1>
        {unreadNotifications.length > 0 && (
          <Badge variant="default" className="text-sm">
            {unreadNotifications.length} {t("جديد", "new")}
          </Badge>
        )}
      </div>
      
      {(!notifications || notifications.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t("لا توجد تنبيهات", "No notifications")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("ستظهر التنبيهات هنا عند وجود تحديثات", "Notifications will appear here when there are updates")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("غير مقروء", "Unread")}
              </h2>
              {unreadNotifications.map((notification) => {
                const actionUrl = getActionUrl(notification);
                const isEventInvite = notification.type === 'event_invite' && notification.payload?.eventParticipantId;
                const isPending = loadingNotificationIds.has(notification.id);
                
                const content = (
                  <Card
                    key={notification.id}
                    className="border-primary/30 bg-primary/5"
                    data-testid={`notification-unread-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <NotificationIcon type={notification.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <h3 className="font-medium">{notification.title}</h3>
                            <NotificationTypeBadge type={notification.type} t={t} />
                          </div>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.createdAt!)}
                          </p>
                          {isEventInvite && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  acceptInviteMutation.mutate(notification.id);
                                }}
                                disabled={isPending}
                                data-testid={`button-accept-invite-${notification.id}`}
                              >
                                <Check className="h-4 w-4 ml-1" />
                                {t("قبول", "Accept")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  declineInviteMutation.mutate(notification.id);
                                }}
                                disabled={isPending}
                                data-testid={`button-decline-invite-${notification.id}`}
                              >
                                <X className="h-4 w-4 ml-1" />
                                {t("رفض", "Decline")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
                
                if (isEventInvite) {
                  return <div key={notification.id}>{content}</div>;
                }
                
                return actionUrl ? (
                  <Link key={notification.id} href={actionUrl} onClick={() => handleNotificationClick(notification)}>
                    <div className="hover-elevate cursor-pointer">{content}</div>
                  </Link>
                ) : (
                  <div key={notification.id} className="hover-elevate cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
          
          {readNotifications.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Check className="h-4 w-4" />
                {t("مقروء", "Read")}
              </h2>
              {readNotifications.map((notification) => {
                const actionUrl = getActionUrl(notification);
                const content = (
                  <Card
                    key={notification.id}
                    className="opacity-70 hover-elevate cursor-pointer"
                    data-testid={`notification-read-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <NotificationIcon type={notification.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <h3 className="font-medium">{notification.title}</h3>
                            <NotificationTypeBadge type={notification.type} t={t} />
                          </div>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.createdAt!)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
                
                return actionUrl ? (
                  <Link key={notification.id} href={actionUrl}>
                    {content}
                  </Link>
                ) : content;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

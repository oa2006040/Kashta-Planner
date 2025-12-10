import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Users, 
  Package, 
  Edit2,
  Trash2,
  Plus,
  Clock,
  Thermometer,
  Cloud,
  DollarSign,
  Check,
  X,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatArabicDate, formatHijriDate, formatCurrency, formatNumber } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { AvatarIcon } from "@/components/avatar-icon";
import type { Event, EventWithDetails, Contribution, Participant, Category, Item } from "@shared/schema";

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

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", params?.id],
    enabled: !!params?.id,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: participants } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/${params?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الطلعة بنجاح",
      });
      navigate("/events");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الطلعة",
        variant: "destructive",
      });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return apiRequest("DELETE", `/api/events/${params?.id}/participants/${participantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: "تم الحذف",
        description: "تم إزالة المشارك ومستلزماته من الطلعة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إزالة المشارك",
        variant: "destructive",
      });
    },
  });

  const deleteContributionMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      return apiRequest("DELETE", `/api/contributions/${contributionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المستلزم من الطلعة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المستلزم",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">الطلعة غير موجودة</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على هذه الطلعة</p>
            <Link href="/events">
              <Button>العودة للطلعات</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(event.status || 'upcoming');
  const eventDate = new Date(event.date);
  const totalBudget = event.contributions?.reduce((sum, c) => sum + parseFloat(c.cost || "0"), 0) || 0;
  const participantCount = event.eventParticipants?.length || 0;
  const itemCount = event.contributions?.length || 0;

  // Group contributions by category
  const contributionsByCategory = event.contributions?.reduce((acc, contribution) => {
    const categoryId = contribution.item?.categoryId || "other";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(contribution);
    return acc;
  }, {} as Record<string, typeof event.contributions>) || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/events")}
          data-testid="button-back"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{event.title}</h1>
            <Badge variant="secondary" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/events/${event.id}/edit`}>
            <Button variant="outline" size="icon" data-testid="button-edit-event">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-delete-event">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف الطلعة</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف هذه الطلعة؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden">
        <div className="h-40 bg-gradient-to-l from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          <div className="relative z-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card/80 backdrop-blur mx-auto mb-2">
              <Calendar className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          {event.description && (
            <p className="text-muted-foreground">{event.description}</p>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatArabicDate(eventDate)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            {event.weather && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cloud className="h-4 w-4" />
                <span>{event.weather}</span>
              </div>
            )}
            {event.temperature && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Thermometer className="h-4 w-4" />
                <span>{event.temperature}°</span>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            التاريخ الهجري: {formatHijriDate(eventDate)}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(participantCount)}</p>
              <p className="text-sm text-muted-foreground">مشارك</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(itemCount)}</p>
              <p className="text-sm text-muted-foreground">مستلزم</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              <p className="text-sm text-muted-foreground">الميزانية</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" data-testid="tab-items">
            <Package className="h-4 w-4 ml-2" />
            المستلزمات
          </TabsTrigger>
          <TabsTrigger value="participants" data-testid="tab-participants">
            <Users className="h-4 w-4 ml-2" />
            المشاركين
          </TabsTrigger>
          <TabsTrigger value="budget" data-testid="tab-budget">
            <DollarSign className="h-4 w-4 ml-2" />
            الميزانية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">المستلزمات المطلوبة</h3>
            <Link href={`/events/${event.id}/items`}>
              <Button size="sm" data-testid="button-add-items">
                <Plus className="h-4 w-4 ml-2" />
                إضافة مستلزمات
              </Button>
            </Link>
          </div>

          {Object.keys(contributionsByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(contributionsByCategory).map(([categoryId, contributions]) => {
                const category = categories?.find((c) => c.id === categoryId);
                return (
                  <Card key={categoryId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {category && (
                          <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
                        )}
                        {category?.nameAr || "أخرى"}
                        <Badge variant="secondary" className="mr-auto">
                          {contributions?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {contributions?.map((contribution) => (
                        <div 
                          key={contribution.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              contribution.status === "delivered" 
                                ? "bg-green-100 dark:bg-green-900/30" 
                                : "bg-muted"
                            }`}>
                              {contribution.status === "delivered" ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{contribution.item?.name}</p>
                              {contribution.participant && (
                                <p className="text-xs text-muted-foreground">
                                  {contribution.participant.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {parseFloat(contribution.cost || "0") > 0 && (
                              <Badge variant="outline">
                                {formatCurrency(contribution.cost || 0)}
                              </Badge>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  data-testid={`button-delete-contribution-${contribution.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف المستلزم</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل تريد حذف "{contribution.item?.name}" من الطلعة؟
                                    {contribution.participant && (
                                      <span className="block mt-2 text-muted-foreground">
                                        المسؤول: {contribution.participant.name}
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteContributionMutation.mutate(contribution.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">لا توجد مستلزمات</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  أضف المستلزمات المطلوبة للطلعة
                </p>
                <Link href={`/events/${event.id}/items`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مستلزمات
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">المشاركين في الطلعة</h3>
            <Link href={`/events/${event.id}/participants`}>
              <Button size="sm" data-testid="button-add-participants">
                <Plus className="h-4 w-4 ml-2" />
                إضافة مشاركين
              </Button>
            </Link>
          </div>

          {event.eventParticipants && event.eventParticipants.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {event.eventParticipants.map((ep) => {
                const participantContributions = event.contributions?.filter(
                  (c) => c.participantId === ep.participantId
                ) || [];
                
                return (
                  <Card key={ep.id} className="hover-elevate">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <AvatarIcon icon={ep.participant?.avatar} className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ep.participant?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {participantContributions.length} مستلزم
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-muted-foreground"
                            data-testid={`button-remove-participant-${ep.participantId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>إزالة المشارك</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من إزالة {ep.participant?.name} من الطلعة؟
                              {participantContributions.length > 0 && (
                                <span className="block mt-2 text-destructive">
                                  سيتم حذف {participantContributions.length} مستلزم مرتبط به أيضاً.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeParticipantMutation.mutate(ep.participantId)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              إزالة
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">لا يوجد مشاركين</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  أضف المشاركين في هذه الطلعة
                </p>
                <Link href={`/events/${event.id}/participants`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مشاركين
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ملخص الميزانية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                <span className="font-medium">إجمالي التكلفة</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalBudget)}</span>
              </div>

              {participantCount > 0 && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <span className="text-muted-foreground">التكلفة للفرد</span>
                  <span className="font-semibold">
                    {formatCurrency(totalBudget / participantCount)}
                  </span>
                </div>
              )}

              {event.contributions && event.contributions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">توزيع التكاليف</h4>
                  {Object.entries(contributionsByCategory).map(([categoryId, contributions]) => {
                    const category = categories?.find((c) => c.id === categoryId);
                    const categoryTotal = contributions?.reduce((sum, c) => sum + parseFloat(c.cost || "0"), 0) || 0;
                    const percentage = totalBudget > 0 ? (categoryTotal / totalBudget) * 100 : 0;
                    
                    return (
                      <div key={categoryId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {category && <CategoryIcon icon={category.icon} color={category.color} className="h-4 w-4" />}
                            {category?.nameAr || "أخرى"}
                          </span>
                          <span>{formatCurrency(categoryTotal)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
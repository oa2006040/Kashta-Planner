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
  XCircle,
  UserPlus,
  CheckCircle2,
  Circle,
  Loader2,
  Receipt,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Equal,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDate, formatHijriDate, formatCurrency, formatNumber } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { AvatarIcon } from "@/components/avatar-icon";
import { useLanguage } from "@/components/language-provider";
import type { EventWithDetails, Contribution, Participant, Category, EventSettlement } from "@shared/schema";

function getStatusBadge(status: string, t: (ar: string, en: string) => string) {
  switch (status) {
    case 'upcoming':
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: t('قادمة', 'Upcoming') };
    case 'ongoing':
      return { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: t('جارية', 'Ongoing') };
    case 'completed':
      return { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300', label: t('منتهية', 'Completed') };
    case 'cancelled':
      return { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: t('ملغاة', 'Cancelled') };
    default:
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: t('قادمة', 'Upcoming') };
  }
}

type ContributionWithDetails = Contribution & { 
  item: { id: string; categoryId: string; name: string; description: string | null; isCommon: boolean }; 
  participant: Participant | null 
};

interface ContributionItemProps {
  contribution: ContributionWithDetails;
  category?: Category;
  participants: Participant[];
  eventId: string;
  onAssign: (contributionId: string, participantId: string, cost: string) => void;
  onDelete: (contributionId: string) => void;
  onUnassign: (contributionId: string) => void;
  isAssigning: boolean;
}

function ContributionItem({ 
  contribution, 
  category, 
  participants, 
  eventId,
  onAssign, 
  onDelete,
  onUnassign,
  isAssigning 
}: ContributionItemProps) {
  const { t, language } = useLanguage();
  const [showAssign, setShowAssign] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [includeCost, setIncludeCost] = useState(false);
  const [cost, setCost] = useState(contribution.cost || "0");

  const hasParticipant = !!contribution.participantId;

  const handleAssign = () => {
    if (selectedParticipant) {
      onAssign(contribution.id, selectedParticipant, includeCost ? cost : "0");
      setShowAssign(false);
      setSelectedParticipant("");
      setIncludeCost(false);
      setCost("0");
    }
  };

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-lg ${
      hasParticipant 
        ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800" 
        : "bg-muted/50"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            hasParticipant 
              ? "bg-green-100 dark:bg-green-900/30" 
              : "bg-muted"
          }`}>
            {hasParticipant ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">{contribution.item?.name}</p>
              {category && (
                <Badge variant="outline" className="text-xs">
                  <CategoryIcon icon={category.icon} color={category.color} className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                  {language === "ar" ? category.nameAr : (category.name || category.nameAr)}
                </Badge>
              )}
            </div>
            {contribution.participant && (
              <div className="flex items-center gap-2 mt-1">
                <AvatarIcon icon={contribution.participant.avatar} className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">{contribution.participant.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {parseFloat(contribution.cost || "0") > 0 && (
            <Badge variant="secondary" className="text-xs">
              {formatCurrency(contribution.cost || 0, language)}
            </Badge>
          )}
          {!hasParticipant && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAssign(!showAssign)}
              data-testid={`button-assign-${contribution.id}`}
            >
              <UserPlus className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
              {t("تعيين", "Assign")}
            </Button>
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
                <AlertDialogTitle>
                  {hasParticipant ? t("إلغاء تعيين المستلزم", "Unassign Item") : t("حذف المستلزم", "Delete Item")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {hasParticipant ? (
                    <>
                      {t(`هل تريد إلغاء تعيين "${contribution.item?.name}"؟`, `Unassign "${contribution.item?.name}"?`)}
                      <span className="block mt-2 text-muted-foreground">
                        {t(`سيتم إزالة المسؤول (${contribution.participant?.name}) ونقل المستلزم للقائمة المتبقية.`, `The assignee (${contribution.participant?.name}) will be removed and the item will move to the remaining list.`)}
                      </span>
                    </>
                  ) : (
                    <>{t(`هل تريد حذف "${contribution.item?.name}" من الطلعة نهائياً؟`, `Delete "${contribution.item?.name}" from this event permanently?`)}</>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => hasParticipant ? onUnassign(contribution.id) : onDelete(contribution.id)}
                  className={hasParticipant 
                    ? "bg-orange-600 text-white hover:bg-orange-700" 
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  }
                >
                  {hasParticipant ? t("إلغاء التعيين", "Unassign") : t("حذف", "Delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {showAssign && !hasParticipant && (
        <div className="flex flex-col gap-3 pt-3 border-t">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
              <SelectTrigger className="flex-1" data-testid={`select-participant-${contribution.id}`}>
                <SelectValue placeholder={t("اختر المشارك", "Select participant")} />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <AvatarIcon icon={p.avatar} className="h-4 w-4" />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleAssign} 
                disabled={!selectedParticipant || isAssigning}
                data-testid={`button-confirm-assign-${contribution.id}`}
              >
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowAssign(false);
                  setSelectedParticipant("");
                  setIncludeCost(false);
                  setCost("0");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
            <Checkbox
              id={`cost-toggle-${contribution.id}`}
              checked={includeCost}
              onCheckedChange={(checked) => setIncludeCost(!!checked)}
              data-testid={`checkbox-include-cost-${contribution.id}`}
            />
            <Label htmlFor={`cost-toggle-${contribution.id}`} className="text-sm cursor-pointer">
              {t("إضافة تكلفة", "Add cost")}
            </Label>
            {includeCost && (
              <div className={`flex items-center gap-2 ${language === "ar" ? "mr-auto" : "ml-auto"}`}>
                <Input
                  type="number"
                  placeholder="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-24"
                  data-testid={`input-cost-${contribution.id}`}
                />
                <span className="text-sm text-muted-foreground">{t("ر.ق", "QAR")}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", params?.id],
    enabled: !!params?.id,
    refetchInterval: 5000,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: participants } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const { data: settlement } = useQuery<EventSettlement>({
    queryKey: ["/api/events", params?.id, "settlement"],
    enabled: !!params?.id,
    refetchInterval: 5000,
  });

  const toggleSettlementMutation = useMutation({
    mutationFn: async ({ debtorId, creditorId }: { debtorId: string; creditorId: string }) => {
      return apiRequest("PATCH", `/api/events/${params?.id}/settlements/${debtorId}/${creditorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id, "settlement"] });
      toast({
        title: t("تم التحديث", "Updated"),
        description: t("تم تحديث حالة الدفع", "Payment status updated"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تحديث حالة الدفع", "Error updating payment status"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/${params?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف الطلعة بنجاح", "Event deleted successfully"),
      });
      navigate("/events");
    },
    onError: (error: Error) => {
      let errorMessage = t("حدث خطأ أثناء حذف الطلعة", "Error deleting event");
      if (error.message.includes("400")) {
        errorMessage = error.message.includes("تسويات") || error.message.includes("ديون")
          ? t("لا يمكن حذف الطلعة لأنها تحتوي على تسويات وديون", "Cannot delete event with settlements and debts")
          : t("لا يمكن حذف الطلعة لأنها تحتوي على مساهمات بتكاليف", "Cannot delete event with cost contributions");
      }
      toast({
        title: t("خطأ", "Error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/events/${params?.id}`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الإلغاء", "Cancelled"),
        description: t("تم إلغاء الطلعة بنجاح", "Event cancelled successfully"),
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("400") || error.message.includes("تسويات")
        ? t("لا يمكن إلغاء الطلعة لأنها تحتوي على تسويات وديون", "Cannot cancel event with settlements and debts")
        : t("حدث خطأ أثناء إلغاء الطلعة", "Error cancelling event");
      toast({
        title: t("خطأ", "Error"),
        description: errorMessage,
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
        title: t("تم الحذف", "Deleted"),
        description: t("تم إزالة المشارك ومستلزماته من الطلعة", "Participant and their items removed from event"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إزالة المشارك", "Error removing participant"),
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
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف المستلزم من الطلعة", "Item removed from event"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء حذف المستلزم", "Error removing item"),
        variant: "destructive",
      });
    },
  });

  const unassignContributionMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      return apiRequest("POST", `/api/contributions/${contributionId}/unassign`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم إلغاء التعيين", "Unassigned"),
        description: t("تم نقل المستلزم إلى قائمة المتبقية", "Item moved to remaining list"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إلغاء التعيين", "Error unassigning item"),
        variant: "destructive",
      });
    },
  });

  const assignParticipantMutation = useMutation({
    mutationFn: async ({ contributionId, participantId, cost }: { 
      contributionId: string; 
      participantId: string; 
      cost: string;
    }) => {
      return apiRequest("PATCH", `/api/contributions/${contributionId}`, {
        participantId,
        cost: cost || "0",
        status: "confirmed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      toast({
        title: t("تم التعيين", "Assigned"),
        description: t("تم تعيين المشارك للمستلزم بنجاح", "Participant assigned to item successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تعيين المشارك", "Error assigning participant"),
        variant: "destructive",
      });
    },
  });

  const handleAssign = (contributionId: string, participantId: string, cost: string) => {
    assignParticipantMutation.mutate({ contributionId, participantId, cost });
  };

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
            <h3 className="text-lg font-medium mb-2">{t("الطلعة غير موجودة", "Event Not Found")}</h3>
            <p className="text-muted-foreground mb-4">{t("لم يتم العثور على هذه الطلعة", "This event could not be found")}</p>
            <Link href="/events">
              <Button>{t("العودة للطلعات", "Back to Events")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(event.status || 'upcoming', t);
  const eventDate = new Date(event.date);
  const totalBudget = event.contributions?.reduce((sum, c) => sum + parseFloat(c.cost || "0"), 0) || 0;
  const participantCount = event.eventParticipants?.length || 0;
  const itemCount = event.contributions?.length || 0;

  // Split contributions into fulfilled (has participant) and unfulfilled (no participant)
  const fulfilledContributions = event.contributions?.filter(c => c.participantId) || [];
  const unfulfilledContributions = event.contributions?.filter(c => !c.participantId) || [];
  
  const fulfilledCount = fulfilledContributions.length;
  const unfulfilledCount = unfulfilledContributions.length;

  // Group fulfilled contributions by category for budget view
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
          <BackArrow className="h-5 w-5" />
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
          {event.status === 'upcoming' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-cancel-event">
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("إلغاء الطلعة", "Cancel Event")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("هل أنت متأكد من إلغاء هذه الطلعة؟ سيتم تغيير حالتها إلى \"ملغاة\".", "Are you sure you want to cancel this event? Its status will be changed to \"Cancelled\".")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>{t("تراجع", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelEventMutation.mutate()}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {t("إلغاء الطلعة", "Cancel Event")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-delete-event">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("حذف الطلعة", "Delete Event")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("هل أنت متأكد من حذف هذه الطلعة؟ لا يمكن التراجع عن هذا الإجراء.", "Are you sure you want to delete this event? This action cannot be undone.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                >
                  {t("حذف", "Delete")}
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
              <span>{formatDate(eventDate, language)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
                {event.latitude && event.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                    data-testid="link-open-map"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            {event.latitude && event.longitude && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-xs" dir="ltr">
                  ({parseFloat(event.latitude).toFixed(6)}°, {parseFloat(event.longitude).toFixed(6)}°)
                </span>
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
            {t("التاريخ الهجري", "Hijri Date")}: {formatHijriDate(eventDate, language)}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(participantCount, language)}</p>
              <p className="text-sm text-muted-foreground">{t("مشارك", "Participants")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(fulfilledCount, language)}</p>
              <p className="text-sm text-muted-foreground">{t("مكتمل", "Fulfilled")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Circle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(unfulfilledCount, language)}</p>
              <p className="text-sm text-muted-foreground">{t("متبقي", "Remaining")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget, language)}</p>
              <p className="text-sm text-muted-foreground">{t("الميزانية", "Budget")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <div className="overflow-x-auto -mx-6 px-6">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="items" data-testid="tab-items" className="text-xs sm:text-sm">
              <Package className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("المستلزمات", "Items")}</span>
              <span className="sm:hidden">{t("مستلزمات", "Items")}</span>
            </TabsTrigger>
            <TabsTrigger value="participants" data-testid="tab-participants" className="text-xs sm:text-sm">
              <Users className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("المشاركين", "Participants")}</span>
              <span className="sm:hidden">{t("مشاركين", "People")}</span>
            </TabsTrigger>
            <TabsTrigger value="budget" data-testid="tab-budget" className="text-xs sm:text-sm">
              <DollarSign className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("الميزانية", "Budget")}</span>
              <span className="sm:hidden">{t("ميزانية", "Cost")}</span>
            </TabsTrigger>
            <TabsTrigger value="settlement" data-testid="tab-settlement" className="text-xs sm:text-sm">
              <Receipt className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("التسوية", "Settlement")}</span>
              <span className="sm:hidden">{t("تسوية", "Settle")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">{t("المستلزمات المطلوبة", "Required Items")}</h3>
            <Link href={`/events/${event.id}/items`}>
              <Button size="sm" data-testid="button-add-items">
                <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                {t("إضافة مستلزمات", "Add Items")}
              </Button>
            </Link>
          </div>

          {/* Fulfilled Contributions Section (TOP) */}
          {fulfilledContributions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-700 dark:text-green-400">
                  {t("المستلزمات المكتملة", "Fulfilled Items")} ({formatNumber(fulfilledCount, language)})
                </h4>
              </div>
              <div className="space-y-2">
                {fulfilledContributions.map((contribution) => {
                  const category = categories?.find(c => c.id === contribution.item?.categoryId);
                  return (
                    <ContributionItem
                      key={contribution.id}
                      contribution={contribution as ContributionWithDetails}
                      category={category}
                      participants={participants || []}
                      eventId={params?.id || ""}
                      onAssign={handleAssign}
                      onDelete={(id) => deleteContributionMutation.mutate(id)}
                      onUnassign={(id) => unassignContributionMutation.mutate(id)}
                      isAssigning={assignParticipantMutation.isPending}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Unfulfilled Contributions Section (BOTTOM) */}
          {unfulfilledContributions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Circle className="h-5 w-5 text-orange-600" />
                <h4 className="font-medium text-orange-700 dark:text-orange-400">
                  {t("المستلزمات المتبقية", "Remaining Items")} ({formatNumber(unfulfilledCount, language)})
                </h4>
                <span className="text-sm text-muted-foreground">- {t("قم بتعيين مشارك لكل مستلزم", "Assign a participant to each item")}</span>
              </div>
              <div className="space-y-2">
                {unfulfilledContributions.map((contribution) => {
                  const category = categories?.find(c => c.id === contribution.item?.categoryId);
                  return (
                    <ContributionItem
                      key={contribution.id}
                      contribution={contribution as ContributionWithDetails}
                      category={category}
                      participants={participants || []}
                      eventId={params?.id || ""}
                      onAssign={handleAssign}
                      onDelete={(id) => deleteContributionMutation.mutate(id)}
                      onUnassign={(id) => unassignContributionMutation.mutate(id)}
                      isAssigning={assignParticipantMutation.isPending}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {event.contributions?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{t("لا توجد مستلزمات", "No Items")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("أضف المستلزمات المطلوبة للطلعة", "Add the required items for this event")}
                </p>
                <Link href={`/events/${event.id}/items`}>
                  <Button size="sm">
                    <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t("إضافة مستلزمات", "Add Items")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">{t("المشاركين في الطلعة", "Event Participants")}</h3>
            <Link href={`/events/${event.id}/participants`}>
              <Button size="sm" data-testid="button-add-participants">
                <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                {t("إضافة مشاركين", "Add Participants")}
              </Button>
            </Link>
          </div>

          {event.eventParticipants && event.eventParticipants.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {event.eventParticipants.map((ep) => {
                const participantContributions = event.contributions?.filter(
                  (c) => c.participantId === ep.participantId
                ) || [];
                const participantTotal = participantContributions.reduce(
                  (sum, c) => sum + parseFloat(c.cost || "0"), 0
                );
                
                return (
                  <Card key={ep.id} className="hover-elevate">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <AvatarIcon icon={ep.participant?.avatar} className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ep.participant?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatNumber(participantContributions.length, language)} {t("مستلزم", "items")}</span>
                          {participantTotal > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatCurrency(participantTotal, language)}</span>
                            </>
                          )}
                        </div>
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
                            <AlertDialogTitle>{t("إزالة المشارك", "Remove Participant")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(`هل أنت متأكد من إزالة ${ep.participant?.name} من الطلعة؟`, `Are you sure you want to remove ${ep.participant?.name} from this event?`)}
                              {participantContributions.length > 0 && (
                                <span className="block mt-2 text-destructive">
                                  {t(`سيتم حذف ${participantContributions.length} مستلزم مرتبط به أيضاً.`, `${participantContributions.length} linked items will also be deleted.`)}
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeParticipantMutation.mutate(ep.participantId)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("إزالة", "Remove")}
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
                <h3 className="font-medium mb-2">{t("لا يوجد مشاركين", "No Participants")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("أضف المشاركين في هذه الطلعة", "Add participants to this event")}
                </p>
                <Link href={`/events/${event.id}/participants`}>
                  <Button size="sm">
                    <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t("إضافة مشاركين", "Add Participants")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">{t("ملخص الميزانية", "Budget Summary")}</h3>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {formatCurrency(totalBudget, language)}
            </Badge>
          </div>

          {Object.keys(contributionsByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(contributionsByCategory).map(([categoryId, contributions]) => {
                const category = categories?.find((c) => c.id === categoryId);
                const categoryTotal = contributions?.reduce((sum, c) => sum + parseFloat(c.cost || "0"), 0) || 0;
                
                return (
                  <Card key={categoryId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {category && (
                            <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
                          )}
                          {language === "ar" ? (category?.nameAr || t("أخرى", "Other")) : (category?.name || category?.nameAr || t("أخرى", "Other"))}
                          <Badge variant="secondary">
                            {contributions?.length || 0}
                          </Badge>
                        </div>
                        <span className="font-bold">{formatCurrency(categoryTotal, language)}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {contributions?.map((contribution) => (
                        <div 
                          key={contribution.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-medium truncate">{contribution.item?.name}</span>
                            {contribution.participant && (
                              <span className="text-xs text-muted-foreground">
                                - {contribution.participant.name}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(contribution.cost || 0, language)}
                          </Badge>
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
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{t("لا توجد تكاليف", "No Costs")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("أضف مستلزمات وحدد تكلفتها لعرض الميزانية", "Add items with costs to view the budget")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="font-semibold">{t("تسوية المصاريف", "Expense Settlement")}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {settlement && (
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {t("الحصة", "Share")}: {formatCurrency(settlement.fairShare, language)}
                </Badge>
              )}
              {settlement && settlement.unassignedCosts > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  <AlertTriangle className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                  {formatCurrency(settlement.unassignedCosts, language)} {t("غير معين", "unassigned")}
                </Badge>
              )}
            </div>
          </div>

          {settlement && settlement.balances.length > 0 ? (
            <div className="space-y-6">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {settlement.balances.map((balance) => (
                  <div 
                    key={balance.participant.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      balance.role === 'creditor' 
                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
                        : balance.role === 'debtor'
                        ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
                        : 'bg-muted/50'
                    }`}
                  >
                    <AvatarIcon icon={balance.participant.avatar} className="h-8 w-8" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{balance.participant.name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{t("دفع", "Paid")}: {formatCurrency(balance.totalPaid, language)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {balance.role === 'creditor' && (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            +{formatCurrency(balance.balance, language)}
                          </span>
                        </>
                      )}
                      {balance.role === 'debtor' && (
                        <>
                          <TrendingDown className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-600">
                            {formatCurrency(balance.balance, language)}
                          </span>
                        </>
                      )}
                      {balance.role === 'settled' && (
                        <>
                          <Equal className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{t("متوازن", "Balanced")}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {settlement.transactions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("التحويلات المطلوبة", "Required Transfers")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {settlement.transactions.map((tx) => (
                      <div 
                        key={`${tx.debtorId}-${tx.creditorId}`}
                        className={`flex flex-col gap-3 p-3 rounded-lg ${
                          tx.isSettled 
                            ? 'bg-green-50 dark:bg-green-900/10' 
                            : 'bg-muted/50'
                        }`}
                        data-testid={`settlement-tx-${tx.debtorId}-${tx.creditorId}`}
                      >
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <AvatarIcon icon={tx.debtor?.avatar} className="h-8 w-8 shrink-0" />
                            <span className="font-medium">{tx.debtor?.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            <span className="text-xs text-muted-foreground">{t("يدفع", "pays")}</span>
                            {language === "ar" ? (
                              <ArrowLeft className="h-5 w-5" />
                            ) : (
                              <ArrowRight className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <AvatarIcon icon={tx.creditor?.avatar} className="h-8 w-8 shrink-0" />
                            <span className="font-medium">{tx.creditor?.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                          <Badge 
                            variant={tx.isSettled ? "default" : "secondary"}
                            className={tx.isSettled ? "bg-green-600" : ""}
                          >
                            {formatCurrency(tx.amount, language)}
                          </Badge>
                          <Button
                            size="sm"
                            variant={tx.isSettled ? "outline" : "default"}
                            onClick={() => toggleSettlementMutation.mutate({
                              debtorId: tx.debtorId,
                              creditorId: tx.creditorId,
                            })}
                            disabled={toggleSettlementMutation.isPending}
                            data-testid={`button-toggle-tx-${tx.debtorId}-${tx.creditorId}`}
                          >
                            {toggleSettlementMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : tx.isSettled ? (
                              <>
                                <X className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                                {t("إلغاء", "Undo")}
                              </>
                            ) : (
                              <>
                                <Check className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                                {t("تم الدفع", "Paid")}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{t("لا توجد تسويات", "No Settlements")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("أضف مشاركين ومستلزمات بتكاليف لعرض تسوية المصاريف", "Add participants and items with costs to view settlements")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

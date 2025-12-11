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
  AlertTriangle
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
import { formatArabicDate, formatHijriDate, formatCurrency, formatNumber } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { AvatarIcon } from "@/components/avatar-icon";
import type { EventWithDetails, Contribution, Participant, Category, EventSettlement } from "@shared/schema";

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
                  <CategoryIcon icon={category.icon} color={category.color} className="h-3 w-3 ml-1" />
                  {category.nameAr}
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
              {formatCurrency(contribution.cost || 0)}
            </Badge>
          )}
          {!hasParticipant && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAssign(!showAssign)}
              data-testid={`button-assign-${contribution.id}`}
            >
              <UserPlus className="h-4 w-4 ml-1" />
              تعيين
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
                  {hasParticipant ? "إلغاء تعيين المستلزم" : "حذف المستلزم"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {hasParticipant ? (
                    <>
                      هل تريد إلغاء تعيين "{contribution.item?.name}"؟
                      <span className="block mt-2 text-muted-foreground">
                        سيتم إزالة المسؤول ({contribution.participant?.name}) ونقل المستلزم للقائمة المتبقية.
                      </span>
                    </>
                  ) : (
                    <>هل تريد حذف "{contribution.item?.name}" من الطلعة نهائياً؟</>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => hasParticipant ? onUnassign(contribution.id) : onDelete(contribution.id)}
                  className={hasParticipant 
                    ? "bg-orange-600 text-white hover:bg-orange-700" 
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  }
                >
                  {hasParticipant ? "إلغاء التعيين" : "حذف"}
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
                <SelectValue placeholder="اختر المشارك" />
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
              إضافة تكلفة
            </Label>
            {includeCost && (
              <div className="flex items-center gap-2 mr-auto">
                <Input
                  type="number"
                  placeholder="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-24"
                  data-testid={`input-cost-${contribution.id}`}
                />
                <span className="text-sm text-muted-foreground">ر.ق</span>
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
        title: "تم التحديث",
        description: "تم تحديث حالة الدفع",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الدفع",
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
        title: "تم الحذف",
        description: "تم حذف الطلعة بنجاح",
      });
      navigate("/events");
    },
    onError: (error: Error) => {
      let errorMessage = "حدث خطأ أثناء حذف الطلعة";
      if (error.message.includes("400")) {
        errorMessage = error.message.includes("تسويات") || error.message.includes("ديون")
          ? "لا يمكن حذف الطلعة لأنها تحتوي على تسويات وديون"
          : "لا يمكن حذف الطلعة لأنها تحتوي على مساهمات بتكاليف";
      }
      toast({
        title: "خطأ",
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
        title: "تم الإلغاء",
        description: "تم إلغاء الطلعة بنجاح",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("400") || error.message.includes("تسويات")
        ? "لا يمكن إلغاء الطلعة لأنها تحتوي على تسويات وديون"
        : "حدث خطأ أثناء إلغاء الطلعة";
      toast({
        title: "خطأ",
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

  const unassignContributionMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      return apiRequest("POST", `/api/contributions/${contributionId}/unassign`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم إلغاء التعيين",
        description: "تم نقل المستلزم إلى قائمة المتبقية",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء التعيين",
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
        title: "تم التعيين",
        description: "تم تعيين المشارك للمستلزم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعيين المشارك",
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
          {event.status === 'upcoming' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-cancel-event">
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>إلغاء الطلعة</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من إلغاء هذه الطلعة؟ سيتم تغيير حالتها إلى "ملغاة".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelEventMutation.mutate()}
                    className="bg-destructive text-destructive-foreground"
                  >
                    إلغاء الطلعة
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
      <div className="grid gap-4 sm:grid-cols-4">
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
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(fulfilledCount)}</p>
              <p className="text-sm text-muted-foreground">مكتمل</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Circle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(unfulfilledCount)}</p>
              <p className="text-sm text-muted-foreground">متبقي</p>
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
          <TabsTrigger value="settlement" data-testid="tab-settlement">
            <Receipt className="h-4 w-4 ml-2" />
            التسوية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">المستلزمات المطلوبة</h3>
            <Link href={`/events/${event.id}/items`}>
              <Button size="sm" data-testid="button-add-items">
                <Plus className="h-4 w-4 ml-2" />
                إضافة مستلزمات
              </Button>
            </Link>
          </div>

          {/* Fulfilled Contributions Section (TOP) */}
          {fulfilledContributions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-700 dark:text-green-400">
                  المستلزمات المكتملة ({fulfilledCount})
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
                  المستلزمات المتبقية ({unfulfilledCount})
                </h4>
                <span className="text-sm text-muted-foreground">- قم بتعيين مشارك لكل مستلزم</span>
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
                          <span>{participantContributions.length} مستلزم</span>
                          {participantTotal > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatCurrency(participantTotal)}</span>
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
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">ملخص الميزانية</h3>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {formatCurrency(totalBudget)}
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
                          {category?.nameAr || "أخرى"}
                          <Badge variant="secondary">
                            {contributions?.length || 0}
                          </Badge>
                        </div>
                        <span className="font-bold">{formatCurrency(categoryTotal)}</span>
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
                            {formatCurrency(contribution.cost || 0)}
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
                <h3 className="font-medium mb-2">لا توجد تكاليف</h3>
                <p className="text-sm text-muted-foreground">
                  أضف مستلزمات وحدد تكلفتها لعرض الميزانية
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="font-semibold">تسوية المصاريف</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {settlement && (
                <Badge variant="outline" className="text-lg px-4 py-1">
                  الحصة: {formatCurrency(settlement.fairShare)}
                </Badge>
              )}
              {settlement && settlement.unassignedCosts > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  <AlertTriangle className="h-3 w-3 ml-1" />
                  {formatCurrency(settlement.unassignedCosts)} غير معين
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
                        <span className="text-muted-foreground">دفع: {formatCurrency(balance.totalPaid)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {balance.role === 'creditor' && (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            +{formatCurrency(balance.balance)}
                          </span>
                        </>
                      )}
                      {balance.role === 'debtor' && (
                        <>
                          <TrendingDown className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-600">
                            {formatCurrency(balance.balance)}
                          </span>
                        </>
                      )}
                      {balance.role === 'settled' && (
                        <>
                          <Equal className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">متوازن</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {settlement.transactions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">التحويلات المطلوبة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {settlement.transactions.map((tx) => (
                      <div 
                        key={`${tx.debtorId}-${tx.creditorId}`}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          tx.isSettled 
                            ? 'bg-green-50 dark:bg-green-900/10' 
                            : 'bg-muted/50'
                        }`}
                        data-testid={`settlement-tx-${tx.debtorId}-${tx.creditorId}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <AvatarIcon icon={tx.debtor?.avatar} className="h-6 w-6" />
                          <span className="font-medium truncate">{tx.debtor?.name}</span>
                          <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                          <AvatarIcon icon={tx.creditor?.avatar} className="h-6 w-6" />
                          <span className="font-medium truncate">{tx.creditor?.name}</span>
                        </div>
                        <Badge 
                          variant={tx.isSettled ? "default" : "secondary"}
                          className={tx.isSettled ? "bg-green-600" : ""}
                        >
                          {formatCurrency(tx.amount)}
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
                              <X className="h-4 w-4 ml-1" />
                              إلغاء
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 ml-1" />
                              تم الدفع
                            </>
                          )}
                        </Button>
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
                <h3 className="font-medium mb-2">لا توجد تسويات</h3>
                <p className="text-sm text-muted-foreground">
                  أضف مشاركين ومستلزمات بتكاليف لعرض تسوية المصاريف
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

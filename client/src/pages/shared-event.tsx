import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Package, 
  Plus,
  Clock,
  Thermometer,
  Cloud,
  DollarSign,
  Check,
  X,
  UserPlus,
  CheckCircle2,
  Circle,
  Loader2,
  Receipt,
  ExternalLink,
  Navigation,
  Share2,
  Copy,
  Link as LinkIcon,
  Edit2,
  Trash2
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatHijriDate, formatCurrency, formatNumber } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { AvatarIcon } from "@/components/avatar-icon";
import { useLanguage } from "@/components/language-provider";
import type { EventWithDetails, Contribution, Participant, Category, Item } from "@shared/schema";

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

interface EventParticipantWithDetails {
  id: string;
  eventId: number;
  participantId: string;
  role: string | null;
  confirmedAt: Date | null;
  participant: Participant;
}

export default function SharedEvent() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token;
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: event, isLoading, error, refetch } = useQuery<EventWithDetails>({
    queryKey: ["/api/shared", token],
    queryFn: async () => {
      const res = await fetch(`/api/shared/${token}`);
      if (!res.ok) throw new Error("Failed to load shared event");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 3000,
  });

  const { data: allParticipants } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return apiRequest("POST", `/api/shared/${token}/participants`, { participantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared", token] });
      setAddParticipantOpen(false);
      setSelectedParticipantId("");
      toast({
        title: t("تمت الإضافة", "Added"),
        description: t("تم إضافة المشارك بنجاح", "Participant added successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إضافة المشارك", "An error occurred while adding participant"),
        variant: "destructive",
      });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return apiRequest("DELETE", `/api/shared/${token}/participants/${participantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared", token] });
      toast({
        title: t("تم الحذف", "Removed"),
        description: t("تم حذف المشارك من الطلعة", "Participant removed from event"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء حذف المشارك", "An error occurred while removing participant"),
        variant: "destructive",
      });
    },
  });

  const addContributionMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const promises = itemIds.map(itemId => 
        apiRequest("POST", `/api/shared/${token}/contributions`, { itemId })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, itemIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared", token] });
      setAddItemOpen(false);
      setSelectedItems(new Set());
      setCategoryFilter("all");
      toast({
        title: t("تمت الإضافة", "Added"),
        description: t(`تم إضافة ${itemIds.length} مستلزم للطلعة`, `Added ${itemIds.length} item(s) to event`),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إضافة المستلزمات", "An error occurred while adding items"),
        variant: "destructive",
      });
    },
  });

  const updateContributionMutation = useMutation({
    mutationFn: async ({ contributionId, data }: { contributionId: string; data: { participantId?: string | null; cost?: string; quantity?: number } }) => {
      return apiRequest("PATCH", `/api/shared/${token}/contributions/${contributionId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared", token] });
      toast({
        title: t("تم التحديث", "Updated"),
        description: t("تم تحديث المساهمة", "Contribution updated"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تحديث المساهمة", "An error occurred while updating contribution"),
        variant: "destructive",
      });
    },
  });

  const deleteContributionMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      return apiRequest("DELETE", `/api/shared/${token}/contributions/${contributionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared", token] });
      toast({
        title: t("تم الحذف", "Removed"),
        description: t("تم حذف المستلزم", "Item removed"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء حذف المستلزم", "An error occurred while removing item"),
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" dir={language === "ar" ? "rtl" : "ltr"}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir={language === "ar" ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">{t("الرابط غير صالح", "Invalid Link")}</h2>
            <p className="text-muted-foreground">
              {t(
                "رابط المشاركة غير صالح أو تم إيقاف المشاركة",
                "This share link is invalid or sharing has been disabled"
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(event.status || 'upcoming', t);
  const eventParticipants = (event.eventParticipants || []) as EventParticipantWithDetails[];
  const participants = eventParticipants.map(ep => ep.participant);
  const contributions = (event.contributions || []) as ContributionWithDetails[];
  const availableParticipants = allParticipants?.filter(
    p => !participants.some(ep => ep.id === p.id)
  ) || [];
  const existingItemIds = contributions.map(c => c.itemId);
  const availableItems = items?.filter(item => !existingItemIds.includes(item.id)) || [];

  const totalBudget = contributions.reduce((sum, c) => sum + (parseFloat(c.cost || "0") * (c.quantity || 1)), 0);
  const assignedItems = contributions.filter(c => c.participantId);
  const unassignedItems = contributions.filter(c => !c.participantId);

  return (
    <div className="min-h-screen bg-background" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Share2 className="h-4 w-4" />
          <span>{t("طلعة مشتركة", "Shared Event")}</span>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                  {event.weather && (
                    <Badge variant="outline" className="gap-1">
                      <Cloud className="h-3 w-3" />
                      {event.weather}
                    </Badge>
                  )}
                  {event.temperature && (
                    <Badge variant="outline" className="gap-1">
                      <Thermometer className="h-3 w-3" />
                      {formatNumber(event.temperature, language)}°C
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(event.date, language)}</span>
                <span className="text-muted-foreground">({formatHijriDate(event.date, language)})</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{event.location}</span>
                  {event.latitude && event.longitude && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(
                        `https://www.google.com/maps?q=${event.latitude},${event.longitude}`,
                        "_blank"
                      )}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatCurrency(totalBudget, language)}</span>
              </div>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="participants" className="gap-2">
              <Users className="h-4 w-4" />
              {t("المشاركين", "Participants")} ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              {t("المستلزمات", "Items")} ({contributions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-medium">{t("المشاركين في الطلعة", "Event Participants")}</h3>
              <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-participant-shared">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("إضافة مشارك", "Add Participant")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("إضافة مشارك", "Add Participant")}</DialogTitle>
                    <DialogDescription>
                      {t("اختر مشاركاً لإضافته للطلعة", "Select a participant to add to the event")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {availableParticipants.length > 0 ? (
                      <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId}>
                        <SelectTrigger data-testid="select-participant-shared">
                          <SelectValue placeholder={t("اختر مشاركاً", "Select participant")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableParticipants.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <AvatarIcon icon={p.avatar} className="h-4 w-4" />
                                {p.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("لا يوجد مشاركين متاحين للإضافة", "No participants available to add")}
                      </p>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">{t("إلغاء", "Cancel")}</Button>
                    </DialogClose>
                    <Button
                      onClick={() => selectedParticipantId && addParticipantMutation.mutate(selectedParticipantId)}
                      disabled={!selectedParticipantId || addParticipantMutation.isPending}
                      data-testid="button-confirm-add-participant-shared"
                    >
                      {addParticipantMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t("إضافة", "Add")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {participants.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("لم يتم إضافة مشاركين بعد", "No participants added yet")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {participants.map((participant) => (
                  <Card key={participant.id} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarIcon icon={participant.avatar} className="h-10 w-10" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{participant.name}</p>
                          {participant.phone && (
                            <p className="text-sm text-muted-foreground">{participant.phone}</p>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("حذف المشارك", "Remove Participant")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                `هل أنت متأكد من حذف "${participant.name}" من الطلعة؟`,
                                `Are you sure you want to remove "${participant.name}" from this event?`
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeParticipantMutation.mutate(participant.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              {t("حذف", "Remove")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-medium">{t("المستلزمات والمساهمات", "Items & Contributions")}</h3>
              <Dialog open={addItemOpen} onOpenChange={(open) => {
                setAddItemOpen(open);
                if (!open) {
                  setSelectedItems(new Set());
                  setCategoryFilter("all");
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-item-shared">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("إضافة مستلزمات", "Add Items")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{t("إضافة مستلزمات", "Add Items")}</DialogTitle>
                    <DialogDescription>
                      {t("اختر المستلزمات التي تريد إضافتها للطلعة", "Select items to add to the event")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger data-testid="select-category-filter">
                        <SelectValue placeholder={t("جميع الفئات", "All Categories")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("جميع الفئات", "All Categories")}</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon icon={cat.icon} color={cat.color} className="h-4 w-4" />
                              {language === "ar" ? cat.nameAr : (cat.name || cat.nameAr)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                      {(() => {
                        const filteredItems = availableItems.filter(item => 
                          categoryFilter === "all" || item.categoryId === categoryFilter
                        );
                        
                        if (filteredItems.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {categoryFilter === "all" 
                                ? t("جميع المستلزمات مضافة للطلعة", "All items are already added")
                                : t("لا توجد مستلزمات في هذه الفئة", "No items in this category")}
                            </p>
                          );
                        }
                        
                        return filteredItems.map((item) => {
                          const category = categories?.find(c => c.id === item.categoryId);
                          const isSelected = selectedItems.has(item.id);
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                const newSelected = new Set(selectedItems);
                                if (isSelected) {
                                  newSelected.delete(item.id);
                                } else {
                                  newSelected.add(item.id);
                                }
                                setSelectedItems(newSelected);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-colors w-full ${
                                isSelected 
                                  ? "border-primary bg-primary/5" 
                                  : "hover:bg-muted"
                              }`}
                              data-testid={`item-option-${item.id}`}
                            >
                              <Checkbox 
                                checked={isSelected} 
                                onCheckedChange={() => {}}
                                className="pointer-events-none"
                              />
                              {category && (
                                <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.name}</p>
                                {category && categoryFilter === "all" && (
                                  <p className="text-xs text-muted-foreground">
                                    {language === "ar" ? category.nameAr : (category.name || category.nameAr)}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                    
                    {selectedItems.size > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {selectedItems.size} {t("مستلزم محدد", "item(s) selected")}
                        </span>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">{t("إلغاء", "Cancel")}</Button>
                    </DialogClose>
                    <Button
                      onClick={() => selectedItems.size > 0 && addContributionMutation.mutate(Array.from(selectedItems))}
                      disabled={selectedItems.size === 0 || addContributionMutation.isPending}
                      data-testid="button-confirm-add-item-shared"
                    >
                      {addContributionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t("إضافة", "Add")} {selectedItems.size > 0 && `(${selectedItems.size})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {contributions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("لم يتم إضافة مستلزمات بعد", "No items added yet")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {unassignedItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("غير معين", "Unassigned")} ({unassignedItems.length})
                    </h4>
                    {unassignedItems.map((contribution) => (
                      <ContributionCard
                        key={contribution.id}
                        contribution={contribution}
                        category={categories?.find(c => c.id === contribution.item?.categoryId)}
                        participants={participants}
                        onAssign={(participantId, cost, quantity) => 
                          updateContributionMutation.mutate({ 
                            contributionId: contribution.id, 
                            data: { participantId, cost, quantity } 
                          })
                        }
                        onDelete={() => deleteContributionMutation.mutate(contribution.id)}
                        isLoading={updateContributionMutation.isPending || deleteContributionMutation.isPending}
                        language={language}
                        t={t}
                      />
                    ))}
                  </div>
                )}
                {assignedItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("معين", "Assigned")} ({assignedItems.length})
                    </h4>
                    {assignedItems.map((contribution) => (
                      <ContributionCard
                        key={contribution.id}
                        contribution={contribution}
                        category={categories?.find(c => c.id === contribution.item?.categoryId)}
                        participants={participants}
                        onAssign={(participantId, cost, quantity) => 
                          updateContributionMutation.mutate({ 
                            contributionId: contribution.id, 
                            data: { participantId, cost, quantity } 
                          })
                        }
                        onUnassign={() => 
                          updateContributionMutation.mutate({ 
                            contributionId: contribution.id, 
                            data: { participantId: null, cost: "0" } 
                          })
                        }
                        onDelete={() => deleteContributionMutation.mutate(contribution.id)}
                        isLoading={updateContributionMutation.isPending || deleteContributionMutation.isPending}
                        language={language}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">{t("إجمالي الميزانية", "Total Budget")}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget, language)}</p>
              </div>
              <div className="text-end">
                <p className="text-sm text-muted-foreground">{t("المشاركين", "Participants")}</p>
                <p className="text-2xl font-bold">{formatNumber(participants.length, language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ContributionCardProps {
  contribution: ContributionWithDetails;
  category?: Category;
  participants: Participant[];
  onAssign: (participantId: string, cost: string, quantity: number) => void;
  onUnassign?: () => void;
  onDelete: () => void;
  isLoading: boolean;
  language: "ar" | "en";
  t: (ar: string, en: string) => string;
}

function ContributionCard({
  contribution,
  category,
  participants,
  onAssign,
  onUnassign,
  onDelete,
  isLoading,
  language,
  t,
}: ContributionCardProps) {
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [cost, setCost] = useState(contribution.cost || "0");
  const [quantity, setQuantity] = useState(String(contribution.quantity || 1));
  const [includeCost, setIncludeCost] = useState(parseFloat(contribution.cost || "0") > 0);
  
  const hasParticipant = !!contribution.participantId;

  const handleAssign = () => {
    if (selectedParticipant) {
      const qty = parseInt(quantity) || 1;
      const unitCost = parseFloat(cost) || 0;
      onAssign(selectedParticipant, includeCost ? unitCost.toFixed(2) : "0", qty);
      setShowAssign(false);
      setSelectedParticipant("");
      setCost("0");
      setQuantity("1");
      setIncludeCost(false);
    }
  };

  const handleStartEdit = () => {
    setSelectedParticipant(contribution.participantId || "");
    setCost(contribution.cost || "0");
    setQuantity(String(contribution.quantity || 1));
    setIncludeCost(parseFloat(contribution.cost || "0") > 0);
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (selectedParticipant) {
      const qty = parseInt(quantity) || 1;
      const unitCost = parseFloat(cost) || 0;
      onAssign(selectedParticipant, includeCost ? unitCost.toFixed(2) : "0", qty);
      setShowEdit(false);
    }
  };

  return (
    <Card className={hasParticipant ? "border-green-200 dark:border-green-800" : ""}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              hasParticipant ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
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
            {(contribution.quantity && contribution.quantity > 1) && parseFloat(contribution.cost || "0") === 0 && (
              <Badge variant="secondary">
                {contribution.quantity}×
              </Badge>
            )}
            {parseFloat(contribution.cost || "0") > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {(contribution.quantity && contribution.quantity > 1) ? (
                  <span>{contribution.quantity} × {formatCurrency(parseFloat(contribution.cost || "0"), language)} = {formatCurrency((contribution.quantity * parseFloat(contribution.cost || "0")), language)}</span>
                ) : (
                  formatCurrency(parseFloat(contribution.cost || "0"), language)
                )}
              </Badge>
            )}
            {!hasParticipant ? (
              <Dialog open={showAssign} onOpenChange={setShowAssign}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`button-assign-${contribution.id}`}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("تعيين مشارك", "Assign Participant")}</DialogTitle>
                    <DialogDescription>
                      {t("اختر المشارك المسؤول عن هذا المستلزم", "Select who is responsible for this item")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("اختر مشاركاً", "Select participant")} />
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
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("الكمية", "Quantity")}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="include-cost" 
                          checked={includeCost} 
                          onCheckedChange={(checked) => setIncludeCost(checked === true)}
                        />
                        <Label htmlFor="include-cost">{t("إضافة تكلفة", "Add cost")}</Label>
                      </div>
                      {includeCost && (
                        <div className="space-y-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">{t("سعر الوحدة (ر.ق)", "Unit Price (QAR)")}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={cost}
                              onChange={(e) => setCost(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          {(parseFloat(cost) > 0 && parseInt(quantity) > 1) && (
                            <div className="flex items-center justify-between p-2 rounded-md bg-primary/10 text-sm">
                              <span className="text-muted-foreground">
                                {quantity} × {parseFloat(cost).toFixed(2)} {t("ر.ق", "QAR")}
                              </span>
                              <span className="font-semibold">
                                = {((parseInt(quantity) || 1) * (parseFloat(cost) || 0)).toFixed(2)} {t("ر.ق", "QAR")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">{t("إلغاء", "Cancel")}</Button>
                    </DialogClose>
                    <Button onClick={handleAssign} disabled={!selectedParticipant || isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t("تعيين", "Assign")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <>
                <Dialog open={showEdit} onOpenChange={setShowEdit}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleStartEdit}
                      className="h-8 w-8 text-muted-foreground"
                      data-testid={`button-edit-${contribution.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("تعديل المساهمة", "Edit Contribution")}</DialogTitle>
                      <DialogDescription>
                        {t("تعديل المشارك والتكلفة والكمية", "Edit participant, cost and quantity")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("اختر مشاركاً", "Select participant")} />
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
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("الكمية", "Quantity")}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="edit-include-cost" 
                            checked={includeCost} 
                            onCheckedChange={(checked) => setIncludeCost(checked === true)}
                          />
                          <Label htmlFor="edit-include-cost">{t("إضافة تكلفة", "Add cost")}</Label>
                        </div>
                        {includeCost && (
                          <div className="space-y-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t("سعر الوحدة (ر.ق)", "Unit Price (QAR)")}</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            {(parseFloat(cost) > 0 && parseInt(quantity) > 1) && (
                              <div className="flex items-center justify-between p-2 rounded-md bg-primary/10 text-sm">
                                <span className="text-muted-foreground">
                                  {quantity} × {parseFloat(cost).toFixed(2)} {t("ر.ق", "QAR")}
                                </span>
                                <span className="font-semibold">
                                  = {((parseInt(quantity) || 1) * (parseFloat(cost) || 0)).toFixed(2)} {t("ر.ق", "QAR")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">{t("إلغاء", "Cancel")}</Button>
                      </DialogClose>
                      <Button onClick={handleSaveEdit} disabled={!selectedParticipant || isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {t("حفظ", "Save")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {onUnassign && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onUnassign} 
                    className="h-8 w-8 text-muted-foreground"
                    data-testid={`button-unassign-${contribution.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("حذف المستلزم", "Remove Item")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      `هل أنت متأكد من حذف "${contribution.item?.name}" من الطلعة؟`,
                      `Are you sure you want to remove "${contribution.item?.name}" from this event?`
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {t("حذف", "Remove")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

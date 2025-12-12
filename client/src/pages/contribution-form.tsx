import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Package, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CategoryIcon } from "@/components/category-icon";
import { AvatarIcon } from "@/components/avatar-icon";
import { useLanguage } from "@/components/language-provider";
import type { CategoryWithItems, Item, Participant, EventWithDetails } from "@shared/schema";

export default function ContributionForm() {
  const [, params] = useRoute("/events/:id/items");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const eventId = params?.id;

  const [selectedItems, setSelectedItems] = useState<Map<string, { 
    participantId?: string; 
    cost?: string;
    quantity?: string;
    includeParticipant?: boolean;
    includeCost?: boolean;
  }>>(new Map());

  const { data: event, isLoading: eventLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryWithItems[]>({
    queryKey: ["/api/categories?withItems=true"],
  });

  const { data: participants } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const addContributionMutation = useMutation({
    mutationFn: async (data: { eventId: string; itemId: string; participantId?: string; cost?: string; quantity?: number }) => {
      return apiRequest(
        "POST",
        `/api/events/${data.eventId}/contributions`,
        {
          itemId: data.itemId,
          participantId: data.participantId || null,
          cost: data.cost || "0",
          quantity: data.quantity || 1,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
    },
  });

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: t("تنبيه", "Notice"),
        description: t("الرجاء اختيار مستلزم واحد على الأقل", "Please select at least one item"),
        variant: "destructive",
      });
      return;
    }

    try {
      const promises = Array.from(selectedItems.entries()).map(([itemId, data]) => {
        const quantity = parseInt(data.quantity || "1") || 1;
        const unitCost = parseFloat(data.cost || "0") || 0;
        return addContributionMutation.mutateAsync({
          eventId: eventId!,
          itemId,
          participantId: data.includeParticipant ? data.participantId : undefined,
          cost: data.includeCost ? unitCost.toFixed(2) : undefined,
          quantity: quantity,
        });
      });

      await Promise.all(promises);

      toast({
        title: t("تم بنجاح", "Success"),
        description: t(`تم إضافة ${selectedItems.size} مستلزم للطلعة`, `Added ${selectedItems.size} item(s) to the event`),
      });

      navigate(`/events/${eventId}`);
    } catch (error) {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إضافة المستلزمات", "An error occurred while adding items"),
        variant: "destructive",
      });
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.set(itemId, { includeParticipant: false, includeCost: false, quantity: "1" });
    }
    setSelectedItems(newSelected);
  };

  const updateItemData = (itemId: string, field: "participantId" | "cost" | "quantity" | "includeParticipant" | "includeCost", value: string | boolean) => {
    const newSelected = new Map(selectedItems);
    const current = newSelected.get(itemId) || {};
    newSelected.set(itemId, { ...current, [field]: value });
    setSelectedItems(newSelected);
  };

  const isLoading = eventLoading || categoriesLoading;
  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("الطلعة غير موجودة", "Event not found")}</h3>
            <Link href="/events">
              <Button>{t("العودة للطلعات", "Back to Events")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const existingItemIds = new Set(event.contributions?.map((c) => c.itemId) || []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/events/${eventId}`)}
          data-testid="button-back"
        >
          <BackArrow className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("إضافة مستلزمات", "Add Items")}</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      <div className="space-y-4">
        {categories?.map((category) => {
          const availableItems = category.items?.filter((item) => !existingItemIds.has(item.id)) || [];
          if (availableItems.length === 0) return null;

          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
                  {language === "ar" ? category.nameAr : (category.name || category.nameAr)}
                  <Badge variant="secondary" className={language === "ar" ? "mr-auto" : "ml-auto"}>
                    {availableItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableItems.map((item) => {
                  const isSelected = selectedItems.has(item.id);
                  const itemData = selectedItems.get(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={item.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleItem(item.id)}
                          data-testid={`checkbox-item-${item.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={item.id} className="font-medium cursor-pointer">
                            {item.name}
                          </Label>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}

                          {isSelected && (
                            <div className="mt-3 space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">{t("الكمية", "Quantity")}</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={itemData?.quantity || "1"}
                                  onChange={(e) => updateItemData(item.id, "quantity", e.target.value)}
                                  className="w-24"
                                  data-testid={`input-quantity-${item.id}`}
                                />
                              </div>
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                <Checkbox
                                  id={`participant-toggle-${item.id}`}
                                  checked={itemData?.includeParticipant || false}
                                  onCheckedChange={(checked) => updateItemData(item.id, "includeParticipant", !!checked)}
                                  data-testid={`checkbox-include-participant-${item.id}`}
                                />
                                <Label htmlFor={`participant-toggle-${item.id}`} className="text-sm cursor-pointer flex-1">
                                  {t("تعيين مسؤول", "Assign responsible")}
                                </Label>
                                <Checkbox
                                  id={`cost-toggle-${item.id}`}
                                  checked={itemData?.includeCost || false}
                                  onCheckedChange={(checked) => updateItemData(item.id, "includeCost", !!checked)}
                                  data-testid={`checkbox-include-cost-${item.id}`}
                                />
                                <Label htmlFor={`cost-toggle-${item.id}`} className="text-sm cursor-pointer">
                                  {t("إضافة تكلفة", "Add cost")}
                                </Label>
                              </div>
                              
                              {(itemData?.includeParticipant || itemData?.includeCost) && (
                                <div className="space-y-3">
                                  {itemData?.includeParticipant && (
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">{t("المسؤول", "Responsible")}</Label>
                                      <Select
                                        value={itemData?.participantId || ""}
                                        onValueChange={(v) => updateItemData(item.id, "participantId", v)}
                                      >
                                        <SelectTrigger data-testid={`select-participant-${item.id}`}>
                                          <SelectValue placeholder={t("اختر مشارك", "Select participant")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {participants?.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                              <div className="flex items-center gap-2">
                                                <AvatarIcon icon={p.avatar} className="h-4 w-4" />
                                                {p.name}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  {itemData?.includeCost && (
                                    <div className="space-y-2">
                                      <div className="space-y-1.5">
                                        <Label className="text-xs">{t("سعر الوحدة (ر.ق)", "Unit Price (QAR)")}</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0.00"
                                          value={itemData?.cost || ""}
                                          onChange={(e) => updateItemData(item.id, "cost", e.target.value)}
                                          data-testid={`input-cost-${item.id}`}
                                        />
                                      </div>
                                      {(parseFloat(itemData?.cost || "0") > 0 && parseInt(itemData?.quantity || "1") > 1) && (
                                        <div className="flex items-center justify-between p-2 rounded-md bg-primary/10 text-sm">
                                          <span className="text-muted-foreground">
                                            {itemData?.quantity || 1} × {parseFloat(itemData?.cost || "0").toFixed(2)} {t("ر.ق", "QAR")}
                                          </span>
                                          <span className="font-semibold">
                                            = {((parseInt(itemData?.quantity || "1") || 1) * (parseFloat(itemData?.cost || "0") || 0)).toFixed(2)} {t("ر.ق", "QAR")}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedItems.size > 0 && (
        <div className="sticky bottom-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{selectedItems.size} {t("مستلزم محدد", "item(s) selected")}</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={addContributionMutation.isPending}
                data-testid="button-save-contributions"
              >
                {addContributionMutation.isPending ? t("جاري الحفظ...", "Saving...") : t("إضافة للطلعة", "Add to Event")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedItems.size === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t("اختر المستلزمات التي تريد إضافتها للطلعة", "Select items you want to add to the event")}</p>
        </div>
      )}
    </div>
  );
}

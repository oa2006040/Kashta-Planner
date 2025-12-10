import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Package, Check, Plus } from "lucide-react";
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
import type { Category, Item, Participant, EventWithDetails } from "@shared/schema";

export default function ContributionForm() {
  const [, params] = useRoute("/events/:id/items");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params?.id;

  const [selectedItems, setSelectedItems] = useState<Map<string, { participantId?: string; cost?: string }>>(new Map());

  const { data: event, isLoading: eventLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: participants } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const addContributionMutation = useMutation({
    mutationFn: async (data: { eventId: string; itemId: string; participantId?: string; cost?: string }) => {
      return apiRequest("/api/contributions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
    },
  });

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار مستلزم واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      const promises = Array.from(selectedItems.entries()).map(([itemId, data]) =>
        addContributionMutation.mutateAsync({
          eventId: eventId!,
          itemId,
          participantId: data.participantId,
          cost: data.cost,
        })
      );

      await Promise.all(promises);

      toast({
        title: "تم بنجاح",
        description: `تم إضافة ${selectedItems.size} مستلزم للطلعة`,
      });

      navigate(`/events/${eventId}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المستلزمات",
        variant: "destructive",
      });
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.set(itemId, {});
    }
    setSelectedItems(newSelected);
  };

  const updateItemData = (itemId: string, field: "participantId" | "cost", value: string) => {
    const newSelected = new Map(selectedItems);
    const current = newSelected.get(itemId) || {};
    newSelected.set(itemId, { ...current, [field]: value });
    setSelectedItems(newSelected);
  };

  const isLoading = eventLoading || categoriesLoading;

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
            <h3 className="text-lg font-medium mb-2">الطلعة غير موجودة</h3>
            <Link href="/events">
              <Button>العودة للطلعات</Button>
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
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إضافة مستلزمات</h1>
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
                  {category.nameAr}
                  <Badge variant="secondary" className="mr-auto">
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
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs">المسؤول</Label>
                                <Select
                                  value={itemData?.participantId || ""}
                                  onValueChange={(v) => updateItemData(item.id, "participantId", v)}
                                >
                                  <SelectTrigger data-testid={`select-participant-${item.id}`}>
                                    <SelectValue placeholder="اختر مشارك" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {participants?.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center gap-2">
                                          <AvatarIcon avatar={p.avatar} size="sm" />
                                          {p.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">التكلفة (ر.ع)</Label>
                                <Input
                                  type="number"
                                  placeholder="0.000"
                                  value={itemData?.cost || ""}
                                  onChange={(e) => updateItemData(item.id, "cost", e.target.value)}
                                  data-testid={`input-cost-${item.id}`}
                                />
                              </div>
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
                <span>{selectedItems.size} مستلزم محدد</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={addContributionMutation.isPending}
                data-testid="button-save-contributions"
              >
                {addContributionMutation.isPending ? "جاري الحفظ..." : "إضافة للطلعة"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedItems.size === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>اختر المستلزمات التي تريد إضافتها للطلعة</p>
        </div>
      )}
    </div>
  );
}

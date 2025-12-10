import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowRight, Users, Check, Plus, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AvatarIcon } from "@/components/avatar-icon";
import { CategoryIcon } from "@/components/category-icon";
import type { Participant, EventWithDetails, CategoryWithItems } from "@shared/schema";

export default function EventParticipantsForm() {
  const [, params] = useRoute("/events/:id/participants");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params?.id;

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemCosts, setItemCosts] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: event, isLoading: eventLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: participants, isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryWithItems[]>({
    queryKey: ["/api/categories", "withItems"],
    queryFn: () => fetch("/api/categories?withItems=true").then(res => res.json()),
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (data: { participantId: string; itemIds: string[]; costs: Record<string, string> }) => {
      return apiRequest(
        "POST",
        `/api/events/${eventId}/participants-with-contributions`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
    },
  });

  const handleSubmit = async () => {
    if (!selectedParticipantId) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار مشارك",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.size === 0) {
      toast({
        title: "تنبيه",
        description: "يجب اختيار مستلزم واحد على الأقل للمشارك",
        variant: "destructive",
      });
      return;
    }

    try {
      // Sanitize costs: convert empty strings to "0" and ensure numeric values
      const sanitizedCosts: Record<string, string> = {};
      for (const itemId of selectedItems) {
        const cost = itemCosts[itemId];
        sanitizedCosts[itemId] = cost && cost.trim() !== "" ? cost : "0";
      }
      
      await addParticipantMutation.mutateAsync({
        participantId: selectedParticipantId,
        itemIds: Array.from(selectedItems),
        costs: sanitizedCosts,
      });

      toast({
        title: "تم بنجاح",
        description: `تم إضافة المشارك مع ${selectedItems.size} مستلزم`,
      });

      navigate(`/events/${eventId}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المشارك",
        variant: "destructive",
      });
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const setCost = (itemId: string, cost: string) => {
    setItemCosts((prev) => ({ ...prev, [itemId]: cost }));
  };

  const isLoading = eventLoading || participantsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">الطلعة غير موجودة</h3>
            <Link href="/events">
              <Button>العودة للطلعات</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const existingParticipantIds = new Set(
    event.eventParticipants?.map((ep) => ep.participantId) || []
  );
  const availableParticipants = participants?.filter(
    (p) => !existingParticipantIds.has(p.id)
  ) || [];

  const existingItemIds = new Set(
    event.contributions?.map((c) => c.itemId) || []
  );

  const selectedParticipant = participants?.find((p) => p.id === selectedParticipantId);

  return (
    <div className="p-6 space-y-6 pb-32">
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
          <h1 className="text-2xl font-bold">إضافة مشارك</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            الخطوة 1: اختر المشارك
            {selectedParticipantId && (
              <Badge className="mr-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                <Check className="h-3 w-3 ml-1" />
                تم الاختيار
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableParticipants.length > 0 ? (
            availableParticipants.map((participant) => {
              const isSelected = selectedParticipantId === participant.id;

              return (
                <div
                  key={participant.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover-elevate"
                  }`}
                  onClick={() => setSelectedParticipantId(participant.id)}
                  data-testid={`select-participant-${participant.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <AvatarIcon avatar={participant.avatar} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="font-medium cursor-pointer">
                        {participant.name}
                      </Label>
                      {participant.phone && (
                        <p className="text-sm text-muted-foreground">{participant.phone}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {participant.tripCount || 0} طلعات
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">لا يوجد مشاركين متاحين</p>
              <Link href="/participants/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مشارك جديد
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedParticipantId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5" />
              الخطوة 2: اختر المستلزمات
              <Badge variant="secondary" className="mr-auto">
                {selectedItems.size} محدد
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              اختر المستلزمات التي سيكون {selectedParticipant?.name} مسؤولاً عنها (مطلوب مستلزم واحد على الأقل)
            </p>
            
            {categories?.map((category) => {
              const availableItems = category.items?.filter((item) => !existingItemIds.has(item.id)) || [];
              if (availableItems.length === 0) return null;
              
              const isExpanded = expandedCategories.has(category.id);
              const selectedInCategory = availableItems.filter((item) => selectedItems.has(item.id)).length;

              return (
                <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover-elevate">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={category.icon} size="sm" />
                        <span className="font-medium">{category.nameAr}</span>
                        {selectedInCategory > 0 && (
                          <Badge className="bg-primary/10 text-primary">
                            {selectedInCategory}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{availableItems.length}</Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {availableItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`p-3 mr-4 rounded-lg border transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={item.id}
                              checked={isSelected}
                              onCheckedChange={() => toggleItem(item.id)}
                              data-testid={`checkbox-item-${item.id}`}
                            />
                            <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                              {item.nameAr}
                            </Label>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="التكلفة"
                                  value={itemCosts[item.id] || ""}
                                  onChange={(e) => setCost(item.id, e.target.value)}
                                  className="w-24 text-left"
                                  dir="ltr"
                                  data-testid={`input-cost-${item.id}`}
                                />
                                <span className="text-sm text-muted-foreground">ر.ق</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}

      {selectedParticipantId && selectedItems.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <AvatarIcon avatar={selectedParticipant?.avatar} size="sm" />
                </div>
                <span>{selectedParticipant?.name}</span>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                  {selectedItems.size} مستلزم
                </Badge>
              </div>
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={addParticipantMutation.isPending}
                data-testid="button-save-participant"
              >
                {addParticipantMutation.isPending ? "جاري الحفظ..." : "إضافة للطلعة"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

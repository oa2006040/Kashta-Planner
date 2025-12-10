import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowRight, 
  Calendar,
  MapPin,
  FileText,
  Save,
  Loader2,
  Package,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CategoryIcon } from "@/components/category-icon";
import type { Event, CategoryWithItems } from "@shared/schema";

const eventFormSchema = z.object({
  title: z.string().min(1, "يرجى إدخال اسم الطلعة"),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string().min(1, "يرجى اختيار التاريخ"),
  endDate: z.string().optional(),
  status: z.string().default("upcoming"),
  weather: z.string().optional(),
  temperature: z.coerce.number().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function EventForm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/events/:id/edit");
  const isEditing = !!params?.id;
  const { toast } = useToast();
  
  const [selectContributions, setSelectContributions] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", params?.id],
    enabled: isEditing,
  });

  const { data: categories } = useQuery<CategoryWithItems[]>({
    queryKey: ["/api/categories?withItems=true"],
    enabled: selectContributions,
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      date: new Date().toISOString().split("T")[0],
      endDate: "",
      status: "upcoming",
      weather: "",
      temperature: undefined,
    },
    values: event ? {
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
      endDate: event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
      status: event.status || "upcoming",
      weather: event.weather || "",
      temperature: event.temperature || undefined,
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        temperature: data.temperature || null,
        requiredItems: selectContributions ? Array.from(selectedItems) : [],
      };
      return apiRequest("POST", "/api/events", payload);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      const event = await response.json();
      toast({
        title: "تم إنشاء الطلعة",
        description: "تم إنشاء الطلعة بنجاح",
      });
      navigate(`/events/${event.id}`);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الطلعة",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        temperature: data.temperature || null,
      };
      return apiRequest("PATCH", `/api/events/${params?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث الطلعة بنجاح",
      });
      navigate(`/events/${params?.id}`);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الطلعة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const selectAllInCategory = (categoryId: string, items: { id: string }[]) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      const categoryItemIds = items.map(i => i.id);
      const allSelected = categoryItemIds.every(id => next.has(id));
      
      if (allSelected) {
        categoryItemIds.forEach(id => next.delete(id));
      } else {
        categoryItemIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(isEditing ? `/events/${params?.id}` : "/events")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "تعديل الطلعة" : "طلعة جديدة"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "قم بتعديل تفاصيل الطلعة" : "أدخل تفاصيل الطلعة الجديدة"}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الطلعة *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="مثال: كشتة نهاية الأسبوع" 
                        {...field}
                        data-testid="input-event-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="أضف وصفاً للطلعة..." 
                        className="resize-none"
                        {...field}
                        data-testid="input-event-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموقع</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="مثال: روضة خريم" 
                          className="pr-9"
                          {...field}
                          data-testid="input-event-location"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ البداية *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            type="date" 
                            className="pr-9"
                            {...field}
                            data-testid="input-event-date"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ النهاية</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            type="date" 
                            className="pr-9"
                            {...field}
                            data-testid="input-event-end-date"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-event-status">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">قادمة</SelectItem>
                        <SelectItem value="ongoing">جارية</SelectItem>
                        <SelectItem value="completed">منتهية</SelectItem>
                        <SelectItem value="cancelled">ملغاة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="weather"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الطقس</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-event-weather">
                            <SelectValue placeholder="اختر الطقس" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sunny">مشمس</SelectItem>
                          <SelectItem value="cloudy">غائم</SelectItem>
                          <SelectItem value="cold">بارد</SelectItem>
                          <SelectItem value="windy">عاصف</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>درجة الحرارة</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="مثال: 18"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-event-temperature"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!isEditing && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="selectContributions"
                      checked={selectContributions}
                      onCheckedChange={(checked) => setSelectContributions(checked === true)}
                      data-testid="checkbox-select-contributions"
                    />
                    <label
                      htmlFor="selectContributions"
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      تحديد المستلزمات المطلوبة
                    </label>
                  </div>

                  {selectContributions && (
                    <div className="space-y-3 pr-6">
                      {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{selectedItems.size}</Badge>
                          <span>مستلزم محدد</span>
                        </div>
                      )}

                      {categories?.map((category) => {
                        const isExpanded = expandedCategories.has(category.id);
                        const categoryItems = category.items || [];
                        const selectedCount = categoryItems.filter(i => selectedItems.has(i.id)).length;
                        const allSelected = categoryItems.length > 0 && selectedCount === categoryItems.length;

                        return (
                          <Collapsible
                            key={category.id}
                            open={isExpanded}
                            onOpenChange={() => toggleCategory(category.id)}
                          >
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
                              <span className="font-medium flex-1">{category.nameAr}</span>
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {selectedCount}/{categoryItems.length}
                                </Badge>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllInCategory(category.id, categoryItems);
                                }}
                                className="text-xs"
                                data-testid={`button-select-all-${category.id}`}
                              >
                                {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                              </Button>
                            </div>
                            <CollapsibleContent className="space-y-1 pr-6 pt-2">
                              {categoryItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                                  onClick={() => toggleItem(item.id)}
                                  data-testid={`item-${item.id}`}
                                >
                                  <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                                    selectedItems.has(item.id)
                                      ? "bg-primary border-primary"
                                      : "border-muted-foreground/30"
                                  }`}>
                                    {selectedItems.has(item.id) && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm">{item.name}</span>
                                  {item.description && (
                                    <span className="text-xs text-muted-foreground">({item.description})</span>
                                  )}
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isPending}
                  data-testid="button-submit-event"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  {isEditing ? "حفظ التغييرات" : "إنشاء الطلعة"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(isEditing ? `/events/${params?.id}` : "/events")}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

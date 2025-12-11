import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Save,
  Loader2,
  Package,
  Check,
  ChevronDown,
  ChevronUp,
  Navigation,
  Cloud,
  Thermometer,
  Target,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CategoryIcon } from "@/components/category-icon";
import { MapPickerDialog } from "@/components/map-picker";
import { useLanguage } from "@/components/language-provider";
import type { Event, CategoryWithItems } from "@shared/schema";

export default function EventForm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/events/:id/edit");
  const isEditing = !!params?.id;
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const eventFormSchema = z.object({
    title: z.string().min(1, t("يرجى إدخال اسم الطلعة", "Please enter event name")),
    description: z.string().optional(),
    location: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    date: z.string().min(1, t("يرجى اختيار التاريخ", "Please select a date")),
    endDate: z.string().optional(),
    weather: z.string().optional(),
    temperature: z.coerce.number().optional(),
  });

  type EventFormData = z.infer<typeof eventFormSchema>;
  
  const [selectContributions, setSelectContributions] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [includeEndDate, setIncludeEndDate] = useState(false);
  const [includeWeather, setIncludeWeather] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

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
      latitude: undefined,
      longitude: undefined,
      date: todayStr,
      endDate: "",
      weather: "",
      temperature: undefined,
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        latitude: event.latitude ? parseFloat(event.latitude) : undefined,
        longitude: event.longitude ? parseFloat(event.longitude) : undefined,
        date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
        weather: event.weather || "",
        temperature: event.temperature || undefined,
      });
      
      if (event.endDate) {
        setIncludeEndDate(true);
      }
      if (event.weather || event.temperature) {
        setIncludeWeather(true);
      }
      if (event.latitude && event.longitude) {
        setCoordinates({ 
          lat: parseFloat(event.latitude), 
          lng: parseFloat(event.longitude) 
        });
      }
    }
  }, [event, form]);

  const fetchWeather = async (lat: number, lng: number, date: string) => {
    setIsLoadingWeather(true);
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}&date=${date}`);
      if (!response.ok) throw new Error("Failed to fetch weather");
      const data = await response.json();
      
      form.setValue("weather", data.weather);
      form.setValue("temperature", data.temperature);
      
      toast({
        title: t("تم جلب الطقس", "Weather fetched"),
        description: `${data.weather} - ${data.temperature}°C`,
      });
    } catch (error) {
      toast({
        title: t("خطأ", "Error"),
        description: t("لم نتمكن من جلب بيانات الطقس", "Could not fetch weather data"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const getDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t("خطأ", "Error"),
        description: t("المتصفح لا يدعم تحديد الموقع", "Browser does not support location"),
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        form.setValue("latitude", latitude);
        form.setValue("longitude", longitude);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${language}`
          );
          if (!response.ok) throw new Error("Geocoding failed");
          const data = await response.json();
          const address = data.address || {};
          const region = address.state || address.region || address.county || address.city || address.town || address.village || "";
          const country = address.country || "";
          const locationName = region && country 
            ? `${region}، ${country}` 
            : (region || country || t("موقع محدد", "Selected location"));
          form.setValue("location", locationName);
        } catch (err) {
          console.error("Geocoding error:", err);
          form.setValue("location", t("موقع محدد", "Selected location"));
        }
        
        setIsLoadingLocation(false);
        
        toast({
          title: t("تم تحديد الموقع", "Location set"),
          description: t("تم الحصول على موقعك بنجاح", "Your location was obtained successfully"),
        });
        
        if (includeWeather) {
          const dateValue = form.getValues("date");
          if (dateValue) {
            fetchWeather(latitude, longitude, dateValue);
          }
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = t("حدث خطأ أثناء تحديد الموقع", "Error determining location");
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t("يرجى السماح بالوصول إلى موقعك من إعدادات المتصفح", "Please allow location access in browser settings");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t("لا يمكن تحديد موقعك حالياً. تأكد من تفعيل GPS", "Cannot determine location. Make sure GPS is enabled");
            break;
          case error.TIMEOUT:
            errorMessage = t("انتهت المهلة الزمنية لتحديد الموقع. حاول مرة أخرى", "Location timeout. Please try again");
            break;
        }
        
        toast({
          title: t("خطأ في تحديد الموقع", "Location error"),
          description: errorMessage,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleMapSelect = (lat: number, lng: number, locationName: string) => {
    setCoordinates({ lat, lng });
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
    
    if (locationName) {
      form.setValue("location", locationName);
    }
    
    toast({
      title: t("تم تحديد الموقع", "Location set"),
      description: t("تم إضافة الإحداثيات بنجاح", "Coordinates added successfully"),
    });
    
    if (includeWeather) {
      const dateValue = form.getValues("date");
      if (dateValue) {
        fetchWeather(lat, lng, dateValue);
      }
    }
  };

  useEffect(() => {
    if (includeWeather && coordinates) {
      const dateValue = form.getValues("date");
      if (dateValue) {
        fetchWeather(coordinates.lat, coordinates.lng, dateValue);
      }
    }
  }, [includeWeather]);

  const watchDate = form.watch("date");
  useEffect(() => {
    if (includeWeather && coordinates && watchDate) {
      fetchWeather(coordinates.lat, coordinates.lng, watchDate);
    }
  }, [watchDate]);

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        endDate: includeEndDate && data.endDate ? new Date(data.endDate).toISOString() : null,
        weather: includeWeather ? data.weather : null,
        temperature: includeWeather ? data.temperature : null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        requiredItems: selectContributions ? Array.from(selectedItems) : [],
      };
      return apiRequest("POST", "/api/events", payload);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      const event = await response.json();
      toast({
        title: t("تم إنشاء الطلعة", "Event created"),
        description: t("تم إنشاء الطلعة بنجاح", "Event created successfully"),
      });
      navigate(`/events/${event.id}`);
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إنشاء الطلعة", "Error creating event"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        endDate: includeEndDate && data.endDate ? new Date(data.endDate).toISOString() : null,
        weather: includeWeather ? data.weather : null,
        temperature: includeWeather ? data.temperature : null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };
      return apiRequest("PATCH", `/api/events/${params?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: t("تم التحديث", "Updated"),
        description: t("تم تحديث الطلعة بنجاح", "Event updated successfully"),
      });
      navigate(`/events/${params?.id}`);
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تحديث الطلعة", "Error updating event"),
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
    <div className="p-3 sm:p-6 max-w-2xl mx-auto pb-24 sm:pb-6">
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(isEditing ? `/events/${params?.id}` : "/events")}
          className="mb-3 sm:mb-4 h-10 sm:h-9"
          data-testid="button-back"
        >
          <BackArrow className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
          {t("رجوع", "Back")}
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">
          {isEditing ? t("تعديل الطلعة", "Edit Event") : t("طلعة جديدة", "New Event")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {isEditing ? t("قم بتعديل تفاصيل الطلعة", "Edit event details") : t("أدخل تفاصيل الطلعة الجديدة", "Enter new event details")}
        </p>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("اسم الطلعة", "Event Name")} *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("مثال: كشتة نهاية الأسبوع", "Example: Weekend Trip")} 
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
                    <FormLabel>{t("الوصف", "Description")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("أضف وصفاً للطلعة...", "Add event description...")} 
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
                    <FormLabel>{t("الموقع", "Location")}</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
                            <Input 
                              placeholder={t("مثال: روضة خريم", "Example: Desert Camp")} 
                              className={language === "ar" ? "pr-9" : "pl-9"}
                              {...field}
                              data-testid="input-event-location"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={getDeviceLocation}
                            disabled={isLoadingLocation}
                            data-testid="button-get-location"
                          >
                            {isLoadingLocation ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Navigation className="h-4 w-4" />
                            )}
                            <span className={`${language === "ar" ? "mr-2" : "ml-2"} hidden sm:inline`}>{t("موقعي", "My Location")}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowMapPicker(true)}
                            data-testid="button-open-map-picker"
                          >
                            <Target className="h-4 w-4" />
                            <span className={`${language === "ar" ? "mr-2" : "ml-2"} hidden sm:inline`}>{t("الخريطة", "Map")}</span>
                          </Button>
                        </div>
                        {coordinates && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                            <span className="font-mono" dir="ltr">
                              ({coordinates.lat.toFixed(6)}°, {coordinates.lng.toFixed(6)}°)
                            </span>
                            <a
                              href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t("فتح في الخريطة", "Open in Maps")}
                            </a>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("تاريخ البداية", "Start Date")} *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
                        <Input 
                          type="date" 
                          className={language === "ar" ? "pr-9" : "pl-9"}
                          min={isEditing ? undefined : todayStr}
                          {...field}
                          data-testid="input-event-date"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-lg border p-4 overflow-hidden">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="include-end-date">{t("تحديد تاريخ نهاية", "Set End Date")}</Label>
                  </div>
                  <Switch
                    id="include-end-date"
                    checked={includeEndDate}
                    onCheckedChange={setIncludeEndDate}
                    data-testid="switch-include-end-date"
                  />
                </div>
                
                {includeEndDate && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("تاريخ النهاية", "End Date")}</FormLabel>
                        <FormControl>
                          <div className="relative w-full">
                            <Calendar className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none`} />
                            <Input 
                              type="date" 
                              className={`w-full ${language === "ar" ? "pr-9" : "pl-9"}`}
                              min={form.getValues("date") || todayStr}
                              {...field}
                              data-testid="input-event-end-date"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="include-weather">{t("جلب الطقس تلقائياً", "Auto-fetch Weather")}</Label>
                  </div>
                  <Switch
                    id="include-weather"
                    checked={includeWeather}
                    onCheckedChange={setIncludeWeather}
                    disabled={!coordinates}
                    data-testid="switch-include-weather"
                  />
                </div>
                
                {!coordinates && (
                  <p className="text-xs text-muted-foreground">
                    {t("حدد الموقع أولاً لجلب بيانات الطقس تلقائياً", "Set location first to auto-fetch weather data")}
                  </p>
                )}
                
                {includeWeather && coordinates && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {isLoadingWeather ? (
                      <div className="col-span-2 flex items-center justify-center p-4">
                        <Loader2 className={`h-5 w-5 animate-spin ${language === "ar" ? "ml-2" : "mr-2"}`} />
                        <span className="text-sm text-muted-foreground">{t("جاري جلب الطقس...", "Fetching weather...")}</span>
                      </div>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="weather"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Cloud className="h-4 w-4" />
                                {t("الطقس", "Weather")}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t("صافي", "Clear")}
                                  {...field}
                                  readOnly
                                  className="bg-muted"
                                  data-testid="input-event-weather"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4" />
                                {t("درجة الحرارة", "Temperature")}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="number"
                                    placeholder="25"
                                    {...field}
                                    readOnly
                                    className="bg-muted"
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    data-testid="input-event-temperature"
                                  />
                                  <span className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-muted-foreground`}>°C</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                )}
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
                      {t("تحديد المستلزمات المطلوبة", "Select Required Items")}
                    </label>
                  </div>

                  {selectContributions && (
                    <div className={`space-y-3 ${language === "ar" ? "pr-6" : "pl-6"}`}>
                      {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{selectedItems.size}</Badge>
                          <span>{t("مستلزم محدد", "items selected")}</span>
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
                              <span className="font-medium flex-1">{language === "ar" ? category.nameAr : (category.name || category.nameAr)}</span>
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
                                {allSelected ? t("إلغاء الكل", "Deselect All") : t("تحديد الكل", "Select All")}
                              </Button>
                            </div>
                            <CollapsibleContent className={`space-y-1 ${language === "ar" ? "pr-6" : "pl-6"} pt-2`}>
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

              {/* Desktop Submit Button */}
              <div className="hidden sm:flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isPending}
                  data-testid="button-submit-event"
                >
                  {isPending ? (
                    <Loader2 className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                  ) : (
                    <Save className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  )}
                  {isEditing ? t("حفظ التغييرات", "Save Changes") : t("إنشاء الطلعة", "Create Event")}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(isEditing ? `/events/${params?.id}` : "/events")}
                  data-testid="button-cancel"
                >
                  {t("إلغاء", "Cancel")}
                </Button>
              </div>

              {/* Mobile Sticky Submit Button */}
              <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t sm:hidden z-50">
                <div className="flex gap-2 max-w-2xl mx-auto">
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="flex-1 h-12"
                    data-testid="button-submit-event-mobile"
                  >
                    {isPending ? (
                      <Loader2 className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                    ) : (
                      <Save className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    )}
                    {isEditing ? t("حفظ التغييرات", "Save Changes") : t("إنشاء الطلعة", "Create Event")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="h-12"
                    onClick={() => navigate(isEditing ? `/events/${params?.id}` : "/events")}
                    data-testid="button-cancel-mobile"
                  >
                    {t("إلغاء", "Cancel")}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <MapPickerDialog
        isOpen={showMapPicker}
        onOpenChange={setShowMapPicker}
        initialLat={coordinates?.lat}
        initialLng={coordinates?.lng}
        onSelect={handleMapSelect}
      />
    </div>
  );
}

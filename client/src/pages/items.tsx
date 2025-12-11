import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Package,
  Filter,
  Check,
  X,
  Loader2,
  Trash2,
  FolderPlus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatNumber } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { useLanguage } from "@/components/language-provider";
import type { Category, Item, CategoryWithItems } from "@shared/schema";

const AVAILABLE_ICONS = [
  "coffee", "utensils", "flame", "tent", "car", "gamepad-2", "first-aid", "sparkles",
  "cup-soda", "beer", "wine", "sandwich", "pizza", "cake", "apple", "banana", "cherry",
  "cookie", "croissant", "egg", "fish", "grape", "ice-cream", "lollipop", "milk", "popcorn", "salad",
  "soup", "drumstick", "bacon", "beef", "carrot", "citrus", "hot-dog",
  "home", "building", "building-2", "warehouse", "store", "hotel", "castle", "church", "school", "hospital",
  "camping", "mountain", "mountain-snow", "trees", "tree-palm", "tree-deciduous", "tree-pine", "flower", "flower-2", "leaf", "clover",
  "sun", "moon", "star", "cloud", "cloud-rain", "cloud-snow", "wind", "rainbow", "umbrella", "thermometer",
  "map", "map-pin", "compass", "globe", "navigation", "signpost", "route", "milestone",
  "truck", "bus", "train", "plane", "ship", "bike", "motorcycle", "tractor", "forklift", "ambulance",
  "shirt", "footprints", "glasses", "watch", "crown", "gem", "ring", "necklace", "hat", "boot",
  "scissors", "ruler", "pencil", "pen", "highlighter", "eraser", "paperclip", "pin", "thumbtack", "bookmark",
  "book", "notebook", "book-open", "library", "graduation-cap", "backpack", "briefcase", "folder", "file", "clipboard",
  "camera", "video", "film", "tv", "monitor", "laptop", "tablet", "smartphone", "headphones", "speaker",
  "music", "music-2", "music-3", "music-4", "mic", "mic-2", "radio", "volume-2", "bell", "alarm-clock",
  "phone", "mail", "message-circle", "message-square", "inbox", "send", "at-sign", "hash", "link", "qr-code",
  "wifi", "bluetooth", "signal", "satellite", "antenna", "cast", "screen-share", "airplay", "download", "upload",
  "key", "lock", "unlock", "shield", "shield-check", "eye", "eye-off", "fingerprint", "scan", "id-card",
  "heart", "heart-pulse", "activity", "stethoscope", "syringe", "pill", "capsule", "bandage", "thermometer-sun", "brain",
  "dumbbell", "weight", "trophy", "medal", "target", "bullseye", "flag", "flag-triangle", "pennant", "award",
  "dice-1", "dice-2", "dice-3", "dice-4", "dice-5", "dice-6", "puzzle", "joystick", "game-controller", "chess",
  "palette", "brush", "paint-bucket", "spray-can", "stamp", "crop", "layers", "shapes", "circle", "square",
  "triangle", "hexagon", "octagon", "pentagon", "diamond", "heart-handshake", "handshake", "users", "user", "user-plus",
  "baby", "person-standing", "accessibility", "dog", "cat", "bird", "fish-symbol", "bug", "rabbit", "turtle",
  "wrench", "hammer", "screwdriver", "drill", "saw", "axe", "shovel", "pickaxe", "flashlight", "lantern",
  "plug", "battery", "battery-charging", "zap", "power", "lightbulb", "lamp", "lamp-desk", "fan", "air-vent",
  "droplet", "droplets", "waves", "anchor", "life-buoy", "sailboat", "fishing", "shell", "palm-tree", "cactus",
  "flame", "fire-extinguisher", "smoke", "wind", "tornado", "snowflake", "sun-snow", "sunrise", "sunset", "moon-star",
  "gift", "party-popper", "balloon", "cake-slice", "candy", "candy-cane", "ribbon", "bow", "box", "package",
  "shopping-bag", "shopping-cart", "shopping-basket", "wallet", "credit-card", "banknote", "coins", "piggy-bank", "receipt", "calculator",
  "clock", "timer", "hourglass", "calendar", "calendar-days", "calendar-check", "alarm-clock", "watch", "stopwatch", "timer-off",
  "flag-checkered", "rocket", "satellite-dish", "radio-tower", "construction", "cone", "barrier", "traffic-cone", "hard-hat", "vest",
  "recycle", "leaf", "sprout", "seedling", "plant", "flower-lotus", "clover", "shamrock", "herb", "wheat",
  "microscope", "telescope", "binoculars", "magnifying-glass", "search", "zoom-in", "zoom-out", "focus", "scan-line", "crosshair"
];

const AVAILABLE_COLORS = [
  "#6B4423", "#8B4513", "#A0522D", "#CD853F", "#DEB887",
  "#D2691E", "#F4A460", "#DAA520", "#B8860B", "#FFD700",
  "#228B22", "#32CD32", "#90EE90", "#006400", "#008000",
  "#00CED1", "#20B2AA", "#008B8B", "#5F9EA0", "#4682B4",
  "#1E90FF", "#4169E1", "#0000CD", "#000080", "#191970",
  "#9932CC", "#8B008B", "#800080", "#4B0082", "#6A5ACD",
  "#DC143C", "#B22222", "#8B0000", "#FF6347", "#FF4500",
  "#FF8C00", "#FFA500", "#FFB347", "#FFDAB9", "#FFEFD5",
  "#708090", "#778899", "#696969", "#808080", "#A9A9A9"
];

function ItemCard({ item, category }: { item: Item; category?: Category }) {
  const { t } = useLanguage();
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
      data-testid={`item-${item.id}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
        {category && <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>
      {item.isCommon && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {t("شائع", "Common")}
        </Badge>
      )}
    </div>
  );
}

function CategorySection({ category, items, onDelete }: { category: Category; items: Item[]; onDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t, language } = useLanguage();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer"
            style={{ backgroundColor: `${category.color}20` }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
          </div>
          <div className="flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <span>{language === "ar" ? category.nameAr : category.name || category.nameAr}</span>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              {formatNumber(items.length, language)} {t("مستلزم", "item")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{items.length}</Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive"
                  data-testid={`button-delete-category-${category.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("حذف الفئة", "Delete Category")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      `هل أنت متأكد من حذف فئة "${category.nameAr}"؟ سيتم حذف جميع المستلزمات (${items.length}) داخلها أيضاً.`,
                      `Are you sure you want to delete the "${category.name || category.nameAr}" category? All items (${items.length}) inside will also be deleted.`
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(category.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {t("حذف", "Delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} category={category} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function AddItemDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isCommon, setIsCommon] = useState(true);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/items", {
        name,
        description: description || null,
        categoryId,
        isCommon,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الإضافة", "Added"),
        description: t("تم إضافة المستلزم بنجاح", "Item added successfully"),
      });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إضافة المستلزم", "An error occurred while adding the item"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setIsCommon(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-item">
          <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
          {t("إضافة مستلزم", "Add Item")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("إضافة مستلزم جديد", "Add New Item")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("اسم المستلزم *", "Item Name *")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("مثال: شواية كبيرة", "Example: Large grill")}
              data-testid="input-item-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("الفئة *", "Category *")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger data-testid="select-item-category">
                <SelectValue placeholder={t("اختر الفئة", "Select category")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <CategoryIcon icon={cat.icon} color={cat.color} className="h-4 w-4" />
                      {language === "ar" ? cat.nameAr : cat.name || cat.nameAr}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("الوصف", "Description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("وصف اختياري للمستلزم", "Optional item description")}
              className="resize-none"
              data-testid="input-item-description"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isCommon">{t("مستلزم شائع", "Common Item")}</Label>
            <Switch
              id="isCommon"
              checked={isCommon}
              onCheckedChange={setIsCommon}
              data-testid="switch-item-common"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("إلغاء", "Cancel")}
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={!name || !categoryId || createMutation.isPending}
              data-testid="button-submit-item"
            >
              {createMutation.isPending ? (
                <Loader2 className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
              ) : (
                <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
              )}
              {t("إضافة", "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("package");
  const [selectedColor, setSelectedColor] = useState("#6B4423");
  const [iconSearch, setIconSearch] = useState("");
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const filteredIcons = AVAILABLE_ICONS.filter(icon => 
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/categories", {
        name: name || nameAr,
        nameAr,
        icon: selectedIcon,
        color: selectedColor,
        sortOrder: 99,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: t("تم الإضافة", "Added"),
        description: t("تم إضافة الفئة بنجاح", "Category added successfully"),
      });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إضافة الفئة", "An error occurred while adding the category"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNameAr("");
    setName("");
    setSelectedIcon("package");
    setSelectedColor("#6B4423");
    setIconSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-category">
          <FolderPlus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
          {t("إضافة فئة", "Add Category")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("إضافة فئة جديدة", "Add New Category")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameAr">{t("الاسم بالعربية *", "Arabic Name *")}</Label>
              <Input
                id="nameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t("مثال: معدات الطبخ", "Example: Cooking Equipment")}
                data-testid="input-category-name-ar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("الاسم بالإنجليزية", "English Name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("مثال: Cooking Equipment", "Example: Cooking Equipment")}
                data-testid="input-category-name-en"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("معاينة", "Preview")}</Label>
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                <CategoryIcon icon={selectedIcon} color={selectedColor} className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{nameAr || t("اسم الفئة", "Category Name")}</p>
                <p className="text-sm text-muted-foreground">{name || nameAr || t("اسم الفئة بالإنجليزية", "English name")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("اللون", "Color")}</Label>
            <div className="grid grid-cols-9 gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-md border-2 transition-all ${
                    selectedColor === color ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  data-testid={`color-${color}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("الرمز", "Icon")}</Label>
            <div className="relative">
              <Search className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
              <Input
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder={t("ابحث عن رمز...", "Search for icon...")}
                className={language === "ar" ? "pr-9" : "pl-9"}
                data-testid="input-icon-search"
              />
            </div>
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                {filteredIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`p-2 rounded-md border transition-all hover-elevate ${
                      selectedIcon === icon 
                        ? "border-primary bg-primary/10" 
                        : "border-transparent"
                    }`}
                    onClick={() => setSelectedIcon(icon)}
                    title={icon}
                    data-testid={`icon-${icon}`}
                  >
                    <CategoryIcon icon={icon} color={selectedColor} className="h-5 w-5 mx-auto" />
                  </button>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              {t(`${filteredIcons.length} رمز متاح`, `${filteredIcons.length} icons available`)}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("إلغاء", "Cancel")}
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={!nameAr || createMutation.isPending}
              data-testid="button-submit-category"
            >
              {createMutation.isPending ? (
                <Loader2 className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
              ) : (
                <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
              )}
              {t("إضافة", "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Items() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const { data: categoriesWithItems, isLoading } = useQuery<CategoryWithItems[]>({
    queryKey: ["/api/categories?withItems=true"],
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف الفئة وجميع مستلزماتها بنجاح", "Category and all its items deleted successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء حذف الفئة", "An error occurred while deleting the category"),
        variant: "destructive",
      });
    },
  });

  const filteredCategories = categoriesWithItems?.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => 
    (selectedCategory === "all" || cat.id === selectedCategory) &&
    cat.items.length > 0
  );

  const totalItems = categoriesWithItems?.reduce((sum, cat) => sum + cat.items.length, 0) || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("المستلزمات", "Items")}</h1>
          <p className="text-muted-foreground">{t("قاعدة بيانات المستلزمات المشتركة", "Shared items database")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddCategoryDialog />
          {categoriesWithItems && <AddItemDialog categories={categoriesWithItems} />}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
          <Input
            placeholder={t("ابحث عن مستلزم...", "Search for items...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={language === "ar" ? "pr-9" : "pl-9"}
            data-testid="input-search-items"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
            <Filter className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
            <SelectValue placeholder={t("الفئة", "Category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("جميع الفئات", "All Categories")}</SelectItem>
            {categoriesWithItems?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <CategoryIcon icon={cat.icon} color={cat.color} className="h-4 w-4" />
                  {language === "ar" ? cat.nameAr : cat.name || cat.nameAr}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(totalItems, language)}</p>
              <p className="text-sm text-muted-foreground">{t("إجمالي المستلزمات", "Total Items")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(categoriesWithItems?.length || 0, language)}</p>
              <p className="text-sm text-muted-foreground">{t("فئة", "Categories")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-16" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCategories && filteredCategories.length > 0 ? (
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <CategorySection 
              key={category.id} 
              category={category} 
              items={category.items}
              onDelete={(id) => deleteCategoryMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedCategory !== "all" ? t("لا توجد نتائج", "No results") : t("لا توجد مستلزمات", "No items")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery || selectedCategory !== "all" 
                ? t("جرب تغيير معايير البحث", "Try changing search criteria") 
                : t("أضف المستلزمات لتظهر في قاعدة البيانات المشتركة", "Add items to appear in the shared database")}
            </p>
            {categoriesWithItems && !searchQuery && selectedCategory === "all" && (
              <AddItemDialog categories={categoriesWithItems} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
  ChevronUp,
  Pencil
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
import { CategoryIcon, AVAILABLE_ICON_NAMES } from "@/components/category-icon";
import { useLanguage } from "@/components/language-provider";
import type { Category, ItemWithOwner, CategoryWithItems, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

const ICON_ARABIC_NAMES: Record<string, string> = {
  coffee: "قهوة",
  flame: "نار لهب",
  tent: "خيمة",
  snowflake: "ثلج",
  lightbulb: "مصباح ضوء",
  car: "سيارة",
  heart: "قلب",
  music: "موسيقى",
  package: "صندوق علبة",
  utensils: "أدوات طعام شوكة سكين",
  pizza: "بيتزا",
  cake: "كيك كعكة",
  apple: "تفاحة فاكهة",
  beef: "لحم",
  salad: "سلطة",
  soup: "شوربة حساء",
  sandwich: "ساندويتش",
  cookie: "كوكيز بسكويت",
  "ice-cream": "ايسكريم مثلجات",
  milk: "حليب",
  wine: "عصير",
  beer: "مشروب",
  "cup-soda": "كولا مشروب غازي",
  popcorn: "فشار",
  croissant: "كرواسون معجنات",
  egg: "بيض",
  fish: "سمك",
  cherry: "كرز",
  grape: "عنب",
  banana: "موز",
  citrus: "برتقال ليمون",
  carrot: "جزر",
  home: "بيت منزل",
  building: "مبنى عمارة",
  "building-2": "مبنى",
  warehouse: "مستودع مخزن",
  store: "متجر محل",
  hotel: "فندق",
  castle: "قلعة",
  church: "كنيسة",
  school: "مدرسة",
  hospital: "مستشفى",
  mountain: "جبل",
  "mountain-snow": "جبل ثلج",
  trees: "أشجار غابة",
  "tree-palm": "نخلة",
  "tree-deciduous": "شجرة",
  "tree-pine": "شجرة صنوبر",
  flower: "زهرة وردة",
  "flower-2": "زهرة",
  leaf: "ورقة شجر",
  clover: "برسيم",
  sun: "شمس",
  moon: "قمر",
  star: "نجمة",
  cloud: "سحابة غيمة",
  "cloud-rain": "مطر",
  "cloud-snow": "ثلج",
  wind: "رياح هواء",
  rainbow: "قوس قزح",
  umbrella: "مظلة شمسية",
  thermometer: "ميزان حرارة",
  map: "خريطة",
  "map-pin": "موقع مكان",
  compass: "بوصلة",
  globe: "كرة أرضية عالم",
  navigation: "ملاحة اتجاه",
  signpost: "لافتة",
  route: "طريق مسار",
  milestone: "علامة",
  truck: "شاحنة",
  bus: "باص حافلة",
  train: "قطار",
  plane: "طائرة",
  ship: "سفينة باخرة",
  bike: "دراجة",
  shirt: "قميص ملابس",
  footprints: "أقدام آثار",
  glasses: "نظارة",
  watch: "ساعة يد",
  crown: "تاج",
  gem: "جوهرة الماس",
  scissors: "مقص",
  ruler: "مسطرة",
  pencil: "قلم رصاص",
  pen: "قلم",
  highlighter: "قلم تحديد",
  paperclip: "مشبك",
  bookmark: "علامة مرجعية",
  book: "كتاب",
  "book-open": "كتاب مفتوح",
  "graduation-cap": "قبعة تخرج",
  backpack: "حقيبة ظهر شنطة",
  briefcase: "حقيبة عمل",
  folder: "مجلد ملف",
  "file-text": "ملف نص",
  clipboard: "حافظة",
  camera: "كاميرا تصوير",
  video: "فيديو",
  film: "فيلم",
  tv: "تلفزيون شاشة",
  monitor: "شاشة كمبيوتر",
  laptop: "لابتوب حاسوب",
  tablet: "تابلت آيباد",
  smartphone: "جوال هاتف موبايل",
  headphones: "سماعات",
  speaker: "سماعة مكبر صوت",
  mic: "مايكروفون",
  radio: "راديو",
  "volume-2": "صوت",
  bell: "جرس",
  "alarm-clock": "منبه",
  phone: "هاتف",
  mail: "بريد رسالة",
  "message-circle": "رسالة محادثة",
  "message-square": "رسالة",
  inbox: "صندوق وارد",
  send: "إرسال",
  "at-sign": "إيميل",
  hash: "هاشتاق",
  link: "رابط",
  "qr-code": "كود باركود",
  wifi: "واي فاي انترنت",
  bluetooth: "بلوتوث",
  signal: "إشارة",
  satellite: "قمر صناعي",
  cast: "بث",
  download: "تحميل",
  upload: "رفع",
  key: "مفتاح",
  lock: "قفل",
  unlock: "فتح",
  shield: "درع حماية",
  "shield-check": "أمان",
  eye: "عين رؤية",
  "eye-off": "إخفاء",
  fingerprint: "بصمة",
  scan: "مسح",
  activity: "نشاط",
  stethoscope: "سماعة طبيب",
  syringe: "حقنة إبرة",
  pill: "حبة دواء",
  bandage: "ضمادة",
  brain: "دماغ عقل",
  dumbbell: "أثقال رياضة",
  trophy: "كأس جائزة",
  medal: "ميدالية",
  target: "هدف",
  flag: "علم راية",
  award: "جائزة",
  "dice-1": "نرد",
  "dice-2": "نرد",
  "dice-3": "نرد",
  "dice-4": "نرد",
  "dice-5": "نرد",
  "dice-6": "نرد",
  puzzle: "أحجية لغز",
  "gamepad-2": "ألعاب جيم",
  palette: "لوحة ألوان رسم",
  brush: "فرشاة",
  "paint-bucket": "دلو طلاء",
  stamp: "ختم",
  crop: "قص",
  layers: "طبقات",
  shapes: "أشكال",
  circle: "دائرة",
  square: "مربع",
  triangle: "مثلث",
  hexagon: "سداسي",
  octagon: "ثماني",
  pentagon: "خماسي",
  diamond: "معين الماس",
  handshake: "مصافحة",
  users: "مستخدمين أشخاص",
  user: "مستخدم شخص",
  "user-plus": "إضافة مستخدم",
  baby: "طفل",
  "person-standing": "شخص واقف",
  accessibility: "إمكانية وصول",
  dog: "كلب",
  cat: "قطة",
  bird: "طائر عصفور",
  bug: "حشرة",
  rabbit: "أرنب",
  turtle: "سلحفاة",
  wrench: "مفتاح ربط",
  hammer: "مطرقة",
  axe: "فأس",
  shovel: "مجرفة",
  flashlight: "كشاف مصباح يدوي",
  plug: "قابس كهرباء",
  battery: "بطارية",
  "battery-charging": "شحن بطارية",
  zap: "برق كهرباء",
  power: "طاقة",
  lamp: "مصباح",
  fan: "مروحة",
  droplet: "قطرة ماء",
  droplets: "قطرات",
  waves: "موج بحر",
  anchor: "مرساة",
  sailboat: "قارب شراعي",
  shell: "صدفة",
  "fire-extinguisher": "طفاية حريق",
  tornado: "إعصار",
  sunrise: "شروق",
  sunset: "غروب",
  gift: "هدية",
  "party-popper": "حفلة احتفال",
  ribbon: "شريط",
  box: "صندوق",
  "shopping-bag": "حقيبة تسوق",
  "shopping-cart": "عربة تسوق",
  "shopping-basket": "سلة تسوق",
  wallet: "محفظة",
  "credit-card": "بطاقة ائتمان",
  banknote: "ورقة نقدية فلوس",
  coins: "عملات معدنية",
  "piggy-bank": "حصالة",
  receipt: "فاتورة إيصال",
  calculator: "آلة حاسبة",
  clock: "ساعة وقت",
  timer: "مؤقت",
  hourglass: "ساعة رملية",
  calendar: "تقويم",
  "calendar-days": "أيام تقويم",
  "calendar-check": "موعد",
  rocket: "صاروخ",
  construction: "بناء إنشاء",
  "hard-hat": "خوذة عمال",
  recycle: "إعادة تدوير",
  sprout: "نبتة",
  wheat: "قمح",
  microscope: "مجهر",
  telescope: "تلسكوب",
  binoculars: "منظار",
  search: "بحث",
  "zoom-in": "تكبير",
  "zoom-out": "تصغير",
  focus: "تركيز",
  crosshair: "تصويب",
  sparkles: "لمعان بريق",
  "wand-2": "عصا سحرية",
  "badge-check": "شارة تحقق",
};

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

function ItemCard({ 
  item, 
  category, 
  categories,
  onDelete,
  onMove,
  onEdit,
  user
}: { 
  item: ItemWithOwner; 
  category?: Category;
  categories: Category[];
  onDelete: (id: string) => void;
  onMove: (itemId: string, newCategoryId: string) => void;
  onEdit: (itemId: string, data: { name?: string; description?: string | null; isCommon?: boolean | null }) => void;
  user?: User | null;
}) {
  const { t, language } = useLanguage();
  
  const isSystemItem = item.ownerId === null;
  const isOwnItem = item.ownerId === user?.id;
  const isAdmin = user?.isAdmin ?? false;
  const canEdit = isAdmin || isOwnItem;
  
  // Get owner display name for user-owned items
  const ownerName = item.owner 
    ? `${item.owner.firstName || ''} ${item.owner.lastName || ''}`.trim() || t("مستخدم", "User")
    : null;
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editName, setEditName] = useState(item.name);
  const [editDescription, setEditDescription] = useState(item.description || "");
  const [editIsCommon, setEditIsCommon] = useState(item.isCommon ?? false);
  
  const otherCategories = categories.filter(c => c.id !== category?.id);
  
  const handleEditSubmit = () => {
    if (!editName.trim()) return;
    onEdit(item.id, {
      name: editName.trim(),
      description: editDescription.trim() || null,
      isCommon: editIsCommon,
    });
    setEditDialogOpen(false);
  };
  
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate group"
      data-testid={`item-${item.id}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shrink-0">
        {category && <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>
      {!isSystemItem && ownerName && (
        <Badge variant="outline" className="text-xs shrink-0">
          {ownerName}
        </Badge>
      )}
      {item.isCommon && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {t("شائع", "Common")}
        </Badge>
      )}
      {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <Dialog open={editDialogOpen} onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (open) {
              setEditName(item.name);
              setEditDescription(item.description || "");
              setEditIsCommon(item.isCommon ?? false);
            }
          }}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                data-testid={`button-edit-item-${item.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("تعديل المستلزم", "Edit Item")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("اسم المستلزم", "Item Name")}</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  data-testid="input-edit-item-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t("الوصف", "Description")}</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="resize-none"
                  data-testid="input-edit-item-description"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isCommon">{t("مستلزم شائع", "Common Item")}</Label>
                <Switch
                  id="edit-isCommon"
                  checked={editIsCommon}
                  onCheckedChange={setEditIsCommon}
                  data-testid="switch-edit-item-common"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">{t("إلغاء", "Cancel")}</Button>
              </DialogClose>
              <Button
                onClick={handleEditSubmit}
                disabled={!editName.trim()}
                data-testid="button-confirm-edit"
              >
                {t("حفظ", "Save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
              data-testid={`button-move-item-${item.id}`}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("نقل المستلزم", "Move Item")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t(
                  `نقل "${item.name}" إلى فئة أخرى`,
                  `Move "${item.name}" to another category`
                )}
              </p>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger data-testid="select-move-category">
                  <SelectValue placeholder={t("اختر الفئة الجديدة", "Select new category")} />
                </SelectTrigger>
                <SelectContent>
                  {otherCategories.map((cat) => (
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
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">{t("إلغاء", "Cancel")}</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (selectedCategoryId) {
                    onMove(item.id, selectedCategoryId);
                    setMoveDialogOpen(false);
                    setSelectedCategoryId("");
                  }
                }}
                disabled={!selectedCategoryId}
                data-testid="button-confirm-move"
              >
                {t("نقل", "Move")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              data-testid={`button-delete-item-${item.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("حذف المستلزم", "Delete Item")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  `هل أنت متأكد من حذف "${item.name}"؟`,
                  `Are you sure you want to delete "${item.name}"?`
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(item.id)}
                className="bg-destructive text-destructive-foreground"
              >
                {t("حذف", "Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      )}
    </div>
  );
}

function CategorySection({ 
  category, 
  items, 
  categories,
  onDeleteCategory,
  onDeleteItem,
  onMoveItem,
  onEditItem,
  onEditCategory,
  user
}: { 
  category: Category; 
  items: ItemWithOwner[]; 
  categories: Category[];
  onDeleteCategory: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem: (itemId: string, newCategoryId: string) => void;
  onEditItem: (itemId: string, data: { name?: string; description?: string | null; isCommon?: boolean | null }) => void;
  onEditCategory: (id: string, data: { name?: string; nameAr?: string; icon?: string; color?: string }) => void;
  user?: User | null;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNameAr, setEditNameAr] = useState(category.nameAr);
  const [editName, setEditName] = useState(category.name || "");
  const [editIcon, setEditIcon] = useState(category.icon);
  const [editColor, setEditColor] = useState(category.color);
  const [iconSearch, setIconSearch] = useState("");
  const { t, language } = useLanguage();

  const filteredIcons = AVAILABLE_ICON_NAMES.filter(icon => {
    const searchLower = iconSearch.toLowerCase();
    const englishMatch = icon.toLowerCase().includes(searchLower);
    const arabicName = ICON_ARABIC_NAMES[icon] || "";
    const arabicMatch = arabicName.includes(iconSearch);
    return englishMatch || arabicMatch;
  });

  const handleEditSubmit = () => {
    if (!editNameAr.trim()) return;
    onEditCategory(category.id, {
      nameAr: editNameAr.trim(),
      name: editName.trim() || editNameAr.trim(),
      icon: editIcon,
      color: editColor,
    });
    setEditDialogOpen(false);
  };

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
            
            <Dialog open={editDialogOpen} onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (open) {
                setEditNameAr(category.nameAr);
                setEditName(category.name || "");
                setEditIcon(category.icon);
                setEditColor(category.color);
                setIconSearch("");
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground"
                  data-testid={`button-edit-category-${category.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("تعديل الفئة", "Edit Category")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("الاسم بالعربية *", "Arabic Name *")}</Label>
                      <Input
                        value={editNameAr}
                        onChange={(e) => setEditNameAr(e.target.value)}
                        data-testid="input-edit-category-name-ar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("الاسم بالإنجليزية", "English Name")}</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        data-testid="input-edit-category-name-en"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("معاينة", "Preview")}</Label>
                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <div 
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${editColor}20` }}
                      >
                        <CategoryIcon icon={editIcon} color={editColor} className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{editNameAr || t("اسم الفئة", "Category name")}</p>
                        {editName && <p className="text-sm text-muted-foreground">{editName}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("اللون", "Color")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-8 w-8 rounded-md border-2 transition-all ${
                            editColor === color ? "border-primary scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("الأيقونة", "Icon")}</Label>
                    <Input
                      placeholder={t("بحث عن أيقونة...", "Search for icon...")}
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                    />
                    <ScrollArea className="h-48 rounded-md border p-2">
                      <div className="grid grid-cols-8 gap-2">
                        {filteredIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            className={`flex h-10 w-10 items-center justify-center rounded-md border transition-all ${
                              editIcon === icon 
                                ? "border-primary bg-primary/10" 
                                : "border-transparent hover:bg-muted"
                            }`}
                            onClick={() => setEditIcon(icon)}
                          >
                            <CategoryIcon icon={icon} color={editColor} className="h-5 w-5" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">{t("إلغاء", "Cancel")}</Button>
                  </DialogClose>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={!editNameAr.trim()}
                    data-testid="button-confirm-edit-category"
                  >
                    {t("حفظ", "Save")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                    onClick={() => onDeleteCategory(category.id)}
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
            <ItemCard 
              key={item.id} 
              item={item} 
              category={category} 
              categories={categories}
              onDelete={onDeleteItem}
              onMove={onMoveItem}
              onEdit={onEditItem}
              user={user}
            />
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

  const filteredIcons = AVAILABLE_ICON_NAMES.filter(icon => {
    const searchLower = iconSearch.toLowerCase();
    const englishMatch = icon.toLowerCase().includes(searchLower);
    const arabicName = ICON_ARABIC_NAMES[icon] || "";
    const arabicMatch = arabicName.includes(iconSearch);
    return englishMatch || arabicMatch;
  });

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
  const { user } = useAuth();

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

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف المستلزم بنجاح", "Item deleted successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء حذف المستلزم", "An error occurred while deleting the item"),
        variant: "destructive",
      });
    },
  });

  const moveItemMutation = useMutation({
    mutationFn: async ({ itemId, newCategoryId }: { itemId: string; newCategoryId: string }) => {
      return apiRequest("PATCH", `/api/items/${itemId}`, { categoryId: newCategoryId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: t("تم النقل", "Moved"),
        description: t("تم نقل المستلزم بنجاح", "Item moved successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء نقل المستلزم", "An error occurred while moving the item"),
        variant: "destructive",
      });
    },
  });

  const editItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: { name?: string; description?: string | null; isCommon?: boolean | null } }) => {
      return apiRequest("PATCH", `/api/items/${itemId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: t("تم التعديل", "Updated"),
        description: t("تم تعديل المستلزم بنجاح", "Item updated successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تعديل المستلزم", "An error occurred while updating the item"),
        variant: "destructive",
      });
    },
  });

  const editCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: { name?: string; nameAr?: string; icon?: string; color?: string } }) => {
      return apiRequest("PATCH", `/api/categories/${categoryId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: t("تم التعديل", "Updated"),
        description: t("تم تعديل الفئة بنجاح", "Category updated successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تعديل الفئة", "An error occurred while updating the category"),
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
              categories={categoriesWithItems || []}
              onDeleteCategory={(id) => deleteCategoryMutation.mutate(id)}
              onDeleteItem={(id) => deleteItemMutation.mutate(id)}
              onMoveItem={(itemId, newCategoryId) => moveItemMutation.mutate({ itemId, newCategoryId })}
              onEditItem={(itemId, data) => editItemMutation.mutate({ itemId, data })}
              onEditCategory={(categoryId, data) => editCategoryMutation.mutate({ categoryId, data })}
              user={user}
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

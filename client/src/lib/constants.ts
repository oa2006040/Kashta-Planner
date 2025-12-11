// Default categories with Gulf-specific items
export const DEFAULT_CATEGORIES = [
  {
    id: "coffee",
    name: "Coffee & Dalla",
    nameAr: "القهوة والدلة",
    icon: "coffee",
    color: "#8B4513",
    order: 1,
    items: [
      { name: "دلة عربية", description: "للقهوة القطرية", isCommon: true },
      { name: "فناجين قهوة", description: "طقم 12 فنجان", isCommon: true },
      {
        name: "قهوة عربية مطحونة",
        description: "مع الهيل والزعفران",
        isCommon: true,
      },
      { name: "ترمس حافظ للحرارة", description: "سعة 2 لتر", isCommon: true },
      { name: "تمر سكري", description: "للضيافة", isCommon: true },
      { name: "محماسة القهوة", description: "للتحميص الطازج", isCommon: false },
    ],
  },
  {
    id: "grilling",
    name: "Grilling & Meat",
    nameAr: "الشوي واللحم",
    icon: "flame",
    color: "#DC2626",
    order: 2,
    items: [
      { name: "شواية فحم كبيرة", description: "حجم عائلي", isCommon: true },
      { name: "فحم طبيعي", description: "كيس 10 كيلو", isCommon: true },
      { name: "أسياخ شوي ستيل", description: "طقم 20 سيخ", isCommon: true },
      { name: "لحم غنم طازج", description: "للشوي والكبسة", isCommon: true },
      { name: "دجاج مشوي", description: "مع البهارات", isCommon: true },
      { name: "ملقط وسكاكين", description: "أدوات الشوي", isCommon: true },
      { name: "صحون وملاعق", description: "للاستخدام", isCommon: true },
    ],
  },
  {
    id: "camping",
    name: "Tents & Seating",
    nameAr: "الخيام والفرش",
    icon: "tent",
    color: "#059669",
    order: 3,
    items: [
      { name: "خيمة كبيرة", description: "تتسع 8 أشخاص", isCommon: true },
      { name: "بساط أرضي", description: "مقاوم للرطوبة", isCommon: true },
      { name: "فرش جلوس عربي", description: "مجلس متكامل", isCommon: true },
      { name: "مساند ظهر", description: "طقم 6 قطع", isCommon: true },
      { name: "أعمدة الخيمة", description: "معدنية قوية", isCommon: true },
      { name: "حبال وأوتاد", description: "لتثبيت الخيمة", isCommon: true },
    ],
  },
  {
    id: "winter",
    name: "Winter Equipment",
    nameAr: "مستلزمات الشتاء",
    icon: "snowflake",
    color: "#0EA5E9",
    order: 4,
    items: [
      { name: "دفاية غاز", description: "للتدفئة الداخلية", isCommon: true },
      { name: "أسطوانة غاز صغيرة", description: "للدفاية", isCommon: true },
      { name: "بطانيات صوف", description: "طقم 4 قطع", isCommon: true },
      { name: "جاكيتات شتوية", description: "للجميع", isCommon: false },
      { name: "قفازات وطواقي", description: "للبرد الشديد", isCommon: false },
      { name: "حطب للنار", description: "حزمة كبيرة", isCommon: true },
    ],
  },
  {
    id: "lighting",
    name: "Lighting",
    nameAr: "الإضاءة",
    icon: "lightbulb",
    color: "#F59E0B",
    order: 5,
    items: [
      { name: "للسيارة LED", description: "قابل للشحن", isCommon: true },
      { name: "إضاءة زينة", description: "سلسلة أضواء", isCommon: true },
      { name: "كشاف يدوي قوي", description: "1000 لومن", isCommon: true },
      { name: "شموع معطرة", description: "للأجواء", isCommon: false },
      { name: "بطاريات احتياطية", description: "أحجام مختلفة", isCommon: true },
    ],
  },
  {
    id: "transport",
    name: "Transportation",
    nameAr: "النقل والسيارات",
    icon: "car",
    color: "#6366F1",
    order: 6,
    items: [
      { name: "سيارة دفع رباعي", description: "عشان مانغرز", isCommon: true },
      { name: "مضخة هواء", description: "للإطارات", isCommon: true },
      { name: "حبل سحب", description: "للطوارئ", isCommon: true },
      { name: "عدة طوارئ سيارة", description: "كاملة", isCommon: true },
      { name: "جالونات وقود احتياطي", description: "20 لتر", isCommon: false },
      { name: "ثلاجة سيارة", description: "للمشروبات", isCommon: true },
    ],
  },
  {
    id: "health",
    name: "Health & Safety",
    nameAr: "الصحة والسلامة",
    icon: "heart",
    color: "#EC4899",
    order: 7,
    items: [
      { name: "صندوق إسعافات أولية", description: "متكامل", isCommon: true },
      { name: "أدوية أساسية", description: "مسكنات وغيرها", isCommon: true },
      { name: "واقي شمس", description: "SPF 50", isCommon: true },
      { name: "مطفأة حريق صغيرة", description: "للسلامة", isCommon: true },
      { name: "مياه شرب", description: "جالونات كافية", isCommon: true },
      { name: "كريم مرطب", description: "للجفاف", isCommon: false },
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    nameAr: "الترفيه والألعاب",
    icon: "music",
    color: "#8B5CF6",
    order: 8,
    items: [
      { name: "سماعة بلوتوث", description: "للموسيقى", isCommon: true },
      { name: "ورق لعب (بلوت)", description: "للسمر", isCommon: true },
      { name: "كرة قدم", description: "للشباب", isCommon: true },
      { name: "تلسكوب صغير", description: "لمشاهدة النجوم", isCommon: false },
      { name: "عود موسيقي", description: "للطرب", isCommon: false },
      { name: "كتب وقصص", description: "للقراءة الليلية", isCommon: false },
    ],
  },
];

// Avatar options for participants - using icon names instead of emojis
export const AVATAR_OPTIONS = [
  "user",
  "user-circle",
  "user-round",
  "user-check",
  "users",
  "contact",
];

// Avatar colors for visual distinction
export const AVATAR_COLORS = [
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#65A30D",
  "#16A34A",
  "#0D9488",
  "#0891B2",
  "#2563EB",
  "#7C3AED",
  "#C026D3",
  "#DB2777",
  "#E11D48",
];

// Status colors
export const STATUS_COLORS = {
  upcoming: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    label: "قادمة",
  },
  ongoing: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    label: "جارية",
  },
  completed: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-300",
    label: "منتهية",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    label: "ملغاة",
  },
};

// Weather icons
export const WEATHER_ICONS: Record<string, string> = {
  sunny: "sun",
  cloudy: "cloud",
  rainy: "cloud-rain",
  cold: "snowflake",
  windy: "wind",
};

// Format functions
export function formatArabicDate(date: Date | string): string {
  const d = new Date(date);
  // Use Gregorian calendar explicitly for Arabic month names (يناير، فبراير...)
  return new Intl.DateTimeFormat("ar-u-ca-gregory", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

// Short format without weekday for compact display
export function formatArabicDateShort(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("ar-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatHijriDate(date: Date | string, language: "ar" | "en" = "ar"): string {
  const d = new Date(date);
  const locale = language === "ar" ? "ar-SA-u-ca-islamic" : "en-u-ca-islamic";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Bilingual date formatting
export function formatDate(date: Date | string, language: "ar" | "en" = "ar"): string {
  const d = new Date(date);
  const locale = language === "ar" ? "ar-u-ca-gregory" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string, language: "ar" | "en" = "ar"): string {
  const d = new Date(date);
  const locale = language === "ar" ? "ar-u-ca-gregory" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatCurrency(amount: number | string, language: "ar" | "en" = "ar"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const locale = language === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num: number, language: "ar" | "en" = "ar"): string {
  const locale = language === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(locale).format(num);
}

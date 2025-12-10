import { db } from "./db";
import { categories, items, participants } from "@shared/schema";
import { sql } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  {
    id: 'coffee',
    name: 'Coffee & Dalla',
    nameAr: 'القهوة والدلة',
    icon: 'coffee',
    color: '#8B4513',
    order: 1,
  },
  {
    id: 'grilling',
    name: 'Grilling & Meat',
    nameAr: 'الشوي واللحم',
    icon: 'flame',
    color: '#DC2626',
    order: 2,
  },
  {
    id: 'camping',
    name: 'Tents & Seating',
    nameAr: 'الخيام والفرش',
    icon: 'tent',
    color: '#059669',
    order: 3,
  },
  {
    id: 'winter',
    name: 'Winter Equipment',
    nameAr: 'مستلزمات الشتاء',
    icon: 'snowflake',
    color: '#0EA5E9',
    order: 4,
  },
  {
    id: 'lighting',
    name: 'Lighting',
    nameAr: 'الإضاءة',
    icon: 'lightbulb',
    color: '#F59E0B',
    order: 5,
  },
  {
    id: 'transport',
    name: 'Transportation',
    nameAr: 'النقل والسيارات',
    icon: 'car',
    color: '#6366F1',
    order: 6,
  },
  {
    id: 'health',
    name: 'Health & Safety',
    nameAr: 'الصحة والسلامة',
    icon: 'heart',
    color: '#EC4899',
    order: 7,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    nameAr: 'الترفيه والألعاب',
    icon: 'music',
    color: '#8B5CF6',
    order: 8,
  },
];

const DEFAULT_ITEMS = [
  // Coffee & Dalla
  { categoryId: 'coffee', name: 'دلة عربية', description: 'للقهوة السعودية', isCommon: true },
  { categoryId: 'coffee', name: 'فناجين قهوة', description: 'طقم 12 فنجان', isCommon: true },
  { categoryId: 'coffee', name: 'قهوة عربية مطحونة', description: 'مع الهيل والزعفران', isCommon: true },
  { categoryId: 'coffee', name: 'ترمس حافظ للحرارة', description: 'سعة 2 لتر', isCommon: true },
  { categoryId: 'coffee', name: 'تمر سكري', description: 'للضيافة', isCommon: true },
  { categoryId: 'coffee', name: 'محماسة القهوة', description: 'للتحميص الطازج', isCommon: false },
  
  // Grilling & Meat
  { categoryId: 'grilling', name: 'شواية فحم كبيرة', description: 'حجم عائلي', isCommon: true },
  { categoryId: 'grilling', name: 'فحم طبيعي', description: 'كيس 10 كيلو', isCommon: true },
  { categoryId: 'grilling', name: 'أسياخ شوي ستيل', description: 'طقم 20 سيخ', isCommon: true },
  { categoryId: 'grilling', name: 'لحم غنم طازج', description: 'للشوي والكبسة', isCommon: true },
  { categoryId: 'grilling', name: 'دجاج مشوي', description: 'مع البهارات', isCommon: true },
  { categoryId: 'grilling', name: 'ملقط وسكاكين', description: 'أدوات الشوي', isCommon: true },
  { categoryId: 'grilling', name: 'صحون وملاعق', description: 'للاستخدام', isCommon: true },
  
  // Tents & Seating
  { categoryId: 'camping', name: 'خيمة كبيرة', description: 'تتسع 8 أشخاص', isCommon: true },
  { categoryId: 'camping', name: 'بساط أرضي', description: 'مقاوم للرطوبة', isCommon: true },
  { categoryId: 'camping', name: 'فرش جلوس عربي', description: 'مجلس متكامل', isCommon: true },
  { categoryId: 'camping', name: 'مساند ظهر', description: 'طقم 6 قطع', isCommon: true },
  { categoryId: 'camping', name: 'أعمدة الخيمة', description: 'معدنية قوية', isCommon: true },
  { categoryId: 'camping', name: 'حبال وأوتاد', description: 'لتثبيت الخيمة', isCommon: true },
  
  // Winter Equipment
  { categoryId: 'winter', name: 'دفاية غاز', description: 'للتدفئة الداخلية', isCommon: true },
  { categoryId: 'winter', name: 'أسطوانة غاز صغيرة', description: 'للدفاية', isCommon: true },
  { categoryId: 'winter', name: 'بطانيات صوف', description: 'طقم 4 قطع', isCommon: true },
  { categoryId: 'winter', name: 'جاكيتات شتوية', description: 'للجميع', isCommon: false },
  { categoryId: 'winter', name: 'قفازات وطواقي', description: 'للبرد الشديد', isCommon: false },
  { categoryId: 'winter', name: 'حطب للنار', description: 'حزمة كبيرة', isCommon: true },
  
  // Lighting
  { categoryId: 'lighting', name: 'فانوس LED', description: 'قابل للشحن', isCommon: true },
  { categoryId: 'lighting', name: 'إضاءة زينة', description: 'سلسلة أضواء', isCommon: true },
  { categoryId: 'lighting', name: 'كشاف يدوي قوي', description: '1000 لومن', isCommon: true },
  { categoryId: 'lighting', name: 'شموع معطرة', description: 'للأجواء', isCommon: false },
  { categoryId: 'lighting', name: 'بطاريات احتياطية', description: 'أحجام مختلفة', isCommon: true },
  
  // Transportation
  { categoryId: 'transport', name: 'سيارة دفع رباعي', description: 'للطرق الوعرة', isCommon: true },
  { categoryId: 'transport', name: 'مضخة هواء', description: 'للإطارات', isCommon: true },
  { categoryId: 'transport', name: 'حبل سحب', description: 'للطوارئ', isCommon: true },
  { categoryId: 'transport', name: 'عدة طوارئ سيارة', description: 'كاملة', isCommon: true },
  { categoryId: 'transport', name: 'جالونات وقود احتياطي', description: '20 لتر', isCommon: false },
  { categoryId: 'transport', name: 'ثلاجة سيارة', description: 'للمشروبات', isCommon: true },
  
  // Health & Safety
  { categoryId: 'health', name: 'صندوق إسعافات أولية', description: 'متكامل', isCommon: true },
  { categoryId: 'health', name: 'أدوية أساسية', description: 'مسكنات وغيرها', isCommon: true },
  { categoryId: 'health', name: 'واقي شمس', description: 'SPF 50', isCommon: true },
  { categoryId: 'health', name: 'مطفأة حريق صغيرة', description: 'للسلامة', isCommon: true },
  { categoryId: 'health', name: 'مياه شرب', description: 'جالونات كافية', isCommon: true },
  { categoryId: 'health', name: 'كريم مرطب', description: 'للجفاف', isCommon: false },
  
  // Entertainment
  { categoryId: 'entertainment', name: 'سماعة بلوتوث', description: 'للموسيقى', isCommon: true },
  { categoryId: 'entertainment', name: 'ورق لعب (بلوت)', description: 'للسمر', isCommon: true },
  { categoryId: 'entertainment', name: 'كرة قدم', description: 'للشباب', isCommon: true },
  { categoryId: 'entertainment', name: 'تلسكوب صغير', description: 'لمشاهدة النجوم', isCommon: false },
  { categoryId: 'entertainment', name: 'عود موسيقي', description: 'للطرب', isCommon: false },
  { categoryId: 'entertainment', name: 'كتب وقصص', description: 'للقراءة الليلية', isCommon: false },
];

const DEFAULT_PARTICIPANTS = [
  { name: 'أبو محمد', phone: '0501234567', avatar: 'user', tripCount: 12 },
  { name: 'أبو عبدالله', phone: '0557654321', avatar: 'user-circle', tripCount: 8 },
  { name: 'أبو سعود', phone: '0509876543', avatar: 'user-round', tripCount: 15 },
  { name: 'أبو فهد', phone: '0551112222', avatar: 'user-check', tripCount: 6 },
  { name: 'أبو خالد', phone: '0503334444', avatar: 'contact', tripCount: 20 },
];

export async function seedDatabase() {
  console.log("Seeding database...");
  
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length === 0) {
      console.log("Inserting default categories...");
      await db.insert(categories).values(DEFAULT_CATEGORIES);
      
      console.log("Inserting default items...");
      await db.insert(items).values(DEFAULT_ITEMS);
      
      console.log("Inserting default participants...");
      await db.insert(participants).values(DEFAULT_PARTICIPANTS);
      
      console.log("Database seeded successfully!");
    } else {
      console.log("Database already seeded, skipping...");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
-- Kashta Database Backup Script
-- Generated: 2025-12-11
-- PostgreSQL Database Schema and Data

-- ===========================================
-- حذف الجداول بالترتيب العكسي (لتجنب مشاكل المفاتيح الأجنبية)
-- ===========================================

DROP TABLE IF EXISTS settlement_activity_log CASCADE;
DROP TABLE IF EXISTS settlement_records CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===========================================
-- إنشاء الجداول بالترتيب الصحيح
-- ===========================================

-- 1. جدول التصنيفات (Categories)
CREATE TABLE categories (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 2. جدول المشاركين (Participants)
CREATE TABLE participants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    trip_count INTEGER DEFAULT 0
);

-- 3. جدول المستخدمين (Users)
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- 4. جدول العناصر (Items) - يعتمد على categories
CREATE TABLE items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    is_common BOOLEAN DEFAULT true
);

-- 5. جدول الطلعات (Events)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status TEXT DEFAULT 'upcoming',
    image_url TEXT,
    weather TEXT,
    temperature INTEGER,
    total_budget DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. جدول مشاركي الطلعات (Event Participants) - يعتمد على events و participants
CREATE TABLE event_participants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id VARCHAR NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    confirmed_at TIMESTAMP
);

-- 7. جدول المساهمات (Contributions) - يعتمد على events و items و participants
CREATE TABLE contributions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    item_id VARCHAR NOT NULL REFERENCES items(id),
    participant_id VARCHAR REFERENCES participants(id),
    quantity INTEGER DEFAULT 1,
    cost DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. جدول سجل النشاط (Activity Logs)
CREATE TABLE activity_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. جدول سجلات التسوية (Settlement Records) - يعتمد على events و participants
CREATE TABLE settlement_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    debtor_id VARCHAR NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    creditor_id VARCHAR NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. جدول سجل نشاط التسوية (Settlement Activity Log) - بدون قيود مفاتيح أجنبية للحفاظ على السجل
CREATE TABLE settlement_activity_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id INTEGER,
    event_title TEXT NOT NULL,
    debtor_id VARCHAR,
    debtor_name TEXT NOT NULL,
    creditor_id VARCHAR,
    creditor_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===========================================
-- إدخال البيانات بالترتيب الصحيح
-- ===========================================

-- 1. بيانات التصنيفات
INSERT INTO categories (id, name, name_ar, icon, color, sort_order) VALUES
('coffee', 'Coffee & Dalla', 'القهوة والدلة', 'coffee', '#8B4513', 1),
('grilling', 'Grilling & Meat', 'الشوي واللحم', 'flame', '#DC2626', 2),
('camping', 'Tents & Seating', 'الخيام والفرش', 'tent', '#059669', 3),
('winter', 'Winter Equipment', 'مستلزمات الشتاء', 'snowflake', '#0EA5E9', 4),
('lighting', 'Lighting', 'الإضاءة', 'lightbulb', '#F59E0B', 5),
('transport', 'Transportation', 'النقل والسيارات', 'car', '#6366F1', 6),
('health', 'Health & Safety', 'الصحة والسلامة', 'heart', '#EC4899', 7),
('entertainment', 'Entertainment', 'الترفيه والألعاب', 'music', '#8B5CF6', 8);

-- 2. بيانات المشاركين
INSERT INTO participants (id, name, phone, avatar, trip_count) VALUES
('9d2c8254-f42d-4fa8-9535-30763e1f358d', 'احمد مسعد', '66725946', 'user', 0),
('2aef19d8-adbc-486b-b033-4136011c54cb', 'اسامه السميطي', '70005974', 'user', 8),
('d1507dc5-3d57-4ccc-b6bf-9f90ddd6861a', 'المهندس حمزة', '66131992', 'user', 0),
('aa52b887-d8a0-4a76-9397-1fd1d9d4c4e7', 'ايمن الحمودي', '66280086', 'user', 0),
('88c5957d-3be9-4a4b-9b63-3f4eb7c2a368', 'حسن ضيف الله', '66444312', 'user', 0),
('2f3b9e83-2b5d-4d57-b154-e567dfd87a79', 'عمر عبدالعظيم', '50323611', 'user', 0),
('f2b4242d-c8fe-44bf-996d-539d0dac1422', 'محمد عبدالجبار', '33327976', 'user', 0),
('c6ecc9cc-8166-4515-9f62-b425b0d577f5', 'يوسف عبد العظيم', '50958726', 'user', 0);

-- 3. بيانات العناصر (Items)
INSERT INTO items (id, category_id, name, description, is_common) VALUES
-- Coffee items
('ae165b36-40db-4548-a1c1-248e395f3721', 'coffee', 'ترمس حافظ للحرارة', 'سعة 2 لتر', true),
('087fd3a9-d0b2-4b56-bbf0-314bdda01965', 'coffee', 'تمر سكري', 'للضيافة', true),
('3aed182e-e6a7-41d5-a8da-73382856cb24', 'coffee', 'دلة عربية', 'للقهوة العربية', true),
('4afddad6-25ca-4759-b699-b9fdf766abb7', 'coffee', 'فناجين قهوة', 'طقم 12 فنجان', true),
('59416db8-06ae-451f-8282-1950284ca2a8', 'coffee', 'قهوة عربية مطحونة', 'مع الهيل والزعفران', true),
('0b34ee1c-051b-4145-a8f8-dd1fea5a1fa8', 'coffee', 'محماسة القهوة', 'للتحميص الطازج', false),
-- Grilling items
('30f05604-4718-434c-944f-6855d9f07ecf', 'grilling', 'أسياخ شوي ستيل', 'طقم 20 سيخ', true),
('bb70d917-2dae-4248-a147-619d7385b2a1', 'grilling', 'دجاج مشوي', 'مع البهارات', true),
('f93f11ad-5629-4e86-b798-bc6b7f9f55d9', 'grilling', 'شواية فحم كبيرة', 'حجم عائلي', true),
('d71f1e46-4409-4570-a1cb-f487388dc437', 'grilling', 'صحون وملاعق', 'للاستخدام', true),
('fc406f03-b65e-49c4-a28b-45b43717a659', 'grilling', 'فحم طبيعي', 'كيس 10 كيلو', true),
('be4abb23-0077-4fa0-b1bd-33153675b5e8', 'grilling', 'لحم غنم طازج', 'للشوي والكبسة', true),
('da6e7d1e-2005-49fc-8c4a-d86e2d50087b', 'grilling', 'ملقط وسكاكين', 'أدوات الشوي', true),
-- Camping items
('6a6f9702-7c4f-4e28-a8a6-8999ca9d00c0', 'camping', 'ert', 'ertw', true),
('fe7bcba2-f8a6-4e6f-a50e-c51df83bef4b', 'camping', 'أعمدة الخيمة', 'معدنية قوية', true),
('8c340abf-1988-47df-9726-30bb691ab85e', 'camping', 'بساط أرضي', 'مقاوم للرطوبة', true),
('25456085-88dd-464a-96ba-48c1c9d3410c', 'camping', 'حبال وأوتاد', 'لتثبيت الخيمة', true),
('3b92cb40-51d5-42d7-a991-bc55bc5e4b5e', 'camping', 'خيمة كبيرة', 'تتسع 8 أشخاص', true),
('3db61688-cd4b-4bcb-803a-f24d82978ef9', 'camping', 'فرش جلوس عربي', 'مجلس متكامل', true),
('43dfb667-e63c-48ea-b10f-90940a3a4244', 'camping', 'مساند ظهر', 'طقم 6 قطع', true),
-- Winter items
('385c9310-790f-4d76-b9e4-8918d28e2dff', 'winter', 'أسطوانة غاز صغيرة', 'للدفاية', true),
('0f366387-846e-4238-9fac-3948e7381350', 'winter', 'بطانيات صوف', 'طقم 4 قطع', true),
('d0b23a03-bc21-435f-b8aa-b651baeefaf6', 'winter', 'جاكيتات شتوية', 'للجميع', false),
('bb27285f-7a0d-420a-b7bb-33365436f92c', 'winter', 'حطب للنار', 'حزمة كبيرة', true),
('419248b1-bbeb-4d84-a5f8-6cf0ad3ccb14', 'winter', 'دفاية غاز', 'للتدفئة الداخلية', true),
('dfeafdf1-31d9-453f-9306-e974f04ec7c2', 'winter', 'قفازات وطواقي', 'للبرد الشديد', false),
-- Lighting items
('370689cd-95fa-49ac-bf04-a99bc457c73e', 'lighting', 'إضاءة زينة', 'سلسلة أضواء', true),
('286caec4-b425-458a-a41d-dfdd341421b3', 'lighting', 'بطاريات احتياطية', 'أحجام مختلفة', true),
('99aa1ad2-09b9-4e51-bbde-06f724657e29', 'lighting', 'شموع معطرة', 'للأجواء', false),
('5626d61c-4371-41a8-a7bb-6d3bd97d94ab', 'lighting', 'فانوس LED', 'قابل للشحن', true),
('d8a6ae7b-e5e1-464a-8675-e63343ce4e1c', 'lighting', 'كشاف يدوي قوي', '1000 لومن', true),
-- Transport items
('1299e48e-51c2-4f7b-b5d0-69fa7412e655', 'transport', 'ثلاجة سيارة', 'للمشروبات', true),
('98273e5b-715f-432f-bf1f-2215d5399b52', 'transport', 'جالونات وقود احتياطي', '20 لتر', false),
('0459083a-fc79-43a6-b027-e895acaee2b0', 'transport', 'حبل سحب', 'للطوارئ', true),
('c522c9c7-edea-4031-bc74-d26286634904', 'transport', 'سيارة دفع رباعي', 'للطرق الوعرة', true),
('545bbfe7-ad90-4ef0-b61b-d51137461528', 'transport', 'عدة طوارئ سيارة', 'كاملة', true),
('4030fd83-c857-47e0-a6fe-96cb00b56426', 'transport', 'مضخة هواء', 'للإطارات', true),
-- Health items
('efae4c4e-99fe-4bb8-8ec1-25112bf5b498', 'health', 'أدوية أساسية', 'مسكنات وغيرها', true),
('d79c8209-45d7-408c-bb18-00f7bb2e4df7', 'health', 'صندوق إسعافات أولية', 'متكامل', true),
('fd1bd754-430c-4af1-a5dc-8f90e933abbf', 'health', 'كريم مرطب', 'للجفاف', false),
('1328295a-ccd6-45ec-a4e4-c9352be8a58d', 'health', 'مطفأة حريق صغيرة', 'للسلامة', true),
('b75306a4-f569-441b-b9e4-b6ad927081ea', 'health', 'مياه شرب', 'جالونات كافية', true),
('b84f7515-f240-482c-b462-1f3952a01107', 'health', 'واقي شمس', 'SPF 50', true),
-- Entertainment items
('b17aa3d0-69e6-4cfd-af6d-447390efea73', 'entertainment', 'تلسكوب صغير', 'لمشاهدة النجوم', false),
('d856dcf3-2c13-46c5-bcf2-dbea139e3c11', 'entertainment', 'سماعة بلوتوث', 'للموسيقى', true),
('4ec55772-2fa8-4979-bf8b-aae91fb783a7', 'entertainment', 'عود موسيقي', 'للطرب', false),
('9e114d95-750d-4d5c-aa49-6bff31d5b449', 'entertainment', 'كتب وقصص', 'للقراءة الليلية', false),
('60dbe998-f0cc-40f0-bdc3-01942c17e53c', 'entertainment', 'كرة قدم', 'للشباب', true),
('ce9ff380-7ee6-430f-9c36-5009088fb19a', 'entertainment', 'ورق لعب (بلوت)', 'للسمر', true);

-- 4. بيانات سجل النشاط (لا تحتاج event_id)
INSERT INTO activity_logs (id, event_id, action, details, metadata, created_at) VALUES
('fd69dfb0-5f32-4f2e-b98b-7c4204cee7ca', NULL, 'حذف طلعة', 'تم حذف طلعة "كشتة اختبار eT941H"', NULL, '2025-12-10 23:44:20.177696'),
('27489e83-370d-4e40-897e-62bb12b5cf9b', NULL, 'إضافة مشارك', 'تم إضافة "ايمن الحمودي"', NULL, '2025-12-11 01:13:24.975948'),
('3b752c81-e86c-4a67-bb3c-42040be8f12c', NULL, 'إضافة مشارك', 'تم إضافة "احمد مسعد"', NULL, '2025-12-11 01:13:57.037564'),
('76f50a23-ca80-4eb8-bc45-1310ce20cc47', NULL, 'إضافة مشارك', 'تم إضافة "عمر عبدالعظيم"', NULL, '2025-12-11 01:14:26.480562'),
('39175dde-b89c-4f71-bde7-0a5a73b6d013', NULL, 'إضافة مشارك', 'تم إضافة "يوسف عبد العظيم"', NULL, '2025-12-11 01:14:58.166328'),
('74d983ce-2608-4996-b9b4-8453ecf0d061', NULL, 'إضافة مشارك', 'تم إضافة "حسن ضيف الله"', NULL, '2025-12-11 01:15:28.164411'),
('49ddfb16-da28-4802-ba06-2e92f2288440', NULL, 'إضافة مشارك', 'تم إضافة "المهندس حمزة"', NULL, '2025-12-11 01:16:12.186265'),
('6d2673e8-0acd-4835-a15d-07a7bbc38b46', NULL, 'إضافة مشارك', 'تم إضافة "محمد عبدالجبار"', NULL, '2025-12-11 01:16:40.638499');

-- 5. بيانات سجل نشاط التسوية (جدول تاريخي بدون قيود FK)
INSERT INTO settlement_activity_log (id, event_id, event_title, debtor_id, debtor_name, creditor_id, creditor_name, amount, action, created_at) VALUES
('ae5ea986-041a-4314-91d1-a496c5009d58', 11, 'كشتة اختبار الغاء 7uH7uf', '4mpkwWL2At', 'تست مشارك', '5d795311-5e70-4bc6-b1b0-7e55bf0528c6', 'ff', 353.33, 'cancellation', '2025-12-10 23:41:14.280729'),
('e8fe34f0-604d-48e7-bb3f-1b0d99d12658', 11, 'كشتة اختبار الغاء 7uH7uf', '2aef19d8-adbc-486b-b033-4136011c54cb', 'اسامه السميطي', '5d795311-5e70-4bc6-b1b0-7e55bf0528c6', 'ff', 273.33, 'payment', '2025-12-10 23:41:15.911106'),
('43a36d59-822b-4f2f-84fd-71ea86391e46', 11, 'كشتة اختبار الغاء 7uH7uf', '2aef19d8-adbc-486b-b033-4136011c54cb', 'اسامه السميطي', '5d795311-5e70-4bc6-b1b0-7e55bf0528c6', 'ff', 273.33, 'cancellation', '2025-12-10 23:41:19.959435'),
('e862e7a3-ba29-4175-a0ab-a724f2d5ec67', 11, 'كشتة اختبار الغاء 7uH7uf', '4mpkwWL2At', 'تست مشارك', '5d795311-5e70-4bc6-b1b0-7e55bf0528c6', 'ff', 353.33, 'payment', '2025-12-10 23:41:21.844918'),
('c91811fb-8305-4bf3-8034-fbbdbc290d5a', 11, 'كشتة اختبار الغاء 7uH7uf', '2aef19d8-adbc-486b-b033-4136011c54cb', 'اسامه السميطي', '5d795311-5e70-4bc6-b1b0-7e55bf0528c6', 'ff', 273.33, 'payment', '2025-12-10 23:47:54.63223'),
('050f9faf-70db-4da2-af55-3cb1e7b99009', 3, 'كشتة تجريبية', '2aef19d8-adbc-486b-b033-4136011c54cb', 'اسامه السميطي', '4mpkwWL2At', 'تست مشارك', 25.00, 'payment', '2025-12-11 00:16:00.832247');

-- ===========================================
-- ملاحظات مهمة
-- ===========================================
-- * الجداول الفارغة حالياً: events, event_participants, contributions, settlement_records, users
-- * settlement_activity_log يحتفظ بسجل تاريخي حتى بعد حذف الطلعات والمشاركين
-- * لتشغيل هذا السكربت: psql -d your_database -f database_backup.sql

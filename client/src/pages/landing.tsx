import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Users, Package, CalendarDays, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export default function Landing() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const features = [
    {
      icon: CalendarDays,
      titleAr: "تنظيم الرحلات",
      titleEn: "Trip Planning",
      descAr: "خطط لطلعاتك مع الأهل والأصدقاء",
      descEn: "Plan your trips with family and friends",
    },
    {
      icon: Users,
      titleAr: "إدارة المشاركين",
      titleEn: "Manage Participants",
      descAr: "أضف المشاركين وتابع مساهماتهم",
      descEn: "Add participants and track contributions",
    },
    {
      icon: Package,
      titleAr: "تتبع المستلزمات",
      titleEn: "Track Equipment",
      descAr: "نظم المستلزمات والتكاليف بسهولة",
      descEn: "Organize equipment and costs easily",
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <header className="flex h-14 sm:h-16 items-center justify-between gap-2 border-b px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg">{isArabic ? "كشتة" : "Kashta"}</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center space-y-6 mb-12">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Flame className="h-10 w-10" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold">
            {isArabic ? "مرحباً بك في كشتة" : "Welcome to Kashta"}
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isArabic 
              ? "تطبيق متكامل لتنظيم رحلات البر والكشتات مع الأهل والأصدقاء"
              : "A complete app for organizing desert trips with family and friends"
            }
          </p>

          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            {isArabic ? (
              <>
                <ArrowLeft className="h-4 w-4" />
                تسجيل الدخول
              </>
            ) : (
              <>
                Sign In
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <feature.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-semibold">
                  {isArabic ? feature.titleAr : feature.titleEn}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? feature.descAr : feature.descEn}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

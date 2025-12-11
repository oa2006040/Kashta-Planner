import { useState } from "react";
import { 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Palette,
  Bell,
  Database,
  HelpCircle,
  Languages,
  Download,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export");
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kashta-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: t("تم التصدير", "Export Complete"),
        description: t("تم تحميل نسخة احتياطية من جميع بياناتك", "A backup of all your data has been downloaded"),
      });
    } catch (error) {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تصدير البيانات", "An error occurred while exporting data"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("الإعدادات", "Settings")}</h1>
        <p className="text-muted-foreground">{t("تخصيص تجربة استخدام التطبيق", "Customize your app experience")}</p>
      </div>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            {t("اللغة", "Language")}
          </CardTitle>
          <CardDescription>
            {t("اختر لغة التطبيق", "Choose app language")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("اللغة الحالية", "Current Language")}</Label>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "العربية" : "English"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={language === "ar" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("ar")}
                data-testid="button-lang-arabic"
              >
                العربية
              </Button>
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                data-testid="button-lang-english"
              >
                English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {t("المظهر", "Appearance")}
          </CardTitle>
          <CardDescription>
            {t("تخصيص شكل التطبيق", "Customize app appearance")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("الوضع الليلي", "Dark Mode")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("تفعيل الوضع الداكن للتطبيق", "Enable dark mode for the app")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                data-testid="switch-dark-mode"
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("الإشعارات", "Notifications")}
          </CardTitle>
          <CardDescription>
            {t("إدارة إشعارات التطبيق", "Manage app notifications")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("إشعارات الطلعات", "Event Notifications")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("استلام إشعارات عند اقتراب موعد الطلعات", "Receive notifications when events are approaching")}
              </p>
            </div>
            <Switch data-testid="switch-event-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("تذكير المستلزمات", "Item Reminders")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("تذكير بالمستلزمات المطلوب إحضارها", "Reminder for items you need to bring")}
              </p>
            </div>
            <Switch data-testid="switch-item-reminders" />
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {t("البيانات", "Data")}
          </CardTitle>
          <CardDescription>
            {t("إدارة بيانات التطبيق", "Manage app data")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("تصدير البيانات", "Export Data")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("تحميل نسخة احتياطية من جميع بياناتك (JSON)", "Download a backup of all your data (JSON)")}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={isExporting}
              data-testid="button-export-data"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 ml-2" />
                  {t("تصدير", "Export")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {t("المساعدة", "Help")}
          </CardTitle>
          <CardDescription>
            {t("الحصول على المساعدة والدعم", "Get help and support")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t("تطبيق كشتة - منظم الطلعات البرية", "Kashta App - Desert Trip Planner")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("الإصدار", "Version")} 1.0.0
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

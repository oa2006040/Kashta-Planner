import { 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Palette,
  Bell,
  Database,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">تخصيص تجربة استخدام التطبيق</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            المظهر
          </CardTitle>
          <CardDescription>
            تخصيص شكل التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>الوضع الليلي</Label>
              <p className="text-xs text-muted-foreground">
                تفعيل الوضع الداكن للتطبيق
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
            الإشعارات
          </CardTitle>
          <CardDescription>
            إدارة إشعارات التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>إشعارات الطلعات</Label>
              <p className="text-xs text-muted-foreground">
                استلام إشعارات عند اقتراب موعد الطلعات
              </p>
            </div>
            <Switch data-testid="switch-event-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تذكير المستلزمات</Label>
              <p className="text-xs text-muted-foreground">
                تذكير بالمستلزمات المطلوب إحضارها
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
            البيانات
          </CardTitle>
          <CardDescription>
            إدارة بيانات التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تصدير البيانات</Label>
              <p className="text-xs text-muted-foreground">
                تحميل نسخة من جميع بياناتك
              </p>
            </div>
            <Button variant="outline" size="sm" data-testid="button-export-data">
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            المساعدة
          </CardTitle>
          <CardDescription>
            الحصول على المساعدة والدعم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              تطبيق كشتة - منظم الطلعات البرية
            </p>
            <p className="text-xs text-muted-foreground">
              الإصدار 1.0.0
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
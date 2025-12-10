import { useQuery } from "@tanstack/react-query";
import { 
  History as HistoryIcon, 
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Users,
  Package,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatArabicDate } from "@/lib/constants";
import type { ActivityLog } from "@shared/schema";

const ACTION_ICONS: Record<string, React.ElementType> = {
  "إنشاء طلعة": Plus,
  "تحديث طلعة": Edit2,
  "حذف طلعة": Trash2,
  "إضافة مشارك": Users,
  "إضافة مستلزم": Package,
  default: HistoryIcon,
};

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  "إنشاء طلعة": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
  "تحديث طلعة": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  "حذف طلعة": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  "إضافة مشارك": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  "إضافة مستلزم": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
  default: { bg: "bg-muted", text: "text-muted-foreground" },
};

function LogCard({ log }: { log: ActivityLog }) {
  const Icon = ACTION_ICONS[log.action] || ACTION_ICONS.default;
  const colors = ACTION_COLORS[log.action] || ACTION_COLORS.default;
  const logDate = new Date(log.createdAt!);

  return (
    <div className="flex gap-4 p-4 rounded-lg bg-muted/30" data-testid={`log-${log.id}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${colors.bg}`}>
        <Icon className={`h-5 w-5 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-medium">{log.action}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {logDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {log.details && (
          <p className="text-sm text-muted-foreground">{log.details}</p>
        )}
      </div>
    </div>
  );
}

function LogCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-muted/30">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

function groupLogsByDate(logs: ActivityLog[]): Record<string, ActivityLog[]> {
  return logs.reduce((acc, log) => {
    const date = new Date(log.createdAt!).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, ActivityLog[]>);
}

export default function History() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const groupedLogs = logs ? groupLogsByDate(logs) : {};
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">سجل النشاط</h1>
        <p className="text-muted-foreground">تتبع جميع التغييرات والإجراءات</p>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <HistoryIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{logs?.length || 0}</p>
            <p className="text-sm text-muted-foreground">إجمالي السجلات</p>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <LogCardSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      ) : sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatArabicDate(new Date(date))}
                  <Badge variant="secondary" className="mr-auto">
                    {groupedLogs[date].length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedLogs[date].map((log) => (
                  <LogCard key={log.id} log={log} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <HistoryIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">لا يوجد سجل</h3>
            <p className="text-muted-foreground max-w-md">
              سيظهر هنا سجل جميع الإجراءات والتغييرات التي تتم على الطلعات والمشاركين
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
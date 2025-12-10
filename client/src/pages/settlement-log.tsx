import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  ArrowLeftRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatArabicDate, formatNumber } from "@/lib/constants";
import type { SettlementActivityLog } from "@shared/schema";

export default function SettlementLogPage() {
  const { data: logs, isLoading, error } = useQuery<SettlementActivityLog[]>({
    queryKey: ['/api/settlement-activity-log'],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            حدث خطأ في تحميل سجل التسويات
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentCount = logs?.filter(l => l.action === 'payment').length || 0;
  const cancellationCount = logs?.filter(l => l.action === 'cancellation').length || 0;
  const totalAmount = logs?.reduce((sum, l) => {
    if (l.action === 'payment') {
      return sum + parseFloat(l.amount);
    }
    return sum;
  }, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">سجل التسويات</h1>
            <p className="text-muted-foreground">سجل دائم لجميع عمليات الدفع والإلغاء</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">عمليات الدفع</span>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="text-payment-count">
              {formatNumber(paymentCount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">عمليات الإلغاء</span>
            </div>
            <p className="text-2xl font-bold text-red-600" data-testid="text-cancellation-count">
              {formatNumber(cancellationCount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="text-sm">إجمالي المدفوعات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-amount">
              {formatCurrency(totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            سجل العمليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                  data-testid={`log-entry-${log.id}`}
                >
                  <div className={`mt-1 p-2 rounded-full ${log.action === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                    {log.action === 'payment' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge 
                        variant={log.action === 'payment' ? 'default' : 'destructive'}
                        data-testid={`badge-action-${log.id}`}
                      >
                        {log.action === 'payment' ? 'دفع' : 'إلغاء'}
                      </Badge>
                      <span className="text-lg font-bold" data-testid={`text-amount-${log.id}`}>
                        {formatCurrency(log.amount)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>
                          <span className="font-medium text-red-600" data-testid={`text-debtor-${log.id}`}>
                            {log.debtorName}
                          </span>
                          <span className="text-muted-foreground mx-2">
                            {log.action === 'payment' ? 'دفع إلى' : 'تم إلغاء الدفع إلى'}
                          </span>
                          <span className="font-medium text-green-600" data-testid={`text-creditor-${log.id}`}>
                            {log.creditorName}
                          </span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          في فعالية: <span className="font-medium">{log.eventTitle}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left text-sm text-muted-foreground">
                    <p>{formatArabicDate(log.createdAt)}</p>
                    <p className="text-xs">
                      {new Date(log.createdAt).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">لا توجد عمليات مسجلة</p>
              <p className="text-muted-foreground">
                عند تسجيل أو إلغاء عمليات الدفع، ستظهر هنا
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium mb-1">ملاحظة مهمة</p>
              <p className="text-sm text-muted-foreground">
                هذا السجل دائم ولا يمكن حذفه أو تعديله. يتم الاحتفاظ بجميع العمليات حتى لو تم حذف الفعالية أو المشاركين، مما يضمن الشفافية الكاملة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Equal,
  Wallet,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/constants";
import type { ParticipantDebtSummary } from "@shared/schema";

export default function DebtPage() {
  const { data: summaries, isLoading, error } = useQuery<ParticipantDebtSummary[]>({
    queryKey: ['/api/debt'],
    refetchInterval: 5000,
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
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
            حدث خطأ في تحميل بيانات الديون
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCreditors = summaries?.filter(s => s.role === 'creditor').length || 0;
  const totalDebtors = summaries?.filter(s => s.role === 'debtor').length || 0;
  const totalSettled = summaries?.filter(s => s.role === 'settled').length || 0;

  const totalOwedAmount = summaries?.reduce((sum, s) => sum + Math.max(0, s.totalOwed), 0) || 0;
  const totalCreditsAmount = summaries?.reduce((sum, s) => sum + Math.max(0, s.totalOwedToYou), 0) || 0;

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
            <h1 className="text-2xl font-bold" data-testid="text-page-title">محفظة الديون</h1>
            <p className="text-muted-foreground">عرض ديون جميع المشاركين عبر جميع الفعاليات</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">إجمالي المشاركين</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-participants">
              {formatNumber(summaries?.length || 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">دائنون</span>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="text-creditors-count">
              {formatNumber(totalCreditors)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">مدينون</span>
            </div>
            <p className="text-2xl font-bold text-red-600" data-testid="text-debtors-count">
              {formatNumber(totalDebtors)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Equal className="h-4 w-4" />
              <span className="text-sm">متعادلون</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-settled-count">
              {formatNumber(totalSettled)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries?.map((summary) => (
          <Link key={summary.participant.id} href={`/debt/${summary.participant.id}`}>
            <Card 
              className="cursor-pointer hover-elevate transition-all"
              data-testid={`card-participant-${summary.participant.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-name-${summary.participant.id}`}>
                        {summary.participant.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatNumber(summary.eventCount)} فعاليات</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={summary.role === 'creditor' ? 'default' : summary.role === 'debtor' ? 'destructive' : 'secondary'}
                    data-testid={`badge-role-${summary.participant.id}`}
                  >
                    {summary.role === 'creditor' && <TrendingUp className="h-3 w-3 ml-1" />}
                    {summary.role === 'debtor' && <TrendingDown className="h-3 w-3 ml-1" />}
                    {summary.role === 'settled' && <Equal className="h-3 w-3 ml-1" />}
                    {summary.role === 'creditor' ? 'دائن' : summary.role === 'debtor' ? 'مدين' : 'متعادل'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">إجمالي المدفوع</span>
                  <span className="font-medium" data-testid={`text-paid-${summary.participant.id}`}>
                    {formatCurrency(summary.totalPaid)}
                  </span>
                </div>
                
                {summary.totalOwed > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">عليه للآخرين</span>
                    <span className="font-medium text-red-600" data-testid={`text-owes-${summary.participant.id}`}>
                      {formatCurrency(summary.totalOwed)}
                    </span>
                  </div>
                )}
                
                {summary.totalOwedToYou > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">له عند الآخرين</span>
                    <span className="font-medium text-green-600" data-testid={`text-owed-to-${summary.participant.id}`}>
                      {formatCurrency(summary.totalOwedToYou)}
                    </span>
                  </div>
                )}
                
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="font-medium">صافي الموقف</span>
                  <span 
                    className={`font-bold ${summary.netPosition > 0 ? 'text-green-600' : summary.netPosition < 0 ? 'text-red-600' : ''}`}
                    data-testid={`text-net-${summary.participant.id}`}
                  >
                    {summary.netPosition > 0 ? '+' : ''}{formatCurrency(summary.netPosition)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {summaries?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">لا توجد ديون حالياً</p>
            <p className="text-muted-foreground">
              عندما يتم تسجيل مساهمات للفعاليات، ستظهر هنا ديون المشاركين
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

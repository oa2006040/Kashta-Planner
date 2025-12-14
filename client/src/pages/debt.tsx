import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { 
  Users, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Equal,
  Wallet,
  Calendar,
  ShieldAlert,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/constants";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/useAuth";
import type { ParticipantDebtSummary } from "@shared/schema";

export default function DebtPage() {
  const { t, language } = useLanguage();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const isAdmin = user?.isAdmin ?? false;
  
  // Fetch debt summaries - for admins shows all, for regular users shows only their own
  const { data: summaries, isLoading, error } = useQuery<ParticipantDebtSummary[]>({
    queryKey: ['/api/debt'],
    refetchInterval: 5000,
    enabled: !authLoading && isAuthenticated,
  });

  // For regular users: if they have exactly one participant (their own), redirect to their detail page
  useEffect(() => {
    if (!isAdmin && summaries && summaries.length === 1) {
      setLocation(`/debt/${summaries[0].participant.id}`);
    }
  }, [isAdmin, summaries, setLocation]);

  // Show loading while auth is loading
  if (authLoading) {
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

  // For regular users with no linked participant, show a friendly message
  if (!isAdmin && summaries && summaries.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("لا يوجد ملف مشارك مرتبط", "No participant profile linked")}
            </h3>
            <p className="text-muted-foreground">
              {t("حسابك غير مرتبط بملف مشارك حتى الآن. تواصل مع المسؤول.", "Your account is not linked to a participant profile yet. Contact an admin.")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {t("حدث خطأ في تحميل بيانات الديون", "An error occurred while loading debt data")}
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
  const totalExpenses = summaries?.reduce((sum, s) => sum + s.totalPaid, 0) || 0;

  const BackArrow = language === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <BackArrow className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("محفظة الديون", "Debt Portfolio")}</h1>
            <p className="text-muted-foreground">{t("عرض ديون جميع المشاركين عبر جميع الفعاليات", "View all participants' debts across all events")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">{t("إجمالي المصروفات", "Total Expenses")}</span>
            </div>
            <p className="text-2xl font-bold text-primary" data-testid="text-total-expenses">
              {formatCurrency(totalExpenses, language)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{t("إجمالي المشاركين", "Total Participants")}</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-participants">
              {formatNumber(summaries?.length || 0, language)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">{t("دائنون", "Creditors")}</span>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="text-creditors-count">
              {formatNumber(totalCreditors, language)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">{t("مدينون", "Debtors")}</span>
            </div>
            <p className="text-2xl font-bold text-red-600" data-testid="text-debtors-count">
              {formatNumber(totalDebtors, language)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Equal className="h-4 w-4" />
              <span className="text-sm">{t("متعادلون", "Settled")}</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-settled-count">
              {formatNumber(totalSettled, language)}
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
                        <span>{formatNumber(summary.eventCount, language)} {t("فعاليات", "events")}</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={summary.role === 'creditor' ? 'default' : summary.role === 'debtor' ? 'destructive' : 'secondary'}
                    data-testid={`badge-role-${summary.participant.id}`}
                  >
                    {summary.role === 'creditor' && <TrendingUp className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                    {summary.role === 'debtor' && <TrendingDown className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                    {summary.role === 'settled' && <Equal className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                    {summary.role === 'creditor' ? t('دائن', 'Creditor') : summary.role === 'debtor' ? t('مدين', 'Debtor') : t('متعادل', 'Settled')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("إجمالي المدفوع", "Total Paid")}</span>
                  <span className="font-medium" data-testid={`text-paid-${summary.participant.id}`}>
                    {formatCurrency(summary.totalPaid, language)}
                  </span>
                </div>
                
                {summary.totalOwed > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">{t("عليه للآخرين", "Owes Others")}</span>
                    <span className="font-medium text-red-600" data-testid={`text-owes-${summary.participant.id}`}>
                      {formatCurrency(summary.totalOwed, language)}
                    </span>
                  </div>
                )}
                
                {summary.totalOwedToYou > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">{t("له عند الآخرين", "Owed by Others")}</span>
                    <span className="font-medium text-green-600" data-testid={`text-owed-to-${summary.participant.id}`}>
                      {formatCurrency(summary.totalOwedToYou, language)}
                    </span>
                  </div>
                )}
                
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="font-medium">{t("صافي الموقف", "Net Position")}</span>
                  <span 
                    className={`font-bold ${summary.netPosition > 0 ? 'text-green-600' : summary.netPosition < 0 ? 'text-red-600' : ''}`}
                    data-testid={`text-net-${summary.participant.id}`}
                  >
                    {summary.netPosition > 0 ? '+' : ''}{formatCurrency(summary.netPosition, language)}
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
            <p className="text-lg font-medium mb-2">{t("لا توجد ديون حالياً", "No debts currently")}</p>
            <p className="text-muted-foreground">
              {t("عندما يتم تسجيل مساهمات للفعاليات، ستظهر هنا ديون المشاركين", "When contributions are recorded for events, participant debts will appear here")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

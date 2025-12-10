import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Receipt, 
  Calendar, 
  Users, 
  Check, 
  X, 
  ArrowLeft, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Equal,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatArabicDate, formatCurrency, formatNumber } from "@/lib/constants";
import { AvatarIcon } from "@/components/avatar-icon";
import type { EventSettlement } from "@shared/schema";

export default function Statement() {
  const { toast } = useToast();

  const { data: settlements, isLoading } = useQuery<EventSettlement[]>({
    queryKey: ["/api/settlements"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ eventId, debtorId, creditorId }: { 
      eventId: number; 
      debtorId: string; 
      creditorId: string;
    }) => {
      return apiRequest("PATCH", `/api/events/${eventId}/settlements/${debtorId}/${creditorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settlements"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الدفع",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الدفع",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const hasSettlements = settlements && settlements.length > 0;
  
  const totalUnsettled = settlements?.reduce((sum, s) => 
    sum + s.transactions.filter(t => !t.isSettled).reduce((tSum, t) => tSum + parseFloat(t.amount), 0)
  , 0) || 0;
  
  const totalSettled = settlements?.reduce((sum, s) => 
    sum + s.transactions.filter(t => t.isSettled).reduce((tSum, t) => tSum + parseFloat(t.amount), 0)
  , 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Receipt className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">كشف الحساب</h1>
          <p className="text-muted-foreground">تسوية المصاريف بين المشاركين</p>
        </div>
      </div>

      {hasSettlements && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <X className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalUnsettled)}</p>
                <p className="text-sm text-muted-foreground">ديون غير مسددة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalSettled)}</p>
                <p className="text-sm text-muted-foreground">تم تسديدها</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasSettlements ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد تسويات</h3>
            <p className="text-muted-foreground mb-4">
              ستظهر هنا تسويات المصاريف عند إضافة مستلزمات بتكاليف للطلعات
            </p>
            <Link href="/events">
              <Button data-testid="button-go-events">
                <Calendar className="h-4 w-4 ml-2" />
                الذهاب للطلعات
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {settlements.map((settlement) => (
            <Card key={settlement.eventId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        <Link 
                          href={`/events/${settlement.eventId}`}
                          className="hover:underline"
                          data-testid={`link-event-${settlement.eventId}`}
                        >
                          {settlement.eventTitle}
                        </Link>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {formatArabicDate(new Date(settlement.eventDate))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{formatNumber(settlement.participantCount)}</span>
                    </div>
                    <Badge variant="secondary">
                      الحصة: {formatCurrency(settlement.fairShare)}
                    </Badge>
                    {settlement.unassignedCosts > 0 && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <AlertTriangle className="h-3 w-3 ml-1" />
                        {formatCurrency(settlement.unassignedCosts)} غير معين
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {settlement.balances.map((balance) => (
                    <div 
                      key={balance.participant.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        balance.role === 'creditor' 
                          ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
                          : balance.role === 'debtor'
                          ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
                          : 'bg-muted/50'
                      }`}
                    >
                      <AvatarIcon icon={balance.participant.avatar} className="h-8 w-8" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{balance.participant.name}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">دفع: {formatCurrency(balance.totalPaid)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {balance.role === 'creditor' && (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              +{formatCurrency(balance.balance)}
                            </span>
                          </>
                        )}
                        {balance.role === 'debtor' && (
                          <>
                            <TrendingDown className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-600">
                              {formatCurrency(balance.balance)}
                            </span>
                          </>
                        )}
                        {balance.role === 'settled' && (
                          <>
                            <Equal className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">متوازن</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {settlement.transactions.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">التحويلات المطلوبة</h4>
                    <div className="space-y-2">
                      {settlement.transactions.map((tx) => (
                        <div 
                          key={`${tx.debtorId}-${tx.creditorId}`}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            tx.isSettled 
                              ? 'bg-green-50 dark:bg-green-900/10' 
                              : 'bg-muted/50'
                          }`}
                          data-testid={`settlement-${settlement.eventId}-${tx.debtorId}-${tx.creditorId}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <AvatarIcon icon={tx.debtor?.avatar} className="h-6 w-6" />
                            <span className="font-medium truncate">{tx.debtor?.name}</span>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                            <AvatarIcon icon={tx.creditor?.avatar} className="h-6 w-6" />
                            <span className="font-medium truncate">{tx.creditor?.name}</span>
                          </div>
                          <Badge 
                            variant={tx.isSettled ? "default" : "secondary"}
                            className={tx.isSettled ? "bg-green-600" : ""}
                          >
                            {formatCurrency(tx.amount)}
                          </Badge>
                          <Button
                            size="sm"
                            variant={tx.isSettled ? "outline" : "default"}
                            onClick={() => toggleMutation.mutate({
                              eventId: settlement.eventId,
                              debtorId: tx.debtorId,
                              creditorId: tx.creditorId,
                            })}
                            disabled={toggleMutation.isPending}
                            data-testid={`button-toggle-${settlement.eventId}-${tx.debtorId}-${tx.creditorId}`}
                          >
                            {toggleMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : tx.isSettled ? (
                              <>
                                <X className="h-4 w-4 ml-1" />
                                إلغاء
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 ml-1" />
                                تم الدفع
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

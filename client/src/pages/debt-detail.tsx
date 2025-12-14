import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Equal,
  Wallet,
  Calendar,
  Users,
  MapPin,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber, formatDate } from "@/lib/constants";
import { useLanguage } from "@/components/language-provider";
import type { ParticipantDebtPortfolio } from "@shared/schema";

export default function DebtDetailPage() {
  const [, params] = useRoute("/debt/:participantId");
  const participantId = params?.participantId;
  const { t, language } = useLanguage();

  const { data: portfolio, isLoading, error } = useQuery<ParticipantDebtPortfolio>({
    queryKey: ['/api/debt', participantId],
    enabled: !!participantId,
    refetchInterval: 5000,
    retry: (failureCount, error: any) => {
      if (error?.status === 403) return false;
      return failureCount < 3;
    },
  });

  const BackArrow = language === "ar" ? ArrowLeft : ArrowRight;

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const is403Error = (error as any)?.status === 403;

  if (is403Error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <BackArrow className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{t("الوصول مقيد", "Access Restricted")}</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("لا يمكنك الوصول لهذه الصفحة", "You cannot access this page")}
            </h3>
            <p className="text-muted-foreground">
              {t("يمكنك فقط عرض ديونك الخاصة. للوصول لديون الآخرين، تواصل مع المسؤول.", "You can only view your own debts. To access others' debts, contact an admin.")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/debt">
            <Button variant="ghost" size="icon">
              <BackArrow className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{t("خطأ", "Error")}</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            {t("المشارك غير موجود أو حدث خطأ في تحميل البيانات", "Participant not found or an error occurred while loading data")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { participant, totalPaid, totalOwed, totalOwedToYou, netPosition, role, counterpartyDebts, eventBreakdown } = portfolio;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/debt">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <BackArrow className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-participant-name">
                {participant.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={role === 'creditor' ? 'default' : role === 'debtor' ? 'destructive' : 'secondary'}
                  data-testid="badge-role"
                >
                  {role === 'creditor' && <TrendingUp className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                  {role === 'debtor' && <TrendingDown className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                  {role === 'settled' && <Equal className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                  {role === 'creditor' ? t('دائن', 'Creditor') : role === 'debtor' ? t('مدين', 'Debtor') : t('متعادل', 'Settled')}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {formatNumber(eventBreakdown.length, language)} {t("فعاليات", "events")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">{t("إجمالي المدفوع", "Total Paid")}</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-paid">
              {formatCurrency(totalPaid, language)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">{t("عليه للآخرين", "Owes Others")}</span>
            </div>
            <p className="text-2xl font-bold text-red-600" data-testid="text-total-owed">
              {formatCurrency(totalOwed, language)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">{t("له عند الآخرين", "Owed by Others")}</span>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="text-total-owed-to">
              {formatCurrency(totalOwedToYou, language)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Equal className="h-4 w-4" />
              <span className="text-sm">{t("صافي الموقف", "Net Position")}</span>
            </div>
            <p 
              className={`text-2xl font-bold ${netPosition > 0 ? 'text-green-600' : netPosition < 0 ? 'text-red-600' : ''}`}
              data-testid="text-net-position"
            >
              {netPosition > 0 ? '+' : ''}{formatCurrency(netPosition, language)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="counterparties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="counterparties" data-testid="tab-counterparties">
            <Users className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
            {t("الديون مع الآخرين", "Debts with Others")}
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            <Calendar className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
            {t("الفعاليات", "Events")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="counterparties" className="space-y-4">
          <h3 className="font-semibold">{t("تفصيل الديون مع كل شخص", "Debt breakdown with each person")}</h3>
          
          {counterpartyDebts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {counterpartyDebts.map((cp) => (
                <Card 
                  key={cp.counterparty.id}
                  data-testid={`card-counterparty-${cp.counterparty.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-base">
                          {cp.counterparty.name}
                        </CardTitle>
                      </div>
                      <Badge 
                        variant={cp.totalOwed > 0 ? 'destructive' : 'default'}
                      >
                        {cp.totalOwed > 0 ? (
                          <>
                            <TrendingDown className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                            {t("يستحق", "Due")}
                          </>
                        ) : (
                          <>
                            <TrendingUp className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                            {t("مستحق له", "Owed")}
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {cp.totalOwed > 0 ? t('مبلغ مستحق عليك', 'Amount you owe') : t('مبلغ مستحق لك', 'Amount owed to you')}
                      </span>
                      <span 
                        className={`font-bold ${cp.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}
                        data-testid={`text-amount-${cp.counterparty.id}`}
                      >
                        {formatCurrency(Math.abs(cp.totalOwed), language)}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <p className="text-sm text-muted-foreground mb-2">{t("تفصيل الفعاليات:", "Events breakdown:")}</p>
                      <div className="space-y-1">
                        {cp.events.map((evt, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <Link href={`/events/${evt.eventId}`}>
                              <span className="text-muted-foreground hover:underline cursor-pointer">
                                {evt.eventTitle}
                              </span>
                            </Link>
                            <span className={evt.amount > 0 ? 'text-red-600' : 'text-green-600'}>
                              {evt.amount > 0 ? '-' : '+'}{formatCurrency(Math.abs(evt.amount), language)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Equal className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium">{t("لا توجد ديون مستحقة", "No debts due")}</p>
                <p className="text-muted-foreground">
                  {t("هذا المشارك متعادل مع جميع الآخرين", "This participant is settled with everyone")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <h3 className="font-semibold">{t("تفصيل المساهمات حسب الفعالية", "Contributions breakdown by event")}</h3>
          
          {eventBreakdown.length > 0 ? (
            <div className="space-y-3">
              {eventBreakdown.map((eb) => (
                <Link key={eb.event.id} href={`/events/${eb.event.id}`}>
                  <Card 
                    className="cursor-pointer hover-elevate"
                    data-testid={`card-event-${eb.event.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{eb.event.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatDate(eb.event.date, language)}</span>
                              {eb.event.location && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {eb.event.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={language === "ar" ? "text-left" : "text-right"}>
                            <p className="text-sm text-muted-foreground">{t("دفع", "Paid")}</p>
                            <p className="font-medium">{formatCurrency(eb.paid, language)}</p>
                          </div>
                          <div className={language === "ar" ? "text-left" : "text-right"}>
                            <p className="text-sm text-muted-foreground">{t("الحصة", "Share")}</p>
                            <p className="font-medium">{formatCurrency(eb.fairShare, language)}</p>
                          </div>
                          <Badge 
                            variant={eb.role === 'creditor' ? 'default' : eb.role === 'debtor' ? 'destructive' : 'secondary'}
                          >
                            {eb.role === 'creditor' && <TrendingUp className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                            {eb.role === 'debtor' && <TrendingDown className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                            {eb.role === 'settled' && <Equal className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                            {eb.balance > 0 ? '+' : ''}{formatCurrency(eb.balance, language)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium">{t("لا توجد فعاليات", "No events")}</p>
                <p className="text-muted-foreground">
                  {t("هذا المشارك لم يشارك في أي فعالية بعد", "This participant hasn't joined any events yet")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

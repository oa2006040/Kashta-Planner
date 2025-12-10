import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Equal,
  Wallet,
  Calendar,
  Users,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber, formatArabicDate } from "@/lib/constants";
import type { ParticipantDebtPortfolio } from "@shared/schema";

export default function DebtDetailPage() {
  const [, params] = useRoute("/debt/:participantId");
  const participantId = params?.participantId;

  const { data: portfolio, isLoading, error } = useQuery<ParticipantDebtPortfolio>({
    queryKey: ['/api/debt', participantId],
    enabled: !!participantId,
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/debt">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">خطأ</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            المشارك غير موجود أو حدث خطأ في تحميل البيانات
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
              <ArrowLeft className="h-5 w-5" />
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
                  {role === 'creditor' && <TrendingUp className="h-3 w-3 ml-1" />}
                  {role === 'debtor' && <TrendingDown className="h-3 w-3 ml-1" />}
                  {role === 'settled' && <Equal className="h-3 w-3 ml-1" />}
                  {role === 'creditor' ? 'دائن' : role === 'debtor' ? 'مدين' : 'متعادل'}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {formatNumber(eventBreakdown.length)} فعاليات
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
              <span className="text-sm">إجمالي المدفوع</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-paid">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">عليه للآخرين</span>
            </div>
            <p className="text-2xl font-bold text-red-600" data-testid="text-total-owed">
              {formatCurrency(totalOwed)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">له عند الآخرين</span>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="text-total-owed-to">
              {formatCurrency(totalOwedToYou)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Equal className="h-4 w-4" />
              <span className="text-sm">صافي الموقف</span>
            </div>
            <p 
              className={`text-2xl font-bold ${netPosition > 0 ? 'text-green-600' : netPosition < 0 ? 'text-red-600' : ''}`}
              data-testid="text-net-position"
            >
              {netPosition > 0 ? '+' : ''}{formatCurrency(netPosition)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="counterparties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="counterparties" data-testid="tab-counterparties">
            <Users className="h-4 w-4 ml-2" />
            الديون مع الآخرين
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            <Calendar className="h-4 w-4 ml-2" />
            الفعاليات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="counterparties" className="space-y-4">
          <h3 className="font-semibold">تفصيل الديون مع كل شخص</h3>
          
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
                            <TrendingDown className="h-3 w-3 ml-1" />
                            يستحق
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-3 w-3 ml-1" />
                            مستحق له
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {cp.totalOwed > 0 ? 'مبلغ مستحق عليك' : 'مبلغ مستحق لك'}
                      </span>
                      <span 
                        className={`font-bold ${cp.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}
                        data-testid={`text-amount-${cp.counterparty.id}`}
                      >
                        {formatCurrency(Math.abs(cp.totalOwed))}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <p className="text-sm text-muted-foreground mb-2">تفصيل الفعاليات:</p>
                      <div className="space-y-1">
                        {cp.events.map((evt, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <Link href={`/events/${evt.eventId}`}>
                              <span className="text-muted-foreground hover:underline cursor-pointer">
                                {evt.eventTitle}
                              </span>
                            </Link>
                            <span className={evt.amount > 0 ? 'text-red-600' : 'text-green-600'}>
                              {evt.amount > 0 ? '-' : '+'}{formatCurrency(Math.abs(evt.amount))}
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
                <p className="text-lg font-medium">لا توجد ديون مستحقة</p>
                <p className="text-muted-foreground">
                  هذا المشارك متعادل مع جميع الآخرين
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <h3 className="font-semibold">تفصيل المساهمات حسب الفعالية</h3>
          
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
                              <span>{formatArabicDate(eb.event.date)}</span>
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
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground">دفع</p>
                            <p className="font-medium">{formatCurrency(eb.paid)}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground">الحصة</p>
                            <p className="font-medium">{formatCurrency(eb.fairShare)}</p>
                          </div>
                          <Badge 
                            variant={eb.role === 'creditor' ? 'default' : eb.role === 'debtor' ? 'destructive' : 'secondary'}
                          >
                            {eb.role === 'creditor' && <TrendingUp className="h-3 w-3 ml-1" />}
                            {eb.role === 'debtor' && <TrendingDown className="h-3 w-3 ml-1" />}
                            {eb.role === 'settled' && <Equal className="h-3 w-3 ml-1" />}
                            {eb.balance > 0 ? '+' : ''}{formatCurrency(eb.balance)}
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
                <p className="text-lg font-medium">لا توجد فعاليات</p>
                <p className="text-muted-foreground">
                  هذا المشارك لم يشارك في أي فعالية بعد
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

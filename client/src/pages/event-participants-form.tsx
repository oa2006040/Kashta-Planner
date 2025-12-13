import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Mail, Check, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/components/language-provider";
import type { EventWithDetails } from "@shared/schema";

export default function EventParticipantsForm() {
  const [, params] = useRoute("/events/:id/participants");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const eventId = params?.id;

  const [email, setEmail] = useState("");

  const { data: event, isLoading: eventLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const inviteMutation = useMutation({
    mutationFn: async (inviteEmail: string) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/invite`, { email: inviteEmail });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "invitations"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: t("تنبيه", "Notice"),
        description: t("الرجاء إدخال البريد الإلكتروني", "Please enter an email address"),
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: t("تنبيه", "Notice"),
        description: t("الرجاء إدخال بريد إلكتروني صحيح", "Please enter a valid email address"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await inviteMutation.mutateAsync(email);
      const successMessage = response?.message || t(`تم إرسال الدعوة إلى ${email}`, `Invitation sent to ${email}`);
      toast({
        title: t("تم بنجاح", "Success"),
        description: successMessage,
      });
      setEmail("");
      navigate(`/events/${eventId}`);
    } catch (error: any) {
      let message = t("حدث خطأ أثناء إرسال الدعوة", "An error occurred while sending the invitation");
      
      if (error?.message) {
        message = error.message;
      } else if (error?.error) {
        message = error.error;
      }
      
      toast({
        title: t("خطأ", "Error"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

  if (eventLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("الطلعة غير موجودة", "Event not found")}</h3>
            <Link href="/events">
              <Button>{t("العودة للطلعات", "Back to Events")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/events/${eventId}`)}
          data-testid="button-back"
        >
          <BackArrow className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("دعوة مشارك", "Invite Participant")}</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("دعوة عبر البريد الإلكتروني", "Invite via Email")}
          </CardTitle>
          <CardDescription>
            {t(
              "أدخل البريد الإلكتروني للشخص الذي تريد دعوته للمشاركة في هذه الطلعة",
              "Enter the email address of the person you want to invite to this event"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("البريد الإلكتروني", "Email Address")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="text-left"
                disabled={inviteMutation.isPending}
                data-testid="input-invite-email"
              />
            </div>
            
            <Button
              type="submit"
              disabled={inviteMutation.isPending || !email.trim()}
              className="w-full"
              data-testid="button-send-invite"
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("جاري الإرسال...", "Sending...")}
                </>
              ) : (
                <>
                  <Send className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("إرسال الدعوة", "Send Invitation")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{t("كيف تعمل الدعوات؟", "How do invitations work?")}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t("إذا كان الشخص مسجلاً بالفعل، سيرى الدعوة في حسابه", "If the person is already registered, they'll see the invitation in their account")}</li>
                <li>{t("يمكنهم قبول أو رفض الدعوة", "They can accept or decline the invitation")}</li>
                <li>{t("بعد القبول، سيصبحون مشاركين في الطلعة", "After accepting, they'll become participants in the event")}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

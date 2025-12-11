import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, User, Phone, Save, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AVATAR_OPTIONS } from "@/lib/constants";
import { AvatarIcon } from "@/components/avatar-icon";
import { useLanguage } from "@/components/language-provider";
import type { Participant } from "@shared/schema";

export default function ParticipantForm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/participants/:id/edit");
  const isEditing = !!params?.id;
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const participantFormSchema = z.object({
    name: z.string().min(1, t("يرجى إدخال الاسم", "Please enter a name")),
    phone: z.string().optional(),
    avatar: z.string().optional(),
  });

  type ParticipantFormData = z.infer<typeof participantFormSchema>;

  const { data: participant } = useQuery<Participant>({
    queryKey: ["/api/participants", params?.id],
    enabled: isEditing,
  });

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      avatar: "user",
    },
    values: participant
      ? {
          name: participant.name,
          phone: participant.phone || "",
          avatar: participant.avatar || "user",
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      return apiRequest("POST", "/api/participants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الإضافة", "Added"),
        description: t("تم إضافة المشارك بنجاح", "Participant added successfully"),
      });
      navigate("/participants");
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إضافة المشارك", "An error occurred while adding the participant"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      return apiRequest("PATCH", `/api/participants/${params?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      toast({
        title: t("تم التحديث", "Updated"),
        description: t("تم تحديث المشارك بنجاح", "Participant updated successfully"),
      });
      navigate("/participants");
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تحديث المشارك", "An error occurred while updating the participant"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ParticipantFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedAvatar = form.watch("avatar");
  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/participants")}
          className="mb-4"
          data-testid="button-back"
        >
          <BackArrow className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
          {t("رجوع", "Back")}
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? t("تعديل المشارك", "Edit Participant") : t("مشارك جديد", "New Participant")}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? t("قم بتعديل بيانات المشارك", "Edit participant details")
            : t("أدخل بيانات المشارك الجديد", "Enter new participant details")}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("الصورة الرمزية", "Avatar")}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_OPTIONS.map((avatar) => (
                          <button
                            key={avatar}
                            type="button"
                            onClick={() => field.onChange(avatar)}
                            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                              selectedAvatar === avatar
                                ? "bg-primary/20 ring-2 ring-primary"
                                : "bg-muted hover-elevate"
                            }`}
                            data-testid={`button-avatar-${avatar}`}
                          >
                            <AvatarIcon icon={avatar} className="h-6 w-6" />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("الاسم", "Name")} *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
                        <Input
                          placeholder={t("مثال: أسامه السميطي", "Example: John Doe")}
                          className={language === "ar" ? "pr-9" : "pl-9"}
                          {...field}
                          data-testid="input-participant-name"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("رقم الجوال", "Phone Number")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
                        <Input
                          placeholder="55xx xxxx"
                          className={language === "ar" ? "pr-9" : "pl-9"}
                          {...field}
                          data-testid="input-participant-phone"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  data-testid="button-submit-participant"
                >
                  {isPending ? (
                    <Loader2 className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                  ) : (
                    <Save className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  )}
                  {isEditing ? t("حفظ التغييرات", "Save Changes") : t("إضافة المشارك", "Add Participant")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/participants")}
                  data-testid="button-cancel"
                >
                  {t("إلغاء", "Cancel")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

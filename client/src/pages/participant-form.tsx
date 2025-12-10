import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowRight, 
  User,
  Phone,
  Save,
  Loader2
} from "lucide-react";
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
import type { Participant } from "@shared/schema";

const participantFormSchema = z.object({
  name: z.string().min(1, "يرجى إدخال الاسم"),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

type ParticipantFormData = z.infer<typeof participantFormSchema>;

export default function ParticipantForm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/participants/:id/edit");
  const isEditing = !!params?.id;
  const { toast } = useToast();

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
    values: participant ? {
      name: participant.name,
      phone: participant.phone || "",
      avatar: participant.avatar || "user",
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      return apiRequest("POST", "/api/participants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المشارك بنجاح",
      });
      navigate("/participants");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المشارك",
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
        title: "تم التحديث",
        description: "تم تحديث المشارك بنجاح",
      });
      navigate("/participants");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المشارك",
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/participants")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "تعديل المشارك" : "مشارك جديد"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "قم بتعديل بيانات المشارك" : "أدخل بيانات المشارك الجديد"}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Selection */}
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الصورة الرمزية</FormLabel>
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
                    <FormLabel>الاسم *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="مثال: أبو محمد" 
                          className="pr-9"
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
                    <FormLabel>رقم الجوال</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="05xxxxxxxx" 
                          className="pr-9"
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
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  {isEditing ? "حفظ التغييرات" : "إضافة المشارك"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/participants")}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
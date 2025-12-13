import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Eye, EyeOff, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { updateProfileSchema, changePasswordSchema, type UpdateProfile, type ChangePassword, type SafeUser } from "@shared/schema";

export default function Account() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: user, isLoading: userLoading } = useQuery<SafeUser>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إعدادات الحساب</h1>
        <p className="text-muted-foreground">إدارة معلومات حسابك الشخصي</p>
      </div>

      <ProfileForm user={user} />
      
      <Separator />
      
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ user }: { user?: SafeUser }) {
  const { toast } = useToast();

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      email: user?.email || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await apiRequest("PATCH", "/api/auth/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث معلومات الحساب بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التحديث",
        description: error.message || "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfile) => {
    updateMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
        </div>
        <CardDescription>تحديث بياناتك الشخصية</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأول</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="محمد"
                        data-testid="input-first-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم العائلة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="العلي"
                        data-testid="input-last-name"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      className="text-start"
                      dir="ltr"
                      data-testid="input-email"
                      {...field}
                    />
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
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+974 XXXX XXXX"
                      className="text-start"
                      dir="ltr"
                      data-testid="input-phone"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const changeMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      const response = await apiRequest("PATCH", "/api/auth/password", data);
      return response.json();
    },
    onSuccess: () => {
      form.reset();
      toast({
        title: "تم التغيير",
        description: "تم تغيير كلمة المرور بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التغيير",
        description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChangePassword) => {
    changeMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">تغيير كلمة المرور</CardTitle>
        </div>
        <CardDescription>تحديث كلمة المرور الخاصة بك</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الحالية</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="text-start pe-10"
                        dir="ltr"
                        data-testid="input-current-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الجديدة</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="text-start pe-10"
                        dir="ltr"
                        data-testid="input-new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="text-start pe-10"
                        dir="ltr"
                        data-testid="input-confirm-new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={changeMutation.isPending}
              data-testid="button-change-password"
            >
              {changeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  جاري التغيير...
                </>
              ) : (
                "تغيير كلمة المرور"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

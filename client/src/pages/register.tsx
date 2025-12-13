import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Flame, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { useLanguage } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { tr } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({
        title: tr("auth.registerSuccess"),
        description: tr("auth.registerSuccessDesc"),
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: tr("auth.registerError"),
        description: error.message || tr("auth.registerErrorDesc"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterUser) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-end">
            <LanguageToggle />
          </div>
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Flame className="h-8 w-8" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{tr("auth.registerTitle")}</CardTitle>
            <CardDescription className="mt-2">
              {tr("auth.registerSubtitle")}
            </CardDescription>
          </div>
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
                      <FormLabel>{tr("auth.firstName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tr("auth.firstNamePlaceholder")}
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
                      <FormLabel>{tr("auth.lastName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tr("auth.lastNamePlaceholder")}
                          data-testid="input-last-name"
                          {...field}
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
                    <FormLabel>{tr("auth.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={tr("auth.emailPlaceholder")}
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
                    <FormLabel>{tr("auth.phoneOptional")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={tr("auth.phonePlaceholder")}
                        className="text-start"
                        dir="ltr"
                        data-testid="input-phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("auth.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={tr("auth.passwordPlaceholder")}
                          className="text-start pe-10"
                          dir="ltr"
                          data-testid="input-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("auth.confirmPassword")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={tr("auth.passwordPlaceholder")}
                          className="text-start pe-10"
                          dir="ltr"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
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
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    {tr("auth.creatingAccount")}
                  </>
                ) : (
                  tr("auth.createAccount")
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {tr("auth.haveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              {tr("auth.login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

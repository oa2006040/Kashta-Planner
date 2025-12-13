import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface AuthStatus {
  authenticated: boolean;
  user: User | null;
  loginUrl?: string;
  logoutUrl?: string;
}

export function useAuth() {
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { data, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    }
  };

  return {
    user: data?.user,
    isLoading,
    isLoggingOut,
    isAuthenticated: data?.authenticated ?? false,
    loginUrl: data?.loginUrl ?? "/login",
    logoutUrl: data?.logoutUrl ?? "/api/auth/logout",
    handleLogout,
  };
}

import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthStatus {
  authenticated: boolean;
  user: User | null;
  loginUrl?: string;
  logoutUrl?: string;
}

export function useAuth() {
  const { data, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  return {
    user: data?.user,
    isLoading,
    isAuthenticated: data?.authenticated ?? false,
    loginUrl: data?.loginUrl ?? "/api/login",
    logoutUrl: data?.logoutUrl ?? "/api/logout",
  };
}

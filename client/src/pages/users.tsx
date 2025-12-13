import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Users,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/constants";
import { useLanguage } from "@/components/language-provider";
import type { SafeUser } from "@shared/schema";

function UserCard({ user }: { user: SafeUser }) {
  const { t, language } = useLanguage();
  
  const getInitials = (firstName: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "?";
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString(language === "ar" ? "ar-QA" : "en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Card className="hover-elevate" data-testid={`card-user-${user.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold truncate">
                {user.firstName} {user.lastName || ""}
              </h3>
              {user.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1" dir="ltr">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </p>
              )}
              {user.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1" dir="ltr">
                  <Phone className="h-3 w-3" />
                  {user.phone}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Calendar className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                {t("انضم", "Joined")} {formatDate(user.createdAt)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users?.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName || ""}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("المستخدمين", "Users")}</h1>
          <p className="text-muted-foreground">{t("قائمة المستخدمين المسجلين في التطبيق", "List of registered users in the app")}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
        <Input
          placeholder={t("ابحث عن مستخدم...", "Search for a user...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={language === "ar" ? "pr-9" : "pl-9"}
          data-testid="input-search-users"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(users?.length || 0, language)}</p>
              <p className="text-sm text-muted-foreground">{t("إجمالي المستخدمين", "Total Users")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredUsers && filteredUsers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? t("لا توجد نتائج", "No results") : t("لا يوجد مستخدمين", "No users")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery 
                ? t("جرب تغيير معايير البحث", "Try changing search criteria") 
                : t("لم يقم أحد بالتسجيل بعد", "No one has registered yet")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

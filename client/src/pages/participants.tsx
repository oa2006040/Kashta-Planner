import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Users,
  Phone,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatNumber } from "@/lib/constants";
import { AvatarIcon, getAvatarColor } from "@/components/avatar-icon";
import type { Participant } from "@shared/schema";

function ParticipantCard({ 
  participant, 
  onDelete 
}: { 
  participant: Participant;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="hover-elevate" data-testid={`card-participant-${participant.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div 
            className="flex h-14 w-14 items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: `${getAvatarColor(participant.name)}20` }}
          >
            <AvatarIcon 
              icon={participant.avatar} 
              className="h-7 w-7" 
              color={getAvatarColor(participant.name)}
            />
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{participant.name}</h3>
                {participant.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {participant.phone}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-menu-${participant.id}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <Link href={`/participants/${participant.id}/edit`}>
                    <DropdownMenuItem>
                      <Edit2 className="h-4 w-4 ml-2" />
                      تعديل
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onDelete(participant.id)}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 ml-1" />
                {formatNumber(participant.tripCount || 0)} طلعة
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ParticipantCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Participants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: participants, isLoading } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/participants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المشارك بنجاح",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المشارك",
        variant: "destructive",
      });
    },
  });

  const filteredParticipants = participants?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المشاركين</h1>
          <p className="text-muted-foreground">إدارة قائمة المشاركين في الطلعات</p>
        </div>
        <Link href="/participants/new">
          <Button data-testid="button-new-participant">
            <Plus className="h-4 w-4 ml-2" />
            مشارك جديد
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث عن مشارك..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-9"
          data-testid="input-search-participants"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(participants?.length || 0)}</p>
              <p className="text-sm text-muted-foreground">إجمالي المشاركين</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ParticipantCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredParticipants && filteredParticipants.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredParticipants.map((participant) => (
            <ParticipantCard 
              key={participant.id} 
              participant={participant}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "لا توجد نتائج" : "لا يوجد مشاركين"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery 
                ? "جرب تغيير معايير البحث" 
                : "أضف المشاركين ليتمكنوا من المشاركة في الطلعات"}
            </p>
            {!searchQuery && (
              <Link href="/participants/new">
                <Button data-testid="button-create-first-participant">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مشارك
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المشارك</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المشارك؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
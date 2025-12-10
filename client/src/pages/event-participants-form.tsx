import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowRight, Users, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AvatarIcon } from "@/components/avatar-icon";
import type { Participant, EventWithDetails } from "@shared/schema";

export default function EventParticipantsForm() {
  const [, params] = useRoute("/events/:id/participants");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params?.id;

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  const { data: event, isLoading: eventLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: participants, isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return apiRequest(
        "POST",
        `/api/events/${eventId}/participants`,
        { participantId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
    },
  });

  const handleSubmit = async () => {
    if (selectedParticipants.size === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار مشارك واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      const promises = Array.from(selectedParticipants).map((participantId) =>
        addParticipantMutation.mutateAsync(participantId)
      );

      await Promise.all(promises);

      toast({
        title: "تم بنجاح",
        description: `تم إضافة ${selectedParticipants.size} مشارك للطلعة`,
      });

      navigate(`/events/${eventId}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المشاركين",
        variant: "destructive",
      });
    }
  };

  const toggleParticipant = (participantId: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const isLoading = eventLoading || participantsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">الطلعة غير موجودة</h3>
            <Link href="/events">
              <Button>العودة للطلعات</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const existingParticipantIds = new Set(
    event.eventParticipants?.map((ep) => ep.participantId) || []
  );
  const availableParticipants = participants?.filter(
    (p) => !existingParticipantIds.has(p.id)
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/events/${eventId}`)}
          data-testid="button-back"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إضافة مشاركين</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      {availableParticipants.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              اختر المشاركين
              <Badge variant="secondary" className="mr-auto">
                {availableParticipants.length} متاح
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableParticipants.map((participant) => {
              const isSelected = selectedParticipants.has(participant.id);

              return (
                <div
                  key={participant.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={participant.id}
                      checked={isSelected}
                      onCheckedChange={() => toggleParticipant(participant.id)}
                      data-testid={`checkbox-participant-${participant.id}`}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <AvatarIcon avatar={participant.avatar} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={participant.id} className="font-medium cursor-pointer">
                        {participant.name}
                      </Label>
                      {participant.phone && (
                        <p className="text-sm text-muted-foreground">{participant.phone}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {participant.tripCount || 0} طلعات
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">لا يوجد مشاركين متاحين</h3>
            <p className="text-sm text-muted-foreground mb-4">
              جميع المشاركين مضافين للطلعة أو لا يوجد مشاركين
            </p>
            <Link href="/participants/new">
              <Button size="sm">
                <Plus className="h-4 w-4 ml-2" />
                إضافة مشارك جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {selectedParticipants.size > 0 && (
        <div className="sticky bottom-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{selectedParticipants.size} مشارك محدد</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={addParticipantMutation.isPending}
                data-testid="button-save-participants"
              >
                {addParticipantMutation.isPending ? "جاري الحفظ..." : "إضافة للطلعة"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

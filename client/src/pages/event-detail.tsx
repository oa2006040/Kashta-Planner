import { useState, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { 
  ArrowRight, 
  Calendar, 
  CalendarPlus,
  MapPin, 
  Users, 
  Package, 
  Edit2,
  Trash2,
  Plus,
  Clock,
  Thermometer,
  Cloud,
  DollarSign,
  Check,
  X,
  XCircle,
  UserPlus,
  CheckCircle2,
  Circle,
  Loader2,
  Receipt,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Equal,
  AlertTriangle,
  ExternalLink,
  Navigation,
  Download,
  Share2,
  Copy,
  Link as LinkIcon,
  Image as ImageIcon,
  Shield,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatHijriDate, formatCurrency, formatNumber } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { AvatarIcon } from "@/components/avatar-icon";
import { useLanguage } from "@/components/language-provider";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { EventWithDetails, Contribution, Participant, Category, EventSettlement, EventRoleRecord, PermissionKey } from "@shared/schema";

// Permission keys for display in role management UI
const PERMISSION_KEYS: PermissionKey[] = [
  'invite_participants',
  'remove_participants', 
  'edit_roles',
  'assign_item',
  'unassign_item',
  'edit_event',
  'delete_event'
];

const PERMISSION_LABELS: Record<PermissionKey, { ar: string; en: string }> = {
  invite_participants: { ar: "دعوة مشاركين", en: "Invite participants" },
  remove_participants: { ar: "إزالة مشاركين", en: "Remove participants" },
  edit_roles: { ar: "إدارة الأدوار", en: "Manage roles" },
  assign_item: { ar: "تعيين المستلزمات", en: "Assign items" },
  unassign_item: { ar: "إلغاء تعيين المستلزمات", en: "Unassign items" },
  edit_event: { ar: "تعديل الطلعة", en: "Edit event" },
  delete_event: { ar: "حذف الطلعة", en: "Delete event" },
};

function getStatusBadge(status: string, t: (ar: string, en: string) => string) {
  switch (status) {
    case 'upcoming':
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: t('قادمة', 'Upcoming') };
    case 'ongoing':
      return { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: t('جارية', 'Ongoing') };
    case 'completed':
      return { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300', label: t('منتهية', 'Completed') };
    case 'cancelled':
      return { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: t('ملغاة', 'Cancelled') };
    default:
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: t('قادمة', 'Upcoming') };
  }
}

type ContributionWithDetails = Contribution & { 
  item: { 
    id: string; 
    categoryId: string; 
    name: string; 
    description: string | null; 
    isCommon: boolean;
    ownerId?: string | null;
    owner?: { id: string; firstName: string | null; lastName: string | null } | null;
  }; 
  participant: Participant | null 
};

interface ContributionItemProps {
  contribution: ContributionWithDetails;
  category?: Category;
  participants: Participant[];
  eventId: string;
  onAssign: (contributionId: string, participantId: string, cost: string, quantity: number) => void;
  onDelete: (contributionId: string) => void;
  onUnassign: (contributionId: string) => void;
  onReceiptUpload: (contributionId: string, receiptUrl: string) => void;
  isAssigning: boolean;
}

function ContributionItem({ 
  contribution, 
  category, 
  participants, 
  eventId,
  onAssign, 
  onDelete,
  onUnassign,
  onReceiptUpload,
  isAssigning 
}: ContributionItemProps) {
  const { t, language } = useLanguage();
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [includeCost, setIncludeCost] = useState(parseFloat(contribution.cost || "0") > 0);
  const [cost, setCost] = useState(contribution.cost || "0");
  const [quantity, setQuantity] = useState(String(contribution.quantity || 1));

  const hasParticipant = !!contribution.participantId;
  const hasCost = parseFloat(contribution.cost || "0") > 0;
  const hasReceipt = !!contribution.receiptUrl;

  const handleReceiptUpload = async (uploadedUrls: string[]) => {
    if (uploadedUrls.length > 0) {
      try {
        const res = await fetch("/api/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadURL: uploadedUrls[0] }),
        });
        if (res.ok) {
          const { objectPath } = await res.json();
          onReceiptUpload(contribution.id, objectPath);
        }
      } catch (error) {
        console.error("Error normalizing receipt path:", error);
      }
    }
  };

  const getUploadParameters = async () => {
    const res = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { uploadURL } = await res.json();
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleAssign = () => {
    if (selectedParticipant) {
      const qty = parseInt(quantity) || 1;
      onAssign(contribution.id, selectedParticipant, includeCost ? cost : "0", qty);
      setShowAssign(false);
      setSelectedParticipant("");
      setIncludeCost(false);
      setCost("0");
      setQuantity("1");
    }
  };

  const handleStartEdit = () => {
    setSelectedParticipant(contribution.participantId || "");
    setCost(contribution.cost || "0");
    setQuantity(String(contribution.quantity || 1));
    setIncludeCost(parseFloat(contribution.cost || "0") > 0);
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (selectedParticipant) {
      const qty = parseInt(quantity) || 1;
      onAssign(contribution.id, selectedParticipant, includeCost ? cost : "0", qty);
      setShowEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEdit(false);
    setSelectedParticipant("");
    setCost("0");
    setQuantity("1");
    setIncludeCost(false);
  };

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-lg ${
      hasParticipant 
        ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800" 
        : "bg-muted/50"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          hasParticipant 
            ? "bg-green-100 dark:bg-green-900/30" 
            : "bg-muted"
        }`}>
          {hasParticipant ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium break-words">
            {contribution.item?.name}
            {contribution.item?.ownerId && contribution.item?.owner && (
              <span className="text-muted-foreground text-xs font-normal mr-2">
                ({contribution.item.owner.firstName}{contribution.item.owner.lastName ? ` ${contribution.item.owner.lastName}` : ''})
              </span>
            )}
          </p>
          {category && (
            <Badge variant="outline" className="text-xs mt-1">
              <CategoryIcon icon={category.icon} color={category.color} className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
              {language === "ar" ? category.nameAr : (category.name || category.nameAr)}
            </Badge>
          )}
          {contribution.participant && (
            <div className="flex items-center gap-2 mt-1">
              <AvatarIcon icon={contribution.participant.avatar} className="h-4 w-4" />
              <span className="text-sm text-muted-foreground break-words">{contribution.participant.name}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
          {(contribution.quantity && contribution.quantity > 1) && parseFloat(contribution.cost || "0") === 0 && (
            <Badge variant="outline" className="text-xs">
              {formatNumber(contribution.quantity, language)}×
            </Badge>
          )}
          {parseFloat(contribution.cost || "0") > 0 && (
            <Badge variant="secondary" className="text-xs">
              {(contribution.quantity && contribution.quantity > 1) ? (
                <span>{formatNumber(contribution.quantity, language)} × {formatCurrency(contribution.cost || 0, language)} = {formatCurrency((contribution.quantity * parseFloat(contribution.cost || "0")), language)}</span>
              ) : (
                formatCurrency(contribution.cost || 0, language)
              )}
            </Badge>
          )}
          {hasCost && hasReceipt && (
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600"
                  data-testid={`button-view-receipt-${contribution.id}`}
                >
                  <Receipt className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("عرض الفاتورة", "View Receipt")}</DialogTitle>
                  <DialogDescription>
                    {contribution.item?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center">
                  <img
                    src={contribution.receiptUrl || ""}
                    alt={t("صورة الفاتورة", "Receipt image")}
                    className="max-h-96 rounded-lg object-contain"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowReceipt(false)}>
                    {t("إغلاق", "Close")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {hasCost && !hasReceipt && (
            <ObjectUploader
              onGetUploadParameters={getUploadParameters}
              onComplete={handleReceiptUpload}
              buttonVariant="ghost"
              buttonSize="icon"
              title={t("رفع الفاتورة", "Upload Receipt")}
            >
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </ObjectUploader>
          )}
          {!hasParticipant && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAssign(!showAssign)}
              data-testid={`button-assign-${contribution.id}`}
            >
              <UserPlus className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
              {t("تعيين", "Assign")}
            </Button>
          )}
          {hasParticipant && !showEdit && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStartEdit}
              className="h-8 w-8 text-muted-foreground"
              data-testid={`button-edit-${contribution.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                data-testid={`button-delete-contribution-${contribution.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {hasParticipant ? t("إلغاء تعيين المستلزم", "Unassign Item") : t("حذف المستلزم", "Delete Item")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {hasParticipant ? (
                    <>
                      {t(`هل تريد إلغاء تعيين "${contribution.item?.name}"؟`, `Unassign "${contribution.item?.name}"?`)}
                      <span className="block mt-2 text-muted-foreground">
                        {t(`سيتم إزالة المسؤول (${contribution.participant?.name}) ونقل المستلزم للقائمة المتبقية.`, `The assignee (${contribution.participant?.name}) will be removed and the item will move to the remaining list.`)}
                      </span>
                    </>
                  ) : (
                    <>{t(`هل تريد حذف "${contribution.item?.name}" من الطلعة نهائياً؟`, `Delete "${contribution.item?.name}" from this event permanently?`)}</>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => hasParticipant ? onUnassign(contribution.id) : onDelete(contribution.id)}
                  className={hasParticipant 
                    ? "bg-orange-600 text-white hover:bg-orange-700" 
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  }
                >
                  {hasParticipant ? t("إلغاء التعيين", "Unassign") : t("حذف", "Delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
      
      {showAssign && !hasParticipant && (
        <div className="flex flex-col gap-3 pt-3 border-t">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
              <SelectTrigger className="flex-1" data-testid={`select-participant-${contribution.id}`}>
                <SelectValue placeholder={t("اختر المشارك", "Select participant")} />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <AvatarIcon icon={p.avatar} className="h-4 w-4" />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleAssign} 
                disabled={!selectedParticipant || isAssigning}
                data-testid={`button-confirm-assign-${contribution.id}`}
              >
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowAssign(false);
                  setSelectedParticipant("");
                  setIncludeCost(false);
                  setCost("0");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-2 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t("الكمية", "Qty")}</Label>
              <Input
                type="number"
                placeholder="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-16"
                data-testid={`input-quantity-${contribution.id}`}
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id={`cost-toggle-${contribution.id}`}
                checked={includeCost}
                onCheckedChange={(checked) => setIncludeCost(!!checked)}
                data-testid={`checkbox-include-cost-${contribution.id}`}
              />
              <Label htmlFor={`cost-toggle-${contribution.id}`} className="text-sm cursor-pointer">
                {t("إضافة تكلفة", "Add cost")}
              </Label>
            </div>
            {includeCost && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("سعر الوحدة", "Unit price")}</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-24"
                    data-testid={`input-cost-${contribution.id}`}
                  />
                  <span className="text-sm text-muted-foreground">{t("ر.ق", "QAR")}</span>
                </div>
                {(parseInt(quantity) || 1) > 1 && parseFloat(cost) > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>=</span>
                    <span className="font-medium">{((parseInt(quantity) || 1) * parseFloat(cost || "0")).toFixed(2)}</span>
                    <span>{t("ر.ق", "QAR")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showEdit && hasParticipant && (
        <div className="flex flex-col gap-3 pt-3 border-t border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <Edit2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("تعديل المستلزم", "Edit Item")}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
              <SelectTrigger className="flex-1" data-testid={`select-edit-participant-${contribution.id}`}>
                <SelectValue placeholder={t("اختر المشارك", "Select participant")} />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <AvatarIcon icon={p.avatar} className="h-4 w-4" />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSaveEdit} 
                disabled={!selectedParticipant || isAssigning}
                data-testid={`button-save-edit-${contribution.id}`}
              >
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-2 rounded-md bg-green-50/50 dark:bg-green-900/5">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t("الكمية", "Qty")}</Label>
              <Input
                type="number"
                placeholder="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-16"
                data-testid={`input-edit-quantity-${contribution.id}`}
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id={`edit-cost-toggle-${contribution.id}`}
                checked={includeCost}
                onCheckedChange={(checked) => setIncludeCost(!!checked)}
                data-testid={`checkbox-edit-include-cost-${contribution.id}`}
              />
              <Label htmlFor={`edit-cost-toggle-${contribution.id}`} className="text-sm cursor-pointer">
                {t("إضافة تكلفة", "Add cost")}
              </Label>
            </div>
            {includeCost && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("سعر الوحدة", "Unit price")}</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-24"
                    data-testid={`input-edit-cost-${contribution.id}`}
                  />
                  <span className="text-sm text-muted-foreground">{t("ر.ق", "QAR")}</span>
                </div>
                {(parseInt(quantity) || 1) > 1 && parseFloat(cost) > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>=</span>
                    <span className="font-medium">{((parseInt(quantity) || 1) * parseFloat(cost || "0")).toFixed(2)}</span>
                    <span>{t("ر.ق", "QAR")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", params?.id],
    enabled: !!params?.id,
    refetchInterval: 5000,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: participants } = useQuery<Participant[]>({
    queryKey: ["/api/participants"],
  });

  const { data: settlement } = useQuery<EventSettlement>({
    queryKey: ["/api/events", params?.id, "settlement"],
    enabled: !!params?.id,
    refetchInterval: 5000,
  });

  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedParticipantForCalendar, setSelectedParticipantForCalendar] = useState<string>("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [debtShareDialogOpen, setDebtShareDialogOpen] = useState(false);
  const [selectedCreditorForShare, setSelectedCreditorForShare] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const debtCardRef = useRef<HTMLDivElement>(null);
  const [roleManagementOpen, setRoleManagementOpen] = useState(false);

  // Fetch event roles
  type EventRoleWithPermissions = EventRoleRecord & { permissions: string[] };
  const { data: eventRoles, isLoading: rolesLoading } = useQuery<EventRoleWithPermissions[]>({
    queryKey: ["/api/events", params?.id, "roles"],
    enabled: !!params?.id && roleManagementOpen,
  });

  // Role CRUD state
  const [editingRole, setEditingRole] = useState<EventRoleWithPermissions | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleNameAr, setNewRoleNameAr] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<PermissionKey[]>([]);
  const [showCreateRole, setShowCreateRole] = useState(false);

  // Assign role to participant mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ epId, roleId }: { epId: string; roleId: string }) => {
      return apiRequest("POST", `/api/event-participants/${epId}/role`, { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: t("تم التحديث", "Updated"),
        description: t("تم تعيين الدور بنجاح", "Role assigned successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تعيين الدور", "Error assigning role"),
        variant: "destructive",
      });
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; nameAr: string; description: string; permissions: PermissionKey[] }) => {
      return apiRequest("POST", `/api/events/${params?.id}/roles`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id, "roles"] });
      setShowCreateRole(false);
      setNewRoleName("");
      setNewRoleNameAr("");
      setNewRoleDescription("");
      setNewRolePermissions([]);
      toast({
        title: t("تم الإنشاء", "Created"),
        description: t("تم إنشاء الدور بنجاح", "Role created successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إنشاء الدور", "Error creating role"),
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: { name?: string; nameAr?: string; description?: string; permissions?: PermissionKey[] } }) => {
      return apiRequest("PATCH", `/api/roles/${roleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id, "roles"] });
      setEditingRole(null);
      toast({
        title: t("تم التحديث", "Updated"),
        description: t("تم تحديث الدور بنجاح", "Role updated successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تحديث الدور", "Error updating role"),
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest("DELETE", `/api/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id, "roles"] });
      toast({
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف الدور بنجاح", "Role deleted successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء حذف الدور", "Error deleting role"),
        variant: "destructive",
      });
    },
  });

  const handleShareDebtCard = async (action: 'share' | 'download') => {
    if (!debtCardRef.current || !event) return;

    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(debtCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${event.title}-debts.png`, { type: 'image/png' });

      if (action === 'share' && navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("تذكير بالديون", "Debt Reminder"),
          text: t(`تذكير بالديون من طلعة ${event.title}`, `Debt reminder from ${event.title} trip`),
        });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${event.title}-debts.png`;
        link.click();
        toast({
          title: t("تم التحميل", "Downloaded"),
          description: t("تم تحميل صورة الديون بنجاح", "Debt image downloaded successfully"),
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إنشاء الصورة", "Error generating image"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getCreditorDebts = (creditorId: string) => {
    if (!settlement?.transactions) return [];
    return settlement.transactions.filter(tx => tx.creditorId === creditorId && !tx.isSettled);
  };

  const getCreditorTotalOwed = (creditorId: string) => {
    const debts = getCreditorDebts(creditorId);
    return debts.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  };

  const generateICSFile = () => {
    if (!event || !selectedParticipantForCalendar) return;

    const eventParticipantsList = event.eventParticipants?.map(ep => ep.participant) || [];
    const selectedParticipant = eventParticipantsList.find(p => p.id === selectedParticipantForCalendar);
    if (!selectedParticipant) return;

    const eventDate = new Date(event.date);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const participantContributions = event.contributions?.filter(c => c.participantId === selectedParticipantForCalendar) || [];
    const participantItems = participantContributions.map(c => {
      const qty = c.quantity || 1;
      const unitCost = parseFloat(c.cost || "0");
      const totalCost = unitCost * qty;
      const qtyStr = formatNumber(qty, language);
      const unitCostStr = formatCurrency(unitCost, language);
      const totalCostStr = formatCurrency(totalCost, language);
      const costStr = totalCost > 0 ? ` (${qty > 1 ? `${qtyStr} × ${unitCostStr} = ` : ""}${totalCostStr})` : "";
      return `- ${c.item?.name || t("غرض", "Item")}${costStr}`;
    }).join("\\n");

    const participantDebts: string[] = [];
    if (settlement?.transactions) {
      settlement.transactions.forEach(tx => {
        if (tx.debtorId === selectedParticipantForCalendar && !tx.isSettled) {
          participantDebts.push(`${t("تدفع", "Pay")} ${tx.creditor?.name}: ${formatCurrency(tx.amount, language)}`);
        }
        if (tx.creditorId === selectedParticipantForCalendar && !tx.isSettled) {
          participantDebts.push(`${t("تستلم من", "Receive from")} ${tx.debtor?.name}: ${formatCurrency(tx.amount, language)}`);
        }
      });
    }

    const locationText = event.location || "";
    const mapsUrl = event.latitude && event.longitude 
      ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
      : "";
    
    const weatherInfo = event.weather 
      ? `${t("الطقس", "Weather")}: ${event.weather}${event.temperature ? ` (${event.temperature}°)` : ""}`
      : "";

    let description = `${t("طلعة", "Event")}: ${event.title}\\n`;
    description += `${t("المشارك", "Participant")}: ${selectedParticipant.name}\\n\\n`;
    
    if (event.description) {
      description += `${event.description}\\n\\n`;
    }
    
    if (weatherInfo) {
      description += `${weatherInfo}\\n\\n`;
    }
    
    if (participantItems) {
      description += `${t("المستلزمات المطلوبة منك", "Your Required Items")}:\\n${participantItems}\\n\\n`;
    }
    
    if (participantDebts.length > 0) {
      description += `${t("التسويات المالية", "Financial Settlements")}:\\n${participantDebts.join("\\n")}\\n\\n`;
    }
    
    if (mapsUrl) {
      description += `${t("رابط الموقع", "Location Link")}: ${mapsUrl}`;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kashta App//Trip Planning//AR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@kashta.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(eventDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${event.title} - ${selectedParticipant.name}`,
      `DESCRIPTION:${description}`,
      locationText ? `LOCATION:${locationText}` : '',
      mapsUrl ? `URL:${mapsUrl}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title}-${selectedParticipant.name}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCalendarDialogOpen(false);
    toast({
      title: t("تم التحميل", "Downloaded"),
      description: t("تم تحميل ملف التقويم بنجاح", "Calendar file downloaded successfully"),
    });
  };

  const toggleSettlementMutation = useMutation({
    mutationFn: async ({ debtorId, creditorId }: { debtorId: string; creditorId: string }) => {
      return apiRequest("PATCH", `/api/events/${params?.id}/settlements/${debtorId}/${creditorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id, "settlement"] });
      toast({
        title: t("تم التحديث", "Updated"),
        description: t("تم تحديث حالة الدفع", "Payment status updated"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تحديث حالة الدفع", "Error updating payment status"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/${params?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف الطلعة بنجاح", "Event deleted successfully"),
      });
      navigate("/events");
    },
    onError: (error: Error) => {
      let errorMessage = t("حدث خطأ أثناء حذف الطلعة", "Error deleting event");
      if (error.message.includes("400")) {
        errorMessage = error.message.includes("تسويات") || error.message.includes("ديون")
          ? t("لا يمكن حذف الطلعة لأنها تحتوي على تسويات وديون", "Cannot delete event with settlements and debts")
          : t("لا يمكن حذف الطلعة لأنها تحتوي على مساهمات بتكاليف", "Cannot delete event with cost contributions");
      }
      toast({
        title: t("خطأ", "Error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/events/${params?.id}`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الإلغاء", "Cancelled"),
        description: t("تم إلغاء الطلعة بنجاح", "Event cancelled successfully"),
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("400") || error.message.includes("تسويات")
        ? t("لا يمكن إلغاء الطلعة لأنها تحتوي على تسويات وديون", "Cannot cancel event with settlements and debts")
        : t("حدث خطأ أثناء إلغاء الطلعة", "Error cancelling event");
      toast({
        title: t("خطأ", "Error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return apiRequest("DELETE", `/api/events/${params?.id}/participants/${participantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: t("تم الحذف", "Deleted"),
        description: t("تم إزالة المشارك ومستلزماته من الطلعة", "Participant and their items removed from event"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إزالة المشارك", "Error removing participant"),
        variant: "destructive",
      });
    },
  });

  const deleteContributionMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      return apiRequest("DELETE", `/api/contributions/${contributionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف المستلزم من الطلعة", "Item removed from event"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء حذف المستلزم", "Error removing item"),
        variant: "destructive",
      });
    },
  });

  const unassignContributionMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      return apiRequest("POST", `/api/contributions/${contributionId}/unassign`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("تم إلغاء التعيين", "Unassigned"),
        description: t("تم نقل المستلزم إلى قائمة المتبقية", "Item moved to remaining list"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إلغاء التعيين", "Error unassigning item"),
        variant: "destructive",
      });
    },
  });

  const assignParticipantMutation = useMutation({
    mutationFn: async ({ contributionId, participantId, cost, quantity }: { 
      contributionId: string; 
      participantId: string; 
      cost: string;
      quantity: number;
    }) => {
      return apiRequest("PATCH", `/api/contributions/${contributionId}`, {
        participantId,
        cost: cost || "0",
        quantity: quantity || 1,
        status: "confirmed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      toast({
        title: t("تم التعيين", "Assigned"),
        description: t("تم تعيين المشارك للمستلزم بنجاح", "Participant assigned to item successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تعيين المشارك", "Error assigning participant"),
        variant: "destructive",
      });
    },
  });

  const handleAssign = (contributionId: string, participantId: string, cost: string, quantity: number) => {
    assignParticipantMutation.mutate({ contributionId, participantId, cost, quantity });
  };

  const receiptUploadMutation = useMutation({
    mutationFn: async ({ contributionId, receiptUrl }: { contributionId: string; receiptUrl: string }) => {
      return apiRequest("PATCH", `/api/contributions/${contributionId}`, { receiptUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: t("تم الرفع", "Uploaded"),
        description: t("تم رفع الفاتورة بنجاح", "Receipt uploaded successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء رفع الفاتورة", "Error uploading receipt"),
        variant: "destructive",
      });
    },
  });

  const handleReceiptUpload = (contributionId: string, receiptUrl: string) => {
    receiptUploadMutation.mutate({ contributionId, receiptUrl });
  };

  const enableShareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/events/${params?.id}/share`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: t("تم تفعيل المشاركة", "Sharing Enabled"),
        description: t("يمكنك الآن مشاركة الرابط مع الآخرين", "You can now share the link with others"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء تفعيل المشاركة", "Error enabling sharing"),
        variant: "destructive",
      });
    },
  });

  const disableShareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/${params?.id}/share`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", params?.id] });
      toast({
        title: t("تم إيقاف المشاركة", "Sharing Disabled"),
        description: t("لم يعد بإمكان الآخرين الوصول للطلعة عبر الرابط", "Others can no longer access the event via link"),
      });
    },
    onError: () => {
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إيقاف المشاركة", "Error disabling sharing"),
        variant: "destructive",
      });
    },
  });

  const shareUrl = event?.shareToken ? `${window.location.origin}/share/${event.shareToken}` : "";

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: t("تم النسخ", "Copied"),
        description: t("تم نسخ الرابط للحافظة", "Link copied to clipboard"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("الطلعة غير موجودة", "Event Not Found")}</h3>
            <p className="text-muted-foreground mb-4">{t("لم يتم العثور على هذه الطلعة", "This event could not be found")}</p>
            <Link href="/events">
              <Button>{t("العودة للطلعات", "Back to Events")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(event.status || 'upcoming', t);
  const eventDate = new Date(event.date);
  const totalBudget = event.contributions?.reduce((sum, c) => sum + (parseFloat(c.cost || "0") * (c.quantity || 1)), 0) || 0;
  const participantCount = event.eventParticipants?.length || 0;
  const itemCount = event.contributions?.length || 0;

  // Split contributions into fulfilled (has participant) and unfulfilled (no participant)
  const fulfilledContributions = event.contributions?.filter(c => c.participantId) || [];
  const unfulfilledContributions = event.contributions?.filter(c => !c.participantId) || [];
  
  const fulfilledCount = fulfilledContributions.length;
  const unfulfilledCount = unfulfilledContributions.length;

  // Group fulfilled contributions by category for budget view
  const contributionsByCategory = event.contributions?.reduce((acc, contribution) => {
    const categoryId = contribution.item?.categoryId || "other";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(contribution);
    return acc;
  }, {} as Record<string, typeof event.contributions>) || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/events")}
          data-testid="button-back"
        >
          <BackArrow className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-bold break-words">{event.title}</h1>
            <Badge variant="secondary" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
            {event.latitude && event.longitude && (
              <a
                href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:text-primary/80"
                data-testid="link-header-map"
              >
                <Navigation className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/events/${event.id}/edit`}>
            <Button variant="outline" size="icon" data-testid="button-edit-event">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          {event.status === 'upcoming' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-cancel-event">
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("إلغاء الطلعة", "Cancel Event")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("هل أنت متأكد من إلغاء هذه الطلعة؟ سيتم تغيير حالتها إلى \"ملغاة\".", "Are you sure you want to cancel this event? Its status will be changed to \"Cancelled\".")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>{t("تراجع", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelEventMutation.mutate()}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {t("إلغاء الطلعة", "Cancel Event")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-delete-event">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("حذف الطلعة", "Delete Event")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("هل أنت متأكد من حذف هذه الطلعة؟ لا يمكن التراجع عن هذا الإجراء.", "Are you sure you want to delete this event? This action cannot be undone.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                >
                  {t("حذف", "Delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-add-to-calendar">
                <CalendarPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("إضافة للتقويم", "Add to Calendar")}</DialogTitle>
                <DialogDescription>
                  {t("اختر المشارك لتحميل ملف التقويم بمستلزماته وديونه", "Select participant to download calendar file with their items and debts")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("اختر المشارك", "Select Participant")}</Label>
                  <Select value={selectedParticipantForCalendar} onValueChange={setSelectedParticipantForCalendar}>
                    <SelectTrigger data-testid="select-calendar-participant">
                      <SelectValue placeholder={t("اختر مشارك...", "Select participant...")} />
                    </SelectTrigger>
                    <SelectContent>
                      {event.eventParticipants?.map((ep) => (
                        <SelectItem key={ep.participant.id} value={ep.participant.id}>
                          <div className="flex items-center gap-2">
                            <AvatarIcon icon={ep.participant.avatar} className="h-5 w-5" />
                            <span>{ep.participant.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedParticipantForCalendar && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
                    <p className="font-medium">{t("سيتضمن ملف التقويم:", "Calendar file will include:")}</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>{t("تاريخ ومكان الطلعة", "Event date and location")}</li>
                      <li>{t("رابط الموقع على الخريطة", "Map location link")}</li>
                      <li>{t("حالة الطقس", "Weather information")}</li>
                      <li>{t("المستلزمات المطلوبة من المشارك", "Participant's required items")}</li>
                      <li>{t("الديون والتسويات المالية", "Debts and financial settlements")}</li>
                    </ul>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCalendarDialogOpen(false)}>
                  {t("إلغاء", "Cancel")}
                </Button>
                <Button 
                  onClick={generateICSFile} 
                  disabled={!selectedParticipantForCalendar}
                  data-testid="button-download-calendar"
                >
                  <Download className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("تحميل", "Download")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant={event.isShareEnabled ? "default" : "outline"} 
                size="icon" 
                data-testid="button-share-event"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("مشاركة الطلعة", "Share Event")}</DialogTitle>
                <DialogDescription>
                  {t("شارك الرابط مع الآخرين لتمكينهم من عرض وتعديل الطلعة", "Share the link with others to allow them to view and edit the event")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {event.isShareEnabled && event.shareToken ? (
                  <>
                    <div className="space-y-2">
                      <Label>{t("رابط المشاركة", "Share Link")}</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={shareUrl} 
                          readOnly 
                          className="flex-1 font-mono text-sm"
                          dir="ltr"
                          data-testid="input-share-link"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={copyShareLink}
                          data-testid="button-copy-share-link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <LinkIcon className="h-4 w-4" />
                        <span className="font-medium">{t("المشاركة مفعلة", "Sharing is enabled")}</span>
                      </div>
                      <p className="mt-1 text-green-600 dark:text-green-400 text-xs">
                        {t("يمكن لأي شخص لديه الرابط عرض وتعديل الطلعة", "Anyone with the link can view and edit this event")}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <Share2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">{t("المشاركة غير مفعلة", "Sharing is disabled")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("فعّل المشاركة لإنشاء رابط يمكن مشاركته", "Enable sharing to create a shareable link")}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                  {t("إغلاق", "Close")}
                </Button>
                {event.isShareEnabled ? (
                  <Button 
                    variant="destructive"
                    onClick={() => disableShareMutation.mutate()}
                    disabled={disableShareMutation.isPending}
                    data-testid="button-disable-sharing"
                  >
                    {disableShareMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("إيقاف المشاركة", "Disable Sharing")}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => enableShareMutation.mutate()}
                    disabled={enableShareMutation.isPending}
                    data-testid="button-enable-sharing"
                  >
                    {enableShareMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("تفعيل المشاركة", "Enable Sharing")}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden">
        <div className="h-40 bg-gradient-to-l from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          <div className="relative z-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card/80 backdrop-blur mx-auto mb-2">
              <Calendar className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          {event.description && (
            <p className="text-muted-foreground">{event.description}</p>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDate(eventDate, language)}</span>
            </div>
            {event.location && (
              event.latitude && event.longitude ? (
                <a
                  href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                  data-testid="link-open-map"
                >
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                  <Navigation className="h-4 w-4" />
                </a>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )
            )}
            {event.latitude && event.longitude && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-xs" dir="ltr">
                  ({parseFloat(event.latitude).toFixed(6)}°, {parseFloat(event.longitude).toFixed(6)}°)
                </span>
              </div>
            )}
            {event.weather && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cloud className="h-4 w-4" />
                <span>{event.weather}</span>
              </div>
            )}
            {event.temperature && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Thermometer className="h-4 w-4" />
                <span>{event.temperature}°</span>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {t("التاريخ الهجري", "Hijri Date")}: {formatHijriDate(eventDate, language)}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(participantCount, language)}</p>
              <p className="text-sm text-muted-foreground">{t("مشارك", "Participants")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(fulfilledCount, language)}</p>
              <p className="text-sm text-muted-foreground">{t("مكتمل", "Fulfilled")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Circle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(unfulfilledCount, language)}</p>
              <p className="text-sm text-muted-foreground">{t("متبقي", "Remaining")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget, language)}</p>
              <p className="text-sm text-muted-foreground">{t("الميزانية", "Budget")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <div className="overflow-x-auto -mx-6 px-6">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="items" data-testid="tab-items" className="text-xs sm:text-sm">
              <Package className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("المستلزمات", "Items")}</span>
              <span className="sm:hidden">{t("مستلزمات", "Items")}</span>
            </TabsTrigger>
            <TabsTrigger value="participants" data-testid="tab-participants" className="text-xs sm:text-sm">
              <Users className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("المشاركين", "Participants")}</span>
              <span className="sm:hidden">{t("مشاركين", "People")}</span>
            </TabsTrigger>
            <TabsTrigger value="budget" data-testid="tab-budget" className="text-xs sm:text-sm">
              <DollarSign className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("الميزانية", "Budget")}</span>
              <span className="sm:hidden">{t("ميزانية", "Cost")}</span>
            </TabsTrigger>
            <TabsTrigger value="settlement" data-testid="tab-settlement" className="text-xs sm:text-sm">
              <Receipt className={`h-4 w-4 ${language === "ar" ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">{t("التسوية", "Settlement")}</span>
              <span className="sm:hidden">{t("تسوية", "Settle")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">{t("المستلزمات المطلوبة", "Required Items")}</h3>
            <Link href={`/events/${event.id}/items`}>
              <Button size="sm" data-testid="button-add-items">
                <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                {t("إضافة مستلزمات", "Add Items")}
              </Button>
            </Link>
          </div>

          {/* Fulfilled Contributions Section (TOP) */}
          {fulfilledContributions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-700 dark:text-green-400">
                  {t("المستلزمات المكتملة", "Fulfilled Items")} ({formatNumber(fulfilledCount, language)})
                </h4>
              </div>
              <div className="space-y-2">
                {fulfilledContributions.map((contribution) => {
                  const category = categories?.find(c => c.id === contribution.item?.categoryId);
                  return (
                    <ContributionItem
                      key={contribution.id}
                      contribution={contribution as ContributionWithDetails}
                      category={category}
                      participants={participants || []}
                      eventId={params?.id || ""}
                      onAssign={handleAssign}
                      onDelete={(id) => deleteContributionMutation.mutate(id)}
                      onUnassign={(id) => unassignContributionMutation.mutate(id)}
                      onReceiptUpload={handleReceiptUpload}
                      isAssigning={assignParticipantMutation.isPending}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Unfulfilled Contributions Section (BOTTOM) */}
          {unfulfilledContributions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Circle className="h-5 w-5 text-orange-600" />
                <h4 className="font-medium text-orange-700 dark:text-orange-400">
                  {t("المستلزمات المتبقية", "Remaining Items")} ({formatNumber(unfulfilledCount, language)})
                </h4>
                <span className="text-sm text-muted-foreground">- {t("قم بتعيين مشارك لكل مستلزم", "Assign a participant to each item")}</span>
              </div>
              <div className="space-y-2">
                {unfulfilledContributions.map((contribution) => {
                  const category = categories?.find(c => c.id === contribution.item?.categoryId);
                  return (
                    <ContributionItem
                      key={contribution.id}
                      contribution={contribution as ContributionWithDetails}
                      category={category}
                      participants={participants || []}
                      eventId={params?.id || ""}
                      onAssign={handleAssign}
                      onDelete={(id) => deleteContributionMutation.mutate(id)}
                      onUnassign={(id) => unassignContributionMutation.mutate(id)}
                      onReceiptUpload={handleReceiptUpload}
                      isAssigning={assignParticipantMutation.isPending}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {event.contributions?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{t("لا توجد مستلزمات", "No Items")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("أضف المستلزمات المطلوبة للطلعة", "Add the required items for this event")}
                </p>
                <Link href={`/events/${event.id}/items`}>
                  <Button size="sm">
                    <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t("إضافة مستلزمات", "Add Items")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">{t("المشاركين في الطلعة", "Event Participants")}</h3>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setRoleManagementOpen(true)}
                data-testid="button-manage-roles"
              >
                <Shield className="h-4 w-4" />
              </Button>
              <Link href={`/events/${event.id}/participants`}>
                <Button size="sm" data-testid="button-add-participants">
                  <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("إضافة مشاركين", "Add Participants")}
                </Button>
              </Link>
            </div>
          </div>

          {event.eventParticipants && event.eventParticipants.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {event.eventParticipants.map((ep) => {
                const participantContributions = event.contributions?.filter(
                  (c) => c.participantId === ep.participantId
                ) || [];
                const participantTotal = participantContributions.reduce(
                  (sum, c) => sum + (parseFloat(c.cost || "0") * (c.quantity || 1)), 0
                );
                
                const getRoleBadge = () => {
                  if (ep.role === 'organizer') {
                    return (
                      <Badge variant="default" className="text-xs" data-testid={`badge-role-${ep.id}`}>
                        {t("المنظم", "Organizer")}
                      </Badge>
                    );
                  }
                  if (ep.role === 'co_organizer') {
                    return (
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-role-${ep.id}`}>
                        {t("مشرف", "Co-organizer")}
                      </Badge>
                    );
                  }
                  return null;
                };

                return (
                  <Card key={ep.id} className="hover-elevate">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <AvatarIcon icon={ep.participant?.avatar} className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium break-words">{ep.participant?.name}</p>
                          {getRoleBadge()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{formatNumber(participantContributions.length, language)} {t("مستلزم", "items")}</span>
                          {participantTotal > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatCurrency(participantTotal, language)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-muted-foreground"
                            data-testid={`button-remove-participant-${ep.participantId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("إزالة المشارك", "Remove Participant")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(`هل أنت متأكد من إزالة ${ep.participant?.name} من الطلعة؟`, `Are you sure you want to remove ${ep.participant?.name} from this event?`)}
                              {participantContributions.length > 0 && (
                                <span className="block mt-2 text-destructive">
                                  {t(`سيتم حذف ${participantContributions.length} مستلزم مرتبط به أيضاً.`, `${participantContributions.length} linked items will also be deleted.`)}
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeParticipantMutation.mutate(ep.participantId)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("إزالة", "Remove")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{t("لا يوجد مشاركين", "No Participants")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("أضف المشاركين في هذه الطلعة", "Add participants to this event")}
                </p>
                <Link href={`/events/${event.id}/participants`}>
                  <Button size="sm">
                    <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t("إضافة مشاركين", "Add Participants")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">{t("ملخص الميزانية", "Budget Summary")}</h3>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {formatCurrency(totalBudget, language)}
            </Badge>
          </div>

          {Object.keys(contributionsByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(contributionsByCategory).map(([categoryId, contributions]) => {
                const category = categories?.find((c) => c.id === categoryId);
                const categoryTotal = contributions?.reduce((sum, c) => sum + (parseFloat(c.cost || "0") * (c.quantity || 1)), 0) || 0;
                
                return (
                  <Card key={categoryId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {category && (
                            <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
                          )}
                          {language === "ar" ? (category?.nameAr || t("أخرى", "Other")) : (category?.name || category?.nameAr || t("أخرى", "Other"))}
                          <Badge variant="secondary">
                            {contributions?.length || 0}
                          </Badge>
                        </div>
                        <span className="font-bold">{formatCurrency(categoryTotal, language)}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {contributions?.map((contribution) => (
                        <div 
                          key={contribution.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 flex-1 flex-wrap">
                            <span className="font-medium break-words">{contribution.item?.name}</span>
                            {contribution.participant && (
                              <span className="text-xs text-muted-foreground break-words">
                                - {contribution.participant.name}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(contribution.cost || 0, language)}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{t("لا توجد تكاليف", "No Costs")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("أضف مستلزمات وحدد تكلفتها لعرض الميزانية", "Add items with costs to view the budget")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="font-semibold">{t("تسوية المصاريف", "Expense Settlement")}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {settlement && (
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {t("الحصة", "Share")}: {formatCurrency(settlement.fairShare, language)}
                </Badge>
              )}
              {settlement && settlement.unassignedCosts > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  <AlertTriangle className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                  {formatCurrency(settlement.unassignedCosts, language)} {t("غير معين", "unassigned")}
                </Badge>
              )}
            </div>
          </div>

          {settlement && settlement.balances.length > 0 ? (
            <div className="space-y-6">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {settlement.balances.map((balance) => (
                  <div 
                    key={balance.participant.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      balance.role === 'creditor' 
                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
                        : balance.role === 'debtor'
                        ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
                        : 'bg-muted/50'
                    }`}
                  >
                    <AvatarIcon icon={balance.participant.avatar} className="h-8 w-8" />
                    <div className="flex-1">
                      <p className="font-medium break-words">{balance.participant.name}</p>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="text-muted-foreground">{t("دفع", "Paid")}: {formatCurrency(balance.totalPaid, language)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {balance.role === 'creditor' && (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              +{formatCurrency(balance.balance, language)}
                            </span>
                          </>
                        )}
                        {balance.role === 'debtor' && (
                          <>
                            <TrendingDown className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-600">
                              {formatCurrency(balance.balance, language)}
                            </span>
                          </>
                        )}
                        {balance.role === 'settled' && (
                          <>
                            <Equal className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{t("متوازن", "Balanced")}</span>
                          </>
                        )}
                      </div>
                      {balance.role === 'creditor' && getCreditorDebts(balance.participant.id).length > 0 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelectedCreditorForShare(balance.participant.id);
                            setDebtShareDialogOpen(true);
                          }}
                          data-testid={`button-share-debts-${balance.participant.id}`}
                        >
                          <ImageIcon className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {settlement.transactions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("التحويلات المطلوبة", "Required Transfers")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {settlement.transactions.map((tx) => (
                      <div 
                        key={`${tx.debtorId}-${tx.creditorId}`}
                        className={`flex flex-col gap-3 p-3 rounded-lg ${
                          tx.isSettled 
                            ? 'bg-green-50 dark:bg-green-900/10' 
                            : 'bg-muted/50'
                        }`}
                        data-testid={`settlement-tx-${tx.debtorId}-${tx.creditorId}`}
                      >
                        {language === "ar" ? (
                          <div className="flex items-center justify-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <AvatarIcon icon={tx.creditor?.avatar} className="h-8 w-8 shrink-0" />
                              <span className="font-medium">{tx.creditor?.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-primary">
                              <ArrowLeft className="h-5 w-5" />
                              <span className="text-xs text-muted-foreground">{t("يدفع", "pays")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AvatarIcon icon={tx.debtor?.avatar} className="h-8 w-8 shrink-0" />
                              <span className="font-medium">{tx.debtor?.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <AvatarIcon icon={tx.debtor?.avatar} className="h-8 w-8 shrink-0" />
                              <span className="font-medium">{tx.debtor?.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-primary">
                              <span className="text-xs text-muted-foreground">{t("يدفع", "pays")}</span>
                              <ArrowRight className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <AvatarIcon icon={tx.creditor?.avatar} className="h-8 w-8 shrink-0" />
                              <span className="font-medium">{tx.creditor?.name}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 justify-center">
                          <Badge 
                            variant={tx.isSettled ? "default" : "secondary"}
                            className={tx.isSettled ? "bg-green-600" : ""}
                          >
                            {formatCurrency(tx.amount, language)}
                          </Badge>
                          <Button
                            size="sm"
                            variant={tx.isSettled ? "outline" : "default"}
                            onClick={() => toggleSettlementMutation.mutate({
                              debtorId: tx.debtorId,
                              creditorId: tx.creditorId,
                            })}
                            disabled={toggleSettlementMutation.isPending}
                            data-testid={`button-toggle-tx-${tx.debtorId}-${tx.creditorId}`}
                          >
                            {toggleSettlementMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : tx.isSettled ? (
                              <>
                                <X className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                                {t("إلغاء", "Undo")}
                              </>
                            ) : (
                              <>
                                <Check className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                                {t("تم الدفع", "Paid")}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{t("لا توجد تسويات", "No Settlements")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("أضف مشاركين ومستلزمات بتكاليف لعرض تسوية المصاريف", "Add participants and items with costs to view settlements")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Debt Share Dialog */}
      <Dialog open={debtShareDialogOpen} onOpenChange={setDebtShareDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("مشاركة تذكير الديون", "Share Debt Reminder")}</DialogTitle>
            <DialogDescription>
              {t("أنشئ صورة بقائمة الديون لمشاركتها", "Create an image with debt list to share")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCreditorForShare && settlement && (
            <>
              {/* Shareable Card */}
              <div 
                ref={debtCardRef}
                className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200"
                style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
                dir="rtl"
              >
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-amber-900 mb-1">
                    {t("تذكير بالديون", "Debt Reminder")}
                  </h2>
                  <p className="text-sm text-amber-700">{event?.title}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {event?.date && formatDate(event.date, language)}
                  </p>
                </div>

                <div className="bg-white/70 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                      {(() => {
                        const creditor = settlement.balances.find(b => b.participant.id === selectedCreditorForShare);
                        return creditor?.participant.avatar ? (
                          <AvatarIcon icon={creditor.participant.avatar} className="h-8 w-8" />
                        ) : "👤";
                      })()}
                    </div>
                    <div>
                      <p className="font-bold text-amber-900">
                        {settlement.balances.find(b => b.participant.id === selectedCreditorForShare)?.participant.name}
                      </p>
                      <p className="text-xs text-amber-700">{t("يستحق من الآخرين", "is owed by others")}</p>
                    </div>
                  </div>
                  
                  <div className="text-center text-2xl font-bold text-green-700 mb-2">
                    {formatCurrency(getCreditorTotalOwed(selectedCreditorForShare), language)}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800 mb-2">{t("التفاصيل:", "Details:")}</p>
                  {getCreditorDebts(selectedCreditorForShare).map((tx) => (
                    <div 
                      key={`${tx.debtorId}-${tx.creditorId}`}
                      className="flex items-center justify-between bg-white/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <AvatarIcon icon={tx.debtor?.avatar} className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-amber-900">{tx.debtor?.name}</span>
                      </div>
                      <span className="font-bold text-orange-700">
                        {formatCurrency(tx.amount, language)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200 text-center">
                  <p className="text-xs text-amber-600">
                    {t("كشتة - تطبيق تخطيط الرحلات", "Kashta - Trip Planning App")}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    onClick={() => handleShareDebtCard('download')}
                    disabled={isGeneratingImage}
                    className="flex-1"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                        {t("تحميل", "Download")}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleShareDebtCard('share')}
                    disabled={isGeneratingImage}
                    className="flex-1"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Share2 className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                        {t("مشاركة", "Share")}
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setDebtShareDialogOpen(false)}
                  className="sm:hidden"
                  data-testid="button-close-debt-dialog"
                >
                  <X className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("إغلاق", "Close")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={roleManagementOpen} onOpenChange={(open) => {
        setRoleManagementOpen(open);
        if (!open) {
          setEditingRole(null);
          setShowCreateRole(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("إدارة الأدوار", "Manage Roles")}
            </DialogTitle>
            <DialogDescription>
              {t("إنشاء وتعديل الأدوار وتعيينها للمشاركين", "Create, edit roles and assign them to participants")}
            </DialogDescription>
          </DialogHeader>

          {rolesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="roles" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="roles" data-testid="tab-roles">{t("الأدوار", "Roles")}</TabsTrigger>
                <TabsTrigger value="assign" data-testid="tab-assign">{t("التعيين", "Assign")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="roles" className="space-y-4 mt-4">
                {/* Create New Role */}
                {!showCreateRole && !editingRole && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateRole(true)}
                    className="w-full"
                    data-testid="button-create-role"
                  >
                    <Plus className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t("إنشاء دور جديد", "Create New Role")}
                  </Button>
                )}

                {/* Create Role Form */}
                {showCreateRole && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium">{t("دور جديد", "New Role")}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("الاسم بالإنجليزية", "English Name")}</Label>
                        <Input
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="Coordinator"
                          data-testid="input-role-name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("الاسم بالعربية", "Arabic Name")}</Label>
                        <Input
                          value={newRoleNameAr}
                          onChange={(e) => setNewRoleNameAr(e.target.value)}
                          placeholder="منسق"
                          data-testid="input-role-name-ar"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("الوصف", "Description")}</Label>
                      <Input
                        value={newRoleDescription}
                        onChange={(e) => setNewRoleDescription(e.target.value)}
                        placeholder={t("وصف الدور", "Role description")}
                        data-testid="input-role-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{t("الصلاحيات", "Permissions")}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PERMISSION_KEYS.map((perm) => (
                          <div key={perm} className="flex items-center gap-2">
                            <Checkbox
                              id={`new-perm-${perm}`}
                              checked={newRolePermissions.includes(perm)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewRolePermissions([...newRolePermissions, perm]);
                                } else {
                                  setNewRolePermissions(newRolePermissions.filter(p => p !== perm));
                                }
                              }}
                              data-testid={`checkbox-new-perm-${perm}`}
                            />
                            <Label htmlFor={`new-perm-${perm}`} className="text-xs cursor-pointer">
                              {language === "ar" ? PERMISSION_LABELS[perm].ar : PERMISSION_LABELS[perm].en}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setShowCreateRole(false);
                          setNewRoleName("");
                          setNewRoleNameAr("");
                          setNewRoleDescription("");
                          setNewRolePermissions([]);
                        }}
                      >
                        {t("إلغاء", "Cancel")}
                      </Button>
                      <Button 
                        onClick={() => createRoleMutation.mutate({
                          name: newRoleName,
                          nameAr: newRoleNameAr,
                          description: newRoleDescription,
                          permissions: newRolePermissions,
                        })}
                        disabled={!newRoleName || !newRoleNameAr || createRoleMutation.isPending}
                        data-testid="button-save-new-role"
                      >
                        {createRoleMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("حفظ", "Save")
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Edit Role Form */}
                {editingRole && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium">{t("تعديل الدور", "Edit Role")}: {language === "ar" ? editingRole.nameAr : editingRole.name}</h4>
                    {!editingRole.isCreatorRole && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("الاسم بالإنجليزية", "English Name")}</Label>
                          <Input
                            value={editingRole.name}
                            onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                            data-testid="input-edit-role-name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("الاسم بالعربية", "Arabic Name")}</Label>
                          <Input
                            value={editingRole.nameAr}
                            onChange={(e) => setEditingRole({...editingRole, nameAr: e.target.value})}
                            data-testid="input-edit-role-name-ar"
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">{t("الوصف", "Description")}</Label>
                      <Input
                        value={editingRole.description || ""}
                        onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                        data-testid="input-edit-role-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{t("الصلاحيات", "Permissions")}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PERMISSION_KEYS.map((perm) => (
                          <div key={perm} className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-perm-${perm}`}
                              checked={(editingRole.permissions || []).includes(perm)}
                              onCheckedChange={(checked) => {
                                const currentPerms = editingRole.permissions || [];
                                if (checked) {
                                  setEditingRole({...editingRole, permissions: [...currentPerms, perm]});
                                } else {
                                  setEditingRole({...editingRole, permissions: currentPerms.filter(p => p !== perm)});
                                }
                              }}
                              data-testid={`checkbox-edit-perm-${perm}`}
                            />
                            <Label htmlFor={`edit-perm-${perm}`} className="text-xs cursor-pointer">
                              {language === "ar" ? PERMISSION_LABELS[perm].ar : PERMISSION_LABELS[perm].en}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setEditingRole(null)}>
                        {t("إلغاء", "Cancel")}
                      </Button>
                      <Button 
                        onClick={() => updateRoleMutation.mutate({
                          roleId: editingRole.id,
                          data: {
                            name: editingRole.name,
                            nameAr: editingRole.nameAr,
                            description: editingRole.description || undefined,
                            permissions: editingRole.permissions as PermissionKey[],
                          }
                        })}
                        disabled={updateRoleMutation.isPending}
                        data-testid="button-save-edit-role"
                      >
                        {updateRoleMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("حفظ", "Save")
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Role List */}
                {!showCreateRole && !editingRole && (
                  <div className="space-y-2">
                    {eventRoles?.map((role) => (
                      <div 
                        key={role.id} 
                        className="flex items-start gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                        onClick={() => setEditingRole({...role})}
                        data-testid={`role-item-${role.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={role.isCreatorRole ? "default" : "secondary"}>
                              {language === "ar" ? role.nameAr : role.name}
                            </Badge>
                            {role.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                {t("افتراضي", "Default")}
                              </Badge>
                            )}
                            {role.isCreatorRole && (
                              <Badge variant="outline" className="text-xs">
                                {t("المالك", "Owner")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(role.permissions || []).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {language === "ar" ? PERMISSION_LABELS[perm as PermissionKey]?.ar : PERMISSION_LABELS[perm as PermissionKey]?.en}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {!role.isCreatorRole && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-muted-foreground"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-delete-role-${role.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("حذف الدور", "Delete Role")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t(`هل تريد حذف الدور "${language === "ar" ? role.nameAr : role.name}"؟`, `Delete the role "${language === "ar" ? role.nameAr : role.name}"?`)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteRoleMutation.mutate(role.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("حذف", "Delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="assign" className="space-y-4 mt-4">
                <div className="space-y-2">
                  {event.eventParticipants?.map((ep) => (
                    <div 
                      key={ep.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <AvatarIcon icon={ep.participant?.avatar} className="h-4 w-4" />
                      </div>
                      <span className="flex-1 font-medium text-sm">{ep.participant?.name}</span>
                      <Select
                        value={ep.roleId || ""}
                        onValueChange={(roleId) => {
                          if (roleId) {
                            assignRoleMutation.mutate({ epId: ep.id, roleId });
                          }
                        }}
                        disabled={assignRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-36" data-testid={`select-role-${ep.id}`}>
                          <SelectValue placeholder={t("اختر دور", "Select role")} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventRoles?.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {language === "ar" ? role.nameAr : role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleManagementOpen(false)}>
              {t("إغلاق", "Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

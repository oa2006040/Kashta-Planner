import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Package,
  Filter,
  Check,
  X,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatNumber } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import type { Category, Item, CategoryWithItems } from "@shared/schema";

function ItemCard({ item, category }: { item: Item; category?: Category }) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
      data-testid={`item-${item.id}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
        {category && <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>
      {item.isCommon && (
        <Badge variant="secondary" className="text-xs shrink-0">
          شائع
        </Badge>
      )}
    </div>
  );
}

function CategorySection({ category, items }: { category: Category; items: Item[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span>{category.nameAr}</span>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              {formatNumber(items.length)} مستلزم
            </p>
          </div>
          <Badge variant="outline">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} category={category} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function AddItemDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isCommon, setIsCommon] = useState(true);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/items", {
        name,
        description: description || null,
        categoryId,
        isCommon,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المستلزم بنجاح",
      });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المستلزم",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setIsCommon(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-item">
          <Plus className="h-4 w-4 ml-2" />
          إضافة مستلزم
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مستلزم جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المستلزم *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شواية كبيرة"
              data-testid="input-item-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">الفئة *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger data-testid="select-item-category">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <CategoryIcon icon={cat.icon} color={cat.color} className="h-4 w-4" />
                      {cat.nameAr}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف اختياري للمستلزم"
              className="resize-none"
              data-testid="input-item-description"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isCommon">مستلزم شائع</Label>
            <Switch
              id="isCommon"
              checked={isCommon}
              onCheckedChange={setIsCommon}
              data-testid="switch-item-common"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={!name || !categoryId || createMutation.isPending}
              data-testid="button-submit-item"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 ml-2" />
              )}
              إضافة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Items() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: categoriesWithItems, isLoading } = useQuery<CategoryWithItems[]>({
    queryKey: ["/api/categories?withItems=true"],
  });

  const filteredCategories = categoriesWithItems?.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => 
    (selectedCategory === "all" || cat.id === selectedCategory) &&
    cat.items.length > 0
  );

  const totalItems = categoriesWithItems?.reduce((sum, cat) => sum + cat.items.length, 0) || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المستلزمات</h1>
          <p className="text-muted-foreground">قاعدة بيانات المستلزمات المشتركة</p>
        </div>
        {categoriesWithItems && <AddItemDialog categories={categoriesWithItems} />}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مستلزم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
            data-testid="input-search-items"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {categoriesWithItems?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <CategoryIcon icon={cat.icon} color={cat.color} className="h-4 w-4" />
                  {cat.nameAr}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(totalItems)}</p>
              <p className="text-sm text-muted-foreground">إجمالي المستلزمات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(categoriesWithItems?.length || 0)}</p>
              <p className="text-sm text-muted-foreground">فئة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-16" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCategories && filteredCategories.length > 0 ? (
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <CategorySection 
              key={category.id} 
              category={category} 
              items={category.items} 
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedCategory !== "all" ? "لا توجد نتائج" : "لا توجد مستلزمات"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery || selectedCategory !== "all" 
                ? "جرب تغيير معايير البحث" 
                : "أضف المستلزمات لتظهر في قاعدة البيانات المشتركة"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
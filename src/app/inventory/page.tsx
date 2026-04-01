"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/header";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  nameEn: string | null;
  totalItems?: number;
  totalQuantity?: number;
  availableQuantity?: number;
}

interface InventoryItem {
  id: string;
  name: string;
  size: string | null;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
  category: {
    id: string;
    name: string;
  };
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectCategories, setSelectCategories] = useState<{value: string; label: string}[]>([])
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const handleCategoryChange = (value: string | null) => {
    setSelectedCategory(value || "all");
  };
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", nameEn: "" });
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    size: "",
    quantity: "",
    unit: "件",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inventoryRes, categoryRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/category"),
      ]);
      const inventoryData = await inventoryRes.json();
      const categoryData = await categoryRes.json();
      if (inventoryData.success) setItems(inventoryData.data);
      if (categoryData.success) {
        const data: Category[] = categoryData.data
        setCategories(data);
        setSelectCategories([
          { value: "all", label: "所有品类"},
          ...data.map((item) => ({value: item.id, label: item.name }))
        ])
      }
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.categoryId || !formData.quantity) {
      toast.error("请填写必填项");
      return;
    }

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId,
          size: formData.size || null,
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("添加成功");
        setIsAddDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("添加失败");
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          name: editingItem.name,
          size: editingItem.size,
          unit: editingItem.unit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("更新成功");
        setIsEditDialogOpen(false);
        setEditingItem(null);
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("更新失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条库存记录吗？")) return;

    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("删除成功");
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("删除失败");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", categoryId: "", size: "", quantity: "", unit: "件" });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setIsEditDialogOpen(true);
  };

  // Category management
  const handleAddCategory = async () => {
    if (!categoryFormData.name) {
      toast.error("请填写品类名称");
      return;
    }

    try {
      const res = await fetch("/api/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryFormData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("添加成功");
        setIsAddCategoryDialogOpen(false);
        setCategoryFormData({ name: "", nameEn: "" });
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("添加失败");
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    try {
      const res = await fetch(`/api/category/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("更新成功");
        setIsEditCategoryDialogOpen(false);
        setEditingCategory(null);
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("更新失败");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("确定要删除该品类吗？")) return;

    try {
      const res = await fetch(`/api/category/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("删除成功");
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("删除失败");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.size?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="库存管理"
        description="管理服装库存，入库、编辑和删除"
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索服装名称或尺码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} items={selectCategories} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="筛选品类" />
          </SelectTrigger>
          <SelectContent>
            {selectCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setIsCategoryDialogOpen(true)}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          管理品类
        </Button>
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          新增入库
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>服装名称</TableHead>
              <TableHead>品类</TableHead>
              <TableHead>尺码</TableHead>
              <TableHead className="text-right">总库存</TableHead>
              <TableHead className="text-right">可用</TableHead>
              <TableHead className="text-right">借出</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const borrowed = item.totalQuantity - item.availableQuantity;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category.name}</Badge>
                    </TableCell>
                    <TableCell>{item.size || "-"}</TableCell>
                    <TableCell className="text-right">
                      {item.totalQuantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.availableQuantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {borrowed} {item.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增入库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">服装名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="如：黑色西装裤"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">品类 *</Label>
              <Select
                value={formData.categoryId}
                items={selectCategories}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择品类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">尺码</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  placeholder="如：M、L、XL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">数量 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="数量"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAdd}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑库存</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">服装名称</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-size">尺码</Label>
                  <Input
                    id="edit-size"
                    value={editingItem.size || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, size: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">单位</Label>
                  <Input
                    id="edit-unit"
                    value={editingItem.unit}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, unit: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>管理品类</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-end mb-4">
              <Button
                size="sm"
                onClick={() => {
                  setCategoryFormData({ name: "", nameEn: "" });
                  setIsAddCategoryDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                新增品类
              </Button>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>品类名称</TableHead>
                    <TableHead>英文名</TableHead>
                    <TableHead className="text-right">库存数量</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        暂无品类
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {cat.nameEn || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {cat.totalQuantity || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCategory({ ...cat });
                                setIsEditCategoryDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(cat.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增品类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">品类名称 *</Label>
              <Input
                id="cat-name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, name: e.target.value })
                }
                placeholder="如：裤子、上衣、裙子"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-name-en">英文名称</Label>
              <Input
                id="cat-name-en"
                value={categoryFormData.nameEn}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, nameEn: e.target.value })
                }
                placeholder="如：Pants、Shirts、Skirts"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddCategory}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑品类</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cat-name">品类名称</Label>
                <Input
                  id="edit-cat-name"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cat-name-en">英文名称</Label>
                <Input
                  id="edit-cat-name-en"
                  value={editingCategory.nameEn || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, nameEn: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditCategory}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

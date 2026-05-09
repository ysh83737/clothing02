"use client";

import { useState, useRef } from "react";
import { Plus, Search, Pencil, Trash2, FolderOpen, Upload, Download, FileSpreadsheet } from "lucide-react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/header";
import { Pagination } from "@/components/ui/pagination";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
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
  lostQuantity: number;
  borrowedQuantity: number;
  unit: string;
  category: {
    id: string;
    name: string;
  };
}

export default function InventoryPage() {
  const categories = usePaginatedFetch<Category>("/api/category", { defaultPageSize: 100 });
  const inventory = usePaginatedFetch<InventoryItem>("/api/inventory");

  const selectCategoryItems = [
    { value: "all", label: "所有品类" },
    ...categories.data.map((c) => ({ value: c.id, label: c.name })),
  ];

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
        inventory.refresh();
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
        inventory.refresh();
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
        inventory.refresh();
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
        categories.refresh();
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
        categories.refresh();
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
        categories.refresh();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("删除失败");
    }
  };

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBatchImport = async () => {
    if (!selectedFile) {
      toast.error("请选择文件");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/inventory/batch", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const { created, updated, skipped, errors } = data.data;
        let message = `导入完成：新增 ${created} 条`;
        if (updated > 0) message += `，追加 ${updated} 条`;
        if (skipped > 0) {
          const errorDetails = errors
            .map((e: { row: number; name: string; reason: string }) =>
              `第${e.row}行${e.name ? `(${e.name})` : ""}: ${e.reason}`
            )
            .join("；");
          toast.warning(`${message}，跳过 ${skipped} 条\n${errorDetails}`);
        } else {
          toast.success(`${message}`);
        }
        setSelectedFile(null);
        setIsImportDialogOpen(false);
        inventory.refresh();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("导入失败");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new();
      const data = [
        ["服装名称", "品类", "尺码", "数量", "单位"],
        ["黑色西装裤", "裤子", "M", 50, "件"],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "库存");
      XLSX.writeFile(wb, "库存导入模板.xlsx");
    });
  };

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
            value={inventory.search}
            onChange={(e) => inventory.setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <SearchableSelect
          value={inventory.filters.categoryId || "all"}
          onValueChange={(v) => inventory.setFilters(v === "all" ? {} : { categoryId: v || "" })}
          items={selectCategoryItems}
          placeholder="筛选品类"
          triggerClassName="w-full sm:w-[300px]"
        />
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
        <Button
          variant="outline"
          onClick={() => {
            setSelectedFile(null);
            setIsImportDialogOpen(true);
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          批量导入
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
              <TableHead className="text-right">借出中</TableHead>
              <TableHead className="text-right">丢失</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : inventory.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              inventory.data.map((item) => {
                const lost = item.lostQuantity || 0;
                const borrowed = item.borrowedQuantity || 0;
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
                    <TableCell className="text-right text-destructive">
                      {lost} {item.unit}
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

      <Pagination
        page={inventory.page}
        totalPages={inventory.totalPages}
        total={inventory.total}
        pageSize={inventory.pageSize}
        onPageChange={inventory.setPage}
        onPageSizeChange={inventory.setPageSize}
        loading={inventory.loading}
      />

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
              <SearchableSelect
                value={formData.categoryId}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v || "" })}
                items={categories.data.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="选择品类"
              />
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) setSelectedFile(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量导入库存</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">上传 Excel 文件</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 .xlsx / .xls 格式，第一行为表头：服装名称、品类、尺码、数量、单位
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Button
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  选择文件
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  下载模板
                </Button>
              </div>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{selectedFile.name}</span>
                <button
                  className="text-destructive hover:underline ml-auto"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  移除
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleBatchImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? "导入中..." : "确认导入"}
            </Button>
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
                  {categories.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        暂无品类
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.data.map((cat) => (
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

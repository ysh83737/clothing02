"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Phone, Building, Upload, Download, FileSpreadsheet } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/header";
import { Pagination } from "@/components/ui/pagination";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { fetchAllForExport, downloadExcel } from "@/lib/export-utils";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  department: string | null;
  phone: string | null;
  borrowedCount: number;
  totalLoans: number;
}

export default function EmployeePage() {
  const employees = usePaginatedFetch<Employee>("/api/employee");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    phone: "",
  });

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error("请填写姓名");
      return;
    }

    try {
      const res = await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("添加成功");
        setIsAddDialogOpen(false);
        resetForm();
        employees.refresh();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("添加失败");
    }
  };

  const handleEdit = async () => {
    if (!editingEmployee) return;

    try {
      const res = await fetch("/api/employee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEmployee),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("更新成功");
        setIsEditDialogOpen(false);
        setEditingEmployee(null);
        employees.refresh();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("更新失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该员工吗？")) return;

    try {
      const res = await fetch(`/api/employee?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("删除成功");
        employees.refresh();
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

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("请选择文件");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/employee/batch", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const { created, skipped, errors } = data.data;
        if (skipped > 0) {
          const errorDetails = errors
            .map((e: { row: number; name: string; reason: string }) =>
              `第${e.row}行${e.name ? `(${e.name})` : ""}: ${e.reason}`
            )
            .join("；");
          toast.warning(`导入完成：成功 ${created} 条，跳过 ${skipped} 条\n${errorDetails}`);
        } else {
          toast.success(`成功导入 ${created} 名员工`);
        }
        setSelectedFile(null);
        setIsImportDialogOpen(false);
        employees.refresh();
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
    // 需要动态导入 xlsx，避免打包时静态包含
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new();
      const data = [
        ["姓名", "部门", "电话"],
        ["张三", "技术部", "13800138000"],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "员工");
      XLSX.writeFile(wb, "员工导入模板.xlsx");
    });
  };

  const handleExport = async () => {
    try {
      const data = await fetchAllForExport<Employee>("/api/employee", {
        ...(employees.search ? { search: employees.search } : {}),
      });
      const now = new Date().toISOString().slice(0, 10);
      downloadExcel(
        data,
        [
          { header: "姓名", accessor: (emp) => emp.name },
          { header: "部门", accessor: (emp) => emp.department || "-" },
          { header: "电话", accessor: (emp) => emp.phone || "-" },
          { header: "当前借出", accessor: (emp) => emp.borrowedCount },
          { header: "总借出次数", accessor: (emp) => emp.totalLoans },
        ],
        `员工数据_${now}.xlsx`
      );
    } catch {
      toast.error("导出失败");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", department: "", phone: "" });
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee({ ...employee });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="员工管理"
        description="管理员工信息，用于借出记录"
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="搜索员工姓名或部门..."
          value={employees.search}
          onChange={(e) => employees.setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          导出
        </Button>
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          新增员工
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
              <TableHead>姓名</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>电话</TableHead>
              <TableHead className="text-center">当前借出</TableHead>
              <TableHead className="text-center">总借出次数</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : employees.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  暂无员工
                </TableCell>
              </TableRow>
            ) : (
              employees.data.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    {employee.department ? (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {employee.department}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {employee.phone}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {employee.borrowedCount > 0 ? (
                      <Badge variant="default" className="bg-orange-500">{employee.borrowedCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {employee.totalLoans}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(employee.id)}
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

      <Pagination
        page={employees.page}
        totalPages={employees.totalPages}
        total={employees.total}
        pageSize={employees.pageSize}
        onPageChange={employees.setPage}
        onPageSizeChange={employees.setPageSize}
        loading={employees.loading}
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增员工</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="请输入员工姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="请输入部门名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="请输入联系电话"
              />
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) setSelectedFile(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量导入员工</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">上传 Excel 文件</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 .xlsx / .xls 格式，第一行为表头：姓名、部门、电话
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
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? "导入中..." : "确认导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑员工</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">姓名</Label>
                <Input
                  id="edit-name"
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">部门</Label>
                <Input
                  id="edit-department"
                  value={editingEmployee.department || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      department: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">电话</Label>
                <Input
                  id="edit-phone"
                  value={editingEmployee.phone || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      phone: e.target.value,
                    })
                  }
                />
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
    </div>
  );
}

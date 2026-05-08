"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Package, CheckCircle, Trash2 } from "lucide-react";
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
  SearchableSelect,
} from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/header";
import { Pagination } from "@/components/ui/pagination";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  availableQuantity: number;
  unit: string;
  category: { name: string };
}

interface LoanEvent {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  stats: {
    totalBorrowed: number;
    totalReturned: number;
    totalLost: number;
    totalActive: number;
    recordCount: number;
  };
}

interface LoanRecord {
  id: string;
  quantity: number;
  status: string;
  borrowedAt: string;
  employee: { id: string; name: string; department: string | null };
  clothingItem: {
    id: string;
    name: string;
    unit: string;
    category: { name: string };
  };
}

export default function LoanPage() {
  const [pageSearch, setPageSearch] = useState("");
  const [debouncedPageSearch, setDebouncedPageSearch] = useState("");

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPageSearch(pageSearch), 300);
    return () => clearTimeout(timer);
  }, [pageSearch]);

  const activeEvents = usePaginatedFetch<LoanEvent>("/api/loan", {
    defaultPageSize: 12,
    extraParams: { status: "active", search: debouncedPageSearch },
  });
  const closedEvents = usePaginatedFetch<LoanEvent>("/api/loan", {
    defaultPageSize: 10,
    extraParams: { status: "closed", search: debouncedPageSearch },
  });
  const loanRecords = usePaginatedFetch<LoanRecord>("/api/loan-record");
  const inventory = usePaginatedFetch<InventoryItem>("/api/inventory");

  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loanEmployeeId, setLoanEmployeeId] = useState("");
  const [loanItems, setLoanItems] = useState<
    Array<{ key: string; clothingItemId: string; quantity: string }>
  >([{ key: crypto.randomUUID(), clothingItemId: "", quantity: "1" }]);

  // 对话框打开时重置表单
  useEffect(() => {
    if (isLoanDialogOpen) {
      setLoanEmployeeId("");
      setLoanItems([{ key: crypto.randomUUID(), clothingItemId: "", quantity: "1" }]);
    }
  }, [isLoanDialogOpen]);

  const addLoanItem = () => {
    setLoanItems([
      ...loanItems,
      { key: crypto.randomUUID(), clothingItemId: "", quantity: "1" },
    ]);
  };

  const removeLoanItem = (key: string) => {
    if (loanItems.length <= 1) return;
    setLoanItems(loanItems.filter((item) => item.key !== key));
  };

  const updateLoanItem = (key: string, field: "clothingItemId" | "quantity", value: string) => {
    setLoanItems(
      loanItems.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    );
  };

  const handleCreateEvent = async () => {
    if (!formData.name) {
      toast.error("请填写活动名称");
      return;
    }

    try {
      const res = await fetch("/api/loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("创建成功");
        setIsAddEventDialogOpen(false);
        setFormData({ name: "", description: "" });
        activeEvents.refresh();
        closedEvents.refresh();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("创建失败");
    }
  };

  const handleLoan = async () => {
    if (!loanEmployeeId) {
      toast.error("请选择员工");
      return;
    }

    const validItems = loanItems.filter(
      (item) => item.clothingItemId && parseInt(item.quantity) > 0
    );

    if (validItems.length === 0) {
      toast.error("请至少选择一件服装并填写数量");
      return;
    }

    // 检查重复服装
    const clothingIds = validItems.map((item) => item.clothingItemId);
    if (new Set(clothingIds).size !== clothingIds.length) {
      toast.error("同一批借出中不能包含重复服装");
      return;
    }

    try {
      const res = await fetch("/api/loan-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanEventId: selectedEventId,
          employeeId: loanEmployeeId,
          items: validItems.map((item) => ({
            clothingItemId: item.clothingItemId,
            quantity: parseInt(item.quantity),
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("借出成功");
        setIsLoanDialogOpen(false);
        setLoanEmployeeId("");
        setLoanItems([{ key: crypto.randomUUID(), clothingItemId: "", quantity: "1" }]);
        activeEvents.refresh();
        closedEvents.refresh();
        loanRecords.refresh();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("借出失败");
    }
  };

  const handleCloseEvent = async (eventId: string) => {
    if (!confirm("确定要关闭该活动吗？关闭后将无法再添加新的借出记录。")) return;

    try {
      const res = await fetch("/api/loan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, status: "closed" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("活动已关闭");
        activeEvents.refresh();
        closedEvents.refresh();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("操作失败");
    }
  };

  const availInventory = inventory.data.filter((i: InventoryItem) => i.availableQuantity > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="出借管理"
        description="创建出借活动，管理借出记录"
      />

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">活动管理</TabsTrigger>
          <TabsTrigger value="records">借出记录</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="搜索活动..."
              value={pageSearch}
              onChange={(e) => setPageSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => setIsAddEventDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建活动
            </Button>
          </div>

          {/* Active Events */}
          <div>
            <h3 className="text-lg font-medium mb-3">进行中的活动</h3>
            {activeEvents.loading ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                加载中...
              </div>
            ) : activeEvents.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                暂无进行中的活动
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeEvents.data.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="default">进行中</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">借出:</span>{" "}
                          {event.stats.totalBorrowed}
                        </div>
                        <div>
                          <span className="text-muted-foreground">归还:</span>{" "}
                          {event.stats.totalReturned}
                        </div>
                        <div>
                          <span className="text-muted-foreground">丢失:</span>{" "}
                          {event.stats.totalLost}
                        </div>
                        <div className="text-orange-600">
                          <span className="text-muted-foreground">未还:</span>{" "}
                          {event.stats.totalActive}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setIsLoanDialogOpen(true);
                          }}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          借出
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCloseEvent(event.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          关闭
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <Pagination
            page={activeEvents.page}
            totalPages={activeEvents.totalPages}
            total={activeEvents.total}
            pageSize={activeEvents.pageSize}
            onPageChange={activeEvents.setPage}
            onPageSizeChange={activeEvents.setPageSize}
            loading={activeEvents.loading}
          />

          {/* Closed Events */}
          {closedEvents.total > 0 && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-3">已关闭的活动</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>活动名称</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead className="text-right">借出</TableHead>
                        <TableHead className="text-right">归还</TableHead>
                        <TableHead className="text-right">丢失</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedEvents.data.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {event.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {event.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.stats.totalBorrowed}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.stats.totalReturned}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {event.stats.totalLost}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <Pagination
                page={closedEvents.page}
                totalPages={closedEvents.totalPages}
                total={closedEvents.total}
                pageSize={closedEvents.pageSize}
                onPageChange={closedEvents.setPage}
                onPageSizeChange={closedEvents.setPageSize}
                loading={closedEvents.loading}
              />
            </>
          )}
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records">
          <div className="mb-4">
            <Input
              placeholder="搜索借出记录..."
              value={loanRecords.search}
              onChange={(e) => loanRecords.setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工</TableHead>
                  <TableHead>服装</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>借出时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanRecords.loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : loanRecords.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      暂无借出记录
                    </TableCell>
                  </TableRow>
                ) : (
                  loanRecords.data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.employee.department || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{record.clothingItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.clothingItem.category.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.quantity} {record.clothingItem.unit}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "borrowed"
                              ? "default"
                              : record.status === "returned"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {record.status === "borrowed"
                            ? "借出中"
                            : record.status === "returned"
                            ? "已归还"
                            : "丢失"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(record.borrowedAt).toLocaleDateString("zh-CN")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={loanRecords.page}
            totalPages={loanRecords.totalPages}
            total={loanRecords.total}
            pageSize={loanRecords.pageSize}
            onPageChange={loanRecords.setPage}
            onPageSizeChange={loanRecords.setPageSize}
            loading={loanRecords.loading}
          />
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建出借活动</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">活动名称 *</Label>
              <Input
                id="event-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="如：2024年度大会"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">活动描述</Label>
              <Input
                id="event-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="简要描述活动"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddEventDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateEvent}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>发起借出</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择员工 *</Label>
              <SearchableSelect
                value={loanEmployeeId}
                onValueChange={(v) => setLoanEmployeeId(v || "")}
                endpoint="/api/employee"
                pageSize={20}
                placeholder="选择员工"
              >
                {(item: any) =>
                  <>{item.name} {item.department ? `(${item.department})` : ""}</>
                }
              </SearchableSelect>
            </div>

            <div className="space-y-3">
              <Label>选择服装 *</Label>
              {loanItems.map((item, index) => (
                <div key={item.key} className="flex items-end gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      value={item.clothingItemId}
                      onValueChange={(v) =>
                        updateLoanItem(item.key, "clothingItemId", v || "")
                      }
                      endpoint="/api/inventory"
                      pageSize={20}
                      placeholder="选择服装"
                    >
                      {(inv: any) => (
                        <>
                          {inv.name} (可借: {inv.availableQuantity}{inv.unit})
                        </>
                      )}
                    </SearchableSelect>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLoanItem(item.key, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={loanItems.length <= 1}
                    onClick={() => removeLoanItem(item.key)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addLoanItem}
              disabled={
                availInventory.length <=
                loanItems.filter((i) => i.clothingItemId).length
              }
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加服装
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoanDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleLoan}>确认借出</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

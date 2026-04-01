"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Package, CheckCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/header";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  department: string | null;
}

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
  const [events, setEvents] = useState<LoanEvent[]>([]);
  const [records, setRecords] = useState<LoanRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loanData, setLoanData] = useState({
    employeeId: "",
    clothingItemId: "",
    quantity: "1",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventRes, recordRes, employeeRes, inventoryRes] = await Promise.all([
        fetch("/api/loan"),
        fetch("/api/loan-record"),
        fetch("/api/employee"),
        fetch("/api/inventory"),
      ]);
      const eventData = await eventRes.json();
      const recordData = await recordRes.json();
      const employeeData = await employeeRes.json();
      const inventoryData = await inventoryRes.json();

      if (eventData.success) setEvents(eventData.data);
      if (recordData.success) setRecords(recordData.data);
      if (employeeData.success) setEmployees(employeeData.data);
      if (inventoryData.success)
        setInventory(inventoryData.data.filter((i: InventoryItem) => i.availableQuantity > 0));
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
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
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("创建失败");
    }
  };

  const handleLoan = async () => {
    if (!loanData.employeeId || !loanData.clothingItemId || !loanData.quantity) {
      toast.error("请填写完整信息");
      return;
    }

    const qty = parseInt(loanData.quantity);
    if (qty < 1) {
      toast.error("数量必须大于0");
      return;
    }

    try {
      const res = await fetch("/api/loan-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanEventId: selectedEventId,
          ...loanData,
          quantity: qty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("借出成功");
        setIsLoanDialogOpen(false);
        setLoanData({ employeeId: "", clothingItemId: "", quantity: "1" });
        fetchData();
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
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("操作失败");
    }
  };

  const activeEvents = events.filter((e) => e.status === "active");
  const closedEvents = events.filter((e) => e.status === "closed");

  const filteredRecords = records.filter(
    (r) =>
      r.employee.name.toLowerCase().includes(search.toLowerCase()) ||
      r.clothingItem.name.toLowerCase().includes(search.toLowerCase())
  );

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            {activeEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                暂无进行中的活动
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeEvents
                  .filter((e) =>
                    e.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((event) => (
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

          {/* Closed Events */}
          {closedEvents.length > 0 && (
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
                    {closedEvents
                      .filter((e) =>
                        e.name.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((event) => (
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
          )}
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records">
          <div className="mb-4">
            <Input
              placeholder="搜索借出记录..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      暂无借出记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发起借出</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择员工 *</Label>
              <Select
                value={loanData.employeeId}
                onValueChange={(v) =>
                  setLoanData({ ...loanData, employeeId: v || "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择员工" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} {emp.department ? `(${emp.department})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>选择服装 *</Label>
              <Select
                value={loanData.clothingItemId}
                onValueChange={(v) =>
                  setLoanData({ ...loanData, clothingItemId: v || "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择服装" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (可借: {item.availableQuantity}
                      {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-qty">借出数量 *</Label>
              <Input
                id="loan-qty"
                type="number"
                min="1"
                value={loanData.quantity}
                onChange={(e) =>
                  setLoanData({ ...loanData, quantity: e.target.value })
                }
              />
            </div>
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

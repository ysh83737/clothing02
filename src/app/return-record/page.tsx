"use client";

import { useEffect, useState } from "react";
import { Search, ArrowRightLeft, Calendar, User, Package } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/header";
import { toast } from "sonner";

interface ReturnRecord {
  id: string;
  quantity: number;
  returnedAt: string;
  remark: string | null;
  employee: {
    id: string;
    name: string;
    department: string | null;
  };
  clothingItem: {
    id: string;
    name: string;
    unit: string;
    category: { name: string };
  };
  loanRecord: {
    id: string;
    quantity: number;
    borrowedAt: string;
    loanEvent: { id: string; name: string };
  };
}

interface LoanEvent {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

export default function ReturnRecordPage() {
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [events, setEvents] = useState<LoanEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<ReturnRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [returnRes, eventRes, employeeRes] = await Promise.all([
        fetch("/api/return-record"),
        fetch("/api/loan"),
        fetch("/api/employee"),
      ]);
      const returnData = await returnRes.json();
      const eventData = await eventRes.json();
      const employeeData = await employeeRes.json();

      if (returnData.success) setRecords(returnData.data);
      if (eventData.success) setEvents(eventData.data);
      if (employeeData.success) setEmployees(employeeData.data);
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const openDetailDialog = (record: ReturnRecord) => {
    setSelectedRecord(record);
    setIsDetailDialogOpen(true);
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      search === "" ||
      record.employee.name.toLowerCase().includes(search.toLowerCase()) ||
      record.clothingItem.name.toLowerCase().includes(search.toLowerCase()) ||
      record.loanRecord.loanEvent.name.toLowerCase().includes(search.toLowerCase());

    const matchesEvent =
      selectedEvent === "all" || record.loanRecord.loanEvent.id === selectedEvent;

    const matchesEmployee =
      selectedEmployee === "all" || record.employee.id === selectedEmployee;

    return matchesSearch && matchesEvent && matchesEmployee;
  });

  // 计算统计数据
  const stats = {
    totalReturned: records.reduce((sum, r) => sum + r.quantity, 0),
    totalRecords: records.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="归还记录"
        description="查看所有服装归还记录"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">归还总数</p>
              <p className="text-2xl font-bold">{stats.totalReturned}</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">归还记录数</p>
              <p className="text-2xl font-bold">{stats.totalRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索员工、服装或活动..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedEvent} onValueChange={(v) => setSelectedEvent(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="筛选活动" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有活动</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedEmployee} onValueChange={(v) => setSelectedEmployee(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="筛选员工" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有员工</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>员工</TableHead>
              <TableHead>服装</TableHead>
              <TableHead>活动</TableHead>
              <TableHead className="text-right">归还数量</TableHead>
              <TableHead>归还时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  暂无归还记录
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{record.employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.employee.department || "-"}
                        </p>
                      </div>
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
                  <TableCell>
                    <Badge variant="secondary">{record.loanRecord.loanEvent.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {record.quantity} {record.clothingItem.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(record.returnedAt).toLocaleDateString("zh-CN")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openDetailDialog(record)}>
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>归还记录详情</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  <span className="font-medium">归还服装</span>
                </div>
                <p className="text-2xl font-bold">
                  {selectedRecord.quantity} {selectedRecord.clothingItem.unit}
                </p>
                <p className="text-muted-foreground">{selectedRecord.clothingItem.name}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">归还人</span>
                  <span className="font-medium">{selectedRecord.employee.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">部门</span>
                  <span>{selectedRecord.employee.department || "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">所属活动</span>
                  <Badge variant="secondary">{selectedRecord.loanRecord.loanEvent.name}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">原借出数量</span>
                  <span>{selectedRecord.loanRecord.quantity} {selectedRecord.clothingItem.unit}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">借出时间</span>
                  <span>{new Date(selectedRecord.loanRecord.borrowedAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">归还时间</span>
                  <span>{new Date(selectedRecord.returnedAt).toLocaleDateString("zh-CN")}</span>
                </div>
                {selectedRecord.remark && (
                  <div className="py-2">
                    <span className="text-muted-foreground block mb-1">备注</span>
                    <span>{selectedRecord.remark}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
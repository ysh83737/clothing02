"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { SearchToolbar } from "./search-toolbar";

interface LostRecord {
  id: string;
  quantity: number;
  lostAt: string;
  reason: string | null;
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

interface LostRecordsTabProps {
  records: LostRecord[];
  loading: boolean;
  events: LoanEvent[];
  employees: Employee[];
}

export function LostRecordsTab({
  records,
  loading,
  events,
  employees,
}: LostRecordsTabProps) {
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<LostRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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

  const openDetailDialog = (record: LostRecord) => {
    setSelectedRecord(record);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <SearchToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="搜索员工、服装或活动..."
        showEventFilter
        showEmployeeFilter
        events={events}
        employees={employees}
        selectedEvent={selectedEvent}
        selectedEmployee={selectedEmployee}
        onEventChange={setSelectedEvent}
        onEmployeeChange={setSelectedEmployee}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>员工</TableHead>
              <TableHead>服装</TableHead>
              <TableHead>活动</TableHead>
              <TableHead className="text-right">丢失数量</TableHead>
              <TableHead>丢失时间</TableHead>
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
                  暂无丢失记录
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
                  <TableCell className="text-right text-destructive font-medium">
                    {record.quantity} {record.clothingItem.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(record.lostAt).toLocaleDateString("zh-CN")}
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
            <DialogTitle>丢失记录详情</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="bg-destructive/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">丢失服装</span>
                </div>
                <p className="text-2xl font-bold">
                  {selectedRecord.quantity} {selectedRecord.clothingItem.unit}
                </p>
                <p className="text-muted-foreground">{selectedRecord.clothingItem.name}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">丢失人</span>
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
                  <span>
                    {selectedRecord.loanRecord.quantity} {selectedRecord.clothingItem.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">借出时间</span>
                  <span>
                    {new Date(selectedRecord.loanRecord.borrowedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">丢失时间</span>
                  <span>
                    {new Date(selectedRecord.lostAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                {selectedRecord.reason && (
                  <div className="py-2 border-b">
                    <span className="text-muted-foreground block mb-1">丢失原因</span>
                    <span>{selectedRecord.reason}</span>
                  </div>
                )}
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

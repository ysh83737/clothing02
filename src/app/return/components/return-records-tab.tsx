"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, Calendar, User } from "lucide-react";
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
import { Pagination } from "@/components/ui/pagination";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { SearchToolbar } from "./search-toolbar";

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

interface ReturnRecordsTabProps {
  refreshKey: number;
  events: LoanEvent[];
  employees: Employee[];
}

export function ReturnRecordsTab({
  refreshKey,
  events,
  employees,
}: ReturnRecordsTabProps) {
  const records = usePaginatedFetch<ReturnRecord>("/api/return-record");
  const [selectedRecord, setSelectedRecord] = useState<ReturnRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (refreshKey > 0) records.refresh();
  }, [refreshKey]);

  const openDetailDialog = (record: ReturnRecord) => {
    setSelectedRecord(record);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <SearchToolbar
        search={records.search}
        onSearchChange={records.setSearch}
        placeholder="搜索员工、服装或活动..."
        showEventFilter
        showEmployeeFilter
        events={events}
        employees={employees}
        selectedEvent={records.filters.eventId || "all"}
        selectedEmployee={records.filters.employeeId || "all"}
        onEventChange={(v) =>
          records.setFilters(v === "all" ? { employeeId: records.filters.employeeId || "" } : { ...records.filters, eventId: v })
        }
        onEmployeeChange={(v) =>
          records.setFilters(v === "all" ? { eventId: records.filters.eventId || "" } : { ...records.filters, employeeId: v })
        }
      />

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
            {records.loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : records.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  暂无归还记录
                </TableCell>
              </TableRow>
            ) : (
              records.data.map((record) => (
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

      <Pagination
        page={records.page}
        totalPages={records.totalPages}
        total={records.total}
        pageSize={records.pageSize}
        onPageChange={records.setPage}
        onPageSizeChange={records.setPageSize}
        loading={records.loading}
      />

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
                  <span className="text-muted-foreground">归还时间</span>
                  <span>
                    {new Date(selectedRecord.returnedAt).toLocaleDateString("zh-CN")}
                  </span>
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

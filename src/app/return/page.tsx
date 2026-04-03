"use client";

import { useEffect, useState } from "react";
import { Search, RotateCcw, AlertTriangle } from "lucide-react";
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
import { toast } from "sonner";

interface LoanRecord {
  id: string;
  quantity: number;
  returnedQuantity: number;
  status: string;
  borrowedAt: string;
  returnedAt: string | null;
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
  loanEvent: {
    id: string;
    name: string;
  };
  lostRecords?: {
    quantity: number;
  }[];
}

export default function ReturnPage() {
  const [records, setRecords] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LoanRecord | null>(null);
  const [returnQuantity, setReturnQuantity] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [lostRemark, setLostRemark] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/loan-record");
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const getPendingQuantity = (record: LoanRecord) => {
    const lostQty = record.lostRecords?.reduce((sum, lr) => sum + lr.quantity, 0) || 0;
    return record.quantity - (record.returnedQuantity || 0) - lostQty;
  };

  const openReturnDialog = (record: LoanRecord) => {
    setSelectedRecord(record);
    setReturnQuantity(getPendingQuantity(record).toString());
    setIsReturnDialogOpen(true);
  };

  const openLostDialog = (record: LoanRecord) => {
    setSelectedRecord(record);
    setReturnQuantity(getPendingQuantity(record).toString());
    setLostReason("");
    setLostRemark("");
    setIsLostDialogOpen(true);
  };

  const handleReturn = async () => {
    if (!selectedRecord) return;

    const qty = parseInt(returnQuantity);
    if (qty < 1 || qty > selectedRecord.quantity) {
      toast.error("归还数量无效");
      return;
    }

    try {
      const res = await fetch("/api/return-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanRecordId: selectedRecord.id,
          quantity: qty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("归还成功");
        setIsReturnDialogOpen(false);
        setSelectedRecord(null);
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("归还失败");
    }
  };

  const handleMarkLost = async () => {
    if (!selectedRecord) return;

    const qty = parseInt(returnQuantity);
    const pendingQuantity = selectedRecord.quantity - (selectedRecord.returnedQuantity || 0);
    if (qty < 1 || qty > pendingQuantity) {
      toast.error("丢失数量无效");
      return;
    }

    try {
      const res = await fetch("/api/lost-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanRecordId: selectedRecord.id,
          quantity: qty,
          reason: lostReason || null,
          remark: lostRemark || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("登记成功");
        setIsLostDialogOpen(false);
        setSelectedRecord(null);
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("登记失败");
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      getPendingQuantity(r) > 0 &&
      (r.employee.name.toLowerCase().includes(search.toLowerCase()) ||
        r.clothingItem.name.toLowerCase().includes(search.toLowerCase()) ||
        r.loanEvent.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="归还销账"
        description="处理服装归还和丢失登记"
      />

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
        <div className="flex gap-2">
          <Badge variant="default" className="px-3 py-1 h-full">
            待处理: {filteredRecords.length}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>员工</TableHead>
              <TableHead>服装</TableHead>
              <TableHead>活动</TableHead>
              <TableHead className="text-right">待归还</TableHead>
              <TableHead>借出时间</TableHead>
              <TableHead className="text-center">操作</TableHead>
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
                  <TableCell>
                    <Badge variant="secondary">{record.loanEvent.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {getPendingQuantity(record)} {record.clothingItem.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(record.borrowedAt).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReturnDialog(record)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        归还
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openLostDialog(record)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        丢失
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>归还服装</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">员工:</span>
                  <span className="font-medium">{selectedRecord.employee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">服装:</span>
                  <span>{selectedRecord.clothingItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">活动:</span>
                  <span>{selectedRecord.loanEvent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">待归还:</span>
                  <span>
                    {getPendingQuantity(selectedRecord)} {selectedRecord.clothingItem.unit}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="return-qty">归还数量</Label>
                <Input
                  id="return-qty"
                  type="number"
                  min="1"
                  max={getPendingQuantity(selectedRecord)}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  最多可归还 {getPendingQuantity(selectedRecord)}{" "}
                  {selectedRecord.clothingItem.unit}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReturnDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleReturn}>确认归还</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lost Dialog */}
      <Dialog open={isLostDialogOpen} onOpenChange={setIsLostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>登记丢失</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="bg-destructive/10 p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">确认服装丢失</p>
                  <p className="text-sm text-muted-foreground">
                    丢失的服装将计入丢失数量
                  </p>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">员工:</span>
                  <span className="font-medium">{selectedRecord.employee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">服装:</span>
                  <span>{selectedRecord.clothingItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">借出数量:</span>
                  <span>
                    {selectedRecord.quantity} {selectedRecord.clothingItem.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">待处理数量:</span>
                  <span>
                    {getPendingQuantity(selectedRecord)} {selectedRecord.clothingItem.unit}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lost-qty">丢失数量</Label>
                <Input
                  id="lost-qty"
                  type="number"
                  min="1"
                  max={getPendingQuantity(selectedRecord)}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  最多 {getPendingQuantity(selectedRecord)} {selectedRecord.clothingItem.unit}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lost-reason">丢失原因</Label>
                <Input
                  id="lost-reason"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="如：穿着时遗失、损坏等"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lost-remark">备注</Label>
                <Input
                  id="lost-remark"
                  value={lostRemark}
                  onChange={(e) => setLostRemark(e.target.value)}
                  placeholder="额外说明"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLostDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleMarkLost}>
              确认丢失
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/header";
import {
  ReturnStatsCards,
  PendingReturnTab,
  ReturnRecordsTab,
  LostRecordsTab,
} from "./components";
import { toast } from "sonner";

// 类型定义
interface LoanRecord {
  id: string;
  quantity: number;
  returnedQuantity: number;
  borrowedAt: string;
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

interface Stats {
  totalPendingReturn: number;
  totalLost: number;
}

export default function ReturnPage() {
  // 统计数据
  const [stats, setStats] = useState<Stats>({ totalPendingReturn: 0, totalLost: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // 待归还数据
  const [loanRecords, setLoanRecords] = useState<LoanRecord[]>([]);
  const [loanLoading, setLoanLoading] = useState(true);

  // 归还记录数据
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
  const [returnLoading, setReturnLoading] = useState(true);

  // 丢失记录数据
  const [lostRecords, setLostRecords] = useState<LostRecord[]>([]);
  const [lostLoading, setLostLoading] = useState(true);

  // 筛选数据
  const [events, setEvents] = useState<LoanEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // 统一的刷新函数
  const refreshAll = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, loanRes, returnRes, lostRes, eventRes, employeeRes] = await Promise.all([
        fetch("/api/stats/return-stats"),
        fetch("/api/loan-record"),
        fetch("/api/return-record"),
        fetch("/api/lost-record"),
        fetch("/api/loan"),
        fetch("/api/employee"),
      ]);

      const [statsData, loanData, returnData, lostData, eventData, employeeData] = await Promise.all([
        statsRes.json(),
        loanRes.json(),
        returnRes.json(),
        lostRes.json(),
        eventRes.json(),
        employeeRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (loanData.success) setLoanRecords(loanData.data);
      if (returnData.success) setReturnRecords(returnData.data);
      if (lostData.success) setLostRecords(lostData.data);
      if (eventData.success) setEvents(eventData.data);
      if (employeeData.success) setEmployees(employeeData.data);
    } catch {
      toast.error("获取数据失败");
    } finally {
      setStatsLoading(false);
      setLoanLoading(false);
      setReturnLoading(false);
      setLostLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="归还销账"
        description="处理服装归还、丢失登记，查看归还和丢失记录"
      />

      {/* 统计卡片 */}
      <ReturnStatsCards
        totalPendingReturn={stats.totalPendingReturn}
        totalLost={stats.totalLost}
        loading={statsLoading}
      />

      {/* 三标签页 */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">待归还</TabsTrigger>
          <TabsTrigger value="return">归还记录</TabsTrigger>
          <TabsTrigger value="lost">丢失记录</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingReturnTab
            records={loanRecords}
            loading={loanLoading}
            onRefresh={refreshAll}
          />
        </TabsContent>

        <TabsContent value="return">
          <ReturnRecordsTab
            records={returnRecords}
            loading={returnLoading}
            events={events}
            employees={employees}
          />
        </TabsContent>

        <TabsContent value="lost">
          <LostRecordsTab
            records={lostRecords}
            loading={lostLoading}
            events={events}
            employees={employees}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

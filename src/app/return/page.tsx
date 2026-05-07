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
  const [refreshKey, setRefreshKey] = useState(0);

  // 筛选下拉数据
  const [events, setEvents] = useState<LoanEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const refreshAll = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, eventRes, employeeRes] = await Promise.all([
        fetch("/api/stats/return-stats"),
        fetch("/api/loan?pageSize=200"),
        fetch("/api/employee?pageSize=200"),
      ]);

      const [statsData, eventData, employeeData] = await Promise.all([
        statsRes.json(),
        eventRes.json(),
        employeeRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (eventData.success) setEvents(eventData.data);
      if (employeeData.success) setEmployees(employeeData.data);
    } catch {
      toast.error("获取数据失败");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refreshAll();
  }, [refreshAll]);

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
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="return">
          <ReturnRecordsTab
            refreshKey={refreshKey}
            events={events}
            employees={employees}
          />
        </TabsContent>

        <TabsContent value="lost">
          <LostRecordsTab
            refreshKey={refreshKey}
            events={events}
            employees={employees}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  inventory: {
    totalQuantity: number;
    availableQuantity: number;
    borrowedQuantity: number;
    categoryCount: number;
  };
  loans: {
    activeCount: number;
    borrowedQuantity: number;
    lostQuantity: number;
  };
  events: {
    activeCount: number;
  };
  employees: {
    totalCount: number;
  };
  recentLoans: Array<{
    id: string;
    quantity: number;
    borrowedAt: string;
    employee: { name: string };
    clothingItem: { name: string };
    loanEvent: { name: string };
  }>;
  recentReturns: Array<{
    id: string;
    quantity: number;
    returnedAt: string | null;
    employee: { name: string };
    clothingItem: { name: string };
    loanEvent: { name: string };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="仪表盘"
          description="服装仓库管理系统概览"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "总库存",
      value: stats?.inventory.totalQuantity || 0,
      description: `可用 ${stats?.inventory.availableQuantity || 0}`,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "借出中",
      value: stats?.loans.borrowedQuantity || 0,
      description: `${stats?.loans.activeCount || 0} 条记录`,
      icon: ShoppingCart,
      color: "text-orange-600",
    },
    {
      title: "活动中",
      value: stats?.events.activeCount || 0,
      description: "个活动",
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "员工",
      value: stats?.employees.totalCount || 0,
      description: "人",
      icon: Users,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="仪表盘"
        description="服装仓库管理系统概览"
      />

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Loss Alert */}
      {stats && stats.loans.lostQuantity > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">
                提醒：当前有 {stats.loans.lostQuantity} 件服装登记为丢失
              </p>
              <p className="text-sm text-orange-600">
                请及时处理并更新库存记录
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              最近借出
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentLoans && stats.recentLoans.length > 0 ? (
              <div className="space-y-3">
                {stats.recentLoans.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {record.employee.name} 借出 {record.quantity} 件
                      </p>
                      <p className="text-muted-foreground">
                        {record.clothingItem.name} - {record.loanEvent.name}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {new Date(record.borrowedAt).toLocaleDateString("zh-CN")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">暂无借出记录</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Returns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-blue-600" />
              最近归还
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentReturns && stats.recentReturns.length > 0 ? (
              <div className="space-y-3">
                {stats.recentReturns.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {record.employee.name} 归还 {record.quantity} 件
                      </p>
                      <p className="text-muted-foreground">
                        {record.clothingItem.name} - {record.loanEvent.name}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {record.returnedAt
                        ? new Date(record.returnedAt).toLocaleDateString("zh-CN")
                        : "-"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">暂无归还记录</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

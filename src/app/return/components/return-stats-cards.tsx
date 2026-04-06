"use client";

import { ArrowRightLeft, AlertTriangle } from "lucide-react";

interface ReturnStatsCardsProps {
  totalPendingReturn: number;
  totalLost: number;
  loading?: boolean;
}

export function ReturnStatsCards({
  totalPendingReturn,
  totalLost,
  loading,
}: ReturnStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg h-10 w-10" />
            <div>
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded mt-1" />
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg h-10 w-10" />
            <div>
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded mt-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ArrowRightLeft className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">待归还总数</p>
            <p className="text-2xl font-bold">{totalPendingReturn}</p>
          </div>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">丢失总数</p>
            <p className="text-2xl font-bold">{totalLost}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/stats/return-stats - 获取归还销账统计数据
export async function GET() {
  try {
    // 获取所有借出记录（包含丢失记录）
    const loanRecords = await prisma.loanRecord.findMany({
      include: {
        lostRecords: {
          select: {
            quantity: true,
          },
        },
      },
    });

    // 计算待归还总数
    // 待归还 = quantity - returnedQuantity - 丢失数量
    const totalPendingReturn = loanRecords.reduce((sum, record) => {
      const lostQuantity = record.lostRecords.reduce((s, lr) => s + lr.quantity, 0);
      const pending = record.quantity - record.returnedQuantity - lostQuantity;
      return pending > 0 ? sum + pending : sum;
    }, 0);

    // 获取丢失记录总数
    const lostRecords = await prisma.lostRecord.findMany({
      select: {
        quantity: true,
      },
    });

    const totalLost = lostRecords.reduce((sum, record) => sum + record.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalPendingReturn,
        totalLost,
      },
    });
  } catch (error) {
    console.error("Error fetching return stats:", error);
    return NextResponse.json(
      { success: false, error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}

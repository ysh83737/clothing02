import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/stats - 获取统计数据
export async function GET() {
  try {
    // 库存统计
    const inventoryStats = await prisma.clothingItem.aggregate({
      _sum: {
        totalQuantity: true,
        availableQuantity: true,
        lostQuantity: true,
      },
      _count: true,
    });

    // 借出中数量
    const borrowedStats = await prisma.loanRecord.aggregate({
      where: { status: "borrowed" },
      _sum: { quantity: true },
      _count: true,
    });

    // 丢失数量 - 从 LostRecord 表获取
    const lostStats = await prisma.lostRecord.aggregate({
      _sum: { quantity: true },
      _count: true,
    });

    // 活动数量
    const eventCount = await prisma.loanEvent.count({
      where: { status: "active" },
    });

    // 员工数量
    const employeeCount = await prisma.employee.count();

    // 最近借出记录
    const recentLoans = await prisma.loanRecord.findMany({
      take: 10,
      orderBy: { borrowedAt: "desc" },
      include: {
        employee: {
          select: { name: true },
        },
        clothingItem: {
          select: { name: true },
        },
        loanEvent: {
          select: { name: true },
        },
      },
    });

    // 最近归还记录 - 从 ReturnRecord 表获取
    const recentReturns = await prisma.returnRecord.findMany({
      take: 10,
      orderBy: { returnedAt: "desc" },
      include: {
        employee: {
          select: { id: true, name: true },
        },
        clothingItem: {
          select: { id: true, name: true },
        },
        loanRecord: {
          select: {
            id: true,
            quantity: true,
            borrowedAt: true,
            loanEvent: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // 转换数据格式以匹配前端期望
    const formattedReturns = recentReturns.map((r) => ({
      id: r.id,
      quantity: r.quantity,
      returnedAt: r.returnedAt,
      employee: { name: r.employee.name },
      clothingItem: { name: r.clothingItem.name },
      loanEvent: { name: r.loanRecord.loanEvent.name },
    }));

    return NextResponse.json({
      success: true,
      data: {
        inventory: {
          totalQuantity: inventoryStats._sum.totalQuantity || 0,
          availableQuantity: inventoryStats._sum.availableQuantity || 0,
          lostQuantity: inventoryStats._sum.lostQuantity || 0,
          borrowedQuantity:
            (inventoryStats._sum.totalQuantity || 0) -
            (inventoryStats._sum.availableQuantity || 0) -
            (inventoryStats._sum.lostQuantity || 0),
          categoryCount: inventoryStats._count,
        },
        loans: {
          activeCount: borrowedStats._count || 0,
          borrowedQuantity: borrowedStats._sum.quantity || 0,
          lostQuantity: lostStats._sum.quantity || 0,
        },
        events: {
          activeCount: eventCount,
        },
        employees: {
          totalCount: employeeCount,
        },
        recentLoans,
        recentReturns: formattedReturns,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}

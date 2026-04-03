import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/return-record - 获取所有归还记录
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = {};
    if (eventId) {
      where.loanRecord = { loanEventId: eventId };
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const records = await prisma.returnRecord.findMany({
      where,
      include: {
        loanRecord: {
          select: {
            id: true,
            quantity: true,
            borrowedAt: true,
            loanEvent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        clothingItem: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { returnedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching return records:", error);
    return NextResponse.json(
      { success: false, error: "获取归还记录失败" },
      { status: 500 }
    );
  }
}

// POST /api/return-record - 创建归还记录（处理归还逻辑）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loanRecordId, quantity, remark } = body;

    if (!loanRecordId || !quantity) {
      return NextResponse.json(
        { success: false, error: "借出记录ID和归还数量不能为空" },
        { status: 400 }
      );
    }

    // 获取借出记录
    const record = await prisma.loanRecord.findUnique({
      where: { id: loanRecordId },
      include: {
        clothingItem: true,
        lostRecords: true,
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "借出记录不存在" },
        { status: 404 }
      );
    }

    // 计算待归还数量（需要减去已丢失的数量）
    const lostQuantity = record.lostRecords.reduce(
      (sum, lr) => sum + lr.quantity,
      0
    );
    const pendingQuantity = record.quantity - record.returnedQuantity - lostQuantity;

    if (quantity > pendingQuantity) {
      return NextResponse.json(
        { success: false, error: "归还数量不能超过待归还数量" },
        { status: 400 }
      );
    }

    const newReturnedQuantity = record.returnedQuantity + quantity;
    const isFullyReturned = newReturnedQuantity === record.quantity;

    // 创建归还记录并更新库存
    await prisma.$transaction(async (tx) => {
      // 1. 创建归还记录
      await tx.returnRecord.create({
        data: {
          loanRecordId,
          employeeId: record.employeeId,
          clothingItemId: record.clothingItemId,
          quantity,
          remark: remark || null,
        },
      });

      // 2. 更新借出记录状态
      await tx.loanRecord.update({
        where: { id: loanRecordId },
        data: {
          status: isFullyReturned ? "returned" : "borrowed",
          returnedAt: isFullyReturned ? new Date() : null,
          returnedQuantity: newReturnedQuantity,
        },
      });

      // 3. 恢复库存可用数量
      await tx.clothingItem.update({
        where: { id: record.clothingItemId },
        data: {
          availableQuantity: record.clothingItem.availableQuantity + quantity,
        },
      });
    });

    return NextResponse.json({ success: true, message: "归还成功" });
  } catch (error) {
    console.error("Error creating return record:", error);
    return NextResponse.json(
      { success: false, error: "创建归还记录失败" },
      { status: 500 }
    );
  }
}
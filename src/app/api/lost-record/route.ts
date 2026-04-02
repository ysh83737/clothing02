import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/lost-record - 获取丢失记录列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const employeeId = searchParams.get("employeeId");
    const clothingItemId = searchParams.get("clothingItemId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    // 按活动筛选
    if (eventId) {
      where.loanRecord = { loanEventId: eventId };
    }

    // 按员工筛选
    if (employeeId) {
      where.employeeId = employeeId;
    }

    // 按服装筛选
    if (clothingItemId) {
      where.clothingItemId = clothingItemId;
    }

    // 按时间范围筛选
    if (startDate || endDate) {
      where.lostAt = {};
      if (startDate) {
        (where.lostAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.lostAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const records = await prisma.lostRecord.findMany({
      where,
      include: {
        loanRecord: {
          select: {
            id: true,
            quantity: true,
            returnedQuantity: true,
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
      orderBy: { lostAt: "desc" },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching lost records:", error);
    return NextResponse.json(
      { success: false, error: "获取丢失记录失败" },
      { status: 500 }
    );
  }
}

// POST /api/lost-record - 登记丢失记录
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loanRecordId, quantity, reason, remark, lostAt } = body;

    if (!loanRecordId || !quantity) {
      return NextResponse.json(
        { success: false, error: "借出记录和丢失数量不能为空" },
        { status: 400 }
      );
    }

    // 获取借出记录
    const loanRecord = await prisma.loanRecord.findUnique({
      where: { id: loanRecordId },
      include: { clothingItem: true },
    });

    if (!loanRecord) {
      return NextResponse.json(
        { success: false, error: "借出记录不存在" },
        { status: 404 }
      );
    }

    // 计算待处理数量
    const pendingQuantity = loanRecord.quantity - (loanRecord.returnedQuantity || 0);
    if (quantity > pendingQuantity) {
      return NextResponse.json(
        { success: false, error: "丢失数量不能超过待处理数量" },
        { status: 400 }
      );
    }

    // 创建丢失记录并更新相关数据
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建丢失记录
      const lostRecord = await tx.lostRecord.create({
        data: {
          loanRecordId,
          employeeId: loanRecord.employeeId,
          clothingItemId: loanRecord.clothingItemId,
          quantity,
          reason: reason || null,
          remark: remark || null,
          lostAt: lostAt ? new Date(lostAt) : new Date(),
        },
      });

      // 2. 更新借出记录的状态
      const processedQuantity = (loanRecord.returnedQuantity || 0) + quantity;
      const isFullyProcessed = processedQuantity === loanRecord.quantity;

      await tx.loanRecord.update({
        where: { id: loanRecordId },
        data: {
          status: isFullyProcessed ? "lost" : "borrowed",
        },
      });

      // 3. 更新服装库存的丢失数量
      await tx.clothingItem.update({
        where: { id: loanRecord.clothingItemId },
        data: {
          lostQuantity: {
            increment: quantity,
          },
        },
      });

      return lostRecord;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating lost record:", error);
    return NextResponse.json(
      { success: false, error: "登记丢失记录失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/lost-record - 删除丢失记录
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID不能为空" },
        { status: 400 }
      );
    }

    // 获取丢失记录
    const lostRecord = await prisma.lostRecord.findUnique({
      where: { id },
    });

    if (!lostRecord) {
      return NextResponse.json(
        { success: false, error: "丢失记录不存在" },
        { status: 404 }
      );
    }

    // 获取关联的借出记录
    const loanRecord = await prisma.loanRecord.findUnique({
      where: { id: lostRecord.loanRecordId },
    });

    if (!loanRecord) {
      return NextResponse.json(
        { success: false, error: "关联的借出记录不存在" },
        { status: 404 }
      );
    }

    // 执行删除并恢复数据
    await prisma.$transaction(async (tx) => {
      // 1. 删除丢失记录
      await tx.lostRecord.delete({
        where: { id },
      });

      // 2. 恢复借出记录的已归还数量
      const newReturnedQuantity = (loanRecord.returnedQuantity || 0) - lostRecord.quantity;
      await tx.loanRecord.update({
        where: { id: lostRecord.loanRecordId },
        data: {
          returnedQuantity: newReturnedQuantity,
          status: newReturnedQuantity === 0 ? "borrowed" : loanRecord.status,
        },
      });

      // 3. 减少服装库存的丢失数量
      await tx.clothingItem.update({
        where: { id: lostRecord.clothingItemId },
        data: {
          lostQuantity: {
            decrement: lostRecord.quantity,
          },
        },
      });
    });

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("Error deleting lost record:", error);
    return NextResponse.json(
      { success: false, error: "删除丢失记录失败" },
      { status: 500 }
    );
  }
}
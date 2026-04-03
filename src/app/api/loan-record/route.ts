import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/loan-record - 获取所有借出记录
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (eventId) where.loanEventId = eventId;
    if (employeeId) where.employeeId = employeeId;

    // 如果没有指定status参数，返回所有有未处理数量的记录（status为"borrowed"或"lost"但仍有未处理数量的记录）
    if (!status) {
      where.status = { in: ["borrowed", "lost"] };
    } else {
      where.status = status;
    }

    const records = await prisma.loanRecord.findMany({
      where,
      include: {
        loanEvent: {
          select: {
            id: true,
            name: true,
            status: true,
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
        lostRecords: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: { borrowedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching loan records:", error);
    return NextResponse.json(
      { success: false, error: "获取借出记录失败" },
      { status: 500 }
    );
  }
}

// POST /api/loan-record - 创建借出记录
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loanEventId, employeeId, clothingItemId, quantity } = body;

    if (!loanEventId || !employeeId || !clothingItemId || !quantity) {
      return NextResponse.json(
        { success: false, error: "活动、员工、服装和数量不能为空" },
        { status: 400 }
      );
    }

    // 检查服装库存是否充足
    const item = await prisma.clothingItem.findUnique({
      where: { id: clothingItemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "服装不存在" },
        { status: 404 }
      );
    }

    if (item.availableQuantity < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `库存不足，当前可借数量为 ${item.availableQuantity}`,
        },
        { status: 400 }
      );
    }

    // 创建借出记录并更新库存
    const record = await prisma.$transaction(async (tx) => {
      // 创建借出记录
      const newRecord = await tx.loanRecord.create({
        data: {
          loanEventId,
          employeeId,
          clothingItemId,
          quantity,
          status: "borrowed",
        },
      });

      // 更新库存可用数量
      await tx.clothingItem.update({
        where: { id: clothingItemId },
        data: {
          availableQuantity: item.availableQuantity - quantity,
        },
      });

      return newRecord;
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("Error creating loan record:", error);
    return NextResponse.json(
      { success: false, error: "创建借出记录失败" },
      { status: 500 }
    );
  }
}

// PUT /api/loan-record - 更新借出记录（仅处理丢失）
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, quantity } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID不能为空" },
        { status: 400 }
      );
    }

    // 获取当前记录
    const record = await prisma.loanRecord.findUnique({
      where: { id },
      include: { clothingItem: true },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "记录不存在" },
        { status: 404 }
      );
    }

    // 处理丢失
    if (status === "lost") {
      const lostQuantity = quantity || record.quantity;

      const pendingQuantity = record.quantity - (record.returnedQuantity || 0);
      if (lostQuantity > pendingQuantity) {
        return NextResponse.json(
          { success: false, error: "丢失数量不能超过待归还数量" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. 创建丢失记录
        await tx.lostRecord.create({
          data: {
            loanRecordId: record.id,
            employeeId: record.employeeId,
            clothingItemId: record.clothingItemId,
            quantity: lostQuantity,
            lostAt: new Date(),
          },
        });

        // 2. 更新借出记录状态
        await tx.loanRecord.update({
          where: { id },
          data: {
            status: "lost",
            returnedQuantity: record.returnedQuantity + lostQuantity,
          },
        });

        // 3. 更新库存：增加丢失数量
        await tx.clothingItem.update({
          where: { id: record.clothingItemId },
          data: {
            lostQuantity: record.clothingItem.lostQuantity + lostQuantity,
          },
        });
      });

      return NextResponse.json({ success: true, message: "登记丢失成功" });
    }

    return NextResponse.json(
      { success: false, error: "无效的状态" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating loan record:", error);
    return NextResponse.json(
      { success: false, error: "更新借出记录失败" },
      { status: 500 }
    );
  }
}

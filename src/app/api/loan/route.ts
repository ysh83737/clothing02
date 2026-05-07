import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getPaginationParams, paginatedResponse } from "@/lib/api-helpers";

// GET /api/loan - 获取所有活动
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = getPaginationParams(searchParams);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search };
    if (status) where.status = status;

    const [events, total] = await Promise.all([
      prisma.loanEvent.findMany({
        where,
        include: {
          loanRecords: {
            include: {
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
              lostRecords: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loanEvent.count({ where }),
    ]);

    // 计算每个活动的统计
    const result = events.map((event) => {
      const totalBorrowed = event.loanRecords.reduce(
        (sum, r) => sum + r.quantity,
        0
      );

      // 计算归还数量：包括所有已归还的数量（基于 returnedQuantity）
      const totalReturned = event.loanRecords.reduce(
        (sum, r) => sum + (r.returnedQuantity || 0),
        0
      );

      // 计算丢失数量：从 lostRecords 表获取
      const totalLost = event.loanRecords.reduce(
        (sum, r) => sum + r.lostRecords.reduce((s, lr) => s + lr.quantity, 0),
        0
      );

      // 计算未还数量：只计算仍有未处理数量的记录
      const totalActive = totalBorrowed - totalReturned - totalLost;

      return {
        ...event,
        stats: {
          totalBorrowed,
          totalReturned,
          totalLost,
          totalActive,
          recordCount: event.loanRecords.length,
        },
      };
    });

    return NextResponse.json(paginatedResponse(result, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching loan events:", error);
    return NextResponse.json(
      { success: false, error: "获取活动失败" },
      { status: 500 }
    );
  }
}

// POST /api/loan - 创建活动
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "活动名称不能为空" },
        { status: 400 }
      );
    }

    const event = await prisma.loanEvent.create({
      data: {
        name,
        description,
        status: "active",
      },
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Error creating loan event:", error);
    return NextResponse.json(
      { success: false, error: "创建活动失败" },
      { status: 500 }
    );
  }
}

// PUT /api/loan - 更新活动
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID不能为空" },
        { status: 400 }
      );
    }

    const event = await prisma.loanEvent.update({
      where: { id },
      data: {
        name,
        description,
        status,
      },
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Error updating loan event:", error);
    return NextResponse.json(
      { success: false, error: "更新活动失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/loan - 删除活动
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

    // 检查活动是否有未归还的借出记录
    const records = await prisma.loanRecord.findMany({
      where: {
        loanEventId: id,
        status: "borrowed",
      },
    });

    if (records.length > 0) {
      return NextResponse.json(
        { success: false, error: "该活动有未归还的服装，无法删除" },
        { status: 400 }
      );
    }

    // 先删除所有借出记录
    await prisma.loanRecord.deleteMany({
      where: { loanEventId: id },
    });

    // 再删除活动
    await prisma.loanEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting loan event:", error);
    return NextResponse.json(
      { success: false, error: "删除活动失败" },
      { status: 500 }
    );
  }
}

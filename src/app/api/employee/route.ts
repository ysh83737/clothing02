import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getPaginationParams, paginatedResponse } from "@/lib/api-helpers";

// GET /api/employee - 获取所有员工
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = getPaginationParams(searchParams);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          loanRecords: {
            select: {
              id: true,
              quantity: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    // 计算每个员工的借出数量
    const result = employees.map((emp) => ({
      ...emp,
      borrowedCount: emp.loanRecords.filter((r) => r.status === "borrowed").length,
      totalLoans: emp.loanRecords.length,
    }));

    return NextResponse.json(paginatedResponse(result, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, error: "获取员工失败" },
      { status: 500 }
    );
  }
}

// POST /api/employee - 创建员工
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, department, phone } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "姓名不能为空" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: { name, department, phone },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { success: false, error: "创建员工失败" },
      { status: 500 }
    );
  }
}

// PUT /api/employee - 更新员工
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, department, phone } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID不能为空" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { name, department, phone },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { success: false, error: "更新员工失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/employee - 删除员工
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

    // 检查员工是否有未归还的借出记录
    const records = await prisma.loanRecord.findMany({
      where: {
        employeeId: id,
        status: "borrowed",
      },
    });

    if (records.length > 0) {
      return NextResponse.json(
        { success: false, error: "该员工有未归还的服装，无法删除" },
        { status: 400 }
      );
    }

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { success: false, error: "删除员工失败" },
      { status: 500 }
    );
  }
}

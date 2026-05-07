import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getPaginationParams, paginatedResponse } from "@/lib/api-helpers";

// GET /api/inventory - 获取所有库存
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = getPaginationParams(searchParams);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { size: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.clothingItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clothingItem.count({ where }),
    ]);

    // 添加计算字段
    const itemsWithStats = items.map((item) => ({
      ...item,
      borrowedQuantity: item.totalQuantity - item.availableQuantity - item.lostQuantity,
    }));

    return NextResponse.json(paginatedResponse(itemsWithStats, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { success: false, error: "获取库存失败" },
      { status: 500 }
    );
  }
}

// POST /api/inventory - 创建库存记录（入库）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, categoryId, size, quantity, unit } = body;

    if (!name || !categoryId || !quantity) {
      return NextResponse.json(
        { success: false, error: "名称、品类和数量不能为空" },
        { status: 400 }
      );
    }

    // 检查品类是否存在
    const category = await prisma.clothingCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "品类不存在" },
        { status: 404 }
      );
    }

    // 检查是否已存在相同的库存记录
    const existingItem = await prisma.clothingItem.findFirst({
      where: {
        name,
        categoryId,
        size: size || null,
      },
    });

    let item;
    if (existingItem) {
      // 更新现有记录
      item = await prisma.clothingItem.update({
        where: { id: existingItem.id },
        data: {
          totalQuantity: existingItem.totalQuantity + quantity,
          availableQuantity: existingItem.availableQuantity + quantity,
        },
      });
    } else {
      // 创建新记录
      item = await prisma.clothingItem.create({
        data: {
          name,
          categoryId,
          size: size || null,
          totalQuantity: quantity,
          availableQuantity: quantity,
          unit: unit || "件",
        },
      });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Error creating inventory:", error);
    return NextResponse.json(
      { success: false, error: "创建库存失败" },
      { status: 500 }
    );
  }
}

// PUT /api/inventory - 更新库存
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, size, unit } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID不能为空" },
        { status: 400 }
      );
    }

    const item = await prisma.clothingItem.update({
      where: { id },
      data: {
        name,
        size: size || null,
        unit,
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { success: false, error: "更新库存失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory - 删除库存
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

    await prisma.clothingItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory:", error);
    return NextResponse.json(
      { success: false, error: "删除库存失败" },
      { status: 500 }
    );
  }
}

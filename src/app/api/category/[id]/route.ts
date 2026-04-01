import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/category/[id] - 更新品类
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameEn } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID不能为空" },
        { status: 400 }
      );
    }

    const category = await prisma.clothingCategory.update({
      where: { id },
      data: { name, nameEn },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, error: "更新品类失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/category/[id] - 删除品类
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID不能为空" },
        { status: 400 }
      );
    }

    // 检查品类下是否有库存
    const items = await prisma.clothingItem.findMany({
      where: { categoryId: id },
    });

    if (items.length > 0) {
      return NextResponse.json(
        { success: false, error: "该品类下有库存记录，无法删除" },
        { status: 400 }
      );
    }

    await prisma.clothingCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: "删除品类失败" },
      { status: 500 }
    );
  }
}

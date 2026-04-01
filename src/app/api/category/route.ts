import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/category - 获取所有品类
export async function GET() {
  try {
    const categories = await prisma.clothingCategory.findMany({
      include: {
        items: {
          select: {
            id: true,
            totalQuantity: true,
            availableQuantity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 计算每个品类的库存汇总
    const result = categories.map((cat) => ({
      ...cat,
      totalItems: cat.items.length,
      totalQuantity: cat.items.reduce((sum, item) => sum + item.totalQuantity, 0),
      availableQuantity: cat.items.reduce(
        (sum, item) => sum + item.availableQuantity,
        0
      ),
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "获取品类失败" },
      { status: 500 }
    );
  }
}

// POST /api/category - 创建新品类
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameEn } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "品类名称不能为空" },
        { status: 400 }
      );
    }

    const category = await prisma.clothingCategory.create({
      data: { name, nameEn },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: "创建品类失败" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { computeNamePinyin } from "@/lib/pinyin";
import * as XLSX from "xlsx";

interface ImportRow {
  name: string;
  categoryName: string;
  size: string;
  quantity: number;
  unit: string;
}

interface ImportError {
  row: number;
  name: string;
  reason: string;
}

function normalizeHeader(header: string): string {
  const map: Record<string, string> = {
    "服装名称": "name",
    "name": "name",
    "品类": "category",
    "category": "category",
    "尺码": "size",
    "size": "size",
    "数量": "quantity",
    "quantity": "quantity",
    "单位": "unit",
    "unit": "unit",
  };
  return map[header.trim()] || "";
}

// POST /api/inventory/batch - 批量导入库存
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "请上传文件" },
        { status: 400 }
      );
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { success: false, error: "仅支持 .xlsx 或 .xls 格式文件" },
        { status: 400 }
      );
    }

    // 解析 Excel
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: "文件为空，没有可读取的工作表" },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { header: "A" });

    if (rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: "文件中没有数据（第一行为表头，需要至少一行数据）" },
        { status: 400 }
      );
    }

    // 提取表头并映射
    const headerRow = rawData[0];
    const colIndexMap: Record<string, string> = {};

    for (const key of Object.keys(headerRow)) {
      const field = normalizeHeader(headerRow[key]);
      if (field) {
        colIndexMap[key] = field;
      }
    }

    // 解析数据行
    const rows: ImportRow[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const entry: ImportRow = {
        name: "",
        categoryName: "",
        size: "",
        quantity: 0,
        unit: "件",
      };
      for (const key of Object.keys(colIndexMap)) {
        const field = colIndexMap[key];
        const value = (row[key] || "").toString().trim();
        if (field === "name") entry.name = value;
        else if (field === "category") entry.categoryName = value;
        else if (field === "size") entry.size = value;
        else if (field === "quantity") entry.quantity = parseInt(value) || 0;
        else if (field === "unit") entry.unit = value || "件";
      }
      rows.push(entry);
    }

    // 校验
    const errors: ImportError[] = [];
    const validRows: ImportRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      if (!row.name) {
        errors.push({ row: rowNum, name: "", reason: "服装名称为空" });
        continue;
      }

      if (!row.categoryName) {
        errors.push({ row: rowNum, name: row.name, reason: "品类为空" });
        continue;
      }

      if (row.quantity <= 0) {
        errors.push({ row: rowNum, name: row.name, reason: "数量必须为正整数" });
        continue;
      }

      validRows.push(row);
    }

    if (validRows.length === 0) {
      return NextResponse.json({
        success: true,
        data: { created: 0, updated: 0, skipped: errors.length, total: rows.length, errors },
      });
    }

    // 查询所有品类建立名称→ID 映射
    const allCategories = await prisma.clothingCategory.findMany();
    const categoryNameMap = new Map<string, string>();
    for (const cat of allCategories) {
      categoryNameMap.set(cat.name.toLowerCase(), cat.id);
      if (cat.nameEn) categoryNameMap.set(cat.nameEn.toLowerCase(), cat.id);
      if (cat.namePinyin) categoryNameMap.set(cat.namePinyin.toLowerCase(), cat.id);
    }

    // 品类校验 + 文件内去重
    const dedupMap = new Map<string, ImportRow & { categoryId: string }>();
    const finalErrors: ImportError[] = [...errors];

    for (const row of validRows) {
      const categoryId = categoryNameMap.get(row.categoryName.toLowerCase());

      if (!categoryId) {
        const originalIndex = rows.indexOf(row);
        finalErrors.push({
          row: originalIndex + 2,
          name: row.name,
          reason: `品类"${row.categoryName}"不存在`,
        });
        continue;
      }

      // 文件内去重：相同 name + categoryId + size 合并数量
      const key = `${row.name}|${categoryId}|${row.size}`;
      const existing = dedupMap.get(key);
      if (existing) {
        existing.quantity += row.quantity;
      } else {
        dedupMap.set(key, { ...row, categoryId });
      }
    }

    // 逐条处理：先查询再决定创建或追加
    let created = 0;
    let updated = 0;

    for (const [, row] of dedupMap) {
      const existingItem = await prisma.clothingItem.findFirst({
        where: {
          name: row.name,
          categoryId: row.categoryId,
          size: row.size || null,
        },
      });

      if (existingItem) {
        await prisma.clothingItem.update({
          where: { id: existingItem.id },
          data: {
            totalQuantity: existingItem.totalQuantity + row.quantity,
            availableQuantity: existingItem.availableQuantity + row.quantity,
          },
        });
        updated++;
      } else {
        await prisma.clothingItem.create({
          data: {
            name: row.name,
            namePinyin: computeNamePinyin(row.name),
            categoryId: row.categoryId,
            size: row.size || null,
            totalQuantity: row.quantity,
            availableQuantity: row.quantity,
            unit: row.unit || "件",
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created,
        updated,
        skipped: finalErrors.length,
        total: rows.length,
        errors: finalErrors,
      },
    });
  } catch (error) {
    console.error("Error batch importing inventory:", error);
    return NextResponse.json(
      { success: false, error: "文件解析失败，请检查文件格式是否正确" },
      { status: 500 }
    );
  }
}

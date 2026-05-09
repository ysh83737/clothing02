import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { computeNamePinyin } from "@/lib/pinyin";
import * as XLSX from "xlsx";

interface ImportRow {
  name: string;
  department: string;
  phone: string;
}

interface ImportError {
  row: number;
  name: string;
  reason: string;
}

function normalizeHeader(header: string): string {
  const map: Record<string, string> = {
    "姓名": "name",
    "name": "name",
    "部门": "department",
    "department": "department",
    "电话": "phone",
    "phone": "phone",
  };
  return map[header.trim()] || "";
}

// POST /api/employee/batch - 批量导入员工
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

    // 校验文件类型
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
      const entry: ImportRow = { name: "", department: "", phone: "" };
      for (const key of Object.keys(colIndexMap)) {
        const field = colIndexMap[key];
        const value = (row[key] || "").toString().trim();
        if (field === "name") entry.name = value;
        else if (field === "department") entry.department = value;
        else if (field === "phone") entry.phone = value;
      }
      rows.push(entry);
    }

    // 校验
    const errors: ImportError[] = [];
    const validRows: ImportRow[] = [];
    const nameSet = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel 行号（第1行表头，第2行开始数据）

      if (!row.name) {
        errors.push({ row: rowNum, name: "", reason: "姓名为空" });
        continue;
      }

      const nameLower = row.name.toLowerCase();
      if (nameSet.has(nameLower)) {
        errors.push({ row: rowNum, name: row.name, reason: "文件中姓名重复" });
        continue;
      }
      nameSet.add(nameLower);

      validRows.push(row);
    }

    if (validRows.length === 0) {
      return NextResponse.json({
        success: true,
        data: { created: 0, skipped: errors.length, total: rows.length, errors },
      });
    }

    // 查重：与数据库已有员工比较
    const existingNames = await prisma.employee.findMany({
      where: { name: { in: validRows.map((r) => r.name) } },
      select: { name: true },
    });
    const existingNameSet = new Set(existingNames.map((e) => e.name.toLowerCase()));

    const toCreate: { name: string; namePinyin: string; department: string | null; phone: string | null }[] = [];
    const finalErrors: ImportError[] = [...errors];

    for (const row of validRows) {
      if (existingNameSet.has(row.name.toLowerCase())) {
        // 找到它在原始 rows 中的位置以计算行号
        const originalIndex = rows.indexOf(row);
        finalErrors.push({
          row: originalIndex + 2,
          name: row.name,
          reason: "与已有员工重复",
        });
        continue;
      }
      toCreate.push({
        name: row.name,
        namePinyin: computeNamePinyin(row.name),
        department: row.department || null,
        phone: row.phone || null,
      });
    }

    if (toCreate.length > 0) {
      await prisma.employee.createMany({ data: toCreate });
    }

    return NextResponse.json({
      success: true,
      data: {
        created: toCreate.length,
        skipped: finalErrors.length,
        total: rows.length,
        errors: finalErrors,
      },
    });
  } catch (error) {
    console.error("Error batch importing employees:", error);
    return NextResponse.json(
      { success: false, error: "文件解析失败，请检查文件格式是否正确" },
      { status: 500 }
    );
  }
}

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import pinyin from "tiny-pinyin";

function namePinyin(name: string): string {
  if (!name || !pinyin.isSupported()) return name.toLowerCase();
  const full = pinyin.convertToPinyin(name, "", true);
  const words = pinyin.convertToPinyin(name, " ", true).split(" ");
  const initials = words.map((w) => w[0] || "").join("");
  if (full === name.toLowerCase()) return "";
  return `${full} ${initials}`;
}

async function main() {
  const adapter = new PrismaLibSql({
    url: process.env["DATABASE_URL"] as string,
  });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding database...");

  // Create categories
  const categories = await Promise.all([
    prisma.clothingCategory.create({
      data: { name: "裤子", nameEn: "Pants", namePinyin: namePinyin("裤子") },
    }),
    prisma.clothingCategory.create({
      data: { name: "衬衫", nameEn: "Shirts", namePinyin: namePinyin("衬衫") },
    }),
    prisma.clothingCategory.create({
      data: { name: "裙子", nameEn: "Skirts", namePinyin: namePinyin("裙子") },
    }),
    prisma.clothingCategory.create({
      data: { name: "外套", nameEn: "Jackets", namePinyin: namePinyin("外套") },
    }),
    prisma.clothingCategory.create({
      data: { name: "配饰", nameEn: "Accessories", namePinyin: namePinyin("配饰") },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Create inventory items
  const items = await Promise.all([
    prisma.clothingItem.create({
      data: {
        name: "黑色西装裤",
        categoryId: categories[0].id,
        size: "M",
        totalQuantity: 20,
        availableQuantity: 20,
        unit: "条",
        namePinyin: namePinyin("黑色西装裤"),
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "白色正装衬衫",
        categoryId: categories[1].id,
        size: "L",
        totalQuantity: 15,
        availableQuantity: 15,
        unit: "件",
        namePinyin: namePinyin("白色正装衬衫"),
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "黑色职业裙",
        categoryId: categories[2].id,
        size: "S",
        totalQuantity: 10,
        availableQuantity: 10,
        unit: "条",
        namePinyin: namePinyin("黑色职业裙"),
      },
    }),
  ]);

  console.log(`Created ${items.length} inventory items`);

  // Create employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: { name: "张三", department: "市场部", phone: "13800138001", namePinyin: namePinyin("张三") },
    }),
    prisma.employee.create({
      data: { name: "李四", department: "销售部", phone: "13800138002", namePinyin: namePinyin("李四") },
    }),
    prisma.employee.create({
      data: { name: "王五", department: "行政部", phone: "13800138003", namePinyin: namePinyin("王五") },
    }),
  ]);

  console.log(`Created ${employees.length} employees`);

  console.log("Seeding completed!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

-- CreateTable
CREATE TABLE "LostRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanRecordId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "clothingItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lostAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "remark" TEXT,
    CONSTRAINT "LostRecord_loanRecordId_fkey" FOREIGN KEY ("loanRecordId") REFERENCES "LoanRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LostRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LostRecord_clothingItemId_fkey" FOREIGN KEY ("clothingItemId") REFERENCES "ClothingItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClothingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "size" TEXT,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "lostQuantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '件',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClothingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ClothingCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClothingItem" ("availableQuantity", "categoryId", "createdAt", "id", "name", "size", "totalQuantity", "unit") SELECT "availableQuantity", "categoryId", "createdAt", "id", "name", "size", "totalQuantity", "unit" FROM "ClothingItem";
DROP TABLE "ClothingItem";
ALTER TABLE "new_ClothingItem" RENAME TO "ClothingItem";
CREATE TABLE "new_LoanRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanEventId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "clothingItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'borrowed',
    "borrowedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" DATETIME,
    CONSTRAINT "LoanRecord_loanEventId_fkey" FOREIGN KEY ("loanEventId") REFERENCES "LoanEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanRecord_clothingItemId_fkey" FOREIGN KEY ("clothingItemId") REFERENCES "ClothingItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoanRecord" ("borrowedAt", "clothingItemId", "employeeId", "id", "loanEventId", "quantity", "returnedAt", "status") SELECT "borrowedAt", "clothingItemId", "employeeId", "id", "loanEventId", "quantity", "returnedAt", "status" FROM "LoanRecord";
DROP TABLE "LoanRecord";
ALTER TABLE "new_LoanRecord" RENAME TO "LoanRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

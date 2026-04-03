-- CreateTable
CREATE TABLE "ReturnRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanRecordId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "clothingItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    CONSTRAINT "ReturnRecord_loanRecordId_fkey" FOREIGN KEY ("loanRecordId") REFERENCES "LoanRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnRecord_clothingItemId_fkey" FOREIGN KEY ("clothingItemId") REFERENCES "ClothingItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

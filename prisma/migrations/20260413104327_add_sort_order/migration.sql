-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "shotNumber" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "shotType" TEXT,
    "subject" TEXT,
    "action" TEXT,
    "emotion" TEXT,
    "scene" TEXT,
    "dialog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "finalImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Shot" ("action", "createdAt", "dialog", "emotion", "finalImageUrl", "id", "projectId", "scene", "shotNumber", "shotType", "status", "subject", "updatedAt") SELECT "action", "createdAt", "dialog", "emotion", "finalImageUrl", "id", "projectId", "scene", "shotNumber", "shotType", "status", "subject", "updatedAt" FROM "Shot";
DROP TABLE "Shot";
ALTER TABLE "new_Shot" RENAME TO "Shot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

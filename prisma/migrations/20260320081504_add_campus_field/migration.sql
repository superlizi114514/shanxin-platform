-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CampusBuilding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "campus" TEXT NOT NULL DEFAULT 'kuwen',
    "coordinates" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CampusBuilding" ("address", "coordinates", "createdAt", "description", "id", "name", "order", "updatedAt") SELECT "address", "coordinates", "createdAt", "description", "id", "name", "order", "updatedAt" FROM "CampusBuilding";
DROP TABLE "CampusBuilding";
ALTER TABLE "new_CampusBuilding" RENAME TO "CampusBuilding";
CREATE UNIQUE INDEX "CampusBuilding_name_key" ON "CampusBuilding"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

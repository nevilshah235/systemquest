-- Sprint 2 Migration: Spaced Repetition (F-005) + Mistake Patterns (F-003)
-- RedefineTables required for new relations on User and Mission models.

-- SpacedRepetitionItem table
CREATE TABLE "spaced_repetition_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetition" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "nextReviewAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastScore" INTEGER NOT NULL DEFAULT 0,
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "graduated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spaced_repetition_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "spaced_repetition_items_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "spaced_repetition_items_userId_missionId_key"
    ON "spaced_repetition_items"("userId", "missionId");

-- MistakePattern table
CREATE TABLE "mistake_patterns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "patternSlug" TEXT NOT NULL,
    "patternName" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "affectedMissions" TEXT NOT NULL DEFAULT '[]',
    "conceptSlug" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mistake_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "mistake_patterns_userId_patternSlug_key"
    ON "mistake_patterns"("userId", "patternSlug");

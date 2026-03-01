-- CreateTable
CREATE TABLE "lld_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "classDesign" TEXT NOT NULL DEFAULT '',
    "apiContracts" TEXT NOT NULL DEFAULT '',
    "dataSchema" TEXT NOT NULL DEFAULT '',
    "lldState" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "feedback" TEXT NOT NULL DEFAULT '[]',
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lld_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lld_attempts_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "followupLog" TEXT NOT NULL DEFAULT '[]',
    "rubricScores" TEXT NOT NULL DEFAULT '{}',
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "finalArchitecture" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "interview_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "interview_sessions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mission_rubrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionSlug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mission_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "architecture" TEXT NOT NULL DEFAULT '{}',
    "metrics" TEXT NOT NULL DEFAULT '{}',
    "comparisonViewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mission_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mission_attempts_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mission_attempts" ("architecture", "completed", "createdAt", "id", "metrics", "missionId", "score", "updatedAt", "userId", "xpEarned") SELECT "architecture", "completed", "createdAt", "id", "metrics", "missionId", "score", "updatedAt", "userId", "xpEarned" FROM "mission_attempts";
DROP TABLE "mission_attempts";
ALTER TABLE "new_mission_attempts" RENAME TO "mission_attempts";
CREATE TABLE "new_missions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimatedTime" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "components" TEXT NOT NULL,
    "feedbackData" TEXT NOT NULL,
    "learningPath" TEXT NOT NULL DEFAULT 'foundations',
    "skillLevel" TEXT NOT NULL DEFAULT 'beginner',
    "lldEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lldContent" TEXT,
    "lldConfig" TEXT,
    "referenceSolution" TEXT
);
INSERT INTO "new_missions" ("components", "description", "difficulty", "estimatedTime", "feedbackData", "id", "objectives", "order", "requirements", "scenario", "slug", "title", "xpReward") SELECT "components", "description", "difficulty", "estimatedTime", "feedbackData", "id", "objectives", "order", "requirements", "scenario", "slug", "title", "xpReward" FROM "missions";
DROP TABLE "missions";
ALTER TABLE "new_missions" RENAME TO "missions";
CREATE UNIQUE INDEX "missions_slug_key" ON "missions"("slug");
CREATE TABLE "new_mistake_patterns" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mistake_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mistake_patterns" ("affectedMissions", "conceptSlug", "createdAt", "dimension", "frequency", "id", "isResolved", "lastSeenAt", "patternName", "patternSlug", "updatedAt", "userId") SELECT "affectedMissions", "conceptSlug", "createdAt", "dimension", "frequency", "id", "isResolved", "lastSeenAt", "patternName", "patternSlug", "updatedAt", "userId" FROM "mistake_patterns";
DROP TABLE "mistake_patterns";
ALTER TABLE "new_mistake_patterns" RENAME TO "mistake_patterns";
CREATE UNIQUE INDEX "mistake_patterns_userId_patternSlug_key" ON "mistake_patterns"("userId", "patternSlug");
CREATE TABLE "new_spaced_repetition_items" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "spaced_repetition_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "spaced_repetition_items_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_spaced_repetition_items" ("createdAt", "easeFactor", "graduated", "id", "interval", "lastScore", "missionId", "nextReviewAt", "repetition", "snoozeCount", "updatedAt", "userId") SELECT "createdAt", "easeFactor", "graduated", "id", "interval", "lastScore", "missionId", "nextReviewAt", "repetition", "snoozeCount", "updatedAt", "userId" FROM "spaced_repetition_items";
DROP TABLE "spaced_repetition_items";
ALTER TABLE "new_spaced_repetition_items" RENAME TO "spaced_repetition_items";
CREATE UNIQUE INDEX "spaced_repetition_items_userId_missionId_key" ON "spaced_repetition_items"("userId", "missionId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "skillLevel" TEXT NOT NULL DEFAULT 'beginner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "level", "passwordHash", "updatedAt", "username", "xp") SELECT "createdAt", "email", "id", "level", "passwordHash", "updatedAt", "username", "xp" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "mission_rubrics_missionSlug_version_key" ON "mission_rubrics"("missionSlug", "version");

-- Migration: 20260817_esbirka_database_layer
-- Description: Non-destructive persistent database layer for e-Sbírka / e-Legislativa integration
-- Compatible with PostgreSQL 16

-- 1. Create Enums safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LegalActStatus') THEN
        CREATE TYPE "LegalActStatus" AS ENUM ('ACTIVE', 'AMENDED', 'REPEALED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SyncAuditStatus') THEN
        CREATE TYPE "SyncAuditStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'UNCHANGED', 'FAILED', 'SKIPPED', 'RATE_LIMITED', 'QUOTA_EXCEEDED');
    END IF;
END $$;

-- 2. Create Table LegalAct
CREATE TABLE IF NOT EXISTS "LegalAct" (
    "id" TEXT NOT NULL,
    "actCode" TEXT NOT NULL,
    "actNumber" INTEGER NOT NULL,
    "actYear" INTEGER NOT NULL,
    "collection" TEXT NOT NULL DEFAULT 'Sb.',
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "actType" TEXT NOT NULL DEFAULT 'ZAKON',
    "category" TEXT NOT NULL DEFAULT 'FAMILY_LAW',
    "status" "LegalActStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'ESBIRKA',
    "sourceUri" TEXT,
    "passedDate" TIMESTAMP(3),
    "promulgationDate" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "lastAmendedDate" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "contentHash" TEXT NOT NULL,
    "etag" TEXT,
    "syncPriority" INTEGER NOT NULL DEFAULT 10,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAct_pkey" PRIMARY KEY ("id")
);

-- Unique index on actCode
CREATE UNIQUE INDEX IF NOT EXISTS "LegalAct_actCode_key" ON "LegalAct"("actCode");
CREATE INDEX IF NOT EXISTS "LegalAct_actCode_idx" ON "LegalAct"("actCode");
CREATE INDEX IF NOT EXISTS "LegalAct_category_idx" ON "LegalAct"("category");
CREATE INDEX IF NOT EXISTS "LegalAct_status_idx" ON "LegalAct"("status");
CREATE INDEX IF NOT EXISTS "LegalAct_effectiveFrom_idx" ON "LegalAct"("effectiveFrom");
CREATE INDEX IF NOT EXISTS "LegalAct_lastSyncedAt_idx" ON "LegalAct"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "LegalAct_syncPriority_idx" ON "LegalAct"("syncPriority");

-- 3. Create Table LegalActSection
CREATE TABLE IF NOT EXISTS "LegalActSection" (
    "id" TEXT NOT NULL,
    "legalActId" TEXT NOT NULL,
    "sectionNumber" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isKeySection" BOOLEAN NOT NULL DEFAULT false,
    "practicalNote" TEXT,
    "courtRelevance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalActSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LegalActSection_legalActId_sectionNumber_key" ON "LegalActSection"("legalActId", "sectionNumber");
CREATE INDEX IF NOT EXISTS "LegalActSection_legalActId_idx" ON "LegalActSection"("legalActId");
CREATE INDEX IF NOT EXISTS "LegalActSection_sectionNumber_idx" ON "LegalActSection"("sectionNumber");
CREATE INDEX IF NOT EXISTS "LegalActSection_isKeySection_idx" ON "LegalActSection"("isKeySection");

-- 4. Create Table LegalActVersion
CREATE TABLE IF NOT EXISTS "LegalActVersion" (
    "id" TEXT NOT NULL,
    "legalActId" TEXT NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "promulgationDate" TIMESTAMP(3),
    "contentSnapshot" JSONB,
    "contentHash" TEXT NOT NULL,
    "changeSummary" TEXT,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalActVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LegalActVersion_legalActId_idx" ON "LegalActVersion"("legalActId");
CREATE INDEX IF NOT EXISTS "LegalActVersion_effectiveFrom_idx" ON "LegalActVersion"("effectiveFrom");
CREATE INDEX IF NOT EXISTS "LegalActVersion_contentHash_idx" ON "LegalActVersion"("contentHash");

-- 5. Create Table LegalSyncAudit
CREATE TABLE IF NOT EXISTS "LegalSyncAudit" (
    "id" TEXT NOT NULL,
    "legalActId" TEXT,
    "actCode" TEXT NOT NULL,
    "syncType" TEXT NOT NULL DEFAULT 'AUTOMATIC_CRON',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "status" "SyncAuditStatus" NOT NULL,
    "httpStatus" INTEGER,
    "apiCallsCount" INTEGER NOT NULL DEFAULT 1,
    "recordsReceived" INTEGER NOT NULL DEFAULT 0,
    "recordsNew" INTEGER NOT NULL DEFAULT 0,
    "recordsChanged" INTEGER NOT NULL DEFAULT 0,
    "recordsUnchanged" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "responseHash" TEXT,
    "errorMessage" TEXT,
    "initiatedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "quotaUsageIn24h" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalSyncAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LegalSyncAudit_actCode_idx" ON "LegalSyncAudit"("actCode");
CREATE INDEX IF NOT EXISTS "LegalSyncAudit_status_idx" ON "LegalSyncAudit"("status");
CREATE INDEX IF NOT EXISTS "LegalSyncAudit_startedAt_idx" ON "LegalSyncAudit"("startedAt");
CREATE INDEX IF NOT EXISTS "LegalSyncAudit_syncType_idx" ON "LegalSyncAudit"("syncType");

-- 6. Create Table EsbirkaQuotaAudit
CREATE TABLE IF NOT EXISTS "EsbirkaQuotaAudit" (
    "id" TEXT NOT NULL,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestType" TEXT NOT NULL DEFAULT 'GET_ACT',
    "endpoint" TEXT NOT NULL,
    "actCode" TEXT,
    "httpStatus" INTEGER,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "syncAuditId" TEXT,
    "responseHash" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EsbirkaQuotaAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EsbirkaQuotaAudit_calledAt_idx" ON "EsbirkaQuotaAudit"("calledAt");
CREATE INDEX IF NOT EXISTS "EsbirkaQuotaAudit_actCode_idx" ON "EsbirkaQuotaAudit"("actCode");
CREATE INDEX IF NOT EXISTS "EsbirkaQuotaAudit_requestType_idx" ON "EsbirkaQuotaAudit"("requestType");

-- 7. Add Foreign Key Constraints Safely
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LegalActSection_legalActId_fkey'
    ) THEN
        ALTER TABLE "LegalActSection" 
        ADD CONSTRAINT "LegalActSection_legalActId_fkey" 
        FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LegalActVersion_legalActId_fkey'
    ) THEN
        ALTER TABLE "LegalActVersion" 
        ADD CONSTRAINT "LegalActVersion_legalActId_fkey" 
        FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LegalSyncAudit_legalActId_fkey'
    ) THEN
        ALTER TABLE "LegalSyncAudit" 
        ADD CONSTRAINT "LegalSyncAudit_legalActId_fkey" 
        FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

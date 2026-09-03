-- ============================================================================
-- Migration: 20260903_dev3_synthesis_and_legacy_cleanup
-- Scope: DEV3 Zero-Loss Synthesis Transition & Legacy Data Preservation
-- Mandate:
--   1. ZERO DATA LOSS: NO DROP TABLE, NO TRUNCATE, NO DELETE.
--   2. Preserve all existing rows (Audit, AuditFinding, SynthesisTicket, OutboxEvent).
--   3. Quarantine rename legacy tables:
--      Audit -> Audit_LEGACY_PENDING_CLEANUP
--      Verification -> Verification_LEGACY_PENDING_CLEANUP
--      OutboxEvent -> OutboxEvent_LEGACY_PENDING_CLEANUP
--   4. Drop dangerous foreign keys BEFORE renaming to prevent cascading deletes.
--   5. Retain legacy columns in SynthesisTicket (auditId, findingId, priority, publicId).
--   6. Retain legacy columns in AuditFinding (auditId, publicId, evidence, recommendation, verificationStatus).
--   7. Full normalization of historical SynthesisStatus values with fail-safe abort.
--   8. Deterministic dedupHash calculation without overwriting existing data.
--   9. Fully aligned with current prisma/schema.prisma.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP RISKY FOREIGN KEYS (PREVENT ACCIDENTAL CASCADING DELETES)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS "AuditFinding" DROP CONSTRAINT IF EXISTS "AuditFinding_auditId_fkey";
ALTER TABLE IF EXISTS "SynthesisTicket" DROP CONSTRAINT IF EXISTS "SynthesisTicket_auditId_fkey";
ALTER TABLE IF EXISTS "SynthesisTicket" DROP CONSTRAINT IF EXISTS "SynthesisTicket_findingId_fkey";
ALTER TABLE IF EXISTS "Verification" DROP CONSTRAINT IF EXISTS "Verification_ticketId_fkey";

-- ----------------------------------------------------------------------------
-- 2. QUARANTINE RENAMING FOR LEGACY MODELS (NO DROP TABLE)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit_LEGACY_PENDING_CLEANUP') THEN
        ALTER TABLE "Audit" RENAME TO "Audit_LEGACY_PENDING_CLEANUP";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Verification')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Verification_LEGACY_PENDING_CLEANUP') THEN
        ALTER TABLE "Verification" RENAME TO "Verification_LEGACY_PENDING_CLEANUP";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'OutboxEvent')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'OutboxEvent_LEGACY_PENDING_CLEANUP') THEN
        ALTER TABLE "OutboxEvent" RENAME TO "OutboxEvent_LEGACY_PENDING_CLEANUP";
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. RETAIN LEGACY COLUMNS (RELAX CONSTRAINTS, NO DROP COLUMN)
-- ----------------------------------------------------------------------------
-- SynthesisTicket legacy columns: auditId, findingId, priority, publicId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SynthesisTicket' AND column_name = 'auditId') THEN
        ALTER TABLE "SynthesisTicket" ALTER COLUMN "auditId" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SynthesisTicket' AND column_name = 'findingId') THEN
        ALTER TABLE "SynthesisTicket" ALTER COLUMN "findingId" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SynthesisTicket' AND column_name = 'priority') THEN
        ALTER TABLE "SynthesisTicket" ALTER COLUMN "priority" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SynthesisTicket' AND column_name = 'publicId') THEN
        ALTER TABLE "SynthesisTicket" ALTER COLUMN "publicId" DROP NOT NULL;
    END IF;
END $$;

-- AuditFinding legacy columns: auditId, publicId, evidence, recommendation, verificationStatus
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AuditFinding' AND column_name = 'auditId') THEN
        ALTER TABLE "AuditFinding" ALTER COLUMN "auditId" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AuditFinding' AND column_name = 'publicId') THEN
        ALTER TABLE "AuditFinding" ALTER COLUMN "publicId" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AuditFinding' AND column_name = 'evidence') THEN
        ALTER TABLE "AuditFinding" ALTER COLUMN "evidence" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AuditFinding' AND column_name = 'recommendation') THEN
        ALTER TABLE "AuditFinding" ALTER COLUMN "recommendation" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AuditFinding' AND column_name = 'verificationStatus') THEN
        ALTER TABLE "AuditFinding" ALTER COLUMN "verificationStatus" DROP NOT NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. SYNTHESIS ENUMS INITIALIZATION
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SynthesisSource') THEN
        CREATE TYPE "SynthesisSource" AS ENUM (
            'QA_ENGINE', 'AUDIT_DOCUMENT', 'CODERABBIT', 'SUPPORT_PORTAL', 'MANUAL_ADMIN',
            'QA_RUN', 'SUPPORT_TICKET', 'COMMUNITY_FEEDBACK', 'MANUAL_ENTRY'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SynthesisSeverity') THEN
        CREATE TYPE "SynthesisSeverity" AS ENUM ('P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW', 'INFO');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SynthesisCategory') THEN
        CREATE TYPE "SynthesisCategory" AS ENUM (
            'SECURITY', 'DATA_INTEGRITY', 'PERSISTENCE', 'FUNCTIONAL', 'API',
            'E2E', 'INVARIANT', 'REGRESSION', 'PERFORMANCE', 'UX', 'DEVOPS'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GitHubSyncStatus') THEN
        CREATE TYPE "GitHubSyncStatus" AS ENUM (
            'NOT_SYNCED', 'ISSUE_CREATED', 'PR_LINKED', 'CLOSED_BY_COMMIT',
            'SYNC_ERROR', 'PENDING', 'SYNCED', 'FAILED'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. NORMALIZATION OF SynthesisStatus & FAIL-SAFE VALIDATION
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    invalid_cnt INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SynthesisTicket') THEN
        -- Normalize historical values
        UPDATE "SynthesisTicket" SET "status" = 'DISCOVERED' WHERE "status"::text = 'NEW';
        UPDATE "SynthesisTicket" SET "status" = 'IN_TRIAGE' WHERE "status"::text = 'TRIAGED';
        UPDATE "SynthesisTicket" SET "status" = 'BACKLOG' WHERE "status"::text = 'PLANNED';
        UPDATE "SynthesisTicket" SET "status" = 'RESOLVED' WHERE "status"::text IN ('IMPLEMENTED', 'VERIFICATION', 'VERIFIED_LOCAL', 'RELEASED');
        UPDATE "SynthesisTicket" SET "status" = 'IN_PROGRESS' WHERE "status"::text IN ('REOPENED', 'IN_PR');

        -- Fail-safe check: verify no disallowed values remain
        SELECT COUNT(*) INTO invalid_cnt FROM "SynthesisTicket"
        WHERE "status"::text NOT IN (
            'DISCOVERED', 'IN_TRIAGE', 'BACKLOG', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'IGNORED_FALSE_POSITIVE'
        );

        IF invalid_cnt > 0 THEN
            RAISE EXCEPTION 'MIGRACE ZASTAVENA: Nalezeno % zaznamu v SynthesisTicket s nepovolenym stavem. Zadna data nebyla ztracena.', invalid_cnt;
        END IF;
    END IF;
END $$;

-- Re-type column status to clean enum SynthesisStatus
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SynthesisStatus') THEN
        CREATE TYPE "SynthesisStatus_new" AS ENUM (
            'DISCOVERED', 'IN_TRIAGE', 'BACKLOG', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'IGNORED_FALSE_POSITIVE'
        );

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'SynthesisTicket' AND column_name = 'status'
        ) THEN
            ALTER TABLE "SynthesisTicket" ALTER COLUMN "status" DROP DEFAULT;
            ALTER TABLE "SynthesisTicket"
                ALTER COLUMN "status" TYPE "SynthesisStatus_new"
                USING ("status"::text::"SynthesisStatus_new");
            ALTER TABLE "SynthesisTicket" ALTER COLUMN "status" SET DEFAULT 'DISCOVERED'::"SynthesisStatus_new";
        END IF;

        DROP TYPE "SynthesisStatus";
        ALTER TYPE "SynthesisStatus_new" RENAME TO "SynthesisStatus";
    ELSE
        CREATE TYPE "SynthesisStatus" AS ENUM (
            'DISCOVERED', 'IN_TRIAGE', 'BACKLOG', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'IGNORED_FALSE_POSITIVE'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. ADITIVNÍ AKTUALIZACE TABULKY SynthesisTicket (VŠECHNA DATA ZACHOVÁNA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SynthesisTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sequence and ticketNumber autoincrement
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SynthesisTicket' AND column_name = 'ticketNumber') THEN
        CREATE SEQUENCE IF NOT EXISTS "SynthesisTicket_ticketNumber_seq";
        ALTER TABLE "SynthesisTicket" ADD COLUMN "ticketNumber" INTEGER NOT NULL DEFAULT nextval('SynthesisTicket_ticketNumber_seq');
        ALTER SEQUENCE "SynthesisTicket_ticketNumber_seq" OWNED BY "SynthesisTicket"."ticketNumber";
    END IF;
END $$;

-- Deterministic dedupHash generation for rows missing it (does not overwrite existing hashes)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SynthesisTicket' AND column_name = 'dedupHash') THEN
        ALTER TABLE "SynthesisTicket" ADD COLUMN "dedupHash" TEXT;
        UPDATE "SynthesisTicket" SET "dedupHash" = md5("id" || '_' || "title" || '_' || "createdAt"::text) WHERE "dedupHash" IS NULL;
        ALTER TABLE "SynthesisTicket" ALTER COLUMN "dedupHash" SET NOT NULL;
    ELSE
        UPDATE "SynthesisTicket" SET "dedupHash" = md5("id" || '_' || "title" || '_' || "createdAt"::text) WHERE "dedupHash" IS NULL;
    END IF;
END $$;

-- Additive column provisioning (safe for existing schema)
ALTER TABLE "SynthesisTicket"
    ADD COLUMN IF NOT EXISTS "source" "SynthesisSource" NOT NULL DEFAULT 'MANUAL_ENTRY',
    ADD COLUMN IF NOT EXISTS "severity" "SynthesisSeverity" NOT NULL DEFAULT 'P2_MEDIUM',
    ADD COLUMN IF NOT EXISTS "category" "SynthesisCategory" NOT NULL DEFAULT 'FUNCTIONAL',
    ADD COLUMN IF NOT EXISTS "status" "SynthesisStatus" NOT NULL DEFAULT 'DISCOVERED',
    ADD COLUMN IF NOT EXISTS "sourcePath" TEXT,
    ADD COLUMN IF NOT EXISTS "auditDocumentId" TEXT,
    ADD COLUMN IF NOT EXISTS "qaFindingId" TEXT,
    ADD COLUMN IF NOT EXISTS "supportTicketId" TEXT,
    ADD COLUMN IF NOT EXISTS "commitSha" TEXT,
    ADD COLUMN IF NOT EXISTS "branch" TEXT,
    ADD COLUMN IF NOT EXISTS "coderabbitCommentId" TEXT,
    ADD COLUMN IF NOT EXISTS "githubIssueNumber" INTEGER,
    ADD COLUMN IF NOT EXISTS "githubIssueUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "githubPrNumber" INTEGER,
    ADD COLUMN IF NOT EXISTS "githubPrUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "githubSyncStatus" "GitHubSyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    ADD COLUMN IF NOT EXISTS "githubSyncError" TEXT,
    ADD COLUMN IF NOT EXISTS "githubSyncedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "createdById" TEXT,
    ADD COLUMN IF NOT EXISTS "assignedToId" TEXT,
    ADD COLUMN IF NOT EXISTS "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "slaDueDate" TIMESTAMP(3);

-- ----------------------------------------------------------------------------
-- 7. ADITIVNÍ AKTUALIZACE TABULKY AuditFinding (VŠECHNA DATA ZACHOVÁNA)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS "AuditFinding"
    ADD COLUMN IF NOT EXISTS "auditFilename" TEXT,
    ADD COLUMN IF NOT EXISTS "code" TEXT,
    ADD COLUMN IF NOT EXISTS "title" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT,
    ADD COLUMN IF NOT EXISTS "severity" TEXT,
    ADD COLUMN IF NOT EXISTS "status" TEXT,
    ADD COLUMN IF NOT EXISTS "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "actionId" TEXT,
    ADD COLUMN IF NOT EXISTS "fixCommitSha" TEXT,
    ADD COLUMN IF NOT EXISTS "prNumber" INTEGER,
    ADD COLUMN IF NOT EXISTS "testReference" TEXT,
    ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
    ADD COLUMN IF NOT EXISTS "verificationEvidence" TEXT,
    ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "sourceSha" TEXT,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 8. COMPONENT TABLES (SynthesisTicketComment & SynthesisTicketEvent)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SynthesisTicketComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SynthesisTicketEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. SAFE INDEXES
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "SynthesisTicket_ticketNumber_key" ON "SynthesisTicket"("ticketNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "SynthesisTicket_dedupHash_key" ON "SynthesisTicket"("dedupHash");
CREATE INDEX IF NOT EXISTS "SynthesisTicket_source_idx" ON "SynthesisTicket"("source");
CREATE INDEX IF NOT EXISTS "SynthesisTicket_severity_idx" ON "SynthesisTicket"("severity");
CREATE INDEX IF NOT EXISTS "SynthesisTicket_category_idx" ON "SynthesisTicket"("category");
CREATE INDEX IF NOT EXISTS "SynthesisTicket_status_idx" ON "SynthesisTicket"("status");
CREATE INDEX IF NOT EXISTS "SynthesisTicket_dedupHash_idx" ON "SynthesisTicket"("dedupHash");

CREATE INDEX IF NOT EXISTS "SynthesisTicketComment_ticketId_idx" ON "SynthesisTicketComment"("ticketId");
CREATE INDEX IF NOT EXISTS "SynthesisTicketEvent_ticketId_idx" ON "SynthesisTicketEvent"("ticketId");
CREATE INDEX IF NOT EXISTS "SynthesisTicketEvent_eventType_idx" ON "SynthesisTicketEvent"("eventType");

CREATE UNIQUE INDEX IF NOT EXISTS "AuditFinding_auditFilename_code_key" ON "AuditFinding"("auditFilename", "code");
CREATE INDEX IF NOT EXISTS "AuditFinding_status_severity_idx" ON "AuditFinding"("status", "severity");
CREATE INDEX IF NOT EXISTS "AuditFinding_code_idx" ON "AuditFinding"("code");
CREATE INDEX IF NOT EXISTS "AuditFinding_actionId_idx" ON "AuditFinding"("actionId");

-- ----------------------------------------------------------------------------
-- 10. IDEMPOTENT FOREIGN KEYS FOR ACTIVE RELATIONS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditDocument') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SynthesisTicket_auditDocumentId_fkey') THEN
            ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_auditDocumentId_fkey"
                FOREIGN KEY ("auditDocumentId") REFERENCES "AuditDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'QAFinding') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SynthesisTicket_qaFindingId_fkey') THEN
            ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_qaFindingId_fkey"
                FOREIGN KEY ("qaFindingId") REFERENCES "QAFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportTicket') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SynthesisTicket_supportTicketId_fkey') THEN
            ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_supportTicketId_fkey"
                FOREIGN KEY ("supportTicketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SynthesisTicket_createdById_fkey') THEN
            ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_createdById_fkey"
                FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SynthesisTicket_assignedToId_fkey') THEN
            ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_assignedToId_fkey"
                FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ControlPlaneAction') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditFinding_actionId_fkey') THEN
            ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_actionId_fkey"
                FOREIGN KEY ("actionId") REFERENCES "ControlPlaneAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SynthesisTicketComment_ticketId_fkey') THEN
        ALTER TABLE "SynthesisTicketComment" ADD CONSTRAINT "SynthesisTicketComment_ticketId_fkey"
            FOREIGN KEY ("ticketId") REFERENCES "SynthesisTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SynthesisTicketEvent_ticketId_fkey') THEN
        ALTER TABLE "SynthesisTicketEvent" ADD CONSTRAINT "SynthesisTicketEvent_ticketId_fkey"
            FOREIGN KEY ("ticketId") REFERENCES "SynthesisTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


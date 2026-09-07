-- Orion HITL persistent approval store.
-- Adds the missing database representation for Prisma model OrionApproval.
-- No existing tables, enums, or data are modified.

CREATE TABLE "OrionApproval" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "executingAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "auditRef" TEXT,
    "bindingHash" TEXT NOT NULL,

    CONSTRAINT "OrionApproval_pkey" PRIMARY KEY ("id")
);

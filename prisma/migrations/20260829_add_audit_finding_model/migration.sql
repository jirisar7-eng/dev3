-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "auditFilename" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionId" TEXT,
    "fixCommitSha" TEXT,
    "prNumber" INTEGER,
    "testReference" TEXT,
    "verifiedBy" TEXT,
    "verificationEvidence" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "sourceSha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditFinding_auditFilename_code_key" ON "AuditFinding"("auditFilename", "code");

-- CreateIndex
CREATE INDEX "AuditFinding_status_severity_idx" ON "AuditFinding"("status", "severity");

-- CreateIndex
CREATE INDEX "AuditFinding_code_idx" ON "AuditFinding"("code");

-- CreateIndex
CREATE INDEX "AuditFinding_actionId_idx" ON "AuditFinding"("actionId");

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ControlPlaneAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ControlPlaneAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "operationId" TEXT,
    "affectedResources" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "approvalLevel" TEXT NOT NULL,
    "currentState" TEXT,
    "proposedState" TEXT,
    "backupReference" TEXT,
    "changeReference" TEXT,
    "branch" TEXT,
    "commitSha" TEXT,
    "prNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ControlPlaneAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlPlaneEvent" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "actorId" TEXT,

    CONSTRAINT "ControlPlaneEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlPlaneSnapshot" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "beforeStateHash" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "approvalRequired" BOOLEAN NOT NULL,
    "approvalStatus" TEXT NOT NULL,

    CONSTRAINT "ControlPlaneSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ControlPlaneEvent" ADD CONSTRAINT "ControlPlaneEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ControlPlaneAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlPlaneSnapshot" ADD CONSTRAINT "ControlPlaneSnapshot_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ControlPlaneAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

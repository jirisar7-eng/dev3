-- CreateEnum
CREATE TYPE "SubjectVerificationStatus" AS ENUM ('VERIFIED', 'PENDING_REVIEW', 'STALE', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceTrustLevel" AS ENUM ('P0_OFFICIAL_SUBJECT_WEB', 'P1_STATE_MUNICIPAL_PORTAL', 'P2_PUBLIC_STATE_REGISTRY', 'P3_VERIFIED_PARTNER', 'P4_USER_COMMUNITY_PROPOSAL', 'P5_UNVERIFIED_EXTERNAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.



-- CreateTable
CREATE TABLE "SubjectVerifiedProfile" (
    "id" TEXT NOT NULL,
    "subjektId" TEXT NOT NULL,
    "officialWebsite" TEXT,
    "officialPhone" TEXT,
    "officialEmail" TEXT,
    "openingHours" TEXT,
    "appointmentRequired" BOOLEAN NOT NULL DEFAULT false,
    "bookingUrl" TEXT,
    "accessibility" TEXT,
    "dataBoxId" TEXT,
    "submissionMethods" TEXT,
    "status" "SubjectVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "staleAfterDays" INTEGER NOT NULL DEFAULT 180,
    "lastCheckedAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectVerifiedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectInformationSource" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "subjektId" TEXT NOT NULL,
    "sourceLevel" "SourceTrustLevel" NOT NULL DEFAULT 'P4_USER_COMMUNITY_PROPOSAL',
    "sourceUrl" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "extractedValue" TEXT NOT NULL,
    "evidenceSnippet" TEXT,
    "extractionMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "confidence" DOUBLE PRECISION,
    "status" "SubjectVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectInformationSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVerifiedProfile_subjektId_key" ON "SubjectVerifiedProfile"("subjektId");

-- CreateIndex
CREATE INDEX "SubjectVerifiedProfile_subjektId_idx" ON "SubjectVerifiedProfile"("subjektId");

-- CreateIndex
CREATE INDEX "SubjectVerifiedProfile_status_idx" ON "SubjectVerifiedProfile"("status");

-- CreateIndex
CREATE INDEX "SubjectVerifiedProfile_nextCheckAt_idx" ON "SubjectVerifiedProfile"("nextCheckAt");

-- CreateIndex
CREATE INDEX "SubjectInformationSource_subjektId_idx" ON "SubjectInformationSource"("subjektId");

-- CreateIndex
CREATE INDEX "SubjectInformationSource_profileId_idx" ON "SubjectInformationSource"("profileId");

-- CreateIndex
CREATE INDEX "SubjectInformationSource_status_idx" ON "SubjectInformationSource"("status");

-- CreateIndex
CREATE INDEX "SubjectInformationSource_sourceLevel_idx" ON "SubjectInformationSource"("sourceLevel");

-- CreateIndex
CREATE INDEX "SubjectInformationSource_createdAt_idx" ON "SubjectInformationSource"("createdAt");

-- AddForeignKey
ALTER TABLE "SubjectVerifiedProfile" ADD CONSTRAINT "SubjectVerifiedProfile_subjektId_fkey" FOREIGN KEY ("subjektId") REFERENCES "Subjekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectVerifiedProfile" ADD CONSTRAINT "SubjectVerifiedProfile_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectInformationSource" ADD CONSTRAINT "SubjectInformationSource_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SubjectVerifiedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectInformationSource" ADD CONSTRAINT "SubjectInformationSource_subjektId_fkey" FOREIGN KEY ("subjektId") REFERENCES "Subjekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectInformationSource" ADD CONSTRAINT "SubjectInformationSource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectInformationSource" ADD CONSTRAINT "SubjectInformationSource_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


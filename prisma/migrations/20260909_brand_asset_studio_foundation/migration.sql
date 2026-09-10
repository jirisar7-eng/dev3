-- CreateEnum
CREATE TYPE "BrandAppKey" AS ENUM ('public_portal', 'case_portal', 'admin_portal');

-- CreateEnum
CREATE TYPE "BrandProfileKind" AS ENUM ('FAMILY', 'APPLICATION');

-- CreateEnum
CREATE TYPE "BrandReleaseStatus" AS ENUM ('DRAFT', 'VALIDATED', 'READY', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BrandAssetRole" AS ENUM ('LOGO', 'MARK', 'FAVICON', 'PWA_ICON', 'APPLE_TOUCH_ICON', 'SOCIAL_IMAGE', 'DOCUMENT_LOGO', 'WATERMARK');

-- CreateEnum
CREATE TYPE "BrandAssetVariant" AS ENUM ('PRIMARY', 'LIGHT', 'DARK', 'MONO', 'ANY', 'MASKABLE');

-- CreateEnum
CREATE TYPE "BrandAssetSource" AS ENUM ('UPLOADED', 'GENERATED', 'MIGRATED');

-- CreateEnum
CREATE TYPE "BrandAssetValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID');

-- CreateEnum
CREATE TYPE "DocumentBrandingMode" AS ENUM ('FULL', 'SUBTLE', 'NEUTRAL', 'NONE');

-- CreateEnum
CREATE TYPE "WatermarkMode" AS ENUM ('NONE', 'BRAND', 'STATUS', 'BRAND_AND_STATUS');

-- CreateEnum
CREATE TYPE "BrandedDocumentFormat" AS ENUM ('PDF', 'DOCX', 'PRINT');

-- CreateEnum
CREATE TYPE "BrandedDocumentSource" AS ENUM ('SYSTEM_GENERATED', 'USER_UPLOAD_DERIVATIVE', 'AUDIT_EXPORT');

-- CreateEnum
CREATE TYPE "BrandCampaignStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BrandCampaignDisplayMode" AS ENUM ('REPLACE_LOGO', 'DECORATE_LOGO', 'BADGE', 'THEME_ACCENT');

-- CreateEnum
CREATE TYPE "BrandSurface" AS ENUM ('WEB_UI', 'LOGIN', 'OFFLINE_PAGE', 'SOCIAL_METADATA', 'PWA_MANIFEST', 'PWA_ICON', 'EMAIL', 'DOCUMENT', 'WATERMARK');

-- CreateTable
CREATE TABLE "BrandFamily" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppIdentity" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "appKey" "BrandAppKey" NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "startUrl" TEXT NOT NULL,
    "manifestPath" TEXT NOT NULL,
    "serviceWorkerPath" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "identityId" TEXT,
    "parentProfileId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "BrandProfileKind" NOT NULL,
    "inheritsParent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAsset" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "role" "BrandAssetRole" NOT NULL,
    "variant" "BrandAssetVariant" NOT NULL,
    "targetWidth" INTEGER,
    "targetHeight" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAssetVersion" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "source" "BrandAssetSource" NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'MINIO',
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "deliveryPath" TEXT,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "validationStatus" "BrandAssetValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationReport" JSONB,
    "sanitizerVersion" TEXT,
    "derivedFromId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAssetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandRelease" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BrandReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "manifestHash" VARCHAR(64),
    "notes" TEXT,
    "createdById" TEXT,
    "validatedById" TEXT,
    "publishedById" TEXT,
    "supersedesReleaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "BrandRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandReleaseAsset" (
    "releaseId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "assetVersionId" TEXT NOT NULL,

    CONSTRAINT "BrandReleaseAsset_pkey" PRIMARY KEY ("releaseId","slotKey")
);

-- CreateTable
CREATE TABLE "DocumentBrandingProfile" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "mode" "DocumentBrandingMode" NOT NULL,
    "watermarkMode" "WatermarkMode" NOT NULL,
    "status" "BrandReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentBrandingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandedDocumentExport" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "documentProfileId" TEXT,
    "sourceType" "BrandedDocumentSource" NOT NULL,
    "sourceId" TEXT,
    "format" "BrandedDocumentFormat" NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'MINIO',
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "originalSha256" VARCHAR(64),
    "isDerivative" BOOLEAN NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandedDocumentExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCampaign" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "BrandCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Prague',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCampaignTarget" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "surface" "BrandSurface" NOT NULL,
    "displayMode" "BrandCampaignDisplayMode" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandCampaignTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandFamily_key_key" ON "BrandFamily"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AppIdentity_appKey_key" ON "AppIdentity"("appKey");

-- CreateIndex
CREATE UNIQUE INDEX "AppIdentity_scope_key" ON "AppIdentity"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "AppIdentity_manifestPath_key" ON "AppIdentity"("manifestPath");

-- CreateIndex
CREATE UNIQUE INDEX "AppIdentity_serviceWorkerPath_key" ON "AppIdentity"("serviceWorkerPath");

-- CreateIndex
CREATE INDEX "AppIdentity_familyId_idx" ON "AppIdentity"("familyId");

-- CreateIndex
CREATE INDEX "AppIdentity_enabled_idx" ON "AppIdentity"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_identityId_key" ON "BrandProfile"("identityId");

-- CreateIndex
CREATE INDEX "BrandProfile_parentProfileId_idx" ON "BrandProfile"("parentProfileId");

-- CreateIndex
CREATE INDEX "BrandProfile_kind_idx" ON "BrandProfile"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_familyId_key_key" ON "BrandProfile"("familyId", "key");

-- CreateIndex
CREATE INDEX "BrandAsset_profileId_role_variant_idx" ON "BrandAsset"("profileId", "role", "variant");

-- CreateIndex
CREATE UNIQUE INDEX "BrandAsset_profileId_key_key" ON "BrandAsset"("profileId", "key");

-- CreateIndex
CREATE INDEX "BrandAssetVersion_sha256_idx" ON "BrandAssetVersion"("sha256");

-- CreateIndex
CREATE INDEX "BrandAssetVersion_validationStatus_idx" ON "BrandAssetVersion"("validationStatus");

-- CreateIndex
CREATE INDEX "BrandAssetVersion_derivedFromId_idx" ON "BrandAssetVersion"("derivedFromId");

-- CreateIndex
CREATE INDEX "BrandAssetVersion_createdById_idx" ON "BrandAssetVersion"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "BrandAssetVersion_assetId_version_key" ON "BrandAssetVersion"("assetId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "BrandAssetVersion_bucket_objectKey_key" ON "BrandAssetVersion"("bucket", "objectKey");

-- CreateIndex
CREATE INDEX "BrandRelease_profileId_status_idx" ON "BrandRelease"("profileId", "status");

-- CreateIndex
CREATE INDEX "BrandRelease_profileId_isActive_idx" ON "BrandRelease"("profileId", "isActive");

-- CreateIndex
CREATE INDEX "BrandRelease_supersedesReleaseId_idx" ON "BrandRelease"("supersedesReleaseId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandRelease_profileId_version_key" ON "BrandRelease"("profileId", "version");

-- CreateIndex
CREATE INDEX "BrandReleaseAsset_assetVersionId_idx" ON "BrandReleaseAsset"("assetVersionId");

-- CreateIndex
CREATE INDEX "DocumentBrandingProfile_identityId_status_idx" ON "DocumentBrandingProfile"("identityId", "status");

-- CreateIndex
CREATE INDEX "DocumentBrandingProfile_identityId_key_active_idx" ON "DocumentBrandingProfile"("identityId", "key", "active");

-- CreateIndex
CREATE INDEX "DocumentBrandingProfile_createdById_idx" ON "DocumentBrandingProfile"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentBrandingProfile_identityId_key_version_key" ON "DocumentBrandingProfile"("identityId", "key", "version");

-- CreateIndex
CREATE INDEX "BrandedDocumentExport_identityId_createdAt_idx" ON "BrandedDocumentExport"("identityId", "createdAt");

-- CreateIndex
CREATE INDEX "BrandedDocumentExport_releaseId_idx" ON "BrandedDocumentExport"("releaseId");

-- CreateIndex
CREATE INDEX "BrandedDocumentExport_documentProfileId_idx" ON "BrandedDocumentExport"("documentProfileId");

-- CreateIndex
CREATE INDEX "BrandedDocumentExport_sourceType_sourceId_idx" ON "BrandedDocumentExport"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "BrandedDocumentExport_sha256_idx" ON "BrandedDocumentExport"("sha256");

-- CreateIndex
CREATE INDEX "BrandedDocumentExport_createdById_idx" ON "BrandedDocumentExport"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "BrandedDocumentExport_bucket_objectKey_key" ON "BrandedDocumentExport"("bucket", "objectKey");

-- CreateIndex
CREATE INDEX "BrandCampaign_status_startsAt_endsAt_idx" ON "BrandCampaign"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BrandCampaign_createdById_idx" ON "BrandCampaign"("createdById");

-- CreateIndex
CREATE INDEX "BrandCampaign_approvedById_idx" ON "BrandCampaign"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "BrandCampaign_familyId_key_key" ON "BrandCampaign"("familyId", "key");

-- CreateIndex
CREATE INDEX "BrandCampaignTarget_identityId_surface_enabled_idx" ON "BrandCampaignTarget"("identityId", "surface", "enabled");

-- CreateIndex
CREATE INDEX "BrandCampaignTarget_releaseId_idx" ON "BrandCampaignTarget"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandCampaignTarget_campaignId_identityId_surface_key" ON "BrandCampaignTarget"("campaignId", "identityId", "surface");

-- AddForeignKey
ALTER TABLE "AppIdentity" ADD CONSTRAINT "AppIdentity_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "BrandFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "BrandFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AppIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "BrandProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAsset" ADD CONSTRAINT "BrandAsset_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAssetVersion" ADD CONSTRAINT "BrandAssetVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "BrandAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAssetVersion" ADD CONSTRAINT "BrandAssetVersion_derivedFromId_fkey" FOREIGN KEY ("derivedFromId") REFERENCES "BrandAssetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAssetVersion" ADD CONSTRAINT "BrandAssetVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRelease" ADD CONSTRAINT "BrandRelease_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRelease" ADD CONSTRAINT "BrandRelease_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRelease" ADD CONSTRAINT "BrandRelease_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRelease" ADD CONSTRAINT "BrandRelease_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRelease" ADD CONSTRAINT "BrandRelease_supersedesReleaseId_fkey" FOREIGN KEY ("supersedesReleaseId") REFERENCES "BrandRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandReleaseAsset" ADD CONSTRAINT "BrandReleaseAsset_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "BrandRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandReleaseAsset" ADD CONSTRAINT "BrandReleaseAsset_assetVersionId_fkey" FOREIGN KEY ("assetVersionId") REFERENCES "BrandAssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBrandingProfile" ADD CONSTRAINT "DocumentBrandingProfile_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AppIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBrandingProfile" ADD CONSTRAINT "DocumentBrandingProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandedDocumentExport" ADD CONSTRAINT "BrandedDocumentExport_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AppIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandedDocumentExport" ADD CONSTRAINT "BrandedDocumentExport_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "BrandRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandedDocumentExport" ADD CONSTRAINT "BrandedDocumentExport_documentProfileId_fkey" FOREIGN KEY ("documentProfileId") REFERENCES "DocumentBrandingProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandedDocumentExport" ADD CONSTRAINT "BrandedDocumentExport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaign" ADD CONSTRAINT "BrandCampaign_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "BrandFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaign" ADD CONSTRAINT "BrandCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaign" ADD CONSTRAINT "BrandCampaign_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaignTarget" ADD CONSTRAINT "BrandCampaignTarget_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BrandCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaignTarget" ADD CONSTRAINT "BrandCampaignTarget_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AppIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaignTarget" ADD CONSTRAINT "BrandCampaignTarget_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "BrandRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Brand Asset Studio invariants
CREATE UNIQUE INDEX "BrandRelease_one_active_per_profile"
ON "BrandRelease" ("profileId")
WHERE "isActive" = true;

CREATE UNIQUE INDEX "DocumentBrandingProfile_one_active_per_identity_key"
ON "DocumentBrandingProfile" ("identityId", "key")
WHERE "active" = true;

ALTER TABLE "BrandProfile"
ADD CONSTRAINT "BrandProfile_kind_identity_check"
CHECK (
  ("kind" = 'FAMILY' AND "identityId" IS NULL)
  OR
  ("kind" = 'APPLICATION' AND "identityId" IS NOT NULL)
);

ALTER TABLE "BrandRelease"
ADD CONSTRAINT "BrandRelease_active_status_check"
CHECK (
  NOT "isActive"
  OR ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL)
);

ALTER TABLE "DocumentBrandingProfile"
ADD CONSTRAINT "DocumentBrandingProfile_active_status_check"
CHECK (
  NOT "active"
  OR ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL)
);

ALTER TABLE "BrandCampaign"
ADD CONSTRAINT "BrandCampaign_valid_schedule_check"
CHECK ("endsAt" > "startsAt" AND "priority" >= 0);

ALTER TABLE "BrandAssetVersion"
ADD CONSTRAINT "BrandAssetVersion_byte_size_check"
CHECK ("byteSize" > 0);

ALTER TABLE "BrandAssetVersion"
ADD CONSTRAINT "BrandAssetVersion_dimensions_check"
CHECK (
  ("width" IS NULL OR "width" > 0)
  AND ("height" IS NULL OR "height" > 0)
);

ALTER TABLE "BrandAssetVersion"
ADD CONSTRAINT "BrandAssetVersion_sha256_check"
CHECK ("sha256" ~ '^[0-9a-f]{64}$');

ALTER TABLE "BrandedDocumentExport"
ADD CONSTRAINT "BrandedDocumentExport_byte_size_check"
CHECK ("byteSize" > 0);

ALTER TABLE "BrandedDocumentExport"
ADD CONSTRAINT "BrandedDocumentExport_sha256_check"
CHECK ("sha256" ~ '^[0-9a-f]{64}$');

ALTER TABLE "BrandedDocumentExport"
ADD CONSTRAINT "BrandedDocumentExport_original_sha256_check"
CHECK (
  "originalSha256" IS NULL
  OR "originalSha256" ~ '^[0-9a-f]{64}$'
);

ALTER TABLE "BrandedDocumentExport"
ADD CONSTRAINT "BrandedDocumentExport_derivative_check"
CHECK (NOT "isDerivative" OR "originalSha256" IS NOT NULL);

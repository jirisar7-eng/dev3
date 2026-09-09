-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('USER', 'VOLUNTEER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'CONTENT_MANAGER', 'LEGAL_EDITOR', 'VERIFIED_CONTRIBUTOR', 'REGISTERED_USER', 'VERIFIED_USER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "LegalActStatus" AS ENUM ('ACTIVE', 'AMENDED', 'REPEALED');

-- CreateEnum
CREATE TYPE "SyncAuditStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'UNCHANGED', 'FAILED', 'SKIPPED', 'RATE_LIMITED', 'QUOTA_EXCEEDED');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('SPONSOR', 'PARTNER');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('SOUD', 'OSPOD', 'ZNALEC', 'ADVOKAT', 'PORADNA_CHARITA');

-- CreateEnum
CREATE TYPE "SubjektStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubjectVerificationStatus" AS ENUM ('VERIFIED', 'PENDING_REVIEW', 'STALE', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceTrustLevel" AS ENUM ('P0_OFFICIAL_SUBJECT_WEB', 'P1_STATE_MUNICIPAL_PORTAL', 'P2_PUBLIC_STATE_REGISTRY', 'P3_VERIFIED_PARTNER', 'P4_USER_COMMUNITY_PROPOSAL', 'P5_UNVERIFIED_EXTERNAL');

-- CreateEnum
CREATE TYPE "ConflictMode" AS ENUM ('COOPERATION', 'DISAGREEMENT', 'HIGH_CONFLICT');

-- CreateEnum
CREATE TYPE "CarePlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CarePlanType" AS ENUM ('CURRENT', 'PROPOSED', 'SIMULATION');

-- CreateEnum
CREATE TYPE "CarePlanSource" AS ENUM ('MANUAL', 'JUDGMENT_IMPORT', 'SIMULATION_TEMPLATE');

-- CreateEnum
CREATE TYPE "CareLocationType" AS ENUM ('PARENT_A_HOME', 'PARENT_B_HOME', 'SCHOOL', 'KINDERGARTEN', 'NEUTRAL', 'CUSTOM');

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

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('SESSION_START', 'SESSION_END', 'PAGE_VIEW', 'FEATURE_OPEN', 'FEATURE_COMPLETE', 'SEARCH', 'FORM_START', 'FORM_COMPLETE', 'DOCUMENT_DOWNLOAD', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "SynthesisSource" AS ENUM ('QA_ENGINE', 'AUDIT_DOCUMENT', 'CODERABBIT', 'SUPPORT_PORTAL', 'MANUAL_ADMIN', 'QA_RUN', 'SUPPORT_TICKET', 'COMMUNITY_FEEDBACK', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "SynthesisSeverity" AS ENUM ('P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW', 'INFO');

-- CreateEnum
CREATE TYPE "SynthesisCategory" AS ENUM ('SECURITY', 'DATA_INTEGRITY', 'PERSISTENCE', 'FUNCTIONAL', 'API', 'E2E', 'INVARIANT', 'REGRESSION', 'PERFORMANCE', 'UX', 'DEVOPS');

-- CreateEnum
CREATE TYPE "SynthesisStatus" AS ENUM ('DISCOVERED', 'IN_TRIAGE', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'IGNORED_FALSE_POSITIVE', 'BACKLOG', 'VERIFIED_LOCAL', 'IN_PR', 'RELEASED');

-- CreateEnum
CREATE TYPE "GitHubSyncStatus" AS ENUM ('NOT_SYNCED', 'ISSUE_CREATED', 'PR_LINKED', 'CLOSED_BY_COMMIT', 'SYNC_ERROR', 'PENDING', 'SYNCED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "hasChildrenInitial" BOOLEAN DEFAULT false,
    "role" "UserRoleType" NOT NULL DEFAULT 'USER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpTempSecret" TEXT,
    "totpBackupCodes" TEXT[],
    "phone" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "googleId" TEXT,
    "microsoftId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passkey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "birthDate" TEXT,
    "gender" TEXT,
    "hasChildrenInitial" BOOLEAN DEFAULT false,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "autoFillDocs" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDocumentData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDocumentData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresMfa" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'system',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'article',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "categoryName" TEXT NOT NULL DEFAULT 'obecne',
    "categoryId" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL DEFAULT 'general',
    "categoryId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "labelKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "target" TEXT NOT NULL DEFAULT '_self',
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "mimeType" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentString" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "valueCzech" TEXT NOT NULL,
    "valueEnglish" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentString_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "context" TEXT NOT NULL DEFAULT 'GLOBAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeVariable" (
    "id" TEXT NOT NULL,
    "themeId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'color',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeVariable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT NOT NULL DEFAULT '{}',
    "description" TEXT,
    "icon" TEXT DEFAULT 'Package',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleSetting" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModulePermission" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'terms',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT DEFAULT 'Administrátor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "versionId" TEXT,
    "docKey" TEXT NOT NULL,
    "docVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "ipAddress" TEXT DEFAULT '127.0.0.1',
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'system',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT DEFAULT '127.0.0.1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditDocument" (
    "id" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "summary" TEXT,
    "content" TEXT,
    "auditDate" TEXT,
    "author" TEXT,
    "sourceSha" TEXT,
    "commitSha" TEXT,
    "branch" TEXT,
    "sourceUrl" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditShare" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "rawToken" TEXT,
    "accessMode" TEXT NOT NULL DEFAULT 'SHARED_LINK',
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caseNumber" TEXT,
    "courtName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChild" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "birthDate" TEXT,
    "isStudying" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'court',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'pdf',
    "size" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'court_filing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Study" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "authors" TEXT NOT NULL,
    "publicationYear" INTEGER,
    "publisher" TEXT,
    "doi" TEXT,
    "sourceUrl" TEXT,
    "abstract" TEXT,
    "summary" TEXT,
    "methodology" TEXT,
    "findings" TEXT,
    "limitations" TEXT,
    "relevance" TEXT,
    "keywords" TEXT,
    "evidenceLevel" TEXT DEFAULT 'B',
    "evidenceDirection" TEXT DEFAULT 'SUPPORTIVE',
    "causality" TEXT DEFAULT 'NOT_ESTABLISHED',
    "sourceType" TEXT DEFAULT 'PEER_REVIEWED_EMPIRICAL',
    "category" TEXT NOT NULL DEFAULT 'stridava_pece',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "pdfMediaId" TEXT,
    "pdfSize" INTEGER DEFAULT 0,
    "s3Bucket" TEXT,
    "s3ObjectKey" TEXT,
    "storageProvider" TEXT DEFAULT 'MinIO',
    "mimeType" TEXT DEFAULT 'application/pdf',
    "fileHash" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Law" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Law_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalAct" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalAct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalActSection" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalActSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalActVersion" (
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

-- CreateTable
CREATE TABLE "LegalSyncAudit" (
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

-- CreateTable
CREATE TABLE "EsbirkaQuotaAudit" (
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

-- CreateTable
CREATE TABLE "StateStatistic" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "period" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "chartData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StateStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtCase" (
    "id" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "legalRatio" TEXT NOT NULL,
    "tags" TEXT[],
    "fullTextUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourtCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL DEFAULT 'PARTNER',
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerCodexAgreement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL DEFAULT '1.0',
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "VolunteerCodexAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TEXT,
    "address" TEXT,
    "motivation" TEXT NOT NULL,
    "linkedin" TEXT,
    "position" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "UserConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitiveAccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitiveAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdprDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "GdprDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "puckDataJson" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'care',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'AnonymniOtec',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'AnonymniOtec',
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomModule" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Krizová pomoc & Komunita',
    "icon" TEXT NOT NULL DEFAULT 'Box',
    "showInMenu" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contentJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subjekt" (
    "id" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "titleBefore" TEXT,
    "position" TEXT,
    "institution" TEXT,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "region" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "status" "SubjektStatus" NOT NULL DEFAULT 'VERIFIED',
    "createdById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subjekt_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Pracovnik" (
    "id" TEXT NOT NULL,
    "jmeno" TEXT NOT NULL,
    "pozice" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "kancelar" TEXT,
    "subjektId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pracovnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "subjektId" TEXT NOT NULL,
    "pracovnikId" TEXT,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "supportSharedCare" INTEGER NOT NULL,
    "professionalism" INTEGER NOT NULL,
    "speedAndDeadlines" INTEGER NOT NULL,
    "objektivita" INTEGER,
    "komunikace" INTEGER,
    "rychlost" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionHash" TEXT,
    "essential" BOOLEAN NOT NULL DEFAULT true,
    "functional" BOOLEAN NOT NULL DEFAULT false,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "CookieConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caseNumber" TEXT,
    "court" TEXT,
    "caseType" TEXT NOT NULL DEFAULT 'OPATROVNICKE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "currentCareType" TEXT DEFAULT 'STRIDAVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseSubmissionDraft" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "templateId" TEXT DEFAULT 'CUSTOM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "formData" JSONB,
    "generatedContent" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseSubmissionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseSubmissionDraftVersion" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "formData" JSONB,
    "generatedContent" TEXT,
    "changeSummary" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseSubmissionDraftVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseParticipant" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MATKA',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "institution" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TEXT,
    "birthNumber" TEXT,
    "schoolName" TEXT,
    "pediatrician" TEXT,
    "notes" TEXT,
    "addressMode" TEXT DEFAULT 'SAME_AS_MOTHER',
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "attachments" JSONB,
    "sourceType" TEXT DEFAULT 'MANUAL',
    "carePlanId" TEXT,
    "careDayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDeadline" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COURT',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTask" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT DEFAULT 'GENERAL',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "fileUrl" TEXT,
    "s3Bucket" TEXT,
    "s3ObjectKey" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'pdf',
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "size" INTEGER NOT NULL DEFAULT 0,
    "fileHash" TEXT,
    "storageProvider" TEXT NOT NULL DEFAULT 'MinIO',
    "scanStatus" TEXT NOT NULL DEFAULT 'CLEAN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'DOCUMENT',
    "documentId" TEXT,
    "eventId" TEXT,
    "relevance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseCommunication" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "tone" TEXT DEFAULT 'NEUTRAL',
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareArrangement" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRIDAVA',
    "intervalDays" INTEGER NOT NULL DEFAULT 7,
    "handoverDay" TEXT DEFAULT 'Pátek 16:00',
    "handoverLocation" TEXT,
    "childSupportAmount" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareArrangement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentSpace" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Spolurodičovský prostor',
    "conflictMode" "ConflictMode" NOT NULL DEFAULT 'COOPERATION',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentMember" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoParentMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentChild" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentEvent" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "category" TEXT NOT NULL DEFAULT 'CARE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentHandover" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "confirmedByFather" BOOLEAN NOT NULL DEFAULT false,
    "confirmedByMother" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentMessage" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoParentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentAgreement" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentExpense" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentDailyUpdate" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood" TEXT NOT NULL DEFAULT 'HAPPY',
    "healthNotes" TEXT,
    "schoolNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoParentDailyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentItem" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT,
    "name" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentRequest" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoParentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentAuditLog" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoParentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentDocument" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'COURT_ORDER',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoParentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentInvite" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT,
    "invitedBy" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoParentInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlan" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CarePlanStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "CarePlanType" NOT NULL DEFAULT 'PROPOSED',
    "source" "CarePlanSource" NOT NULL DEFAULT 'MANUAL',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "rotationPattern" TEXT DEFAULT '7/7',
    "rotationIntervalDays" INTEGER NOT NULL DEFAULT 7,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSharedWithCoParent" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "parentAName" TEXT DEFAULT 'Otec',
    "parentBName" TEXT DEFAULT 'Matka',
    "parentAAddress" TEXT,
    "parentBAddress" TEXT,
    "parentALat" DOUBLE PRECISION,
    "parentALng" DOUBLE PRECISION,
    "parentBLat" DOUBLE PRECISION,
    "parentBLng" DOUBLE PRECISION,
    "parentAPreferences" TEXT,
    "parentBPreferences" TEXT,
    "defaultHandoverTime" TEXT DEFAULT '16:00',
    "metricsJson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanChild" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarePlanChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareLocation" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "type" "CareLocationType" NOT NULL DEFAULT 'NEUTRAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareDay" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "assignedParent" TEXT NOT NULL DEFAULT 'PARENT_A',
    "isOvernight" BOOLEAN NOT NULL DEFAULT true,
    "overnightParent" TEXT DEFAULT 'PARENT_A',
    "schoolParent" TEXT,
    "isHandover" BOOLEAN NOT NULL DEFAULT false,
    "handoverTime" TEXT,
    "handoverLocationId" TEXT,
    "travelDistanceKm" DOUBLE PRECISION DEFAULT 0,
    "travelDurationMin" INTEGER DEFAULT 0,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "holidayName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareHolidayRule" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "holidayType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "allocationModel" TEXT NOT NULL DEFAULT 'ALTERNATING_YEARS',
    "evenYearParent" TEXT DEFAULT 'PARENT_A',
    "oddYearParent" TEXT DEFAULT 'PARENT_B',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareHolidayRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareSimulationComparison" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "variantsJson" TEXT NOT NULL,
    "notes" TEXT,
    "addressMode" TEXT DEFAULT 'SAME_AS_MOTHER',
    "address" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareSimulationComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QAProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAModule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QAModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAEndpoint" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QAEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QARun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commitSha" TEXT DEFAULT 'main-HEAD',
    "branch" TEXT DEFAULT 'main',
    "environment" TEXT DEFAULT 'development',
    "isIncremental" BOOLEAN DEFAULT false,
    "auditType" TEXT DEFAULT 'FULL',
    "functionalScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "apiScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "persistenceScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "e2eScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "statsJson" TEXT,
    "aiReportJson" TEXT,
    "verdict" TEXT DEFAULT 'PRODUCTION READY',

    CONSTRAINT "QARun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT DEFAULT 'FUNCTIONAL',
    "message" TEXT NOT NULL,
    "endpointId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QAFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QARegistryItem" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT,
    "contentHash" TEXT,
    "lastCommitSha" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISCOVERED',
    "lastVerifiedAt" TIMESTAMP(3),
    "lastResultJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QARegistryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QADependency" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'IMPORTS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QADependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAAICache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'grok',
    "model" TEXT NOT NULL DEFAULT 'grok-2-latest',
    "reportJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QAAICache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAAIStats" (
    "id" TEXT NOT NULL,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "cacheHits" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastCallAt" TIMESTAMP(3),
    "skippedReasons" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QAAIStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedById" TEXT,
    "internalNotesCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT,
    "url" TEXT,
    "tags" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiTerm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "firstLetter" TEXT NOT NULL DEFAULT 'A',
    "category" TEXT NOT NULL DEFAULT 'pravo',
    "categoryLabel" TEXT NOT NULL DEFAULT 'Právní pojmy',
    "citation" TEXT,
    "definition" TEXT NOT NULL,
    "practicalTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedTerms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalGuide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ospod',
    "categoryLabel" TEXT NOT NULL DEFAULT 'OSPOD & Sociální šetření',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "badgeText" TEXT,
    "badgeBg" TEXT,
    "disclaimer" TEXT,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checklist" JSONB DEFAULT '[]',
    "faqs" JSONB DEFAULT '[]',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalGuideChapter" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "type" TEXT DEFAULT 'info',
    "checklistItems" JSONB DEFAULT '[]',
    "faqItems" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalGuideChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyVideo" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'rozhovory',
    "categoryLabel" TEXT NOT NULL DEFAULT 'Rozhovory s odborníky',
    "duration" TEXT NOT NULL DEFAULT '20 min',
    "speaker" TEXT NOT NULL,
    "speakerRole" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "videoEmbedUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'youtube',
    "description" TEXT NOT NULL,
    "summaryNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" JSONB DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Právní povědomí',
    "badge" TEXT NOT NULL DEFAULT '10 Otázek',
    "icon" TEXT NOT NULL DEFAULT 'ShieldCheck',
    "description" TEXT NOT NULL,
    "recommendedStudyPath" TEXT NOT NULL DEFAULT '/studia',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctAnswerIndex" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MementoCase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Flame',
    "category" TEXT NOT NULL DEFAULT 'obecne',
    "error" TEXT NOT NULL,
    "consequence" TEXT NOT NULL,
    "correctAction" TEXT NOT NULL,
    "exampleBad" TEXT NOT NULL,
    "exampleGood" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MementoCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Judgment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentId" TEXT,
    "courtName" TEXT NOT NULL,
    "caseNumber" TEXT,
    "judgmentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "promulgationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "enforceabilityDate" TIMESTAMP(3),
    "judgeName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "sourceFileType" TEXT NOT NULL DEFAULT 'PDF',
    "scanStatus" TEXT NOT NULL DEFAULT 'CLEAN',
    "aiEnriched" BOOLEAN NOT NULL DEFAULT false,
    "extractionQuality" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rawText" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Judgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgmentSentence" (
    "id" TEXT NOT NULL,
    "judgmentId" TEXT NOT NULL,
    "sentenceIndex" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "paragraphNumber" INTEGER,
    "section" TEXT NOT NULL DEFAULT 'VYROK',
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" TEXT NOT NULL DEFAULT 'LOCAL_PDF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JudgmentSentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgmentLegalFact" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "judgmentId" TEXT NOT NULL,
    "sentenceId" TEXT,
    "category" TEXT NOT NULL,
    "factKey" TEXT NOT NULL,
    "factValue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" TEXT NOT NULL DEFAULT 'LOCAL_PDF',
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "rawSourceText" TEXT,
    "notes" TEXT,
    "isOverriddenByUser" BOOLEAN NOT NULL DEFAULT false,
    "userOverrideReason" TEXT,
    "userOverrideDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JudgmentLegalFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialObligation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "judgmentId" TEXT,
    "sentenceId" TEXT,
    "childId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'REGULAR_CHILD_SUPPORT',
    "debtorRole" TEXT NOT NULL DEFAULT 'OTEC',
    "creditorRole" TEXT NOT NULL DEFAULT 'MATKA',
    "monthlyAmount" DOUBLE PRECISION DEFAULT 0,
    "paymentDueDate" INTEGER DEFAULT 15,
    "bankAccount" TEXT,
    "paymentSymbol" TEXT,
    "totalArrears" DOUBLE PRECISION DEFAULT 0,
    "arrearsPeriod" TEXT,
    "arrearsDueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'LOCAL_PDF',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialObligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeMode" TEXT NOT NULL DEFAULT 'system',
    "colorPreset" TEXT NOT NULL DEFAULT 'default',
    "customColors" TEXT,
    "fontFamily" TEXT NOT NULL DEFAULT 'default',
    "fontSize" INTEGER NOT NULL DEFAULT 100,
    "density" TEXT NOT NULL DEFAULT 'standard',
    "borderRadius" TEXT NOT NULL DEFAULT 'standard',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandingVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "primaryLogoSvg" TEXT,
    "darkLogoSvg" TEXT,
    "faviconType" TEXT DEFAULT 'svg',
    "faviconSvg" TEXT,
    "logoAlt" TEXT DEFAULT 'Táta má právo',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandingVersion_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "featureId" TEXT,
    "metadata" JSONB,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSetting" (
    "id" TEXT NOT NULL,
    "publicStatsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "simulatedActivityEnabled" BOOLEAN NOT NULL DEFAULT false,
    "simulationMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "simulationMin" INTEGER NOT NULL DEFAULT 0,
    "simulationMax" INTEGER NOT NULL DEFAULT 5,
    "simulationTimeWindow" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SynthesisTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" "SynthesisSource" NOT NULL,
    "severity" "SynthesisSeverity" NOT NULL,
    "category" "SynthesisCategory" NOT NULL,
    "status" "SynthesisStatus" NOT NULL DEFAULT 'DISCOVERED',
    "dedupHash" TEXT NOT NULL,
    "sourcePath" TEXT,
    "auditDocumentId" TEXT,
    "qaFindingId" TEXT,
    "supportTicketId" TEXT,
    "commitSha" TEXT,
    "branch" TEXT,
    "coderabbitCommentId" TEXT,
    "githubIssueNumber" INTEGER,
    "githubIssueUrl" TEXT,
    "githubPrNumber" INTEGER,
    "githubPrUrl" TEXT,
    "githubSyncStatus" "GitHubSyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "githubSyncError" TEXT,
    "githubSyncedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "assignedToId" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "slaDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SynthesisTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SynthesisTicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SynthesisTicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SynthesisTicketEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SynthesisTicketEvent_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_microsoftId_key" ON "User"("microsoftId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Passkey_credentialId_key" ON "Passkey"("credentialId");

-- CreateIndex
CREATE INDEX "Passkey_userId_idx" ON "Passkey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserDocumentData_userId_idx" ON "UserDocumentData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDocumentData_userId_fieldKey_key" ON "UserDocumentData"("userId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE INDEX "Role_key_idx" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "Permission_key_idx" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "PageSection_pageId_idx" ON "PageSection"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE INDEX "FAQ_categoryId_idx" ON "FAQ"("categoryId");

-- CreateIndex
CREATE INDEX "NavigationItem_parentId_idx" ON "NavigationItem"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentString_key_key" ON "ContentString"("key");

-- CreateIndex
CREATE INDEX "ContentString_key_idx" ON "ContentString"("key");

-- CreateIndex
CREATE INDEX "ContentString_category_idx" ON "ContentString"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_key_key" ON "Theme"("key");

-- CreateIndex
CREATE INDEX "Theme_key_idx" ON "Theme"("key");

-- CreateIndex
CREATE INDEX "Theme_context_idx" ON "Theme"("context");

-- CreateIndex
CREATE INDEX "ThemeVariable_key_idx" ON "ThemeVariable"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeVariable_themeId_key_key" ON "ThemeVariable"("themeId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Module_key_key" ON "Module"("key");

-- CreateIndex
CREATE INDEX "Module_key_idx" ON "Module"("key");

-- CreateIndex
CREATE INDEX "ModuleSetting_moduleId_idx" ON "ModuleSetting"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSetting_moduleId_key_key" ON "ModuleSetting"("moduleId", "key");

-- CreateIndex
CREATE INDEX "ModulePermission_moduleId_idx" ON "ModulePermission"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermission_moduleId_key_key" ON "ModulePermission"("moduleId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_key_key" ON "LegalDocument"("key");

-- CreateIndex
CREATE INDEX "LegalDocument_key_idx" ON "LegalDocument"("key");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_documentId_idx" ON "LegalDocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_status_idx" ON "LegalDocumentVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentVersion_documentId_version_key" ON "LegalDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");

-- CreateIndex
CREATE INDEX "Consent_versionId_idx" ON "Consent"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_userId_docKey_docVersion_key" ON "Consent"("userId", "docKey", "docVersion");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "AuditDocument_sourcePath_key" ON "AuditDocument"("sourcePath");

-- CreateIndex
CREATE INDEX "AuditDocument_category_idx" ON "AuditDocument"("category");

-- CreateIndex
CREATE INDEX "AuditDocument_status_idx" ON "AuditDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AuditShare_tokenHash_key" ON "AuditShare"("tokenHash");

-- CreateIndex
CREATE INDEX "AuditShare_auditId_idx" ON "AuditShare"("auditId");

-- CreateIndex
CREATE INDEX "AuditShare_tokenHash_idx" ON "AuditShare"("tokenHash");

-- CreateIndex
CREATE INDEX "UserCase_userId_idx" ON "UserCase"("userId");

-- CreateIndex
CREATE INDEX "UserChild_userId_idx" ON "UserChild"("userId");

-- CreateIndex
CREATE INDEX "UserCalendarEvent_userId_idx" ON "UserCalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "UserNote_userId_idx" ON "UserNote"("userId");

-- CreateIndex
CREATE INDEX "UserDocument_userId_idx" ON "UserDocument"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Study_slug_key" ON "Study"("slug");

-- CreateIndex
CREATE INDEX "Study_slug_idx" ON "Study"("slug");

-- CreateIndex
CREATE INDEX "Study_status_idx" ON "Study"("status");

-- CreateIndex
CREATE INDEX "Study_category_idx" ON "Study"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Law_code_key" ON "Law"("code");

-- CreateIndex
CREATE INDEX "Law_code_idx" ON "Law"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LegalAct_actCode_key" ON "LegalAct"("actCode");

-- CreateIndex
CREATE INDEX "LegalAct_actCode_idx" ON "LegalAct"("actCode");

-- CreateIndex
CREATE INDEX "LegalAct_category_idx" ON "LegalAct"("category");

-- CreateIndex
CREATE INDEX "LegalAct_status_idx" ON "LegalAct"("status");

-- CreateIndex
CREATE INDEX "LegalAct_effectiveFrom_idx" ON "LegalAct"("effectiveFrom");

-- CreateIndex
CREATE INDEX "LegalAct_lastSyncedAt_idx" ON "LegalAct"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "LegalAct_syncPriority_idx" ON "LegalAct"("syncPriority");

-- CreateIndex
CREATE INDEX "LegalActSection_legalActId_idx" ON "LegalActSection"("legalActId");

-- CreateIndex
CREATE INDEX "LegalActSection_sectionNumber_idx" ON "LegalActSection"("sectionNumber");

-- CreateIndex
CREATE INDEX "LegalActSection_isKeySection_idx" ON "LegalActSection"("isKeySection");

-- CreateIndex
CREATE UNIQUE INDEX "LegalActSection_legalActId_sectionNumber_key" ON "LegalActSection"("legalActId", "sectionNumber");

-- CreateIndex
CREATE INDEX "LegalActVersion_legalActId_idx" ON "LegalActVersion"("legalActId");

-- CreateIndex
CREATE INDEX "LegalActVersion_effectiveFrom_idx" ON "LegalActVersion"("effectiveFrom");

-- CreateIndex
CREATE INDEX "LegalActVersion_contentHash_idx" ON "LegalActVersion"("contentHash");

-- CreateIndex
CREATE INDEX "LegalSyncAudit_actCode_idx" ON "LegalSyncAudit"("actCode");

-- CreateIndex
CREATE INDEX "LegalSyncAudit_status_idx" ON "LegalSyncAudit"("status");

-- CreateIndex
CREATE INDEX "LegalSyncAudit_startedAt_idx" ON "LegalSyncAudit"("startedAt");

-- CreateIndex
CREATE INDEX "LegalSyncAudit_syncType_idx" ON "LegalSyncAudit"("syncType");

-- CreateIndex
CREATE INDEX "EsbirkaQuotaAudit_calledAt_idx" ON "EsbirkaQuotaAudit"("calledAt");

-- CreateIndex
CREATE INDEX "EsbirkaQuotaAudit_actCode_idx" ON "EsbirkaQuotaAudit"("actCode");

-- CreateIndex
CREATE INDEX "EsbirkaQuotaAudit_requestType_idx" ON "EsbirkaQuotaAudit"("requestType");

-- CreateIndex
CREATE INDEX "StateStatistic_category_idx" ON "StateStatistic"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CourtCase_fileNumber_key" ON "CourtCase"("fileNumber");

-- CreateIndex
CREATE INDEX "CourtCase_court_idx" ON "CourtCase"("court");

-- CreateIndex
CREATE INDEX "CourtCase_fileNumber_idx" ON "CourtCase"("fileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerCodexAgreement_userId_documentVersion_key" ON "VolunteerCodexAgreement"("userId", "documentVersion");

-- CreateIndex
CREATE INDEX "ForumThread_category_idx" ON "ForumThread"("category");

-- CreateIndex
CREATE INDEX "ForumThread_createdAt_idx" ON "ForumThread"("createdAt");

-- CreateIndex
CREATE INDEX "ForumPost_threadId_idx" ON "ForumPost"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomModule_slug_key" ON "CustomModule"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subjekt_email_key" ON "Subjekt"("email");

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

-- CreateIndex
CREATE INDEX "Case_ownerId_idx" ON "Case"("ownerId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "CaseSubmissionDraft_caseId_idx" ON "CaseSubmissionDraft"("caseId");

-- CreateIndex
CREATE INDEX "CaseSubmissionDraft_userId_idx" ON "CaseSubmissionDraft"("userId");

-- CreateIndex
CREATE INDEX "CaseSubmissionDraft_status_idx" ON "CaseSubmissionDraft"("status");

-- CreateIndex
CREATE INDEX "CaseSubmissionDraftVersion_draftId_idx" ON "CaseSubmissionDraftVersion"("draftId");

-- CreateIndex
CREATE INDEX "CaseSubmissionDraftVersion_version_idx" ON "CaseSubmissionDraftVersion"("version");

-- CreateIndex
CREATE INDEX "CaseParticipant_caseId_idx" ON "CaseParticipant"("caseId");

-- CreateIndex
CREATE INDEX "Child_caseId_idx" ON "Child"("caseId");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId");

-- CreateIndex
CREATE INDEX "CaseEvent_eventDate_idx" ON "CaseEvent"("eventDate");

-- CreateIndex
CREATE INDEX "CaseEvent_category_idx" ON "CaseEvent"("category");

-- CreateIndex
CREATE INDEX "CaseEvent_carePlanId_idx" ON "CaseEvent"("carePlanId");

-- CreateIndex
CREATE INDEX "CaseEvent_careDayId_idx" ON "CaseEvent"("careDayId");

-- CreateIndex
CREATE INDEX "CaseEvent_sourceType_idx" ON "CaseEvent"("sourceType");

-- CreateIndex
CREATE INDEX "CaseDeadline_caseId_idx" ON "CaseDeadline"("caseId");

-- CreateIndex
CREATE INDEX "CaseDeadline_dueDate_idx" ON "CaseDeadline"("dueDate");

-- CreateIndex
CREATE INDEX "CaseTask_caseId_idx" ON "CaseTask"("caseId");

-- CreateIndex
CREATE INDEX "CaseTask_status_idx" ON "CaseTask"("status");

-- CreateIndex
CREATE INDEX "CaseTask_dueDate_idx" ON "CaseTask"("dueDate");

-- CreateIndex
CREATE INDEX "CaseNote_caseId_idx" ON "CaseNote"("caseId");

-- CreateIndex
CREATE INDEX "CaseNote_visibility_idx" ON "CaseNote"("visibility");

-- CreateIndex
CREATE INDEX "CaseDocument_caseId_idx" ON "CaseDocument"("caseId");

-- CreateIndex
CREATE INDEX "CaseDocument_category_idx" ON "CaseDocument"("category");

-- CreateIndex
CREATE INDEX "CaseEvidence_caseId_idx" ON "CaseEvidence"("caseId");

-- CreateIndex
CREATE INDEX "CaseEvidence_type_idx" ON "CaseEvidence"("type");

-- CreateIndex
CREATE INDEX "CaseCommunication_caseId_idx" ON "CaseCommunication"("caseId");

-- CreateIndex
CREATE INDEX "CaseCommunication_date_idx" ON "CaseCommunication"("date");

-- CreateIndex
CREATE INDEX "CareArrangement_caseId_idx" ON "CareArrangement"("caseId");

-- CreateIndex
CREATE INDEX "CoParentSpace_ownerId_idx" ON "CoParentSpace"("ownerId");

-- CreateIndex
CREATE INDEX "CoParentMember_spaceId_idx" ON "CoParentMember"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentMember_userId_idx" ON "CoParentMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoParentMember_spaceId_userId_key" ON "CoParentMember"("spaceId", "userId");

-- CreateIndex
CREATE INDEX "CoParentChild_spaceId_idx" ON "CoParentChild"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentEvent_spaceId_idx" ON "CoParentEvent"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentHandover_spaceId_idx" ON "CoParentHandover"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentMessage_spaceId_idx" ON "CoParentMessage"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentAgreement_spaceId_idx" ON "CoParentAgreement"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentExpense_spaceId_idx" ON "CoParentExpense"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentDailyUpdate_spaceId_idx" ON "CoParentDailyUpdate"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentItem_spaceId_idx" ON "CoParentItem"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentRequest_spaceId_idx" ON "CoParentRequest"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentAuditLog_spaceId_idx" ON "CoParentAuditLog"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentDocument_spaceId_idx" ON "CoParentDocument"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "CoParentInvite_code_key" ON "CoParentInvite"("code");

-- CreateIndex
CREATE INDEX "CoParentInvite_spaceId_idx" ON "CoParentInvite"("spaceId");

-- CreateIndex
CREATE INDEX "CoParentInvite_code_idx" ON "CoParentInvite"("code");

-- CreateIndex
CREATE INDEX "CarePlan_caseId_idx" ON "CarePlan"("caseId");

-- CreateIndex
CREATE INDEX "CarePlan_status_idx" ON "CarePlan"("status");

-- CreateIndex
CREATE INDEX "CarePlan_type_idx" ON "CarePlan"("type");

-- CreateIndex
CREATE INDEX "CarePlanChild_carePlanId_idx" ON "CarePlanChild"("carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanChild_childId_idx" ON "CarePlanChild"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "CarePlanChild_carePlanId_childId_key" ON "CarePlanChild"("carePlanId", "childId");

-- CreateIndex
CREATE INDEX "CareLocation_carePlanId_idx" ON "CareLocation"("carePlanId");

-- CreateIndex
CREATE INDEX "CareLocation_type_idx" ON "CareLocation"("type");

-- CreateIndex
CREATE INDEX "CareDay_carePlanId_idx" ON "CareDay"("carePlanId");

-- CreateIndex
CREATE INDEX "CareDay_date_idx" ON "CareDay"("date");

-- CreateIndex
CREATE INDEX "CareHolidayRule_carePlanId_idx" ON "CareHolidayRule"("carePlanId");

-- CreateIndex
CREATE INDEX "CareHolidayRule_holidayType_idx" ON "CareHolidayRule"("holidayType");

-- CreateIndex
CREATE INDEX "CareSimulationComparison_caseId_idx" ON "CareSimulationComparison"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "QAProject_name_key" ON "QAProject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "QARegistryItem_key_key" ON "QARegistryItem"("key");

-- CreateIndex
CREATE INDEX "QARegistryItem_type_idx" ON "QARegistryItem"("type");

-- CreateIndex
CREATE INDEX "QARegistryItem_status_idx" ON "QARegistryItem"("status");

-- CreateIndex
CREATE INDEX "QADependency_sourceId_idx" ON "QADependency"("sourceId");

-- CreateIndex
CREATE INDEX "QADependency_targetId_idx" ON "QADependency"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "QADependency_sourceId_targetId_key" ON "QADependency"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "QAAICache_cacheKey_key" ON "QAAICache"("cacheKey");

-- CreateIndex
CREATE INDEX "QAAICache_cacheKey_idx" ON "QAAICache"("cacheKey");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_assignedToId_idx" ON "SupportTicket"("status", "assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "WikiTerm_slug_key" ON "WikiTerm"("slug");

-- CreateIndex
CREATE INDEX "WikiTerm_slug_idx" ON "WikiTerm"("slug");

-- CreateIndex
CREATE INDEX "WikiTerm_category_idx" ON "WikiTerm"("category");

-- CreateIndex
CREATE INDEX "WikiTerm_firstLetter_idx" ON "WikiTerm"("firstLetter");

-- CreateIndex
CREATE INDEX "WikiTerm_status_idx" ON "WikiTerm"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalGuide_slug_key" ON "LegalGuide"("slug");

-- CreateIndex
CREATE INDEX "LegalGuide_slug_idx" ON "LegalGuide"("slug");

-- CreateIndex
CREATE INDEX "LegalGuide_category_idx" ON "LegalGuide"("category");

-- CreateIndex
CREATE INDEX "LegalGuide_status_idx" ON "LegalGuide"("status");

-- CreateIndex
CREATE INDEX "LegalGuideChapter_guideId_idx" ON "LegalGuideChapter"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyVideo_slug_key" ON "AcademyVideo"("slug");

-- CreateIndex
CREATE INDEX "AcademyVideo_slug_idx" ON "AcademyVideo"("slug");

-- CreateIndex
CREATE INDEX "AcademyVideo_category_idx" ON "AcademyVideo"("category");

-- CreateIndex
CREATE INDEX "AcademyVideo_status_idx" ON "AcademyVideo"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_slug_key" ON "Quiz"("slug");

-- CreateIndex
CREATE INDEX "Quiz_slug_idx" ON "Quiz"("slug");

-- CreateIndex
CREATE INDEX "Quiz_category_idx" ON "Quiz"("category");

-- CreateIndex
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "MementoCase_slug_key" ON "MementoCase"("slug");

-- CreateIndex
CREATE INDEX "MementoCase_slug_idx" ON "MementoCase"("slug");

-- CreateIndex
CREATE INDEX "MementoCase_category_idx" ON "MementoCase"("category");

-- CreateIndex
CREATE INDEX "MementoCase_status_idx" ON "MementoCase"("status");

-- CreateIndex
CREATE INDEX "Judgment_caseId_idx" ON "Judgment"("caseId");

-- CreateIndex
CREATE INDEX "Judgment_documentId_idx" ON "Judgment"("documentId");

-- CreateIndex
CREATE INDEX "Judgment_caseNumber_idx" ON "Judgment"("caseNumber");

-- CreateIndex
CREATE INDEX "Judgment_status_idx" ON "Judgment"("status");

-- CreateIndex
CREATE INDEX "JudgmentSentence_judgmentId_idx" ON "JudgmentSentence"("judgmentId");

-- CreateIndex
CREATE INDEX "JudgmentSentence_sentenceIndex_idx" ON "JudgmentSentence"("sentenceIndex");

-- CreateIndex
CREATE INDEX "JudgmentSentence_section_idx" ON "JudgmentSentence"("section");

-- CreateIndex
CREATE INDEX "JudgmentLegalFact_caseId_idx" ON "JudgmentLegalFact"("caseId");

-- CreateIndex
CREATE INDEX "JudgmentLegalFact_judgmentId_idx" ON "JudgmentLegalFact"("judgmentId");

-- CreateIndex
CREATE INDEX "JudgmentLegalFact_category_idx" ON "JudgmentLegalFact"("category");

-- CreateIndex
CREATE INDEX "JudgmentLegalFact_factKey_idx" ON "JudgmentLegalFact"("factKey");

-- CreateIndex
CREATE INDEX "FinancialObligation_caseId_idx" ON "FinancialObligation"("caseId");

-- CreateIndex
CREATE INDEX "FinancialObligation_judgmentId_idx" ON "FinancialObligation"("judgmentId");

-- CreateIndex
CREATE INDEX "FinancialObligation_type_idx" ON "FinancialObligation"("type");

-- CreateIndex
CREATE INDEX "FinancialObligation_status_idx" ON "FinancialObligation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandingVersion_version_key" ON "BrandingVersion"("version");

-- CreateIndex
CREATE INDEX "BrandingVersion_isActive_idx" ON "BrandingVersion"("isActive");

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

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_route_idx" ON "AnalyticsEvent"("route");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_featureId_idx" ON "AnalyticsEvent"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "SynthesisTicket_ticketNumber_key" ON "SynthesisTicket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SynthesisTicket_dedupHash_key" ON "SynthesisTicket"("dedupHash");

-- CreateIndex
CREATE INDEX "SynthesisTicket_source_idx" ON "SynthesisTicket"("source");

-- CreateIndex
CREATE INDEX "SynthesisTicket_severity_idx" ON "SynthesisTicket"("severity");

-- CreateIndex
CREATE INDEX "SynthesisTicket_category_idx" ON "SynthesisTicket"("category");

-- CreateIndex
CREATE INDEX "SynthesisTicket_status_idx" ON "SynthesisTicket"("status");

-- CreateIndex
CREATE INDEX "SynthesisTicket_dedupHash_idx" ON "SynthesisTicket"("dedupHash");

-- CreateIndex
CREATE INDEX "SynthesisTicketComment_ticketId_idx" ON "SynthesisTicketComment"("ticketId");

-- CreateIndex
CREATE INDEX "SynthesisTicketEvent_ticketId_idx" ON "SynthesisTicketEvent"("ticketId");

-- CreateIndex
CREATE INDEX "SynthesisTicketEvent_eventType_idx" ON "SynthesisTicketEvent"("eventType");

-- CreateIndex
CREATE INDEX "AuditFinding_status_severity_idx" ON "AuditFinding"("status", "severity");

-- CreateIndex
CREATE INDEX "AuditFinding_code_idx" ON "AuditFinding"("code");

-- CreateIndex
CREATE INDEX "AuditFinding_actionId_idx" ON "AuditFinding"("actionId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditFinding_auditFilename_code_key" ON "AuditFinding"("auditFilename", "code");

-- AddForeignKey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentData" ADD CONSTRAINT "UserDocumentData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeVariable" ADD CONSTRAINT "ThemeVariable_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleSetting" ADD CONSTRAINT "ModuleSetting_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermission" ADD CONSTRAINT "ModulePermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "LegalDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditShare" ADD CONSTRAINT "AuditShare_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "AuditDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCase" ADD CONSTRAINT "UserCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChild" ADD CONSTRAINT "UserChild_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCalendarEvent" ADD CONSTRAINT "UserCalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNote" ADD CONSTRAINT "UserNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalActSection" ADD CONSTRAINT "LegalActSection_legalActId_fkey" FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalActVersion" ADD CONSTRAINT "LegalActVersion_legalActId_fkey" FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalSyncAudit" ADD CONSTRAINT "LegalSyncAudit_legalActId_fkey" FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerCodexAgreement" ADD CONSTRAINT "VolunteerCodexAgreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsentLog" ADD CONSTRAINT "UserConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitiveAccessLog" ADD CONSTRAINT "SensitiveAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GdprDeletionRequest" ADD CONSTRAINT "GdprDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjekt" ADD CONSTRAINT "Subjekt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjekt" ADD CONSTRAINT "Subjekt_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjekt" ADD CONSTRAINT "Subjekt_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "Pracovnik" ADD CONSTRAINT "Pracovnik_subjektId_fkey" FOREIGN KEY ("subjektId") REFERENCES "Subjekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_subjektId_fkey" FOREIGN KEY ("subjektId") REFERENCES "Subjekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pracovnikId_fkey" FOREIGN KEY ("pracovnikId") REFERENCES "Pracovnik"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieConsent" ADD CONSTRAINT "CookieConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAuditLog" ADD CONSTRAINT "LegalAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSubmissionDraft" ADD CONSTRAINT "CaseSubmissionDraft_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSubmissionDraft" ADD CONSTRAINT "CaseSubmissionDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSubmissionDraftVersion" ADD CONSTRAINT "CaseSubmissionDraftVersion_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "CaseSubmissionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseParticipant" ADD CONSTRAINT "CaseParticipant_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_careDayId_fkey" FOREIGN KEY ("careDayId") REFERENCES "CareDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDeadline" ADD CONSTRAINT "CaseDeadline_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTask" ADD CONSTRAINT "CaseTask_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvidence" ADD CONSTRAINT "CaseEvidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvidence" ADD CONSTRAINT "CaseEvidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CaseDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvidence" ADD CONSTRAINT "CaseEvidence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CaseEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseCommunication" ADD CONSTRAINT "CaseCommunication_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareArrangement" ADD CONSTRAINT "CareArrangement_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentSpace" ADD CONSTRAINT "CoParentSpace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentMember" ADD CONSTRAINT "CoParentMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentMember" ADD CONSTRAINT "CoParentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentChild" ADD CONSTRAINT "CoParentChild_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentEvent" ADD CONSTRAINT "CoParentEvent_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentHandover" ADD CONSTRAINT "CoParentHandover_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentMessage" ADD CONSTRAINT "CoParentMessage_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentMessage" ADD CONSTRAINT "CoParentMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentAgreement" ADD CONSTRAINT "CoParentAgreement_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentExpense" ADD CONSTRAINT "CoParentExpense_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentDailyUpdate" ADD CONSTRAINT "CoParentDailyUpdate_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentDailyUpdate" ADD CONSTRAINT "CoParentDailyUpdate_childId_fkey" FOREIGN KEY ("childId") REFERENCES "CoParentChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentItem" ADD CONSTRAINT "CoParentItem_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentRequest" ADD CONSTRAINT "CoParentRequest_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentRequest" ADD CONSTRAINT "CoParentRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentAuditLog" ADD CONSTRAINT "CoParentAuditLog_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentDocument" ADD CONSTRAINT "CoParentDocument_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentInvite" ADD CONSTRAINT "CoParentInvite_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanChild" ADD CONSTRAINT "CarePlanChild_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanChild" ADD CONSTRAINT "CarePlanChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareLocation" ADD CONSTRAINT "CareLocation_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareDay" ADD CONSTRAINT "CareDay_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareDay" ADD CONSTRAINT "CareDay_handoverLocationId_fkey" FOREIGN KEY ("handoverLocationId") REFERENCES "CareLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareHolidayRule" ADD CONSTRAINT "CareHolidayRule_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareSimulationComparison" ADD CONSTRAINT "CareSimulationComparison_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAModule" ADD CONSTRAINT "QAModule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QAProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAEndpoint" ADD CONSTRAINT "QAEndpoint_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "QAModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QARun" ADD CONSTRAINT "QARun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QAProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAFinding" ADD CONSTRAINT "QAFinding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "QARun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QADependency" ADD CONSTRAINT "QADependency_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "QARegistryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QADependency" ADD CONSTRAINT "QADependency_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "QARegistryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalGuideChapter" ADD CONSTRAINT "LegalGuideChapter_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "LegalGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Judgment" ADD CONSTRAINT "Judgment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Judgment" ADD CONSTRAINT "Judgment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CaseDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgmentSentence" ADD CONSTRAINT "JudgmentSentence_judgmentId_fkey" FOREIGN KEY ("judgmentId") REFERENCES "Judgment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgmentLegalFact" ADD CONSTRAINT "JudgmentLegalFact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgmentLegalFact" ADD CONSTRAINT "JudgmentLegalFact_judgmentId_fkey" FOREIGN KEY ("judgmentId") REFERENCES "Judgment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgmentLegalFact" ADD CONSTRAINT "JudgmentLegalFact_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "JudgmentSentence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_judgmentId_fkey" FOREIGN KEY ("judgmentId") REFERENCES "Judgment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "JudgmentSentence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_auditDocumentId_fkey" FOREIGN KEY ("auditDocumentId") REFERENCES "AuditDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_qaFindingId_fkey" FOREIGN KEY ("qaFindingId") REFERENCES "QAFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_supportTicketId_fkey" FOREIGN KEY ("supportTicketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicket" ADD CONSTRAINT "SynthesisTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicketComment" ADD CONSTRAINT "SynthesisTicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SynthesisTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicketComment" ADD CONSTRAINT "SynthesisTicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicketEvent" ADD CONSTRAINT "SynthesisTicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SynthesisTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisTicketEvent" ADD CONSTRAINT "SynthesisTicketEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlPlaneEvent" ADD CONSTRAINT "ControlPlaneEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ControlPlaneAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlPlaneSnapshot" ADD CONSTRAINT "ControlPlaneSnapshot_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ControlPlaneAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ControlPlaneAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
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

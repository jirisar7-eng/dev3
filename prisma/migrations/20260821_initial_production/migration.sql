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
CREATE TYPE "ConflictMode" AS ENUM ('COOPERATION', 'DISAGREEMENT', 'HIGH_CONFLICT');

-- CreateEnum
CREATE TYPE "CarePlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CarePlanType" AS ENUM ('CURRENT', 'PROPOSED', 'SIMULATION');

-- CreateEnum
CREATE TYPE "CarePlanSource" AS ENUM ('MANUAL', 'JUDGMENT_IMPORT', 'SIMULATION_TEMPLATE');

-- CreateEnum
CREATE TYPE "CareLocationType" AS ENUM ('PARENT_A_HOME', 'PARENT_B_HOME', 'SCHOOL', 'KINDERGARTEN', 'NEUTRAL', 'CUSTOM');

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subjekt_pkey" PRIMARY KEY ("id")
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
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoParentMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoParentChild" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
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
    "spaceId" TEXT NOT NULL,
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
    "spaceId" TEXT NOT NULL,
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
    "spaceId" TEXT NOT NULL,
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
    "spaceId" TEXT NOT NULL,
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
CREATE INDEX "Case_ownerId_idx" ON "Case"("ownerId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

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
ALTER TABLE "Pracovnik" ADD CONSTRAINT "Pracovnik_subjektId_fkey" FOREIGN KEY ("subjektId") REFERENCES "Subjekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_subjektId_fkey" FOREIGN KEY ("subjektId") REFERENCES "Subjekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pracovnikId_fkey" FOREIGN KEY ("pracovnikId") REFERENCES "Pracovnik"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieConsent" ADD CONSTRAINT "CookieConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAuditLog" ADD CONSTRAINT "LegalAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "CoParentMember" ADD CONSTRAINT "CoParentMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentMember" ADD CONSTRAINT "CoParentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentChild" ADD CONSTRAINT "CoParentChild_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentEvent" ADD CONSTRAINT "CoParentEvent_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentHandover" ADD CONSTRAINT "CoParentHandover_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentMessage" ADD CONSTRAINT "CoParentMessage_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentMessage" ADD CONSTRAINT "CoParentMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentAgreement" ADD CONSTRAINT "CoParentAgreement_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentExpense" ADD CONSTRAINT "CoParentExpense_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentDailyUpdate" ADD CONSTRAINT "CoParentDailyUpdate_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentDailyUpdate" ADD CONSTRAINT "CoParentDailyUpdate_childId_fkey" FOREIGN KEY ("childId") REFERENCES "CoParentChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentItem" ADD CONSTRAINT "CoParentItem_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentRequest" ADD CONSTRAINT "CoParentRequest_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentRequest" ADD CONSTRAINT "CoParentRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentAuditLog" ADD CONSTRAINT "CoParentAuditLog_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentDocument" ADD CONSTRAINT "CoParentDocument_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoParentInvite" ADD CONSTRAINT "CoParentInvite_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoParentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


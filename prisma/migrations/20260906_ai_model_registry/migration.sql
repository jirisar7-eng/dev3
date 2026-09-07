-- CreateEnum
CREATE TYPE "AiProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEGRADED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "AiModelLifecycleStatus" AS ENUM ('FREE', 'FREE_TIER', 'OPEN_SOURCE', 'PAID', 'UNAVAILABLE', 'DEPRECATED');

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AiProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "adapterKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "documentationUrl" TEXT,
    "termsUrl" TEXT,
    "privacyUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lifecycleStatus" "AiModelLifecycleStatus" NOT NULL DEFAULT 'PAID',
    "capabilities" TEXT[],
    "inputModalities" TEXT[],
    "outputModalities" TEXT[],
    "contextWindow" INTEGER,
    "maxOutputTokens" INTEGER,
    "supportsTools" BOOLEAN NOT NULL DEFAULT false,
    "supportsStructuredOutput" BOOLEAN NOT NULL DEFAULT false,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "supportsAudio" BOOLEAN NOT NULL DEFAULT false,
    "supportsVideo" BOOLEAN NOT NULL DEFAULT false,
    "supportsEmbeddings" BOOLEAN NOT NULL DEFAULT false,
    "supportsReasoning" BOOLEAN NOT NULL DEFAULT false,
    "routingPriority" INTEGER NOT NULL DEFAULT 0,
    "fallbackPriority" INTEGER NOT NULL DEFAULT 0,
    "timeoutMs" INTEGER NOT NULL DEFAULT 15000,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "freeTier" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitRpm" INTEGER,
    "rateLimitRpd" INTEGER,
    "rateLimitTpm" INTEGER,
    "inputPricePer1M" DOUBLE PRECISION,
    "outputPricePer1M" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dataRetentionPolicy" TEXT,
    "trainingUsePolicy" TEXT,
    "zeroDataRetention" BOOLEAN NOT NULL DEFAULT false,
    "legalDataAllowed" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiProvider_key_key" ON "AiProvider"("key");

-- CreateIndex
CREATE INDEX "AiModel_enabled_lifecycleStatus_idx" ON "AiModel"("enabled", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "AiModel_routingPriority_idx" ON "AiModel"("routingPriority");

-- CreateIndex
CREATE INDEX "AiModel_key_idx" ON "AiModel"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_providerId_key_key" ON "AiModel"("providerId", "key");

-- AddForeignKey
ALTER TABLE "AiModel" ADD CONSTRAINT "AiModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

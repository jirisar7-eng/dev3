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

-- CreateIndex
CREATE UNIQUE INDEX "AcademyVideo_slug_key" ON "AcademyVideo"("slug");
CREATE INDEX "AcademyVideo_slug_idx" ON "AcademyVideo"("slug");
CREATE INDEX "AcademyVideo_category_idx" ON "AcademyVideo"("category");
CREATE INDEX "AcademyVideo_status_idx" ON "AcademyVideo"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_slug_key" ON "Quiz"("slug");
CREATE INDEX "Quiz_slug_idx" ON "Quiz"("slug");
CREATE INDEX "Quiz_category_idx" ON "Quiz"("category");
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "MementoCase_slug_key" ON "MementoCase"("slug");
CREATE INDEX "MementoCase_slug_idx" ON "MementoCase"("slug");
CREATE INDEX "MementoCase_category_idx" ON "MementoCase"("category");
CREATE INDEX "MementoCase_status_idx" ON "MementoCase"("status");

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

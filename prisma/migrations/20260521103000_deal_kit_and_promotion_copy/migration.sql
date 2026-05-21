-- CreateTable
CREATE TABLE "DealKitEntry" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT,
    "contributorName" TEXT NOT NULL,
    "recorderId" TEXT NOT NULL,
    "profileText" TEXT NOT NULL,
    "judgmentText" TEXT NOT NULL,
    "experienceText" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'published',
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "semanticText" TEXT NOT NULL,
    "embeddingJson" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "searchExposureCount" INTEGER NOT NULL DEFAULT 0,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "conversionAssistCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealKitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealKitSearchHit" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealKitSearchHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealKitScriptGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "generatedScript" TEXT NOT NULL,
    "entryIdsJson" TEXT NOT NULL,
    "successMarkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealKitScriptGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionCopy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'team',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "teamScopeManagerId" TEXT,
    "imageAssetsJson" TEXT NOT NULL DEFAULT '[]',
    "imageStorageProvider" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionCopyGeneration" (
    "id" TEXT NOT NULL,
    "promotionCopyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedTitle" TEXT NOT NULL,
    "generatedContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionCopyGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealKitEntry_status_createdAt_idx" ON "DealKitEntry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DealKitEntry_contributorId_createdAt_idx" ON "DealKitEntry"("contributorId", "createdAt");

-- CreateIndex
CREATE INDEX "DealKitEntry_recorderId_createdAt_idx" ON "DealKitEntry"("recorderId", "createdAt");

-- CreateIndex
CREATE INDEX "DealKitEntry_embeddingModel_idx" ON "DealKitEntry"("embeddingModel");

-- CreateIndex
CREATE INDEX "DealKitEntry_searchExposureCount_citationCount_conversionA_idx" ON "DealKitEntry"("searchExposureCount", "citationCount", "conversionAssistCount");

-- CreateIndex
CREATE INDEX "DealKitSearchHit_entryId_createdAt_idx" ON "DealKitSearchHit"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "DealKitSearchHit_viewerId_createdAt_idx" ON "DealKitSearchHit"("viewerId", "createdAt");

-- CreateIndex
CREATE INDEX "DealKitScriptGeneration_userId_createdAt_idx" ON "DealKitScriptGeneration"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DealKitScriptGeneration_successMarkedAt_idx" ON "DealKitScriptGeneration"("successMarkedAt");

-- CreateIndex
CREATE INDEX "PromotionCopy_eventDate_enabled_idx" ON "PromotionCopy"("eventDate", "enabled");

-- CreateIndex
CREATE INDEX "PromotionCopy_scope_eventDate_idx" ON "PromotionCopy"("scope", "eventDate");

-- CreateIndex
CREATE INDEX "PromotionCopy_createdById_eventDate_idx" ON "PromotionCopy"("createdById", "eventDate");

-- CreateIndex
CREATE INDEX "PromotionCopy_teamScopeManagerId_eventDate_idx" ON "PromotionCopy"("teamScopeManagerId", "eventDate");

-- CreateIndex
CREATE INDEX "PromotionCopyGeneration_promotionCopyId_createdAt_idx" ON "PromotionCopyGeneration"("promotionCopyId", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionCopyGeneration_userId_createdAt_idx" ON "PromotionCopyGeneration"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "DealKitEntry" ADD CONSTRAINT "DealKitEntry_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealKitEntry" ADD CONSTRAINT "DealKitEntry_recorderId_fkey" FOREIGN KEY ("recorderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealKitSearchHit" ADD CONSTRAINT "DealKitSearchHit_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DealKitEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealKitSearchHit" ADD CONSTRAINT "DealKitSearchHit_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealKitScriptGeneration" ADD CONSTRAINT "DealKitScriptGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCopy" ADD CONSTRAINT "PromotionCopy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCopy" ADD CONSTRAINT "PromotionCopy_teamScopeManagerId_fkey" FOREIGN KEY ("teamScopeManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCopyGeneration" ADD CONSTRAINT "PromotionCopyGeneration_promotionCopyId_fkey" FOREIGN KEY ("promotionCopyId") REFERENCES "PromotionCopy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCopyGeneration" ADD CONSTRAINT "PromotionCopyGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

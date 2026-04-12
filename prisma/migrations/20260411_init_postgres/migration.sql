-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'SALES');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayTitle" TEXT NOT NULL,
    "introHeadline" TEXT NOT NULL,
    "expertiseSummary" TEXT NOT NULL,
    "trustSignal" TEXT NOT NULL,
    "openingStyle" TEXT NOT NULL,
    "inviteStyle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "currentStatusId" TEXT,
    "wechatNickname" TEXT NOT NULL,
    "phone" TEXT,
    "memberStatus" TEXT,
    "gender" TEXT,
    "education" TEXT,
    "ageRange" TEXT,
    "childrenCount" TEXT,
    "childAgeRanges" TEXT NOT NULL,
    "decisionMakerCount" TEXT,
    "primaryCaretaker" TEXT,
    "parentingRole" TEXT,
    "occupationCategory" TEXT,
    "occupationDetail" TEXT,
    "source" TEXT,
    "sourceDetail" TEXT,
    "ipLocation" TEXT,
    "totalScore" INTEGER,
    "completionSeconds" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "coreProblem" TEXT,
    "coreConcern" TEXT,
    "attemptedActions" TEXT,
    "attemptedOutcome" TEXT,
    "desiredSupport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "answersData" TEXT NOT NULL,
    "intakeData" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSnapshot" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "parentType" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "anxietyPercent" INTEGER NOT NULL,
    "burnoutPercent" INTEGER NOT NULL,
    "competencePercent" INTEGER NOT NULL,
    "parentRadarData" TEXT NOT NULL,
    "childRadarData" TEXT NOT NULL,
    "courseRecommendations" TEXT NOT NULL,
    "reportData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "inPrimaryFunnel" BOOLEAN NOT NULL DEFAULT true,
    "manualAllowed" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusTransition" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fromStatusId" TEXT,
    "toStatusId" TEXT NOT NULL,
    "operatorId" TEXT,
    "operatorName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "statusId" TEXT,
    "kind" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpNote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "customerQuotes" TEXT,
    "nextAction" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptTemplate" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "statusId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "applicableDimension" TEXT,
    "applicableParentType" TEXT,
    "applicableStage" TEXT,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "approvalState" TEXT NOT NULL DEFAULT 'approved',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_managerId_idx" ON "User"("managerId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "PersonaProfile_userId_key" ON "PersonaProfile"("userId");
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE INDEX "Customer_ownerId_idx" ON "Customer"("ownerId");
CREATE INDEX "Customer_currentStatusId_idx" ON "Customer"("currentStatusId");
CREATE INDEX "Customer_submittedAt_idx" ON "Customer"("submittedAt");
CREATE INDEX "Customer_source_idx" ON "Customer"("source");
CREATE INDEX "AssessmentSubmission_customerId_submittedAt_idx" ON "AssessmentSubmission"("customerId", "submittedAt");
CREATE UNIQUE INDEX "ReportSnapshot_submissionId_key" ON "ReportSnapshot"("submissionId");
CREATE INDEX "ReportSnapshot_customerId_createdAt_idx" ON "ReportSnapshot"("customerId", "createdAt");
CREATE INDEX "ReportSnapshot_parentType_idx" ON "ReportSnapshot"("parentType");
CREATE UNIQUE INDEX "StatusDefinition_code_key" ON "StatusDefinition"("code");
CREATE INDEX "StatusTransition_customerId_createdAt_idx" ON "StatusTransition"("customerId", "createdAt");
CREATE INDEX "StatusTransition_toStatusId_createdAt_idx" ON "StatusTransition"("toStatusId", "createdAt");
CREATE INDEX "Appointment_customerId_startAt_idx" ON "Appointment"("customerId", "startAt");
CREATE INDEX "Appointment_ownerId_startAt_idx" ON "Appointment"("ownerId", "startAt");
CREATE INDEX "Appointment_statusId_idx" ON "Appointment"("statusId");
CREATE INDEX "FollowUpNote_customerId_createdAt_idx" ON "FollowUpNote"("customerId", "createdAt");
CREATE INDEX "FollowUpNote_authorId_createdAt_idx" ON "FollowUpNote"("authorId", "createdAt");
CREATE INDEX "FollowUpNote_nextActionAt_idx" ON "FollowUpNote"("nextActionAt");
CREATE INDEX "ScriptTemplate_authorId_idx" ON "ScriptTemplate"("authorId");
CREATE INDEX "ScriptTemplate_approvalState_priority_idx" ON "ScriptTemplate"("approvalState", "priority");
CREATE INDEX "ScriptTemplate_applicableDimension_idx" ON "ScriptTemplate"("applicableDimension");
CREATE INDEX "ScriptTemplate_applicableStage_idx" ON "ScriptTemplate"("applicableStage");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonaProfile" ADD CONSTRAINT "PersonaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_currentStatusId_fkey" FOREIGN KEY ("currentStatusId") REFERENCES "StatusDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatusTransition" ADD CONSTRAINT "StatusTransition_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatusTransition" ADD CONSTRAINT "StatusTransition_fromStatusId_fkey" FOREIGN KEY ("fromStatusId") REFERENCES "StatusDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatusTransition" ADD CONSTRAINT "StatusTransition_toStatusId_fkey" FOREIGN KEY ("toStatusId") REFERENCES "StatusDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FollowUpNote" ADD CONSTRAINT "FollowUpNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpNote" ADD CONSTRAINT "FollowUpNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScriptTemplate" ADD CONSTRAINT "ScriptTemplate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScriptTemplate" ADD CONSTRAINT "ScriptTemplate_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
